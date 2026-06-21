import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AssignProductsSchema,
  CollectionListQuerySchema,
  CreateCollectionSchema,
  ProductListQuerySchema,
  UpdateCollectionSchema,
} from '@storix/shared';
import type {
  CollectionListQuery,
  CreateCollectionInput,
  ProductListQuery,
  UpdateCollectionInput,
} from '@storix/shared';
import { Roles } from '@/shared/decorators/roles.decorator';
import { ZodValidationPipe } from '@/shared/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../../auth/presentation/jwt-auth.guard';
import { RolesGuard } from '../../auth/presentation/roles.guard';
import { CollectionService } from '../application/collection.service';

@ApiTags('collections')
@Controller('collections')
export class CollectionController {
  constructor(private readonly collectionService: CollectionService) {}

  @Get()
  @ApiOperation({ summary: 'List collections' })
  list(@Query(new ZodValidationPipe(CollectionListQuerySchema)) query: CollectionListQuery) {
    return this.collectionService.list(query);
  }

  @Get('detail/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get collection by id (admin)' })
  getById(@Param('id') id: string) {
    return this.collectionService.getById(id);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get collection by slug with products' })
  getBySlug(
    @Param('slug') slug: string,
    @Query(new ZodValidationPipe(ProductListQuerySchema.partial())) query: Partial<ProductListQuery>,
  ) {
    return this.collectionService.getBySlugWithProducts(slug, {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      sort: query.sort,
      direction: query.direction,
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create collection (admin)' })
  create(@Body(new ZodValidationPipe(CreateCollectionSchema)) body: CreateCollectionInput) {
    return this.collectionService.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update collection (admin)' })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateCollectionSchema)) body: UpdateCollectionInput,
  ) {
    return this.collectionService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete collection (admin)' })
  delete(@Param('id') id: string) {
    return this.collectionService.delete(id);
  }

  @Post(':id/products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign products to collection (admin)' })
  assignProducts(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(AssignProductsSchema)) body: { productIds: string[] },
  ) {
    return this.collectionService.assignProducts(id, body.productIds);
  }
}
