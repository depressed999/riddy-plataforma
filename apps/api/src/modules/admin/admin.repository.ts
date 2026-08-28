import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm';

import { DatabaseService } from '../../database/database.service';
import {
  adminAuditEvents,
  authSessions,
  bookings,
  hostProfiles,
  kycCases,
  messageConversations,
  messages,
  payments,
  users,
  vehicles,
} from '../../database/schema';
import type {
  AdminListQuery,
  AdminPage,
  AdminUserRole,
  AdminUserStatus,
  AdminVehicleStatus,
} from './admin.types';

@Injectable()
export class AdminRepository {
  constructor(
    @Inject(DatabaseService)
    private readonly databaseService: DatabaseService,
  ) {}

  async dashboard() {
    const db = this.databaseService.database;
    const [
      [userTotals],
      [vehicleTotals],
      [bookingTotals],
      [paymentTotals],
      [kycTotals],
      [conversationTotals],
    ] = await Promise.all([
      db
        .select({
          active: sql<number>`count(*) filter (where ${users.status} = 'active')::int`,
          suspended: sql<number>`count(*) filter (where ${users.status} = 'suspended')::int`,
          total: sql<number>`count(*)::int`,
        })
        .from(users),
      db
        .select({
          active: sql<number>`count(*) filter (where ${vehicles.status} = 'active')::int`,
          total: sql<number>`count(*)::int`,
        })
        .from(vehicles),
      db
        .select({
          confirmed: sql<number>`count(*) filter (where ${bookings.status} = 'confirmed')::int`,
          pending: sql<number>`count(*) filter (where ${bookings.status} = 'pending')::int`,
          total: sql<number>`count(*)::int`,
        })
        .from(bookings),
      db
        .select({
          approvedAmount: sql<string>`coalesce(sum(${payments.amount}) filter (where ${payments.status} = 'approved'), 0)`,
          pending: sql<number>`count(*) filter (where ${payments.status} in ('created', 'pending', 'in_process'))::int`,
          total: sql<number>`count(*)::int`,
        })
        .from(payments),
      db
        .select({
          pending: sql<number>`count(*) filter (where ${kycCases.status} = 'pending_review')::int`,
        })
        .from(kycCases),
      db
        .select({
          conversations: sql<number>`count(*)::int`,
        })
        .from(messageConversations),
    ]);
    const [messageTotal] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(messages);

    return {
      bookings: bookingTotals ?? { confirmed: 0, pending: 0, total: 0 },
      kyc: kycTotals ?? { pending: 0 },
      messages: {
        conversations: conversationTotals?.conversations ?? 0,
        total: messageTotal?.total ?? 0,
      },
      payments: {
        approvedAmount: Number(paymentTotals?.approvedAmount ?? 0),
        pending: paymentTotals?.pending ?? 0,
        total: paymentTotals?.total ?? 0,
      },
      users: userTotals ?? { active: 0, suspended: 0, total: 0 },
      vehicles: vehicleTotals ?? { active: 0, total: 0 },
    };
  }

  async listUsers(query: AdminListQuery): Promise<AdminPage<unknown>> {
    const conditions: SQL[] = [];
    if (query.status)
      conditions.push(eq(users.status, query.status as AdminUserStatus));
    if (query.query) {
      const term = `%${query.query.trim()}%`;
      conditions.push(or(ilike(users.name, term), ilike(users.email, term))!);
    }
    const where = conditions.length ? and(...conditions) : undefined;
    const [[totalRow], items] = await Promise.all([
      this.databaseService.database
        .select({ total: count() })
        .from(users)
        .where(where),
      this.databaseService.database
        .select({
          createdAt: users.createdAt,
          email: users.email,
          emailVerified: users.emailVerified,
          id: users.id,
          name: users.name,
          role: users.role,
          status: users.status,
          suspendedAt: users.suspendedAt,
          suspensionReason: users.suspensionReason,
        })
        .from(users)
        .where(where)
        .orderBy(desc(users.createdAt))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
    ]);
    return page(items, Number(totalRow?.total ?? 0), query);
  }

  async listVehicles(query: AdminListQuery): Promise<AdminPage<unknown>> {
    const conditions: SQL[] = [];
    if (query.status)
      conditions.push(eq(vehicles.status, query.status as AdminVehicleStatus));
    if (query.query) {
      const term = `%${query.query.trim()}%`;
      conditions.push(
        or(
          ilike(vehicles.make, term),
          ilike(vehicles.model, term),
          ilike(users.email, term),
        )!,
      );
    }
    const where = conditions.length ? and(...conditions) : undefined;
    const base = this.databaseService.database
      .select({ total: count() })
      .from(vehicles)
      .innerJoin(users, eq(vehicles.ownerId, users.id));
    const [[totalRow], items] = await Promise.all([
      base.where(where),
      this.databaseService.database
        .select({
          city: vehicles.city,
          createdAt: vehicles.createdAt,
          dailyRate: vehicles.dailyRate,
          id: vehicles.id,
          make: vehicles.make,
          model: vehicles.model,
          ownerEmail: users.email,
          ownerId: vehicles.ownerId,
          ownerName: users.name,
          state: vehicles.state,
          status: vehicles.status,
          year: vehicles.year,
        })
        .from(vehicles)
        .innerJoin(users, eq(vehicles.ownerId, users.id))
        .where(where)
        .orderBy(desc(vehicles.createdAt))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
    ]);
    return page(items, Number(totalRow?.total ?? 0), query);
  }

  async listBookings(query: AdminListQuery): Promise<AdminPage<unknown>> {
    const renter = users;
    const conditions: SQL[] = [];
    if (query.status)
      conditions.push(
        eq(
          bookings.status,
          query.status as 'pending' | 'confirmed' | 'cancelled' | 'completed',
        ),
      );
    if (query.query) {
      const term = `%${query.query.trim()}%`;
      conditions.push(
        or(
          ilike(renter.name, term),
          ilike(renter.email, term),
          ilike(vehicles.make, term),
          ilike(vehicles.model, term),
        )!,
      );
    }
    const where = conditions.length ? and(...conditions) : undefined;
    const join = this.databaseService.database
      .select({ total: count() })
      .from(bookings)
      .innerJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
      .innerJoin(renter, eq(bookings.renterId, renter.id));
    const [[totalRow], items] = await Promise.all([
      join.where(where),
      this.databaseService.database
        .select({
          createdAt: bookings.createdAt,
          id: bookings.id,
          pickupDate: bookings.pickupDate,
          renterEmail: renter.email,
          renterName: renter.name,
          returnDate: bookings.returnDate,
          status: bookings.status,
          totalPrice: bookings.totalPrice,
          vehicleId: vehicles.id,
          vehicleName: sql<string>`${vehicles.make} || ' ' || ${vehicles.model}`,
        })
        .from(bookings)
        .innerJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
        .innerJoin(renter, eq(bookings.renterId, renter.id))
        .where(where)
        .orderBy(desc(bookings.createdAt))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
    ]);
    return page(items, Number(totalRow?.total ?? 0), query);
  }

  async listPayments(query: AdminListQuery): Promise<AdminPage<unknown>> {
    const conditions: SQL[] = [];
    if (query.status)
      conditions.push(
        eq(
          payments.status,
          query.status as typeof payments.$inferSelect.status,
        ),
      );
    if (query.query) {
      const term = `%${query.query.trim()}%`;
      conditions.push(
        or(
          ilike(users.email, term),
          ilike(vehicles.make, term),
          ilike(vehicles.model, term),
        )!,
      );
    }
    const where = conditions.length ? and(...conditions) : undefined;
    const joined = this.databaseService.database
      .select({ total: count() })
      .from(payments)
      .innerJoin(bookings, eq(payments.bookingId, bookings.id))
      .innerJoin(users, eq(bookings.renterId, users.id))
      .innerJoin(vehicles, eq(bookings.vehicleId, vehicles.id));
    const [[totalRow], items] = await Promise.all([
      joined.where(where),
      this.databaseService.database
        .select({
          amount: payments.amount,
          bookingId: payments.bookingId,
          createdAt: payments.createdAt,
          currency: payments.currency,
          id: payments.id,
          method: payments.method,
          payerEmail: users.email,
          providerPaymentId: payments.providerPaymentId,
          status: payments.status,
          vehicleName: sql<string>`${vehicles.make} || ' ' || ${vehicles.model}`,
        })
        .from(payments)
        .innerJoin(bookings, eq(payments.bookingId, bookings.id))
        .innerJoin(users, eq(bookings.renterId, users.id))
        .innerJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
        .where(where)
        .orderBy(desc(payments.createdAt))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
    ]);
    return page(items, Number(totalRow?.total ?? 0), query);
  }

  async listAudit(query: AdminListQuery): Promise<AdminPage<unknown>> {
    const conditions: SQL[] = [];
    if (query.query) {
      const term = `%${query.query.trim()}%`;
      conditions.push(
        or(
          ilike(adminAuditEvents.action, term),
          ilike(adminAuditEvents.reason, term),
          ilike(users.email, term),
        )!,
      );
    }
    const where = conditions.length ? and(...conditions) : undefined;
    const [[totalRow], items] = await Promise.all([
      this.databaseService.database
        .select({ total: count() })
        .from(adminAuditEvents)
        .innerJoin(users, eq(adminAuditEvents.actorUserId, users.id))
        .where(where),
      this.databaseService.database
        .select({
          action: adminAuditEvents.action,
          actorEmail: users.email,
          actorName: users.name,
          createdAt: adminAuditEvents.createdAt,
          id: adminAuditEvents.id,
          metadata: adminAuditEvents.metadata,
          reason: adminAuditEvents.reason,
          targetId: adminAuditEvents.targetId,
          targetType: adminAuditEvents.targetType,
        })
        .from(adminAuditEvents)
        .innerJoin(users, eq(adminAuditEvents.actorUserId, users.id))
        .where(where)
        .orderBy(desc(adminAuditEvents.createdAt))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
    ]);
    return page(items, Number(totalRow?.total ?? 0), query);
  }

  async findUser(id: string) {
    const [row] = await this.databaseService.database
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return row ?? null;
  }

  async updateUserRole(
    actorId: string,
    id: string,
    role: AdminUserRole,
    reason: string,
  ) {
    return this.databaseService.database.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      if (!current) return null;
      const [updated] = await tx
        .update(users)
        .set({ role, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();
      await tx.insert(adminAuditEvents).values({
        action: 'user.role_changed',
        actorUserId: actorId,
        metadata: { from: current.role, to: role },
        reason,
        targetId: id,
        targetType: 'user',
      });
      return updated ?? null;
    });
  }

  async updateUserStatus(
    actorId: string,
    id: string,
    status: AdminUserStatus,
    reason: string,
  ) {
    return this.databaseService.database.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      if (!current) return null;
      const now = new Date();
      const [updated] = await tx
        .update(users)
        .set({
          status,
          suspendedAt: status === 'suspended' ? now : null,
          suspensionReason: status === 'suspended' ? reason : null,
          updatedAt: now,
        })
        .where(eq(users.id, id))
        .returning();
      if (status === 'suspended')
        await tx.delete(authSessions).where(eq(authSessions.userId, id));
      await tx.insert(adminAuditEvents).values({
        action: status === 'suspended' ? 'user.suspended' : 'user.reactivated',
        actorUserId: actorId,
        metadata: { from: current.status, to: status },
        reason,
        targetId: id,
        targetType: 'user',
      });
      return updated ?? null;
    });
  }

  async findVehicle(id: string) {
    const [row] = await this.databaseService.database
      .select({
        vehicle: vehicles,
        hostStatus: hostProfiles.status,
        kycStatus: kycCases.status,
      })
      .from(vehicles)
      .leftJoin(hostProfiles, eq(vehicles.ownerId, hostProfiles.userId))
      .leftJoin(kycCases, eq(vehicles.ownerId, kycCases.userId))
      .where(eq(vehicles.id, id))
      .limit(1);
    return row ?? null;
  }

  async updateVehicleStatus(
    actorId: string,
    id: string,
    status: AdminVehicleStatus,
    reason: string,
  ) {
    return this.databaseService.database.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(vehicles)
        .where(eq(vehicles.id, id))
        .limit(1);
      if (!current) return null;
      const [updated] = await tx
        .update(vehicles)
        .set({ status, updatedAt: new Date() })
        .where(eq(vehicles.id, id))
        .returning();
      await tx.insert(adminAuditEvents).values({
        action: 'vehicle.status_changed',
        actorUserId: actorId,
        metadata: { from: current.status, to: status },
        reason,
        targetId: id,
        targetType: 'vehicle',
      });
      return updated ?? null;
    });
  }
}

function page<T>(
  items: T[],
  total: number,
  query: AdminListQuery,
): AdminPage<T> {
  return {
    items,
    meta: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    },
  };
}
