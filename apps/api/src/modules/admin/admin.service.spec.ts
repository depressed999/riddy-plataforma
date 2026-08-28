import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import type { AdminRepository } from './admin.repository';
import { AdminService } from './admin.service';

const actorId = '11111111-1111-4111-8111-111111111111';
const targetId = '22222222-2222-4222-8222-222222222222';

describe('AdminService', () => {
  let repository: jest.Mocked<AdminRepository>;
  let service: AdminService;

  beforeEach(() => {
    repository = {
      findUser: jest.fn(),
      findVehicle: jest.fn(),
      updateUserRole: jest.fn(),
      updateUserStatus: jest.fn(),
      updateVehicleStatus: jest.fn(),
    } as unknown as jest.Mocked<AdminRepository>;
    service = new AdminService(repository);
  });

  it('prevents an administrator from changing their own role', async () => {
    await expect(
      service.updateUserRole(
        actorId,
        actorId,
        'user',
        'Revisão de acesso administrativo.',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an invalid status filter before querying the database', () => {
    expect(() =>
      service.listUsers({ page: 1, pageSize: 20, status: 'deleted' }),
    ).toThrow(BadRequestException);
  });

  it('prevents an administrator from suspending their own account', async () => {
    await expect(
      service.updateUserStatus(
        actorId,
        actorId,
        'suspended',
        'Revisão de segurança da conta.',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects changes for a missing user', async () => {
    repository.findUser.mockResolvedValue(null);
    await expect(
      service.updateUserStatus(
        actorId,
        targetId,
        'suspended',
        'Violação confirmada pela equipe.',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('requires active host and approved KYC to activate a vehicle', async () => {
    repository.findVehicle.mockResolvedValue({
      hostStatus: 'onboarding',
      kycStatus: 'pending_review',
      vehicle: { id: targetId, status: 'draft' },
    } as never);
    await expect(
      service.updateVehicleStatus(
        actorId,
        targetId,
        'active',
        'Anúncio revisado manualmente pela operação.',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('delegates a valid vehicle moderation with the normalized reason', async () => {
    repository.findVehicle.mockResolvedValue({
      hostStatus: 'active',
      kycStatus: 'approved',
      vehicle: { id: targetId, status: 'draft' },
    } as never);
    repository.updateVehicleStatus.mockResolvedValue({ id: targetId } as never);
    await service.updateVehicleStatus(
      actorId,
      targetId,
      'active',
      '  Documentos e anúncio revisados pela operação.  ',
    );
    expect(repository.updateVehicleStatus).toHaveBeenCalledWith(
      actorId,
      targetId,
      'active',
      'Documentos e anúncio revisados pela operação.',
    );
  });
});
