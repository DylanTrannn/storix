import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CreateStoreLocationSchema,
  UpdateStoreLocationSchema,
} from '@storix/shared';
import type {
  CreateStoreLocationInput,
  UpdateStoreLocationInput,
} from '@storix/shared';
import { Roles } from '@/shared/decorators/roles.decorator';
import { ZodValidationPipe } from '@/shared/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../../auth/presentation/jwt-auth.guard';
import { RolesGuard } from '../../auth/presentation/roles.guard';
import { StoreLocationService } from '../application/store-location.service';

@ApiTags('store-locations')
@Controller('store-locations')
export class StoreLocationController {
  constructor(private readonly storeLocationService: StoreLocationService) {}

  @Get()
  @ApiOperation({ summary: 'List all store locations' })
  list() {
    return this.storeLocationService.list();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get store location by id' })
  getById(@Param('id') id: string) {
    return this.storeLocationService.getById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create store location (admin)' })
  create(@Body(new ZodValidationPipe(CreateStoreLocationSchema)) body: CreateStoreLocationInput) {
    return this.storeLocationService.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update store location (admin)' })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateStoreLocationSchema)) body: UpdateStoreLocationInput,
  ) {
    return this.storeLocationService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete store location (admin)' })
  delete(@Param('id') id: string) {
    return this.storeLocationService.delete(id);
  }
}
