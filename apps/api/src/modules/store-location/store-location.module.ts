import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StoreLocationService } from './application/store-location.service';
import {
  StoreLocationRepository,
  STORE_LOCATION_REPOSITORY,
} from './infrastructure/store-location.repository';
import { StoreLocationController } from './presentation/store-location.controller';

@Module({
  imports: [AuthModule],
  controllers: [StoreLocationController],
  providers: [
    StoreLocationService,
    StoreLocationRepository,
    { provide: STORE_LOCATION_REPOSITORY, useExisting: StoreLocationRepository },
  ],
})
export class StoreLocationModule {}
