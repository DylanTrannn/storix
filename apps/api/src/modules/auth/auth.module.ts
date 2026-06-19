import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { CartModule } from '../cart/cart.module';
import { AuthService } from './application/auth.service';
import { RefreshTokenRepository, REFRESH_TOKEN_REPOSITORY } from './infrastructure/refresh-token.repository';
import { UserRepository, USER_REPOSITORY } from './infrastructure/user.repository';
import { AuthController } from './presentation/auth.controller';
import { JwtAuthGuard } from './presentation/jwt-auth.guard';
import { OptionalJwtAuthGuard } from './presentation/optional-jwt-auth.guard';
import { JwtStrategy } from './presentation/jwt.strategy';
import { RolesGuard } from './presentation/roles.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m') as `${number}m` },
      }),
    }),
    forwardRef(() => CartModule),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    OptionalJwtAuthGuard,
    RolesGuard,
    UserRepository,
    RefreshTokenRepository,
    { provide: USER_REPOSITORY, useExisting: UserRepository },
    { provide: REFRESH_TOKEN_REPOSITORY, useExisting: RefreshTokenRepository },
  ],
  exports: [
    AuthService,
    JwtAuthGuard,
    OptionalJwtAuthGuard,
    RolesGuard,
    USER_REPOSITORY,
    UserRepository,
  ],
})
export class AuthModule {}
