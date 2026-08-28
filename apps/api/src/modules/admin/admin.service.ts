import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';

import { CacheService } from '../../infrastructure/redis/cache.service';
import { AdminRepository } from './admin.repository';
import type {
  AdminListQuery,
  AdminUserRole,
  AdminUserStatus,
  AdminVehicleStatus,
} from './admin.types';

@Injectable()
export class AdminService {
  constructor(
    @Inject(AdminRepository) private readonly repository: AdminRepository,
    @Optional()
    @Inject(CacheService)
    private readonly cache?: CacheService,
  ) {}

  dashboard() {
    return this.repository.dashboard();
  }
  listUsers(query: AdminListQuery) {
    return this.repository.listUsers(validated(query, ['active', 'suspended']));
  }
  listVehicles(query: AdminListQuery) {
    return this.repository.listVehicles(
      validated(query, ['draft', 'active', 'inactive', 'maintenance']),
    );
  }
  listBookings(query: AdminListQuery) {
    return this.repository.listBookings(
      validated(query, ['pending', 'confirmed', 'cancelled', 'completed']),
    );
  }
  listPayments(query: AdminListQuery) {
    return this.repository.listPayments(
      validated(query, [
        'created',
        'pending',
        'in_process',
        'approved',
        'rejected',
        'cancelled',
        'refunded',
        'charged_back',
        'error',
      ]),
    );
  }
  listAudit(query: AdminListQuery) {
    return this.repository.listAudit(validated(query, []));
  }

  async updateUserRole(
    actorId: string,
    id: string,
    role: AdminUserRole,
    reason: string,
  ) {
    if (actorId === id)
      throw new BadRequestException(
        'Você não pode alterar a própria função administrativa.',
      );
    const user = await this.repository.findUser(id);
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    if (user.role === role)
      throw new ConflictException('O usuário já possui esta função.');
    return this.repository.updateUserRole(actorId, id, role, reason.trim());
  }

  async updateUserStatus(
    actorId: string,
    id: string,
    status: AdminUserStatus,
    reason: string,
  ) {
    if (actorId === id)
      throw new BadRequestException(
        'Você não pode suspender ou reativar a própria conta.',
      );
    const user = await this.repository.findUser(id);
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    if (user.status === status)
      throw new ConflictException(
        `A conta já está ${status === 'active' ? 'ativa' : 'suspensa'}.`,
      );
    return this.repository.updateUserStatus(actorId, id, status, reason.trim());
  }

  async updateVehicleStatus(
    actorId: string,
    id: string,
    status: AdminVehicleStatus,
    reason: string,
  ) {
    const row = await this.repository.findVehicle(id);
    if (!row) throw new NotFoundException('Veículo não encontrado.');
    if (row.vehicle.status === status)
      throw new ConflictException('O veículo já possui este status.');
    if (
      status === 'active' &&
      (row.kycStatus !== 'approved' || row.hostStatus !== 'active')
    ) {
      throw new ConflictException(
        'Para ativar o veículo, o anfitrião deve estar ativo e com KYC aprovado.',
      );
    }
    const vehicle = await this.repository.updateVehicleStatus(
      actorId,
      id,
      status,
      reason.trim(),
    );
    await this.cache?.invalidate('vehicles');
    return vehicle;
  }
}

function validated(
  query: AdminListQuery,
  allowedStatuses: readonly string[],
): AdminListQuery {
  const cleaned = {
    ...query,
    query: query.query?.trim() || undefined,
    status: query.status?.trim() || undefined,
  };
  if (cleaned.status && !allowedStatuses.includes(cleaned.status)) {
    throw new BadRequestException(
      'Filtro de status inválido para este módulo.',
    );
  }
  return cleaned;
}
