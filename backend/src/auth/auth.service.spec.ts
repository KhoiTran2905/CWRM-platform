import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { ApiException } from '../common/errors/api.exception.js';
import type { AppEnv } from '../config/env.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { AuthService } from './auth.service.js';

const config = {
  jwtSecret: 'auth-service-unit-test-secret-at-least-32',
  jwtExpiresInSeconds: 3600,
  bcryptCost: 4,
} as AppEnv;
const user = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'nguoidung@example.com',
  displayName: 'Người dùng',
  isActive: true,
  passwordHash: '',
};

describe('Dịch vụ xác thực', () => {
  it('băm mật khẩu và không trả hash khi đăng ký', async () => {
    const prisma = {
      account: {
        create: vi.fn().mockResolvedValue({
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          isActive: user.isActive,
        }),
      },
    };
    const service = new AuthService(
      prisma as unknown as PrismaService,
      new JwtService({ secret: config.jwtSecret }),
      config,
    );
    const result = await service.register({
      email: '  NGUOIDUNG@example.com ',
      displayName: '  Người dùng  ',
      password: 'matkhau123',
    });

    expect(prisma.account.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'nguoidung@example.com',
        displayName: 'Người dùng',
      }),
      select: { id: true, email: true, displayName: true, isActive: true },
    });
    expect(prisma.account.create.mock.calls[0]![0].data.passwordHash).toMatch(
      /^\$2/,
    );
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('chuyển lỗi Prisma P2002 thành xung đột email', async () => {
    const prisma = {
      account: { create: vi.fn().mockRejectedValue({ code: 'P2002' }) },
    };
    const service = new AuthService(
      prisma as unknown as PrismaService,
      new JwtService({ secret: config.jwtSecret }),
      config,
    );

    await expect(
      service.register({
        email: 'trung@example.com',
        displayName: 'Người dùng',
        password: 'matkhau123',
      }),
    ).rejects.toMatchObject({
      code: 'UNIQUE_CONFLICT',
      details: { field: 'email' },
    });
  });

  it('dùng hash giả cùng cost và trả lỗi chung khi email không tồn tại', async () => {
    const prisma = { account: { findUnique: vi.fn().mockResolvedValue(null) } };
    const compare = vi.spyOn(bcrypt, 'compare');
    const service = new AuthService(
      prisma as unknown as PrismaService,
      new JwtService({ secret: config.jwtSecret }),
      config,
    );
    await service.onModuleInit();

    await expect(
      service.login({ email: 'khongco@example.com', password: 'matkhau123' }),
    ).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
      message: 'Email hoặc mật khẩu không đúng.',
    });
    expect(compare).toHaveBeenCalledOnce();
    expect(compare.mock.calls[0]![1]).toMatch(/^\$2[aby]\$04\$/);
    compare.mockRestore();
  });

  it('đăng nhập thành công chỉ trả account công khai và token Bearer', async () => {
    const passwordHash = await bcrypt.hash('matkhau123', config.bcryptCost);
    const prisma = {
      account: {
        findUnique: vi.fn().mockResolvedValue({ ...user, passwordHash }),
      },
    };
    const service = new AuthService(
      prisma as unknown as PrismaService,
      new JwtService({ secret: config.jwtSecret }),
      config,
    );
    const result = await service.login({
      email: ' NGUOIDUNG@example.com ',
      password: 'matkhau123',
    });

    expect(result).toMatchObject({ tokenType: 'Bearer', expiresIn: 3600 });
    expect(result.account).not.toHaveProperty('passwordHash');
    expect(result.accessToken.split('.')).toHaveLength(3);
  });

  it('từ chối mật khẩu dài quá 72 byte khi đăng nhập', async () => {
    const prisma = {
      account: {
        findUnique: vi
          .fn()
          .mockResolvedValue({ ...user, passwordHash: '$2b$04$hash' }),
      },
    };
    const service = new AuthService(
      prisma as unknown as PrismaService,
      new JwtService({ secret: config.jwtSecret }),
      config,
    );

    await expect(
      service.login({ email: user.email, password: 'ệ'.repeat(25) }),
    ).rejects.toBeInstanceOf(ApiException);
  });
});
