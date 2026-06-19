import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PaginatedResponse, UpdateProfileInput } from '@storix/shared';
import type { UserEntity } from '../../auth/domain/entities/user.entity';
import { OrderService } from '../../order/application/order.service';
import type { IUserRepository } from '../domain/repositories/user.repository.interface';
import { USER_REPOSITORY } from '../domain/repositories/user.repository.interface';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    private readonly orderService: OrderService,
  ) {}

  async updateProfile(userId: string, input: UpdateProfileInput) {
    if (input.email) {
      const existing = await this.userRepository.findByEmail(input.email);
      if (existing && existing.id !== userId) {
        throw new ConflictException('Email already in use');
      }
    }

    const user = await this.userRepository.update(userId, input);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user.toPublic();
  }

  async listCustomers(
    page: number,
    limit: number,
  ): Promise<PaginatedResponse<ReturnType<UserEntity['toPublic']>>> {
    const { users, total } = await this.userRepository.listCustomers(page, limit);
    return {
      data: users.map((u) => u.toPublic()),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getCustomer(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user || user.role !== 'customer') {
      throw new NotFoundException('Customer not found');
    }
    const orders = await this.orderService.getMyOrders(id, { page: 1, limit: 50 });
    return {
      ...user.toPublic(),
      orders: orders.data,
    };
  }
}
