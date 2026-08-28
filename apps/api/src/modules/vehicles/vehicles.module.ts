import { Module } from '@nestjs/common';

import { VehiclesController } from './vehicles.controller';
import { VehiclesCacheService } from './vehicles-cache.service';
import { VehiclesRepository } from './vehicles.repository';
import { VehiclesService } from './vehicles.service';

@Module({
  controllers: [VehiclesController],
  providers: [VehiclesCacheService, VehiclesRepository, VehiclesService],
})
export class VehiclesModule {}
