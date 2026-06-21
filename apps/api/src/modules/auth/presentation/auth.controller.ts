import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { LoginInput, RegisterInput } from '@storix/shared';
import { LoginSchema, RegisterSchema } from '@storix/shared';
import type { Request, Response } from 'express';
import { ZodValidationPipe } from '@/shared/pipes/zod-validation.pipe';
import { CurrentUser, type JwtPayload } from '@/shared/decorators/current-user.decorator';
import { CartService, SESSION_COOKIE } from '../../cart/application/cart.service';
import { AuthService } from '../application/auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

const REFRESH_COOKIE = 'refresh_token';
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cartService: CartService,
  ) {}

  private setRefreshCookie(res: Response, token: string) {
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: REFRESH_MAX_AGE_MS,
      path: '/auth',
    });
  }

  private clearRefreshCookie(res: Response) {
    res.clearCookie(REFRESH_COOKIE, { path: '/auth' });
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new customer account' })
  async register(
    @Body(new ZodValidationPipe(RegisterSchema)) body: RegisterInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, tokens } = await this.authService.register(body);
    this.setRefreshCookie(res, tokens.refreshToken);
    const sessionId = req.cookies?.[SESSION_COOKIE] as string | undefined;
    await this.cartService.mergeGuestCartOnLogin(user.id, sessionId);
    return { user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  async login(
    @Body(new ZodValidationPipe(LoginSchema)) body: LoginInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, tokens } = await this.authService.login(body);
    this.setRefreshCookie(res, tokens.refreshToken);
    const sessionId = req.cookies?.[SESSION_COOKIE] as string | undefined;
    await this.cartService.mergeGuestCartOnLogin(user.id, sessionId);
    return { user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('refresh_token')
  @ApiOperation({ summary: 'Refresh access token using httpOnly cookie' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    const tokens = await this.authService.refresh(refreshToken ?? '');
    this.setRefreshCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth('refresh_token')
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    await this.authService.logout(refreshToken ?? '');
    this.clearRefreshCookie(res);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  async me(@CurrentUser() user: JwtPayload) {
    return this.authService.me(user.sub);
  }
}
