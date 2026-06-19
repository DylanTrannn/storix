import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WishlistService } from './application/wishlist.service';
import { WishlistRepository, WISHLIST_REPOSITORY } from './infrastructure/wishlist.repository';
import { WishlistController } from './presentation/wishlist.controller';

@Module({
  imports: [AuthModule],
  controllers: [WishlistController],
  providers: [
    WishlistService,
    WishlistRepository,
    { provide: WISHLIST_REPOSITORY, useExisting: WishlistRepository },
  ],
})
export class WishlistModule {}
