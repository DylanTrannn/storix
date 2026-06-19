import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CartService } from './application/cart.service';
import { CartRepository, CART_REPOSITORY } from './infrastructure/cart.repository';
import { CartController } from './presentation/cart.controller';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [CartController],
  providers: [
    CartService,
    CartRepository,
    { provide: CART_REPOSITORY, useExisting: CartRepository },
  ],
  exports: [CartService, CART_REPOSITORY],
})
export class CartModule {}
