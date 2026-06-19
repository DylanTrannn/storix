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
  CreateProductImageSchema,
  CreateProductSchema,
  CreateProductVariantSchema,
  BatchCreateProductImagesSchema,
  ProductListQuerySchema,
  ReorderProductImagesSchema,
  UpdateProductSchema,
  UpdateProductVariantSchema,
} from '@storix/shared';
import type {
  BatchCreateProductImagesInput,
  CreateProductImageInput,
  CreateProductInput,
  CreateProductVariantInput,
  ProductListQuery,
  ReorderProductImagesInput,
  UpdateProductInput,
  UpdateProductVariantInput,
} from '@storix/shared';
import { Roles } from '@/shared/decorators/roles.decorator';
import { ZodValidationPipe } from '@/shared/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../../auth/presentation/jwt-auth.guard';
import { RolesGuard } from '../../auth/presentation/roles.guard';
import { ProductService } from '../application/product.service';

@ApiTags('products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @ApiOperation({ summary: 'List products with pagination and sorting' })
  list(@Query(new ZodValidationPipe(ProductListQuerySchema)) query: ProductListQuery) {
    return this.productService.list({ ...query, status: query.status ?? 'active' });
  }

  @Get('detail/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get product by id (admin)' })
  getById(@Param('id') id: string) {
    return this.productService.getById(id);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get product by slug' })
  getBySlug(@Param('slug') slug: string) {
    return this.productService.getBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create product (admin)' })
  create(@Body(new ZodValidationPipe(CreateProductSchema)) body: CreateProductInput) {
    return this.productService.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product (admin)' })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateProductSchema)) body: UpdateProductInput,
  ) {
    return this.productService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete product (admin)' })
  delete(@Param('id') id: string) {
    return this.productService.delete(id);
  }

  @Post(':id/variants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add variant to product (admin)' })
  addVariant(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CreateProductVariantSchema)) body: CreateProductVariantInput,
  ) {
    return this.productService.addVariant(id, body);
  }

  @Patch(':id/variants/:variantId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product variant (admin)' })
  updateVariant(
    @Param('id') id: string,
    @Param('variantId') variantId: string,
    @Body(new ZodValidationPipe(UpdateProductVariantSchema)) body: UpdateProductVariantInput,
  ) {
    return this.productService.updateVariant(id, variantId, body);
  }

  @Delete(':id/variants/:variantId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete product variant (admin)' })
  deleteVariant(@Param('id') id: string, @Param('variantId') variantId: string) {
    return this.productService.deleteVariant(id, variantId);
  }

  @Post(':id/images/batch')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add multiple images to product (admin)' })
  addImages(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(BatchCreateProductImagesSchema)) body: BatchCreateProductImagesInput,
  ) {
    return this.productService.addImages(id, body);
  }

  @Patch(':id/images/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reorder product images (admin)' })
  reorderImages(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ReorderProductImagesSchema)) body: ReorderProductImagesInput,
  ) {
    return this.productService.reorderImages(id, body);
  }

  @Post(':id/images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add image to product (admin)' })
  addImage(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CreateProductImageSchema)) body: CreateProductImageInput,
  ) {
    return this.productService.addImage(id, body);
  }

  @Delete(':id/images/:imageId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete product image (admin)' })
  deleteImage(@Param('id') id: string, @Param('imageId') imageId: string) {
    return this.productService.deleteImage(id, imageId);
  }
}
