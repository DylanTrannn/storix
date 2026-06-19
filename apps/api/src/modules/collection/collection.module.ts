import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProductModule } from '../product/product.module';
import { CollectionService } from './application/collection.service';
import { CollectionRepository, COLLECTION_REPOSITORY } from './infrastructure/collection.repository';
import { CollectionController } from './presentation/collection.controller';

@Module({
  imports: [AuthModule, ProductModule],
  controllers: [CollectionController],
  providers: [
    CollectionService,
    CollectionRepository,
    { provide: COLLECTION_REPOSITORY, useExisting: CollectionRepository },
  ],
  exports: [CollectionService],
})
export class CollectionModule {}
