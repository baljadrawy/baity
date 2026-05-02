/**
 * Members Repository — Data Access للأعضاء
 *
 * كل query مفلتر بـ householdId (Golden Rule #5).
 * إنشاء عضو = إنشاء User إذا لم يكن موجوداً + ربطه بـ HouseholdMember + (للأطفال) ChildWallet.
 */

import { prisma } from '@/core/db/prisma';
import type { Role } from '@prisma/client';
import { hashPin } from '@/core/auth/pin';
import { sendMessage, welcomeInvitedTemplate } from '@/core/notifications/telegram';
import type { CreateMemberInput, UpdateMemberInput } from '../schemas';

export interface MemberView {
  id: string;
  userId: string;
  name: string;
  phone: string;
  role: Role;
  age: number | null;
  points: number;
  hasPin: boolean;
  joinedAt: Date;
  invitedAt: Date | null;
  invitedBy: string | null;
  walletBalance: number | null;
}

export class MembersRepository {
  constructor(private readonly householdId: string) {}

  async list(): Promise<MemberView[]> {
    const members = await prisma.householdMember.findMany({
      where: { householdId: this.householdId },
      include: {
        user: { select: { id: true, name: true, phone: true } },
        wallet: { select: { balance: true } },
      },
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
    });

    return members.map((m) => ({
      id: m.id,
      userId: m.userId,
      name: m.user.name,
      phone: m.user.phone,
      role: m.role,
      age: m.age,
      points: m.points,
      hasPin: !!m.pinHash,
      joinedAt: m.joinedAt,
      invitedAt: m.invitedAt,
      invitedBy: m.invitedBy,
      walletBalance: m.wallet ? Number(m.wallet.balance) : null,
    }));
  }

  /**
   * إنشاء عضو جديد:
   * 1. إن وُجد User بنفس الجوال — استخدمه
   * 2. وإلا — أنشئ User جديد
   * 3. تحقق من عدم تكرار العضوية (unique userId+householdId)
   * 4. أنشئ HouseholdMember + (إن CHILD) ChildWallet + pinHash
   */
  async create(
    data: CreateMemberInput,
    invitedByMemberId: string
  ): Promise<MemberView> {
    // نلتقط بيانات الإشعار خارج الـ transaction لإرسالها بعد commit
    let telegramChatId: string | null = null;
    let householdName: string | null = null;

    const result = await prisma.$transaction(async (tx) => {
      // 1. إيجاد/إنشاء User (مع جلب telegramChatId)
      let user = await tx.user.findUnique({
        where: { phone: data.phone },
        select: { id: true, name: true, phone: true, telegramChatId: true },
      });

      if (!user) {
        const created = await tx.user.create({
          data: { phone: data.phone, name: data.name },
          select: { id: true, name: true, phone: true, telegramChatId: true },
        });
        user = created;
      } else if (user.name !== data.name) {
        // الاسم الحالي يبقى (ملك المستخدم نفسه إن سجّل)
      }
      telegramChatId = user.telegramChatId;

      // 2. تحقق عدم التكرار
      const existing = await tx.householdMember.findUnique({
        where: { userId_householdId: { userId: user.id, householdId: this.householdId } },
      });
      if (existing) {
        const err = new Error('member_already_exists');
        (err as Error & { code: string }).code = 'CONFLICT';
        throw err;
      }

      // 3. إنشاء العضوية
      const pinHash =
        data.role === 'CHILD' && data.pin ? await hashPin(data.pin) : null;

      const member = await tx.householdMember.create({
        data: {
          userId: user.id,
          householdId: this.householdId,
          role: data.role,
          age: data.age ?? null,
          pinHash,
          invitedAt: new Date(),
          invitedBy: invitedByMemberId,
        },
      });

      // 4. محفظة للطفل
      let walletBalance: number | null = null;
      if (data.role === 'CHILD') {
        const wallet = await tx.childWallet.create({
          data: { memberId: member.id, balance: 0 },
        });
        walletBalance = Number(wallet.balance);
      }

      // 5. اسم البيت لرسالة الترحيب
      const household = await tx.household.findUnique({
        where: { id: this.householdId },
        select: { name: true },
      });
      householdName = household?.name ?? null;

      return {
        id: member.id,
        userId: user.id,
        name: user.name,
        phone: user.phone,
        role: member.role,
        age: member.age,
        points: member.points,
        hasPin: !!pinHash,
        joinedAt: member.joinedAt,
        invitedAt: member.invitedAt,
        invitedBy: member.invitedBy,
        walletBalance,
      };
    });

    // 6. رسالة Telegram للمدعو — بعد commit، fire-and-forget
    // (graceful: لا نُفشل إنشاء العضوية إن فشل الإرسال — مثلاً المدعو لم يربط Telegram بعد)
    // OWNER ليس مسموحاً في schema الـ create (الإنشاء حصراً ADMIN/MEMBER/CHILD).
    if (telegramChatId) {
      const appUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://pi-server:3001';
      const text = welcomeInvitedTemplate(
        data.name,
        householdName ?? '',
        data.role,
        appUrl
      );
      sendMessage(telegramChatId, text).catch((err) => {
        console.warn('[members.create] welcome telegram failed:', err);
      });
    }

    return result;
  }

  async update(memberId: string, data: UpdateMemberInput): Promise<MemberView> {
    const member = await prisma.householdMember.findFirst({
      where: { id: memberId, householdId: this.householdId },
      include: { user: { select: { id: true, name: true, phone: true } } },
    });
    if (!member) {
      const err = new Error('member_not_found');
      (err as Error & { code: string }).code = 'NOT_FOUND';
      throw err;
    }

    // تحديث الاسم (في User table) + role/age (في HouseholdMember)
    const [updatedUser, updatedMember] = await prisma.$transaction([
      data.name
        ? prisma.user.update({
            where: { id: member.userId },
            data: { name: data.name },
            select: { id: true, name: true, phone: true },
          })
        : prisma.user.findUniqueOrThrow({
            where: { id: member.userId },
            select: { id: true, name: true, phone: true },
          }),
      prisma.householdMember.update({
        where: { id: memberId },
        data: {
          ...(data.role !== undefined && { role: data.role }),
          ...(data.age !== undefined && { age: data.age }),
        },
        include: { wallet: { select: { balance: true } } },
      }),
    ]);

    return {
      id: updatedMember.id,
      userId: updatedUser.id,
      name: updatedUser.name,
      phone: updatedUser.phone,
      role: updatedMember.role,
      age: updatedMember.age,
      points: updatedMember.points,
      hasPin: !!updatedMember.pinHash,
      joinedAt: updatedMember.joinedAt,
      invitedAt: updatedMember.invitedAt,
      invitedBy: updatedMember.invitedBy,
      walletBalance: updatedMember.wallet ? Number(updatedMember.wallet.balance) : null,
    };
  }

  async setPin(memberId: string, pin: string): Promise<void> {
    const member = await prisma.householdMember.findFirst({
      where: { id: memberId, householdId: this.householdId },
      select: { id: true, role: true },
    });
    if (!member) {
      const err = new Error('member_not_found');
      (err as Error & { code: string }).code = 'NOT_FOUND';
      throw err;
    }
    if (member.role !== 'CHILD') {
      const err = new Error('pin_only_for_children');
      (err as Error & { code: string }).code = 'FORBIDDEN';
      throw err;
    }

    const pinHash = await hashPin(pin);
    await prisma.householdMember.update({
      where: { id: memberId },
      data: { pinHash },
    });
  }

  /**
   * حذف عضو — لا يمكن حذف OWNER ولا حذف الذات.
   */
  async delete(memberId: string, requesterMemberId: string): Promise<void> {
    if (memberId === requesterMemberId) {
      const err = new Error('cannot_delete_self');
      (err as Error & { code: string }).code = 'FORBIDDEN';
      throw err;
    }

    const member = await prisma.householdMember.findFirst({
      where: { id: memberId, householdId: this.householdId },
      select: { id: true, role: true },
    });
    if (!member) {
      const err = new Error('member_not_found');
      (err as Error & { code: string }).code = 'NOT_FOUND';
      throw err;
    }
    if (member.role === 'OWNER') {
      const err = new Error('cannot_delete_owner');
      (err as Error & { code: string }).code = 'FORBIDDEN';
      throw err;
    }

    // حذف ناعم: لا يوجد deletedAt على HouseholdMember حالياً → حذف فعلي + cascade للـ wallet
    await prisma.$transaction(async (tx) => {
      await tx.childWallet.deleteMany({ where: { memberId } });
      await tx.householdMember.delete({ where: { id: memberId } });
    });
  }
}
