import { Inject, Injectable } from '@nestjs/common';
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  type SQL,
} from 'drizzle-orm';

import { DatabaseService } from '../../database/database.service';
import {
  vehicleImages,
  vehicles,
  type VehicleImageSelect,
  type VehicleSelect,
} from '../../database/schema';
import type {
  PaginatedVehicles,
  Vehicle,
  VehicleImage,
  VehicleSearch,
} from './vehicles.types';

@Injectable()
export class VehiclesRepository {
  constructor(
    @Inject(DatabaseService)
    private readonly databaseService: DatabaseService,
  ) {}

  async search(filters: VehicleSearch): Promise<PaginatedVehicles> {
    const where = this.buildWhere(filters);
    const countRows = await this.databaseService.database
      .select({ total: count() })
      .from(vehicles)
      .where(where);
    const total = countRows[0]?.total ?? 0;

    const totalPages = Math.ceil(total / filters.pageSize);
    const page = totalPages === 0 ? 1 : Math.min(filters.page, totalPages);
    const vehicleRows = await this.databaseService.database
      .select()
      .from(vehicles)
      .where(where)
      .orderBy(...this.buildOrder(filters.sort))
      .limit(filters.pageSize)
      .offset((page - 1) * filters.pageSize);

    if (vehicleRows.length === 0) {
      return {
        items: [],
        meta: { page, pageSize: filters.pageSize, total, totalPages },
      };
    }

    const imageRows = await this.databaseService.database
      .select()
      .from(vehicleImages)
      .where(
        inArray(
          vehicleImages.vehicleId,
          vehicleRows.map((vehicle) => vehicle.id),
        ),
      )
      .orderBy(asc(vehicleImages.sortOrder));
    const imagesByVehicle = this.groupImagesByVehicle(imageRows);

    return {
      items: vehicleRows.map((vehicle) =>
        this.toDomain(vehicle, imagesByVehicle.get(vehicle.id) ?? []),
      ),
      meta: { page, pageSize: filters.pageSize, total, totalPages },
    };
  }

  async findActiveById(id: string): Promise<Vehicle | null> {
    const [vehicle] = await this.databaseService.database
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, id))
      .limit(1);

    if (!vehicle || vehicle.status !== 'active') {
      return null;
    }

    const images = await this.databaseService.database
      .select()
      .from(vehicleImages)
      .where(eq(vehicleImages.vehicleId, id))
      .orderBy(asc(vehicleImages.sortOrder));

    return this.toDomain(
      vehicle,
      images.map((image) => this.toImage(image)),
    );
  }

  async findActiveImage(imageId: string): Promise<VehicleImage | null> {
    const [row] = await this.databaseService.database
      .select({ image: vehicleImages })
      .from(vehicleImages)
      .innerJoin(vehicles, eq(vehicleImages.vehicleId, vehicles.id))
      .where(and(eq(vehicleImages.id, imageId), eq(vehicles.status, 'active')))
      .limit(1);
    return row ? this.toImage(row.image) : null;
  }

  private groupImagesByVehicle(
    imageRows: VehicleImageSelect[],
  ): Map<string, VehicleImage[]> {
    const imagesByVehicle = new Map<string, VehicleImage[]>();

    for (const image of imageRows) {
      const currentImages = imagesByVehicle.get(image.vehicleId) ?? [];
      currentImages.push(this.toImage(image));
      imagesByVehicle.set(image.vehicleId, currentImages);
    }

    return imagesByVehicle;
  }

  private buildOrder(sort: VehicleSearch['sort']): SQL[] {
    switch (sort) {
      case 'price_asc':
        return [asc(vehicles.dailyRate), asc(vehicles.id)];
      case 'price_desc':
        return [desc(vehicles.dailyRate), asc(vehicles.id)];
      default:
        return [desc(vehicles.createdAt), asc(vehicles.id)];
    }
  }

  private buildWhere(filters: VehicleSearch): SQL | undefined {
    const conditions: SQL[] = [eq(vehicles.status, 'active')];

    if (filters.query) {
      const term = `%${filters.query.trim()}%`;
      const queryCondition = or(
        ilike(vehicles.make, term),
        ilike(vehicles.model, term),
        ilike(vehicles.description, term),
      );

      if (queryCondition) {
        conditions.push(queryCondition);
      }
    }

    if (filters.location) {
      const location = `%${filters.location.trim()}%`;
      const locationCondition = or(
        ilike(vehicles.city, location),
        ilike(vehicles.state, location),
      );

      if (locationCondition) {
        conditions.push(locationCondition);
      }
    }

    if (filters.type) {
      conditions.push(eq(vehicles.type, filters.type));
    }

    if (filters.transmission) {
      conditions.push(ilike(vehicles.transmission, filters.transmission));
    }

    if (filters.fuelType) {
      conditions.push(ilike(vehicles.fuelType, filters.fuelType));
    }

    if (filters.seats !== undefined) {
      conditions.push(gte(vehicles.seats, filters.seats));
    }

    if (filters.minPrice !== undefined) {
      conditions.push(gte(vehicles.dailyRate, String(filters.minPrice)));
    }

    if (filters.maxPrice !== undefined) {
      conditions.push(lte(vehicles.dailyRate, String(filters.maxPrice)));
    }

    return and(...conditions);
  }

  private toDomain(vehicle: VehicleSelect, images: VehicleImage[]): Vehicle {
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
}
