import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PresignUploadSchema } from '@storix/shared';
import type { PresignUploadInput } from '@storix/shared';
import { Roles } from '@/shared/decorators/roles.decorator';
import { ZodValidationPipe } from '@/shared/pipes/zod-validation.pipe';
import { StorageService } from '@/infrastructure/storage/storage.service';
import { JwtAuthGuard } from '../../auth/presentation/jwt-auth.guard';
import { RolesGuard } from '../../auth/presentation/roles.guard';

@ApiTags('uploads')
@Controller('uploads')
export class UploadController {
  constructor(private readonly storageService: StorageService) {}

  @Post('presign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get presigned URL for R2 upload (admin)' })
  presign(@Body(new ZodValidationPipe(PresignUploadSchema)) body: PresignUploadInput) {
    return this.storageService.presignUpload(body);
  }
}
