import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrivateStorageService } from '../kyc/private-storage.service';
import { VehiclesRepository } from './vehicles.repository';
import { VehiclesCacheService } from './vehicles-cache.service';
import type {
  PaginatedVehicles,
  Vehicle,
  VehicleSearch,
} from './vehicles.types';

@Injectable()
export class VehiclesService {
  constructor(
    @Inject(VehiclesRepository)
    private readonly vehiclesRepository: VehiclesRepository,
    @Inject(VehiclesCacheService)
    private readonly cache: VehiclesCacheService,
    @Inject(PrivateStorageService)
    private readonly storage: PrivateStorageService,
  ) {}

  search(filters: VehicleSearch): Promise<PaginatedVehicles> {
    if (
      filters.minPrice !== undefined &&
      filters.maxPrice !== undefined &&
      filters.minPrice > filters.maxPrice
    ) {
      throw new BadRequestException({
        code: 'INVALID_PRICE_RANGE',
        message: 'O preço mínimo não pode ser maior que o preço máximo.',
      });
    }

    return this.cache.search(filters, () =>
      this.vehiclesRepository.search(filters),
    );
  }

  async findActiveById(id: string): Promise<Vehicle> {
    const vehicle = await this.cache.detail(id, () =>
      this.vehiclesRepository.findActiveById(id),
    );

    if (!vehicle) {
      throw new NotFoundException({
        code: 'VEHICLE_NOT_FOUND',
        message: 'Veículo não encontrado.',
      });
    }

    return vehicle;
  }

  async imageContentUrl(imageId: string): Promise<string> {
    const image = await this.vehiclesRepository.findActiveImage(imageId);
    if (!image || !image.storageKey.startsWith('vehicle-images/')) {
      throw new NotFoundException('Foto não encontrada.');
    }
    return this.storage.createViewUrl(image.storageKey);
  }
}
