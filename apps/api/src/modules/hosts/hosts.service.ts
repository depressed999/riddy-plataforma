import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { CacheService } from '../../infrastructure/redis/cache.service';
import { PrivateStorageService } from '../kyc/private-storage.service';
import { HostsRepository } from './hosts.repository';
import type {
  HostAvailabilityBlock,
  HostBooking,
  HostDashboard,
  HostFinance,
  HostProfile,
  HostVehicle,
  HostVehicleInput,
  HostVehicleUpdate,
  HostVehicleStatusInput,
  VehicleImageCompletion,
  VehicleImageUpload,
  VehicleImageUploadInput,
} from './hosts.types';

const MAX_VEHICLE_IMAGES = 10;
const imageExtensions: Record<VehicleImageUploadInput['mimeType'], string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

@Injectable()
export class HostsService {
  private readonly logger = new Logger(HostsService.name);

  constructor(
    @Inject(HostsRepository)
    private readonly repository: HostsRepository,
    @Inject(PrivateStorageService)
    private readonly storage: PrivateStorageService,
    @Optional()
    @Inject(CacheService)
    private readonly cache?: CacheService,
  ) {}

  async getDashboard(userId: string): Promise<HostDashboard> {
    const dashboard = await this.repository.getDashboard(userId);
    if (
      dashboard.profile?.status === 'onboarding' &&
      dashboard.kycStatus === 'approved'
    ) {
      dashboard.profile = await this.repository.setProfileStatus(
        userId,
        'active',
      );
    }
    return dashboard;
  }

  async onboard(
    userId: string,
    input: {
      acceptTerms: boolean;
      bio?: string;
      displayName: string;
      supportPhone?: string;
    },
  ): Promise<HostProfile> {
    if (!input.acceptTerms) {
      throw new BadRequestException(
        'Aceite os termos para criar o perfil de anfitrião.',
      );
    }
    const kycStatus = await this.repository.getKycStatus(userId);
    return this.repository.upsertProfile({
      bio: normalizeOptional(input.bio),
      displayName: input.displayName.trim(),
      status: kycStatus === 'approved' ? 'active' : 'onboarding',
      supportPhone: normalizePhone(input.supportPhone),
      userId,
    });
  }

  async updateProfile(
    userId: string,
    input: { bio?: string; displayName?: string; supportPhone?: string },
  ): Promise<HostProfile> {
    await this.requireHost(userId);
    const profile = await this.repository.updateProfile(userId, {
      bio: input.bio === undefined ? undefined : normalizeOptional(input.bio),
      displayName: input.displayName?.trim(),
      supportPhone:
        input.supportPhone === undefined
          ? undefined
          : normalizePhone(input.supportPhone),
    });
    if (!profile) {
      throw new NotFoundException('Perfil de anfitrião não encontrado.');
    }
    return profile;
  }

  async listVehicles(userId: string): Promise<HostVehicle[]> {
    await this.requireHost(userId);
    return this.repository.listVehicles(userId);
  }

  async createVehicle(
    userId: string,
    input: HostVehicleInput,
  ): Promise<HostVehicle> {
    await this.requireHost(userId);
    const vehicle = await this.repository.createVehicle(
      userId,
      normalizeVehicle(input),
    );
    await this.cache?.invalidate('vehicles');
    return vehicle;
  }

  async updateVehicle(
    userId: string,
    vehicleId: string,
    input: HostVehicleUpdate,
  ): Promise<HostVehicle> {
    await this.requireHost(userId);
    const current = await this.ownedVehicle(userId, vehicleId);
    if ((input.latitude === undefined) !== (input.longitude === undefined)) {
      throw new BadRequestException(
        'Latitude e longitude devem ser atualizadas juntas.',
      );
    }
    const updated = await this.repository.updateVehicle(
      userId,
      current.id,
      normalizeVehicleUpdate(input),
    );
    if (!updated) {
      throw new NotFoundException('Veículo não encontrado.');
    }
    await this.cache?.invalidate('vehicles');
    return updated;
  }

  async updateVehicleStatus(
    userId: string,
    vehicleId: string,
    input: HostVehicleStatusInput,
  ): Promise<HostVehicle> {
    const profile = await this.requireHost(userId);
    await this.ownedVehicle(userId, vehicleId);
    if (input.status === 'active') {
      const kycStatus = await this.repository.getKycStatus(userId);
      if (profile.status !== 'active' || kycStatus !== 'approved') {
        throw new ForbiddenException(
          'Conclua e aprove sua verificação de identidade antes de publicar veículos.',
        );
      }
      const vehicle = await this.ownedVehicle(userId, vehicleId);
      if (vehicle.images.length === 0) {
        throw new BadRequestException(
          'Adicione pelo menos uma foto antes de publicar o veículo.',
        );
      }
    }
    const updated = await this.repository.updateVehicleStatus(
      userId,
      vehicleId,
      input.status,
    );
    if (!updated) {
      throw new NotFoundException('Veículo não encontrado.');
    }
    await this.cache?.invalidate('vehicles');
    return updated;
  }

  async prepareVehicleImageUpload(
    userId: string,
    vehicleId: string,
    input: VehicleImageUploadInput,
  ): Promise<VehicleImageUpload> {
    await this.requireHost(userId);
    const vehicle = await this.ownedVehicle(userId, vehicleId);
    if (vehicle.images.length >= MAX_VEHICLE_IMAGES) {
      throw new ConflictException(
        `Cada veículo pode ter no máximo ${MAX_VEHICLE_IMAGES} fotos.`,
      );
    }
    const extension = imageExtensions[input.mimeType];
    const storageKey = `vehicle-images/${userId}/${vehicleId}/${randomUUID()}${extension}`;
    const signed = await this.storage.createUploadUrl(
      storageKey,
      input.mimeType,
    );
    return {
      expiresAt: signed.expiresAt.toISOString(),
      headers: signed.headers,
      storageKey,
      uploadUrl: signed.url,
    };
  }

  async completeVehicleImageUpload(
    userId: string,
    vehicleId: string,
    input: VehicleImageCompletion,
  ): Promise<HostVehicle> {
    await this.requireHost(userId);
    const vehicle = await this.ownedVehicle(userId, vehicleId);
    if (vehicle.images.length >= MAX_VEHICLE_IMAGES) {
      throw new ConflictException(
        `Cada veículo pode ter no máximo ${MAX_VEHICLE_IMAGES} fotos.`,
      );
    }
    const expectedPrefix = `vehicle-images/${userId}/${vehicleId}/`;
    const expectedExtension = imageExtensions[input.mimeType];
    if (
      !input.storageKey.startsWith(expectedPrefix) ||
      !input.storageKey.endsWith(expectedExtension)
    ) {
      throw new BadRequestException('A autorização desta foto é inválida.');
    }
    await this.storage.verifyObject(
      input.storageKey,
      input.mimeType,
      input.sizeBytes,
    );
    const altText =
      input.altText?.trim() ||
      `${vehicle.make} ${vehicle.model} - foto ${vehicle.images.length + 1}`;
    try {
      const updated = await this.repository.addVehicleImage({
        altText,
        storageKey: input.storageKey,
        vehicleId,
      });
      await this.cache?.invalidate('vehicles');
      return updated;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Esta foto já foi adicionada ao veículo.');
      }
      throw error;
    }
  }

  async vehicleImageContentUrl(
    userId: string,
    vehicleId: string,
    imageId: string,
  ): Promise<string> {
    await this.requireHost(userId);
    const image = await this.repository.findOwnedVehicleImage(
      userId,
      vehicleId,
      imageId,
    );
    if (!image || !image.storageKey.startsWith('vehicle-images/')) {
      throw new NotFoundException('Foto não encontrada.');
    }
    return this.storage.createViewUrl(image.storageKey);
  }

  async setVehicleImageCover(
    userId: string,
    vehicleId: string,
    imageId: string,
  ): Promise<HostVehicle> {
    await this.requireHost(userId);
    await this.ownedVehicleImage(userId, vehicleId, imageId);
    const updated = await this.repository.setVehicleImageCover(
      vehicleId,
      imageId,
    );
    await this.cache?.invalidate('vehicles');
    return updated;
  }

  async reorderVehicleImages(
    userId: string,
    vehicleId: string,
    imageIds: string[],
  ): Promise<HostVehicle> {
    await this.requireHost(userId);
    const vehicle = await this.ownedVehicle(userId, vehicleId);
    const currentIds = vehicle.images.map((image) => image.id).sort();
    const requestedIds = [...imageIds].sort();
    if (
      currentIds.length !== requestedIds.length ||
      new Set(requestedIds).size !== requestedIds.length ||
      currentIds.some((id, index) => id !== requestedIds[index])
    ) {
      throw new BadRequestException(
        'A ordem deve incluir todas as fotos do veículo uma única vez.',
      );
    }
    const updated = await this.repository.reorderVehicleImages(
      vehicleId,
      imageIds,
    );
    await this.cache?.invalidate('vehicles');
    return updated;
  }

  async deleteVehicleImage(
    userId: string,
    vehicleId: string,
    imageId: string,
  ): Promise<HostVehicle> {
    await this.requireHost(userId);
    const image = await this.ownedVehicleImage(userId, vehicleId, imageId);
    const updated = await this.repository.deleteVehicleImage(
      vehicleId,
      imageId,
    );
    if (image.storageKey.startsWith('vehicle-images/')) {
      await this.storage.deleteObject(image.storageKey).catch((error) => {
        this.logger.warn(
          `Vehicle image object could not be removed: ${String(error)}`,
        );
      });
    }
    await this.cache?.invalidate('vehicles');
    return updated;
  }

  async listBookings(userId: string): Promise<HostBooking[]> {
    await this.requireHost(userId);
    return this.repository.listBookings(userId);
  }

  async listAvailabilityBlocks(
    userId: string,
  ): Promise<HostAvailabilityBlock[]> {
    await this.requireHost(userId);
    return this.repository.listAvailabilityBlocks(userId);
  }

  async createAvailabilityBlock(
    userId: string,
    input: {
      endDate: string;
      reason?: string;
      startDate: string;
      vehicleId: string;
    },
  ): Promise<HostAvailabilityBlock> {
    await this.requireHost(userId);
    await this.ownedVehicle(userId, input.vehicleId);
    if (input.startDate < today()) {
      throw new BadRequestException('O bloqueio não pode começar no passado.');
    }
    if (input.endDate <= input.startDate) {
      throw new BadRequestException(
        'O fim do bloqueio deve ser posterior ao início.',
      );
    }
    if (
      await this.repository.hasAvailabilityConflict(
        input.vehicleId,
        input.startDate,
        input.endDate,
      )
    ) {
      throw new ConflictException(
        'Já existe uma reserva ou bloqueio nesse período.',
      );
    }
    try {
      return await this.repository.createAvailabilityBlock({
        endDate: input.endDate,
        hostId: userId,
        reason: normalizeOptional(input.reason),
        startDate: input.startDate,
        vehicleId: input.vehicleId,
      });
    } catch (error) {
      if (isCalendarConstraintViolation(error)) {
        throw new ConflictException(
          'Já existe um bloqueio neste período do veículo.',
        );
      }
      throw error;
    }
  }

  async deleteAvailabilityBlock(
    userId: string,
    blockId: string,
  ): Promise<void> {
    await this.requireHost(userId);
    if (!(await this.repository.deleteAvailabilityBlock(userId, blockId))) {
      throw new NotFoundException('Bloqueio não encontrado.');
    }
  }

  async getFinance(userId: string): Promise<HostFinance> {
    await this.requireHost(userId);
    return this.repository.getFinance(userId);
  }

  private async requireHost(userId: string): Promise<HostProfile> {
    const profile = await this.repository.findProfile(userId);
    if (!profile) {
      throw new ForbiddenException(
        'Crie seu perfil de anfitrião para continuar.',
      );
    }
    if (profile.status === 'suspended') {
      throw new ForbiddenException('O perfil de anfitrião está suspenso.');
    }
    if (profile.status === 'onboarding') {
      const kycStatus = await this.repository.getKycStatus(userId);
      if (kycStatus === 'approved') {
        return (
          (await this.repository.setProfileStatus(userId, 'active')) ?? profile
        );
      }
    }
    return profile;
  }

  private async ownedVehicle(
    userId: string,
    vehicleId: string,
  ): Promise<HostVehicle> {
    const vehicle = await this.repository.findVehicle(userId, vehicleId);
    if (!vehicle) {
      throw new NotFoundException('Veículo não encontrado.');
    }
    return vehicle;
  }

  private async ownedVehicleImage(
    userId: string,
    vehicleId: string,
    imageId: string,
  ) {
    await this.ownedVehicle(userId, vehicleId);
    const image = await this.repository.findOwnedVehicleImage(
      userId,
      vehicleId,
      imageId,
    );
    if (!image) {
      throw new NotFoundException('Foto não encontrada.');
    }
    return image;
  }
}

function normalizeVehicle(input: HostVehicleInput): HostVehicleInput {
  return {
    ...input,
    amenities: normalizeAmenities(input.amenities),
    city: input.city.trim(),
    description: input.description.trim(),
    fuelType: input.fuelType.trim(),
    make: input.make.trim(),
    model: input.model.trim(),
    state: input.state.trim().toUpperCase(),
    transmission: input.transmission.trim(),
  };
}

function normalizeVehicleUpdate(input: HostVehicleUpdate): HostVehicleUpdate {
  return {
    ...input,
    amenities:
      input.amenities === undefined
        ? undefined
        : normalizeAmenities(input.amenities),
    city: input.city?.trim(),
    description: input.description?.trim(),
    fuelType: input.fuelType?.trim(),
    make: input.make?.trim(),
    model: input.model?.trim(),
    state: input.state?.trim().toUpperCase(),
    transmission: input.transmission?.trim(),
  };
}

function normalizeAmenities(amenities: string[]): string[] {
  return [...new Set(amenities.map((item) => item.trim()).filter(Boolean))];
}

function normalizeOptional(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizePhone(value: string | undefined): string | null {
  const normalized = value?.replace(/[^+\d]/g, '') ?? '';
  return normalized || null;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function isCalendarConstraintViolation(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'code' in error &&
    (error.code === '23505' || error.code === '23P01'),
  );
}

function isUniqueViolation(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === '23505',
  );
}
