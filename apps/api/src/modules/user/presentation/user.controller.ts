import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginationQuerySchema, UpdateProfileSchema } from '@storix/shared';
import type { PaginationQuery, UpdateProfileInput } from '@storix/shared';
import { CurrentUser, type JwtPayload } from '@/shared/decorators/current-user.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { ZodValidationPipe } from '@/shared/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../../auth/presentation/jwt-auth.guard';
import { RolesGuard } from '../../auth/presentation/roles.guard';
import { UserService } from '../application/user.service';

@ApiTags('users')
@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Patch('users/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(UpdateProfileSchema)) body: UpdateProfileInput,
  ) {
    return this.userService.updateProfile(user.sub, body);
  }

  @Get('admin/customers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List customers (admin only)' })
  listCustomers(@Query(new ZodValidationPipe(PaginationQuerySchema)) query: PaginationQuery) {
    return this.userService.listCustomers(query.page, query.limit);
  }

  @Get('admin/customers/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get customer with order history (admin only)' })
  getCustomer(@Param('id') id: string) {
    return this.userService.getCustomer(id);
  }
}
