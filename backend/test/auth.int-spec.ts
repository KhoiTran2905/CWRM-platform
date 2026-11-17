import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import {
  createIntegrationApp,
  clearPublicTables,
  registerAndLogin,
} from './int-test-helpers.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('API xác thực với PostgreSQL', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const password = 'mat-khau-kiem-thu-123';

  beforeAll(async () => {
    app = await createIntegrationApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await clearPublicTables(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('đăng ký tài khoản đã chuẩn hóa email và chỉ trả bốn trường công khai', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: '  Nguoi.Dung@Example.com ',
        password,
        displayName: '  Nguyễn An  ',
      })
      .expect(201);

    expect(Object.keys(response.body).sort()).toEqual(
      ['id', 'email', 'displayName', 'isActive'].sort(),
    );
    expect(response.body.email).toBe('nguoi.dung@example.com');
    expect(response.body.displayName).toBe('Nguyễn An');
    const account = await prisma.account.findUnique({
      where: { id: response.body.id },
    });
    expect(account?.passwordHash.startsWith('$2')).toBe(true);
    expect(account?.passwordHash).not.toBe(password);
  });

  it('từ chối từng dạng dữ liệu đăng ký không hợp lệ theo phong bì lỗi', async () => {
    const valid = {
      email: 'valid@example.com',
      password,
      displayName: 'Người dùng',
    };
    const invalidBodies = [
      {},
      { ...valid, email: 'khong-phai-email' },
      { ...valid, password: '1234567' },
      { ...valid, password: 'ệ'.repeat(25) },
      { ...valid, displayName: '   ' },
      { ...valid, role: 'ADMIN' },
    ];

    for (const body of invalidBodies) {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(body)
        .expect(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error).toHaveProperty('details');
    }
  });

  it('từ chối email trùng sau khi chuẩn hóa chữ hoa thường', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'trung@example.com', password, displayName: 'Người dùng' })
      .expect(201);
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'TRUNG@example.com', password, displayName: 'Người khác' })
      .expect(409);
    expect(response.body.error).toEqual({
      code: 'UNIQUE_CONFLICT',
      message: 'Email này đã được đăng ký.',
      details: { field: 'email' },
    });
  });

  it('đăng nhập trả phiên Bearer và token dùng được để đọc tài khoản hiện tại', async () => {
    const account = await registerAndLogin(app, 'dangnhap@example.com');
    const session = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'DANGNHAP@example.com', password })
      .expect(200);

    expect(session.body).toMatchObject({
      tokenType: 'Bearer',
      expiresIn: 3600,
    });
    const me = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${session.body.accessToken}`)
      .expect(200);
    expect(me.body.id).toBe(account.id);
    expect(me.body).not.toHaveProperty('passwordHash');
  });

  it('trả cùng một lỗi đăng nhập cho mật khẩu sai, email lạ và tài khoản bị khóa', async () => {
    const account = await registerAndLogin(app, 'loi-dang-nhap@example.com');
    await prisma.account.update({
      where: { id: account.id },
      data: { isActive: false },
    });
    const responses = await Promise.all([
      request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'loi-dang-nhap@example.com', password: 'sai-mat-khau' }),
      request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'khong-ton-tai@example.com', password }),
      request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'loi-dang-nhap@example.com', password }),
    ]);
    for (const response of responses) {
      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHENTICATED');
      expect(response.body.error.message).toBe(
        'Email hoặc mật khẩu không đúng.',
      );
    }
  });

  it('từ chối thiếu header, sai dạng, sai chữ ký, hết hạn, alg none và tài khoản đã khóa', async () => {
    const account = await registerAndLogin(app, 'token@example.com');
    const validSession = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'token@example.com', password })
      .expect(200);
    const secret = process.env.JWT_SECRET!;
    const jwt = new JwtService({ secret });
    const expired = await jwt.signAsync(
      { sub: account.id },
      { algorithm: 'HS256', expiresIn: -60 },
    );
    const wrongSecret = await new JwtService({
      secret: 'mot-khoa-bi-mat-hoan-toan-khac',
    }).signAsync({ sub: account.id }, { algorithm: 'HS256', expiresIn: 3600 });
    const wrongAlgorithm = await jwt.signAsync(
      { sub: account.id },
      { algorithm: 'HS384', expiresIn: 3600 },
    );
    const encode = (value: object) =>
      Buffer.from(JSON.stringify(value)).toString('base64url');
    const noAlgorithm = `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ sub: account.id })}.`;

    const requestMe = (token?: string) => {
      const call = request(app.getHttpServer()).get('/api/v1/auth/me');
      if (token)
        call.set(
          'Authorization',
          token.startsWith('Basic ') ? token : `Bearer ${token}`,
        );
      return call;
    };
    const unauthenticated = [
      await requestMe().expect(401),
      await requestMe('Basic mot-token').expect(401),
      await requestMe(wrongSecret).expect(401),
      await requestMe(expired).expect(401),
      await requestMe(noAlgorithm).expect(401),
      await requestMe(wrongAlgorithm).expect(401),
    ];
    await prisma.account.update({
      where: { id: account.id },
      data: { isActive: false },
    });
    unauthenticated.push(
      await requestMe(validSession.body.accessToken as string).expect(401),
    );
    for (const response of unauthenticated) {
      expect(response.body.error.code).toBe('UNAUTHENTICATED');
      expect(response.body.error.message).toBe(
        'Vui lòng đăng nhập để tiếp tục.',
      );
    }
  });

  it('cập nhật tên hiển thị, chặn email trong patch và xử lý đăng xuất', async () => {
    const account = await registerAndLogin(app, 'profile@example.com');
    const updated = await request(app.getHttpServer())
      .patch('/api/v1/auth/me')
      .set('Authorization', `Bearer ${account.accessToken}`)
      .send({ displayName: '  Tên mới  ' })
      .expect(200);
    expect(updated.body.displayName).toBe('Tên mới');

    const invalid = await request(app.getHttpServer())
      .patch('/api/v1/auth/me')
      .set('Authorization', `Bearer ${account.accessToken}`)
      .send({ displayName: 'Tên mới', email: 'khac@example.com' })
      .expect(400);
    expect(invalid.body.error.code).toBe('VALIDATION_ERROR');

    const logout = await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${account.accessToken}`)
      .expect(204);
    expect(logout.text).toBe('');
    await request(app.getHttpServer()).post('/api/v1/auth/logout').expect(401);
  });

  it('mật khẩu dài quá 72 byte không được so sánh như mật khẩu hợp lệ', async () => {
    const registered = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'byte@example.com', password, displayName: 'Người dùng' })
      .expect(201);
    expect(
      await bcrypt.compare(
        password,
        (
          await prisma.account.findUniqueOrThrow({
            where: { id: registered.body.id },
          })
        ).passwordHash,
      ),
    ).toBe(true);
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'byte@example.com', password: 'ệ'.repeat(25) })
      .expect(401);
  });
});
