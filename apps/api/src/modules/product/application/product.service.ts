import {
  ConflictException,
  Inject,
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import type {
  BatchCreateProductImagesInput,
  CreateProductImageInput,
  CreateProductInput,
  CreateProductVariantInput,
  PaginatedResponse,
  ProductListQuery,
  ReorderProductImagesInput,
  UpdateProductImageInput,
  UpdateProductInput,
  UpdateProductVariantInput,
} from '@storix/shared';
import { extractOptionDimensions, optionsKey } from '@storix/shared';
import { StorageService } from '@/infrastructure/storage/storage.service';
import { slugify } from '@/shared/utils/slugify';
import type { ProductEntity } from '../domain/entities/product.entity';
import type { IProductRepository } from '../domain/repositories/product.repository.interface';
import { PRODUCT_REPOSITORY } from '../domain/repositories/product.repository.interface';

@Injectable()
export class ProductService {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: IProductRepository,
    private readonly storageService: StorageService,
  ) {}

  async list(query: ProductListQuery): Promise<PaginatedResponse<ReturnType<ProductEntity['toPublic']>>> {
    const result = await this.productRepository.list(query);
    return {
      data: result.data.map((p) => p.toPublic()),
      meta: result.meta,
    };
  }

  async getBySlug(slug: string, activeOnly = true) {
    const product = await this.productRepository.findBySlug(slug, activeOnly);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product.toDetail();
  }

  previewBySlug(slug: string) {
    return this.getBySlug(slug, false);
  }

  async getById(id: string) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product.toDetail();
  }

  async create(input: CreateProductInput) {
    const slug = input.slug ?? slugify(input.name);
    if (await this.productRepository.slugExists(slug)) {
      throw new ConflictException('Product slug already exists');
    }
    const product = await this.productRepository.create({ ...input, slug });
    return product.toDetail();
  }

  async update(id: string, input: UpdateProductInput) {
    if (input.slug && (await this.productRepository.slugExists(input.slug, id))) {
      throw new ConflictException('Product slug already exists');
    }
    if (input.mediaOptionName) {
      const existing = await this.productRepository.findById(id);
      if (!existing) {
        throw new NotFoundException('Product not found');
      }
      this.assertValidMediaOptionName(existing, input.mediaOptionName);
    }
    const product = await this.productRepository.update(id, input);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product.toDetail();
  }

  async delete(id: string) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    for (const image of product.images) {
      await this.storageService.deleteStoredObject(image.storageKey, image.url);
    }

    const deleted = await this.productRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException('Product not found');
    }
  }

  async addVariant(productId: string, input: CreateProductVariantInput) {
    const existing = await this.productRepository.findById(productId);
    if (!existing) {
      throw new NotFoundException('Product not found');
    }
    this.assertUniqueVariantOptions(existing.variants, input.options ?? {});
    const product = await this.productRepository.addVariant(productId, input);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product.toDetail();
  }

  async updateVariant(productId: string, variantId: string, input: UpdateProductVariantInput) {
    const existing = await this.productRepository.findById(productId);
    if (!existing) {
      throw new NotFoundException('Product not found');
    }
    if (input.options) {
      this.assertUniqueVariantOptions(
        existing.variants.filter((v) => v.id !== variantId),
        input.options,
      );
    }
    const product = await this.productRepository.updateVariant(productId, variantId, input);
    if (!product) {
      throw new NotFoundException('Product or variant not found');
    }
    return product.toDetail();
  }

  private assertUniqueVariantOptions(
    variants: Array<{ options: Record<string, string> }>,
    options: Record<string, string>,
  ) {
    const key = optionsKey(options);
    const duplicate = variants.some((v) => optionsKey(v.options ?? {}) === key);
    if (duplicate) {
      throw new ConflictException('A variant with these options already exists');
    }
  }

  async deleteVariant(productId: string, variantId: string) {
    const product = await this.productRepository.deleteVariant(productId, variantId);
    if (!product) {
      throw new NotFoundException('Product or variant not found');
    }
    return product.toDetail();
  }

  async addImage(productId: string, input: CreateProductImageInput) {
    const existing = await this.productRepository.findById(productId);
    if (!existing) {
      throw new NotFoundException('Product not found');
    }
    this.assertValidLinkedOptions(existing, input.linkedOptions);
    const product = await this.productRepository.addImage(productId, input);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product.toDetail();
  }

  async addImages(productId: string, input: BatchCreateProductImagesInput) {
    const existing = await this.productRepository.findById(productId);
    if (!existing) {
      throw new NotFoundException('Product not found');
    }
    for (const image of input.images) {
      this.assertValidLinkedOptions(existing, image.linkedOptions);
    }
    const product = await this.productRepository.addImages(productId, input.images);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product.toDetail();
  }

  async reorderImages(productId: string, input: ReorderProductImagesInput) {
    const product = await this.productRepository.reorderImages(productId, input.imageIds);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product.toDetail();
  }

  async updateImage(productId: string, imageId: string, input: UpdateProductImageInput) {
    const existing = await this.productRepository.findById(productId);
    if (!existing) {
      throw new NotFoundException('Product not found');
    }
    if (input.linkedOptions !== undefined) {
      this.assertValidLinkedOptions(existing, input.linkedOptions);
    }
    const product = await this.productRepository.updateImage(productId, imageId, input);
    if (!product) {
      throw new NotFoundException('Product or image not found');
    }
    return product.toDetail();
  }

  async deleteImage(productId: string, imageId: string) {
    const image = await this.productRepository.getImageById(productId, imageId);
    if (!image) {
      throw new NotFoundException('Product or image not found');
    }

    await this.storageService.deleteStoredObject(image.storageKey, image.url);

    const product = await this.productRepository.deleteImage(productId, imageId);
    if (!product) {
      throw new NotFoundException('Product or image not found');
    }
    return product.toDetail();
  }

  private assertValidMediaOptionName(
    product: ProductEntity,
    mediaOptionName: string,
  ) {
    const dimensions = extractOptionDimensions(product.variants);
    if (!dimensions.some((dim) => dim.name === mediaOptionName)) {
      throw new BadRequestException('mediaOptionName must match an existing option dimension');
    }
  }

  private assertValidLinkedOptions(
    product: ProductEntity,
    linkedOptions: Record<string, string> | null | undefined,
  ) {
    if (!linkedOptions || Object.keys(linkedOptions).length === 0) return;

    const dimensions = extractOptionDimensions(product.variants);
    for (const [name, value] of Object.entries(linkedOptions)) {
      const dimension = dimensions.find((dim) => dim.name === name);
      if (!dimension) {
        throw new BadRequestException(`Invalid linked option dimension: ${name}`);
      }
      if (!dimension.values.includes(value)) {
        throw new BadRequestException(`Invalid linked option value: ${value}`);
      }
    }
  }
}
