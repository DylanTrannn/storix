import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AddToCartSchema, UpdateCartItemSchema } from '@storix/shared';
import type { AddToCartInput, UpdateCartItemInput } from '@storix/shared';
import type { Request, Response } from 'express';
import { CurrentUser, type JwtPayload } from '@/shared/decorators/current-user.decorator';
import { ZodValidationPipe } from '@/shared/pipes/zod-validation.pipe';
import { OptionalJwtAuthGuard } from '../../auth/presentation/optional-jwt-auth.guard';
import { CartService, SESSION_COOKIE } from '../application/cart.service';

const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

@ApiTags('cart')
@Controller('cart')
@UseGuards(OptionalJwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  private getSessionId(req: Request): string | undefined {
    return req.cookies?.[SESSION_COOKIE] as string | undefined;
  }

  private setSessionCookie(res: Response, sessionId: string) {
    res.cookie(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE_MS,
      path: '/',
    });
  }

  @Get()
  @ApiCookieAuth('cart_session_id')
  @ApiOperation({ summary: 'Get current cart (guest or authenticated)' })
  async getCart(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user?: JwtPayload,
  ) {
    const sessionId = this.getSessionId(req);
    const result = await this.cartService.getOrCreateCart(user?.sub, sessionId);
    if (result.sessionId && !sessionId) {
      this.setSessionCookie(res, result.sessionId);
    }
    return result.cart;
  }

  @Post('items')
  @ApiCookieAuth('cart_session_id')
  @ApiOperation({ summary: 'Add item to cart' })
  async addItem(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body(new ZodValidationPipe(AddToCartSchema)) body: AddToCartInput,
    @CurrentUser() user?: JwtPayload,
  ) {
    const sessionId = this.getSessionId(req);
    const { sessionId: newSessionId } = await this.cartService.getOrCreateCart(
      user?.sub,
      sessionId,
    );
    if (newSessionId && !sessionId) {
      this.setSessionCookie(res, newSessionId);
    }
    return this.cartService.addItem(user?.sub, sessionId ?? newSessionId ?? undefined, body);
  }

  @Patch('items/:itemId')
  @ApiCookieAuth('cart_session_id')
  @ApiOperation({ summary: 'Update cart item quantity' })
  updateItem(
    @Req() req: Request,
    @Param('itemId') itemId: string,
    @Body(new ZodValidationPipe(UpdateCartItemSchema)) body: UpdateCartItemInput,
    @CurrentUser() user?: JwtPayload,
  ) {
    const sessionId = this.getSessionId(req);
    return this.cartService.updateItem(user?.sub, sessionId, itemId, body);
  }

  @Delete('items/:itemId')
  @ApiCookieAuth('cart_session_id')
  @ApiOperation({ summary: 'Remove item from cart' })
  removeItem(
    @Req() req: Request,
    @Param('itemId') itemId: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    const sessionId = this.getSessionId(req);
    return this.cartService.removeItem(user?.sub, sessionId, itemId);
  }
}
