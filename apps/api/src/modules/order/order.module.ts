import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CartModule } from '../cart/cart.module';
import { OrderService } from './application/order.service';
import { OrderRepository, ORDER_REPOSITORY } from './infrastructure/order.repository';
import { OrderController } from './presentation/order.controller';

@Module({
  imports: [AuthModule, CartModule],
  controllers: [OrderController],
  providers: [
    OrderService,
    OrderRepository,
    { provide: ORDER_REPOSITORY, useExisting: OrderRepository },
  ],
  exports: [OrderService],
})
export class OrderModule {}
