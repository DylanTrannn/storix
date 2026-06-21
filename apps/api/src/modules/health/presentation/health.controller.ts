import { Controller, Get, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { HealthService } from '../application/health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /** Liveness probe — returns 200 when the process is running (use for Render uptime checks). */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Liveness check' })
  liveness() {
    return this.healthService.liveness();
  }

  /** Readiness probe — returns 503 when database or Redis is unreachable. */
  @Get('ready')
  @ApiOperation({ summary: 'Readiness check (database + Redis)' })
  async readiness(@Res({ passthrough: true }) res: Response) {
    const result = await this.healthService.readiness();
    res.status(result.status === 'ok' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE);
    return result;
  }
}
