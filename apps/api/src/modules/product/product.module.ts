import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProductService } from './application/product.service';
import { ProductRepository, PRODUCT_REPOSITORY } from './infrastructure/product.repository';
import { ProductController } from './presentation/product.controller';

@Module({
  imports: [AuthModule],
  controllers: [ProductController],
  providers: [
    ProductService,
    ProductRepository,
    { provide: PRODUCT_REPOSITORY, useExisting: ProductRepository },
  ],
  exports: [ProductService, PRODUCT_REPOSITORY, ProductRepository],
})
export class ProductModule {}
