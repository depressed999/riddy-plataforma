import { Module } from '@nestjs/common';

import { KycModule } from '../kyc/kyc.module';
import { VehiclesController } from './vehicles.controller';
import { VehiclesCacheService } from './vehicles-cache.service';
import { VehiclesRepository } from './vehicles.repository';
import { VehiclesService } from './vehicles.service';

@Module({
  controllers: [VehiclesController],
  imports: [KycModule],
  providers: [VehiclesCacheService, VehiclesRepository, VehiclesService],
})
export class VehiclesModule {}
