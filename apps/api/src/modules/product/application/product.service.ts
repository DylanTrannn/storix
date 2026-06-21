import {
  ConflictException,
  Inject,
  Injectable,
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
  UpdateProductInput,
  UpdateProductVariantInput,
} from '@storix/shared';
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
    const product = await this.productRepository.addVariant(productId, input);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product.toDetail();
  }

  async updateVariant(productId: string, variantId: string, input: UpdateProductVariantInput) {
    const product = await this.productRepository.updateVariant(productId, variantId, input);
    if (!product) {
      throw new NotFoundException('Product or variant not found');
    }
    return product.toDetail();
  }

  async deleteVariant(productId: string, variantId: string) {
    const product = await this.productRepository.deleteVariant(productId, variantId);
    if (!product) {
      throw new NotFoundException('Product or variant not found');
    }
    return product.toDetail();
  }

  async addImage(productId: string, input: CreateProductImageInput) {
    const product = await this.productRepository.addImage(productId, input);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product.toDetail();
  }

  async addImages(productId: string, input: BatchCreateProductImagesInput) {
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
}
