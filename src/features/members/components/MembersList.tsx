'use client';

/**
 * MembersList — قائمة أعضاء المنزل
 *
 * - تعرض كل عضو ببطاقة (اسم + جوال + دور + عمر + شارة PIN)
 * - زر حذف (لـ OWNER/ADMIN فقط، يعطّل OWNER والذات)
 * - زر تعيين/تغيير PIN للطفل
 * - Empty state عند صفر أعضاء غير المالك (نظرياً يجب أن يكون OWNER دائماً موجود)
 */

import { useTranslations } from 'next-intl';
import { Crown, Shield, User, Baby, Trash2, KeyRound, Lock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { MemberView } from '../api/repository';
import { useDeleteMember } from '../hooks/useMembers';
import { useFormat } from '@/shared/hooks/useFormat';
import { cn } from '@/shared/lib/utils';

interface MembersListProps {
  members: MemberView[];
  /** ID العضو الحالي (لمنع حذف الذات) */
  currentMemberId: string;
  /** هل يستطيع الـ caller تعديل/حذف؟ */
  canManage: boolean;
  /** عند اختيار "تعيين PIN" — يفتح dialog */
  onSetPin: (member: MemberView) => void;
}

const ROLE_META: Record<MemberView['role'], { icon: LucideIcon; tone: string }> = {
  OWNER: { icon: Crown, tone: 'bg-primary/10 text-primary' },
  ADMIN: { icon: Shield, tone: 'bg-info/10 text-info' },
  MEMBER: { icon: User, tone: 'bg-muted/50 text-muted-foreground' },
  CHILD: { icon: Baby, tone: 'bg-success/10 text-success' },
};

export function MembersList({ members, currentMemberId, canManage, onSetPin }: MembersListProps) {
  const t = useTranslations('members');
  const tc = useTranslations('common');
  const f = useFormat();
  const deleteMember = useDeleteMember();

  const handleDelete = async (member: MemberView) => {
    const confirmed = window.confirm(t('deleteConfirm', { name: member.name }));
    if (!confirmed) return;
    try {
      await deleteMember.mutateAsync(member.id);
    } catch (err) {
      // الخطأ سيظهر في console ويُلتقَط في Sentry
      console.error('delete member failed', err);
    }
  };

  return (
    <ul className="flex flex-col gap-3" role="list">
      {members.map((m) => {
        const meta = ROLE_META[m.role];
        const Icon = meta.icon;
        const isOwner = m.role === 'OWNER';
        const isSelf = m.id === currentMemberId;
        const canDelete = canManage && !isOwner && !isSelf;
        const showPinAction = canManage && m.role === 'CHILD';

        return (
          <li
            key={m.id}
            className="surface-card-elevated p-3 md:p-4 flex items-center gap-3 transition-smooth"
          >
            <div
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-xl flex-shrink-0',
                meta.tone
              )}
              aria-hidden="true"
            >
              <Icon size={20} strokeWidth={2.25} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-foreground truncate">{m.name}</p>
                <span className="trend-pill bg-muted/40 text-muted-foreground">
                  {t(`roles.${m.role.toLowerCase()}` as 'roles.owner')}
                </span>
                {m.role === 'CHILD' && m.hasPin && (
                  <span className="trend-pill bg-success/10 text-success">
                    <Lock size={10} aria-hidden="true" />
                    {t('pinSet')}
                  </span>
                )}
              </div>
              <p
                className="text-xs text-muted-foreground mt-0.5 tabular-nums"
                dir="ltr"
                style={{ fontFeatureSettings: '"lnum", "tnum"' }}
              >
                {f.phone(m.phone)}
                {m.age != null && ` · ${tc('yearsOld', { age: m.age })}`}
              </p>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {showPinAction && (
                <button
                  type="button"
                  onClick={() => onSetPin(m)}
                  className="flex items-center justify-center rounded-lg min-h-[44px] min-w-[44px] text-muted-foreground hover:text-info hover:bg-info/10 transition-smooth"
                  aria-label={m.hasPin ? t('changePinAria', { name: m.name }) : t('setPinAria', { name: m.name })}
                >
                  <KeyRound size={18} aria-hidden="true" />
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  onClick={() => handleDelete(m)}
                  disabled={deleteMember.isPending}
                  className="flex items-center justify-center rounded-lg min-h-[44px] min-w-[44px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-smooth disabled:opacity-50"
                  aria-label={t('deleteAria', { name: m.name })}
                >
                  <Trash2 size={18} aria-hidden="true" />
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
