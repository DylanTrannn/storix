import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CheckoutSchema,
  PaginationQuerySchema,
  UpdateOrderStatusSchema,
} from '@storix/shared';
import type {
  CheckoutInput,
  PaginationQuery,
  UpdateOrderStatusInput,
} from '@storix/shared';
import type { Request } from 'express';
import { CurrentUser, type JwtPayload } from '@/shared/decorators/current-user.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { ZodValidationPipe } from '@/shared/pipes/zod-validation.pipe';
import { SESSION_COOKIE } from '../../cart/application/cart.service';
import { JwtAuthGuard } from '../../auth/presentation/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../auth/presentation/optional-jwt-auth.guard';
import { RolesGuard } from '../../auth/presentation/roles.guard';
import { OrderService } from '../application/order.service';

@ApiTags('orders')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('checkout')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiCookieAuth('cart_session_id')
  @ApiOperation({ summary: 'Checkout cart and create order' })
  checkout(
    @Body(new ZodValidationPipe(CheckoutSchema)) body: CheckoutInput,
    @Req() req: Request,
    @CurrentUser() user?: JwtPayload,
  ) {
    const sessionId = req.cookies?.[SESSION_COOKIE] as string | undefined;
    return this.orderService.checkout(body, user?.sub, sessionId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all orders (admin)' })
  listAll(@Query(new ZodValidationPipe(PaginationQuerySchema)) query: PaginationQuery) {
    return this.orderService.listAll(query);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user order history' })
  getMyOrders(
    @CurrentUser() user: JwtPayload,
    @Query(new ZodValidationPipe(PaginationQuerySchema)) query: PaginationQuery,
  ) {
    return this.orderService.getMyOrders(user.sub, query);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get order by id' })
  getById(@Param('id') id: string, @CurrentUser() user?: JwtPayload) {
    return this.orderService.getById(id, user?.sub);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update order status (admin)' })
  updateStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateOrderStatusSchema)) body: UpdateOrderStatusInput,
  ) {
    return this.orderService.updateStatus(id, body.status);
  }
}
