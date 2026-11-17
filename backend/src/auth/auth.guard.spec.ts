import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ApiException } from '../common/errors/api.exception.js';
import type { AppEnv } from '../config/env.js';
import { AuthGuard } from './auth.guard.js';

const accountId = '11111111-1111-4111-8111-111111111111';
const config = {
  jwtSecret: 'unit-test-secret-for-auth-guard-only',
} as AppEnv;

function makeContext(authorization?: string) {
  const request = { headers: authorization ? { authorization } : {} };
  const handler = () => undefined;
  return {
    request,
    context: {
      getHandler: () => handler,
      getClass: () => class TestController {},
      switchToHttp: () => ({ getRequest: () => request }),
    } as never,
  };
}

describe('Bộ bảo vệ xác thực', () => {
  it('trả cùng lỗi xác thực khi thiếu header hoặc header sai dạng', async () => {
    const jwt = new JwtService({ secret: config.jwtSecret });
    const prisma = { account: { findUnique: vi.fn() } };
    const guard = new AuthGuard(
      {
        getAllAndOverride: vi.fn().mockReturnValue(undefined),
      } as unknown as Reflector,
      jwt,
      prisma as never,
      config,
    );

    for (const context of [makeContext(), makeContext('Basic token')]) {
      await expect(guard.canActivate(context.context)).rejects.toMatchObject({
        code: 'UNAUTHENTICATED',
        message: 'Vui lòng đăng nhập để tiếp tục.',
      });
    }
    expect(prisma.account.findUnique).not.toHaveBeenCalled();
  });

  it('từ chối chữ ký sai, token hết hạn và thuật toán không phải HS256', async () => {
    const jwt = new JwtService({ secret: config.jwtSecret });
    const prisma = { account: { findUnique: vi.fn() } };
    const guard = new AuthGuard(
      {
        getAllAndOverride: vi.fn().mockReturnValue(undefined),
      } as unknown as Reflector,
      jwt,
      prisma as never,
      config,
    );
    const otherSecret = await new JwtService({
      secret: 'mot-bi-mat-khac-hoan-toan',
    }).signAsync({ sub: accountId }, { algorithm: 'HS256', expiresIn: 3600 });
    const expired = await jwt.signAsync(
      { sub: accountId },
      { algorithm: 'HS256', expiresIn: -60 },
    );
    const wrongAlgorithm = await jwt.signAsync(
      { sub: accountId },
      { algorithm: 'HS384', expiresIn: 3600 },
    );

    for (const token of [otherSecret, expired, wrongAlgorithm]) {
      const { context } = makeContext(`Bearer ${token}`);
      await expect(guard.canActivate(context)).rejects.toMatchObject({
        code: 'UNAUTHENTICATED',
        message: 'Vui lòng đăng nhập để tiếp tục.',
      });
    }
    expect(prisma.account.findUnique).not.toHaveBeenCalled();
  });

  it('đọc lại tài khoản mỗi request và từ chối tài khoản thiếu hoặc không hoạt động', async () => {
    const jwt = new JwtService({ secret: config.jwtSecret });
    const token = await jwt.signAsync(
      { sub: accountId },
      { algorithm: 'HS256', expiresIn: 3600 },
    );
    const prisma = {
      account: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ id: accountId, isActive: false }),
      },
    };
    const guard = new AuthGuard(
      {
        getAllAndOverride: vi.fn().mockReturnValue(undefined),
      } as unknown as Reflector,
      jwt,
      prisma as never,
      config,
    );
    const { context } = makeContext(`Bearer ${token}`);

    for (let attempt = 0; attempt < 2; attempt += 1) {
      await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
        ApiException,
      );
    }
    expect(prisma.account.findUnique).toHaveBeenCalledTimes(2);
  });

  it('từ chối claim sub không phải UUID trước khi tra cứu tài khoản', async () => {
    const jwt = new JwtService({ secret: config.jwtSecret });
    const token = await jwt.signAsync(
      { sub: 'khong-phai-uuid' },
      { algorithm: 'HS256', expiresIn: 3600 },
    );
    const prisma = { account: { findUnique: vi.fn() } };
    const guard = new AuthGuard(
      {
        getAllAndOverride: vi.fn().mockReturnValue(undefined),
      } as unknown as Reflector,
      jwt,
      prisma as never,
      config,
    );
    const { context } = makeContext(`Bearer ${token}`);

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
    });
    expect(prisma.account.findUnique).not.toHaveBeenCalled();
  });
});
