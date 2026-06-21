import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './infrastructure/database/database.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { StorageModule } from './infrastructure/storage/storage.module';
import { AuthModule } from './modules/auth/auth.module';
import { CartModule } from './modules/cart/cart.module';
import { CollectionModule } from './modules/collection/collection.module';
import { HealthModule } from './modules/health/health.module';
import { OrderModule } from './modules/order/order.module';
import { ProductModule } from './modules/product/product.module';
import { UploadModule } from './modules/upload/upload.module';
import { UserModule } from './modules/user/user.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    RedisModule,
    StorageModule,
    AuthModule,
    UserModule,
    ProductModule,
    CollectionModule,
    CartModule,
    OrderModule,
    WishlistModule,
    UploadModule,
    HealthModule,
  ],
})
export class AppModule {}
