import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AddToWishlistSchema } from '@storix/shared';
import type { AddToWishlistInput } from '@storix/shared';
import { CurrentUser, type JwtPayload } from '@/shared/decorators/current-user.decorator';
import { ZodValidationPipe } from '@/shared/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../../auth/presentation/jwt-auth.guard';
import { WishlistService } from '../application/wishlist.service';

@ApiTags('wishlist')
@Controller('wishlist')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @ApiOperation({ summary: 'Get user wishlist' })
  getWishlist(@CurrentUser() user: JwtPayload) {
    return this.wishlistService.getWishlist(user.sub);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add product to wishlist' })
  addItem(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(AddToWishlistSchema)) body: AddToWishlistInput,
  ) {
    return this.wishlistService.addItem(user.sub, body);
  }

  @Delete('items/:productId')
  @ApiOperation({ summary: 'Remove product from wishlist' })
  removeItem(@CurrentUser() user: JwtPayload, @Param('productId') productId: string) {
    return this.wishlistService.removeItem(user.sub, productId);
  }
}
