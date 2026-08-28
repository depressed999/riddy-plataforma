import {
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import {
  PaginatedVehiclesResponseDto,
  SearchVehiclesQueryDto,
  VehicleResponseDto,
} from './vehicles.dto';
import { VehiclesService } from './vehicles.service';
import type { PaginatedVehicles, Vehicle } from './vehicles.types';

@ApiTags('vehicles')
@Controller('vehicles')
export class VehiclesController {
  constructor(
    @Inject(VehiclesService)
    private readonly vehiclesService: VehiclesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Busca os veículos ativos do marketplace' })
  @ApiOkResponse({ type: PaginatedVehiclesResponseDto })
  @ApiQuery({ type: SearchVehiclesQueryDto })
  search(@Query() query: SearchVehiclesQueryDto): Promise<PaginatedVehicles> {
    return this.vehiclesService.search({
      fuelType: query.fuelType,
      location: query.location,
      maxPrice: query.maxPrice,
      minPrice: query.minPrice,
      page: query.page,
      pageSize: query.pageSize,
      query: query.query,
      seats: query.seats,
      sort: query.sort,
      transmission: query.transmission,
      type: query.type,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtém um veículo ativo por ID' })
  @ApiParam({ format: 'uuid', name: 'id' })
  @ApiOkResponse({ type: VehicleResponseDto })
  @ApiNotFoundResponse({ description: 'Veículo não encontrado.' })
  findActiveById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<Vehicle> {
    return this.vehiclesService.findActiveById(id);
  }
}
