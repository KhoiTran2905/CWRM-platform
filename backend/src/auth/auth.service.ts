import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { APP_ENV } from '../config/app-config.module.js';
import type { AppEnv } from '../config/env.js';
import { ApiException } from '../common/errors/api.exception.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { LoginRequest, RegisterRequest } from './auth.dto.js';
import type { AuthenticatedAccount } from './auth.decorators.js';

const LOGIN_ERROR = 'Email hoặc mật khẩu không đúng.';
const FAKE_ACCOUNT_PASSWORD = 'mat-khau-gia-cho-tai-khoan-khong-ton-tai';

@Injectable()
export class AuthService implements OnModuleInit {
  private fakePasswordHash?: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    @Inject(APP_ENV) private readonly config: AppEnv,
  ) {}

  async onModuleInit(): Promise<void> {
    this.fakePasswordHash = await bcrypt.hash(
      FAKE_ACCOUNT_PASSWORD,
      this.config.bcryptCost,
    );
  }

  async register(input: RegisterRequest): Promise<AuthenticatedAccount> {
    const email = input.email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(
      input.password,
      this.config.bcryptCost,
    );
    try {
      const account = await this.prisma.account.create({
        data: {
          email,
          passwordHash,
          displayName: input.displayName.trim(),
        },
        select: { id: true, email: true, displayName: true, isActive: true },
      });
      return account;
    } catch (error) {
      if (hasPrismaCode(error, 'P2002')) {
        throw new ApiException(
          'UNIQUE_CONFLICT',
          409,
          'Email này đã được đăng ký.',
          { field: 'email' },
        );
      }
      throw error;
    }
  }

  async login(input: LoginRequest): Promise<{
    accessToken: string;
    tokenType: 'Bearer';
    expiresIn: number;
    account: AuthenticatedAccount;
  }> {
    const email = input.email.trim().toLowerCase();
    const account = await this.prisma.account.findUnique({ where: { email } });
    const passwordFitsBcrypt = Buffer.byteLength(input.password, 'utf8') <= 72;
    const passwordMatches = await bcrypt.compare(
      passwordFitsBcrypt ? input.password : FAKE_ACCOUNT_PASSWORD,
      account?.passwordHash ?? (await this.getFakePasswordHash()),
    );

    if (
      !account ||
      !account.isActive ||
      !passwordFitsBcrypt ||
      !passwordMatches
    ) {
      throw new ApiException('UNAUTHENTICATED', 401, LOGIN_ERROR);
    }

    const accountResponse = selectAccount(account);
    const accessToken = await this.jwt.signAsync(
      { sub: account.id },
      {
        secret: this.config.jwtSecret,
        algorithm: 'HS256',
        expiresIn: this.config.jwtExpiresInSeconds,
      },
    );
    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.config.jwtExpiresInSeconds,
      account: accountResponse,
    };
  }

  async getMyAccount(id: string): Promise<AuthenticatedAccount> {
    const account = await this.prisma.account.findUnique({
      where: { id },
      select: { id: true, email: true, displayName: true, isActive: true },
    });
    if (!account) {
      throw new ApiException(
        'UNAUTHENTICATED',
        401,
        'Vui lòng đăng nhập để tiếp tục.',
      );
    }
    return account;
  }

  async updateMyAccount(
    id: string,
    displayName: string,
  ): Promise<AuthenticatedAccount> {
    const account = await this.prisma.account.update({
      where: { id },
      data: { displayName: displayName.trim() },
      select: { id: true, email: true, displayName: true, isActive: true },
    });
    return account;
  }

  private async getFakePasswordHash(): Promise<string> {
    this.fakePasswordHash ??= await bcrypt.hash(
      FAKE_ACCOUNT_PASSWORD,
      this.config.bcryptCost,
    );
    return this.fakePasswordHash;
  }
}

function selectAccount(account: {
  id: string;
  email: string;
  displayName: string;
  isActive: boolean;
}): AuthenticatedAccount {
  return {
    id: account.id,
    email: account.email,
    displayName: account.displayName,
    isActive: account.isActive,
  };
}

function hasPrismaCode(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === code
  );
}
