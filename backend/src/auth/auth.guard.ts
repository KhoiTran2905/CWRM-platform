import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { isUUID } from 'class-validator';
import type { Request } from 'express';
import { APP_ENV } from '../config/app-config.module.js';
import type { AppEnv } from '../config/env.js';
import { ApiException } from '../common/errors/api.exception.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  IS_PUBLIC_KEY,
  type AuthenticatedAccount,
  type AuthenticatedRequest,
} from './auth.decorators.js';

const AUTHENTICATION_ERROR = 'Vui lòng đăng nhập để tiếp tục.';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    @Inject(APP_ENV) private readonly config: AppEnv,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers.authorization;
    const match =
      typeof header === 'string' ? /^Bearer\s+([^\s]+)$/i.exec(header) : null;
    if (!match)
      throw new ApiException('UNAUTHENTICATED', 401, AUTHENTICATION_ERROR);

    let payload: { sub?: unknown };
    try {
      payload = await this.jwt.verifyAsync<{ sub?: unknown }>(match[1]!, {
        secret: this.config.jwtSecret,
        algorithms: ['HS256'],
      });
    } catch {
      throw new ApiException('UNAUTHENTICATED', 401, AUTHENTICATION_ERROR);
    }
    if (
      typeof payload !== 'object' ||
      payload === null ||
      typeof payload.sub !== 'string' ||
      !isUUID(payload.sub, 'all')
    ) {
      throw new ApiException('UNAUTHENTICATED', 401, AUTHENTICATION_ERROR);
    }

    const account = await this.prisma.account.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, displayName: true, isActive: true },
    });
    if (!account?.isActive) {
      throw new ApiException('UNAUTHENTICATED', 401, AUTHENTICATION_ERROR);
    }
    (request as AuthenticatedRequest).user = account as AuthenticatedAccount;
    return true;
  }
}
