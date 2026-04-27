/**
 * Appliances Repository — طبقة Data Access للأجهزة والضمانات
 */

import { prisma } from '@/core/db/prisma';
import type { Appliance } from '@prisma/client';
import type {
  CreateApplianceInput,
  UpdateApplianceInput,
  CreateMaintenanceScheduleInput,
  ApplianceFilters,
} from '../schemas';

export interface ApplianceWithMeta extends Appliance {
  warrantyDaysLeft: number | null;
  warrantyStatus: 'active' | 'expiring_soon' | 'expired' | 'none';
  maintenanceSchedules: Array<{
    id: string;
    taskName: string;
    nextDueAt: Date;
    intervalDays: number;
    isActive: boolean;
  }>;
  documentsCount: number;
}

export class AppliancesRepository {
  constructor(private readonly householdId: string) {}

  async list(filters?: ApplianceFilters): Promise<{ data: ApplianceWithMeta[]; total: number }> {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const skip = (page - 1) * limit;

    const now = new Date();
    const soonThreshold = new Date(now);
    soonThreshold.setDate(soonThreshold.getDate() + 60);

    const where: Record<string, unknown> = {
      householdId: this.householdId,
      deletedAt: null,
      isActive: true,
      ...(filters?.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { brand: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
      ...(filters?.category && { category: filters.category }),
      ...(filters?.warrantyExpiringSoon && {
        warrantyEnd: { gte: now, lte: soonThreshold },
      }),
    };

    const [appliances, total] = await prisma.$transaction([
      prisma.appliance.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          schedules: { where: { isActive: true }, orderBy: { nextDueAt: 'asc' } },
          _count: { select: { documents: true } },
        },
      }),
      prisma.appliance.count({ where }),
    ]);

    return {
      data: appliances.map((a) => this._addMeta(a)),
      total,
    };
  }

  async findById(id: string): Promise<ApplianceWithMeta | null> {
    const appliance = await prisma.appliance.findFirst({
      where: { id, householdId: this.householdId, deletedAt: null },
      include: {
        schedules: { orderBy: { nextDueAt: 'asc' } },
        documents: { orderBy: { uploadedAt: 'desc' } },
        _count: { select: { documents: true } },
      },
    });
    if (!appliance) return null;
    return this._addMeta(appliance);
  }

  async create(data: CreateApplianceInput): Promise<Appliance> {
    return prisma.appliance.create({
      data: {
        householdId: this.householdId,
        name: data.name,
        brand: data.brand,
        model: data.model,
        serialNumber: data.serialNumber,
        category: data.category,
        location: data.location,
        purchaseDate: data.purchaseDate,
        purchasePrice: data.purchasePrice,
        store: data.store,
        storeOrderNumber: data.storeOrderNumber,
        warrantyStart: data.warrantyStart,
        warrantyEnd: data.warrantyEnd,
        warrantyMonths: data.warrantyMonths,
        warrantyType: data.warrantyType,
        warrantyContact: data.warrantyContact,
        warrantyNotes: data.warrantyNotes,
        warrantyNotifyDaysBefore: data.warrantyNotifyDaysBefore,
        imageUrl: data.imageUrl,
        notes: data.notes,
        isActive: data.isActive,
      },
    });
  }

  async update(id: string, data: UpdateApplianceInput): Promise<Appliance> {
    return prisma.appliance.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.appliance.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ============================================================
  // Maintenance Schedules
  // ============================================================

  async addMaintenanceSchedule(applianceId: string, data: CreateMaintenanceScheduleInput) {
    return prisma.maintenanceSchedule.create({
      data: {
        applianceId,
        taskName: data.taskName,
        intervalDays: data.intervalDays,
        lastDoneAt: data.lastDoneAt,
        nextDueAt: data.nextDueAt,
        notifyBeforeDays: data.notifyBeforeDays,
      },
    });
  }

  async logMaintenance(scheduleId: string, doneById: string, cost?: number, notes?: string) {
    const schedule = await prisma.maintenanceSchedule.findUniqueOrThrow({
      where: { id: scheduleId },
    });

    const now = new Date();
    const { addDays } = await import('date-fns');
    const nextDueAt = addDays(now, schedule.intervalDays);

    return prisma.$transaction([
      prisma.maintenanceLog.create({
        data: { scheduleId, doneById, cost, notes },
      }),
      prisma.maintenanceSchedule.update({
        where: { id: scheduleId },
        data: { lastDoneAt: now, nextDueAt },
      }),
    ]);
  }

  // ============================================================
  // Warranty expiry alerts (for cron)
  // ============================================================

  async getExpiringWarranties(daysAhead: number = 30): Promise<ApplianceWithMeta[]> {
    const now = new Date();
    const threshold = new Date(now);
    threshold.setDate(threshold.getDate() + daysAhead);

    const appliances = await prisma.appliance.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        warrantyEnd: { gte: now, lte: threshold },
      },
      include: {
        schedules: { where: { isActive: true } },
        _count: { select: { documents: true } },
      },
    });

    return appliances.map((a) => this._addMeta(a));
  }

  // ============================================================
  // Private helpers
  // ============================================================

  private _addMeta(
    appliance: Appliance & {
      schedules?: Array<{
        id: string;
        taskName: string;
        nextDueAt: Date;
        intervalDays: number;
        isActive: boolean;
      }>;
      _count?: { documents: number };
    }
  ): ApplianceWithMeta {
    const now = new Date();
    let warrantyDaysLeft: number | null = null;
    let warrantyStatus: ApplianceWithMeta['warrantyStatus'] = 'none';

    if (appliance.warrantyEnd) {
      const diff = Math.ceil(
        (new Date(appliance.warrantyEnd).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      warrantyDaysLeft = diff;
      if (diff < 0) warrantyStatus = 'expired';
      else if (diff <= 60) warrantyStatus = 'expiring_soon';
      else warrantyStatus = 'active';
    }

    return {
      ...appliance,
      warrantyDaysLeft,
      warrantyStatus,
      maintenanceSchedules: appliance.schedules ?? [],
      documentsCount: appliance._count?.documents ?? 0,
    };
  }
}
