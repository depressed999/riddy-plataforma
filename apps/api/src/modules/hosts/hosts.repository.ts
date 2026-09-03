import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, gt, inArray, lt } from 'drizzle-orm';

import { DatabaseService } from '../../database/database.service';
import {
  bookings,
  hostProfiles,
  kycCases,
  payments,
  users,
  vehicleAvailabilityBlocks,
  vehicleImages,
  vehicles,
  type HostProfileSelect,
  type VehicleAvailabilityBlockSelect,
  type VehicleImageSelect,
  type VehicleSelect,
} from '../../database/schema';
import type { VehicleImage } from '../vehicles/vehicles.types';
import type {
  HostAvailabilityBlock,
  HostBooking,
  HostDashboard,
  HostFinance,
  HostKycStatus,
  HostMetrics,
  HostProfile,
  HostProfileStatus,
  HostVehicle,
  HostVehicleInput,
  HostVehicleUpdate,
} from './hosts.types';

@Injectable()
export class HostsRepository {
  constructor(
    @Inject(DatabaseService)
    private readonly databaseService: DatabaseService,
  ) {}

  async getDashboard(userId: string): Promise<HostDashboard> {
    const [profile, kycStatus, metrics] = await Promise.all([
      this.findProfile(userId),
      this.getKycStatus(userId),
      this.getMetrics(userId),
    ]);
    return { kycStatus, metrics, profile };
  }

  async findProfile(userId: string): Promise<HostProfile | null> {
    const [profile] = await this.databaseService.database
      .select()
      .from(hostProfiles)
      .where(eq(hostProfiles.userId, userId))
      .limit(1);
    return profile ? this.toProfile(profile) : null;
  }

  async getKycStatus(userId: string): Promise<HostKycStatus> {
    const [kycCase] = await this.databaseService.database
      .select({ status: kycCases.status })
      .from(kycCases)
      .where(eq(kycCases.userId, userId))
      .limit(1);
    return kycCase?.status ?? 'not_started';
  }

  async upsertProfile(input: {
    bio: string | null;
    displayName: string;
    status: HostProfileStatus;
    supportPhone: string | null;
    userId: string;
  }): Promise<HostProfile> {
    const now = new Date();
    const [profile] = await this.databaseService.database
      .insert(hostProfiles)
      .values({ ...input, termsAcceptedAt: now })
      .onConflictDoUpdate({
        set: {
          bio: input.bio,
          displayName: input.displayName,
          status: input.status,
          supportPhone: input.supportPhone,
          termsAcceptedAt: now,
          updatedAt: now,
        },
        target: hostProfiles.userId,
      })
      .returning();
    if (!profile) {
      throw new Error('O perfil de anfitrião não foi persistido.');
    }
    return this.toProfile(profile);
  }

  async updateProfile(
    userId: string,
    input: {
      bio?: string | null;
      displayName?: string;
      supportPhone?: string | null;
    },
  ): Promise<HostProfile | null> {
    const [profile] = await this.databaseService.database
      .update(hostProfiles)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(hostProfiles.userId, userId))
      .returning();
    return profile ? this.toProfile(profile) : null;
  }

  async setProfileStatus(
    userId: string,
    status: HostProfileStatus,
  ): Promise<HostProfile | null> {
    const [profile] = await this.databaseService.database
      .update(hostProfiles)
      .set({ status, updatedAt: new Date() })
      .where(eq(hostProfiles.userId, userId))
      .returning();
    return profile ? this.toProfile(profile) : null;
  }

  async listVehicles(userId: string): Promise<HostVehicle[]> {
    const rows = await this.databaseService.database
      .select()
      .from(vehicles)
      .where(eq(vehicles.ownerId, userId))
      .orderBy(desc(vehicles.createdAt));
    const images = await this.imagesForVehicles(rows.map((row) => row.id));
    return rows.map((row) => this.toVehicle(row, images.get(row.id) ?? []));
  }

  async findVehicle(
    userId: string,
    vehicleId: string,
  ): Promise<HostVehicle | null> {
    const [row] = await this.databaseService.database
      .select()
      .from(vehicles)
      .where(and(eq(vehicles.id, vehicleId), eq(vehicles.ownerId, userId)))
      .limit(1);
    if (!row) {
      return null;
    }
    const images = await this.imagesForVehicles([row.id]);
    return this.toVehicle(row, images.get(row.id) ?? []);
  }

  async createVehicle(
    userId: string,
    input: HostVehicleInput,
  ): Promise<HostVehicle> {
    const [vehicle] = await this.databaseService.database
      .insert(vehicles)
      .values({
        amenities: input.amenities,
        city: input.city,
        dailyRate: String(input.dailyRate),
        description: input.description,
        fuelType: input.fuelType,
        location: { x: input.longitude, y: input.latitude },
        make: input.make,
        model: input.model,
        ownerId: userId,
        seats: input.seats,
        state: input.state,
        status: 'draft',
        transmission: input.transmission,
        type: input.type,
        year: input.year,
      })
      .returning();
    if (!vehicle) {
      throw new Error('O veículo não foi persistido.');
    }
    return this.toVehicle(vehicle, []);
  }

  async updateVehicle(
    userId: string,
    vehicleId: string,
    input: HostVehicleUpdate,
  ): Promise<HostVehicle | null> {
    const location =
      input.latitude !== undefined && input.longitude !== undefined
        ? { x: input.longitude, y: input.latitude }
        : undefined;
    const [vehicle] = await this.databaseService.database
      .update(vehicles)
      .set({
        amenities: input.amenities,
        city: input.city,
        dailyRate:
          input.dailyRate === undefined ? undefined : String(input.dailyRate),
        description: input.description,
        fuelType: input.fuelType,
        location,
        make: input.make,
        model: input.model,
        seats: input.seats,
        state: input.state,
        transmission: input.transmission,
        type: input.type,
        updatedAt: new Date(),
        year: input.year,
      })
      .where(and(eq(vehicles.id, vehicleId), eq(vehicles.ownerId, userId)))
      .returning();
    if (!vehicle) {
      return null;
    }
    const images = await this.imagesForVehicles([vehicle.id]);
    return this.toVehicle(vehicle, images.get(vehicle.id) ?? []);
  }

  async updateVehicleStatus(
    userId: string,
    vehicleId: string,
    status: HostVehicle['status'],
  ): Promise<HostVehicle | null> {
    const [vehicle] = await this.databaseService.database
      .update(vehicles)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(vehicles.id, vehicleId), eq(vehicles.ownerId, userId)))
      .returning();
    if (!vehicle) {
      return null;
    }
    const images = await this.imagesForVehicles([vehicle.id]);
    return this.toVehicle(vehicle, images.get(vehicle.id) ?? []);
  }

  async addVehicleImage(input: {
    altText: string;
    storageKey: string;
    vehicleId: string;
  }): Promise<HostVehicle> {
    await this.databaseService.database.transaction(async (transaction) => {
      const existing = await transaction
        .select({ id: vehicleImages.id })
        .from(vehicleImages)
        .where(eq(vehicleImages.vehicleId, input.vehicleId))
        .orderBy(asc(vehicleImages.sortOrder));
      await transaction.insert(vehicleImages).values({
        altText: input.altText,
        isCover: existing.length === 0,
        sortOrder: existing.length,
        storageKey: input.storageKey,
        vehicleId: input.vehicleId,
      });
    });
    return this.requiredVehicle(input.vehicleId);
  }

  async findOwnedVehicleImage(
    userId: string,
    vehicleId: string,
    imageId: string,
  ): Promise<VehicleImage | null> {
    const [row] = await this.databaseService.database
      .select({ image: vehicleImages })
      .from(vehicleImages)
      .innerJoin(vehicles, eq(vehicleImages.vehicleId, vehicles.id))
      .where(
        and(
          eq(vehicleImages.id, imageId),
          eq(vehicleImages.vehicleId, vehicleId),
          eq(vehicles.ownerId, userId),
        ),
      )
      .limit(1);
    return row ? this.toImage(row.image) : null;
  }

  async setVehicleImageCover(
    vehicleId: string,
    imageId: string,
  ): Promise<HostVehicle> {
    await this.databaseService.database.transaction(async (transaction) => {
      await transaction
        .update(vehicleImages)
        .set({ isCover: false })
        .where(eq(vehicleImages.vehicleId, vehicleId));
      await transaction
        .update(vehicleImages)
        .set({ isCover: true })
        .where(
          and(
            eq(vehicleImages.id, imageId),
            eq(vehicleImages.vehicleId, vehicleId),
          ),
        );
    });
    return this.requiredVehicle(vehicleId);
  }

  async reorderVehicleImages(
    vehicleId: string,
    imageIds: string[],
  ): Promise<HostVehicle> {
    await this.databaseService.database.transaction(async (transaction) => {
      for (const [sortOrder, imageId] of imageIds.entries()) {
        await transaction
          .update(vehicleImages)
          .set({ sortOrder })
          .where(
            and(
              eq(vehicleImages.id, imageId),
              eq(vehicleImages.vehicleId, vehicleId),
            ),
          );
      }
    });
    return this.requiredVehicle(vehicleId);
  }

  async deleteVehicleImage(
    vehicleId: string,
    imageId: string,
  ): Promise<HostVehicle> {
    await this.databaseService.database.transaction(async (transaction) => {
      const [deleted] = await transaction
        .delete(vehicleImages)
        .where(
          and(
            eq(vehicleImages.id, imageId),
            eq(vehicleImages.vehicleId, vehicleId),
          ),
        )
        .returning({ isCover: vehicleImages.isCover });
      if (deleted?.isCover) {
        const [next] = await transaction
          .select({ id: vehicleImages.id })
          .from(vehicleImages)
          .where(eq(vehicleImages.vehicleId, vehicleId))
          .orderBy(asc(vehicleImages.sortOrder))
          .limit(1);
        if (next) {
          await transaction
            .update(vehicleImages)
            .set({ isCover: true })
            .where(eq(vehicleImages.id, next.id));
        }
      }
    });
    return this.requiredVehicle(vehicleId);
  }

  async listBookings(userId: string): Promise<HostBooking[]> {
    const rows = await this.databaseService.database
      .select({ booking: bookings, renter: users, vehicle: vehicles })
      .from(bookings)
      .innerJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
      .innerJoin(users, eq(bookings.renterId, users.id))
      .where(eq(vehicles.ownerId, userId))
      .orderBy(desc(bookings.createdAt));
    return rows.map(({ booking, renter, vehicle }) => ({
      createdAt: booking.createdAt.toISOString(),
      currency: 'BRL',
      id: booking.id,
      pickupDate: booking.pickupDate,
      renter: { id: renter.id, name: renter.name },
      returnDate: booking.returnDate,
      status: booking.status,
      totalDays: booking.totalDays,
      totalPrice: Number(booking.totalPrice),
      vehicle: { id: vehicle.id, make: vehicle.make, model: vehicle.model },
    }));
  }

  async listAvailabilityBlocks(
    userId: string,
  ): Promise<HostAvailabilityBlock[]> {
    const rows = await this.databaseService.database
      .select({ block: vehicleAvailabilityBlocks, vehicle: vehicles })
      .from(vehicleAvailabilityBlocks)
      .innerJoin(vehicles, eq(vehicleAvailabilityBlocks.vehicleId, vehicles.id))
      .where(eq(vehicleAvailabilityBlocks.hostId, userId))
      .orderBy(asc(vehicleAvailabilityBlocks.startDate));
    return rows.map(({ block, vehicle }) =>
      this.toAvailabilityBlock(block, vehicle),
    );
  }

  async hasAvailabilityConflict(
    vehicleId: string,
    startDate: string,
    endDate: string,
  ): Promise<boolean> {
    const [block, booking] = await Promise.all([
      this.databaseService.database
        .select({ id: vehicleAvailabilityBlocks.id })
        .from(vehicleAvailabilityBlocks)
        .where(
          and(
            eq(vehicleAvailabilityBlocks.vehicleId, vehicleId),
            lt(vehicleAvailabilityBlocks.startDate, endDate),
            gt(vehicleAvailabilityBlocks.endDate, startDate),
          ),
        )
        .limit(1),
      this.databaseService.database
        .select({ id: bookings.id })
        .from(bookings)
        .where(
          and(
            eq(bookings.vehicleId, vehicleId),
            inArray(bookings.status, ['pending', 'confirmed']),
            lt(bookings.pickupDate, endDate),
            gt(bookings.returnDate, startDate),
          ),
        )
        .limit(1),
    ]);
    return Boolean(block[0] || booking[0]);
  }

  async createAvailabilityBlock(input: {
    endDate: string;
    hostId: string;
    reason: string | null;
    startDate: string;
    vehicleId: string;
  }): Promise<HostAvailabilityBlock> {
    const [block] = await this.databaseService.database
      .insert(vehicleAvailabilityBlocks)
      .values(input)
      .returning();
    if (!block) {
      throw new Error('O bloqueio de calendário não foi persistido.');
    }
    const vehicle = await this.findVehicle(input.hostId, input.vehicleId);
    if (!vehicle) {
      throw new Error('O veículo do bloqueio não foi encontrado.');
    }
    return this.toAvailabilityBlock(block, vehicle);
  }

  async deleteAvailabilityBlock(
    userId: string,
    blockId: string,
  ): Promise<boolean> {
    const [deleted] = await this.databaseService.database
      .delete(vehicleAvailabilityBlocks)
      .where(
        and(
          eq(vehicleAvailabilityBlocks.id, blockId),
          eq(vehicleAvailabilityBlocks.hostId, userId),
        ),
      )
      .returning({ id: vehicleAvailabilityBlocks.id });
    return Boolean(deleted);
  }

  async getFinance(userId: string): Promise<HostFinance> {
    const rows = await this.databaseService.database
      .select({ amount: payments.amount, status: payments.status })
      .from(payments)
      .innerJoin(bookings, eq(payments.bookingId, bookings.id))
      .innerJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
      .where(eq(vehicles.ownerId, userId));
    return {
      approvedBookings: rows.filter((row) => row.status === 'approved').length,
      approvedGross: sumAmounts(rows, ['approved']),
      currency: 'BRL',
      pendingGross: sumAmounts(rows, ['created', 'in_process', 'pending']),
      refundedGross: sumAmounts(rows, ['refunded']),
    };
  }

  private async getMetrics(userId: string): Promise<HostMetrics> {
    const [vehicleRows, bookingRows, finance] = await Promise.all([
      this.databaseService.database
        .select({ status: vehicles.status })
        .from(vehicles)
        .where(eq(vehicles.ownerId, userId)),
      this.databaseService.database
        .select({ status: bookings.status })
        .from(bookings)
        .innerJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
        .where(eq(vehicles.ownerId, userId)),
      this.getFinance(userId),
    ]);
    return {
      activeVehicles: vehicleRows.filter((row) => row.status === 'active')
        .length,
      approvedGross: finance.approvedGross,
      confirmedBookings: bookingRows.filter((row) => row.status === 'confirmed')
        .length,
      currency: 'BRL',
      pendingBookings: bookingRows.filter((row) => row.status === 'pending')
        .length,
      totalVehicles: vehicleRows.length,
    };
  }

  private async imagesForVehicles(
    vehicleIds: string[],
  ): Promise<Map<string, VehicleImage[]>> {
    if (vehicleIds.length === 0) {
      return new Map();
    }
    const rows = await this.databaseService.database
      .select()
      .from(vehicleImages)
      .where(inArray(vehicleImages.vehicleId, vehicleIds))
      .orderBy(asc(vehicleImages.sortOrder));
    const result = new Map<string, VehicleImage[]>();
    for (const row of rows) {
      const images = result.get(row.vehicleId) ?? [];
      images.push(this.toImage(row));
      result.set(row.vehicleId, images);
    }
    return result;
  }

  private async requiredVehicle(vehicleId: string): Promise<HostVehicle> {
    const [row] = await this.databaseService.database
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, vehicleId))
      .limit(1);
    if (!row) {
      throw new Error('O veículo não foi encontrado após atualizar as fotos.');
    }
    const images = await this.imagesForVehicles([vehicleId]);
    return this.toVehicle(row, images.get(vehicleId) ?? []);
  }

  private toProfile(profile: HostProfileSelect): HostProfile {
    return {
      bio: profile.bio,
      createdAt: profile.createdAt.toISOString(),
      displayName: profile.displayName,
      id: profile.id,
      status: profile.status,
      supportPhone: profile.supportPhone,
      termsAcceptedAt: profile.termsAcceptedAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
      userId: profile.userId,
    };
  }

  private toVehicle(
    vehicle: VehicleSelect,
    images: VehicleImage[],
  ): HostVehicle {
    return {
      amenities: vehicle.amenities,
      createdAt: vehicle.createdAt.toISOString(),
      dailyRate: Number(vehicle.dailyRate),
      description: vehicle.description,
      fuelType: vehicle.fuelType,
      id: vehicle.id,
      images,
      location: {
        city: vehicle.city,
        latitude: vehicle.location.y,
        longitude: vehicle.location.x,
        state: vehicle.state,
      },
      make: vehicle.make,
      model: vehicle.model,
      ownerId: vehicle.ownerId,
      seats: vehicle.seats,
      status: vehicle.status,
      transmission: vehicle.transmission,
      type: vehicle.type,
      updatedAt: vehicle.updatedAt.toISOString(),
      year: vehicle.year,
    };
  }

  private toImage(image: VehicleImageSelect): VehicleImage {
    return {
      altText: image.altText,
      id: image.id,
      isCover: image.isCover,
      sortOrder: image.sortOrder,
      storageKey: image.storageKey,
    };
  }

  private toAvailabilityBlock(
    block: VehicleAvailabilityBlockSelect,
    vehicle: { id: string; make: string; model: string },
  ): HostAvailabilityBlock {
    return {
      createdAt: block.createdAt.toISOString(),
      endDate: block.endDate,
      id: block.id,
      reason: block.reason,
      startDate: block.startDate,
      updatedAt: block.updatedAt.toISOString(),
      vehicle: { id: vehicle.id, make: vehicle.make, model: vehicle.model },
    };
  }
}

function sumAmounts(
  rows: Array<{ amount: string; status: string }>,
  statuses: string[],
): number {
  const total = rows
    .filter((row) => statuses.includes(row.status))
    .reduce((sum, row) => sum + Number(row.amount), 0);
  return Math.round((total + Number.EPSILON) * 100) / 100;
}
