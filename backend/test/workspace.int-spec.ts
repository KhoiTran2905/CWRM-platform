import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import {
  clearPublicTables,
  createIntegrationApp,
  registerAndLogin,
} from './int-test-helpers.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('API workspace với PostgreSQL', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

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

  it('tạo workspace cùng membership MANAGER ACTIVE trong một transaction', async () => {
    const manager = await registerAndLogin(app, 'quanly@example.com');
    const response = await request(app.getHttpServer())
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${manager.accessToken}`)
      .send({ name: '  Kế hoạch  ' })
      .expect(201);

    expect(response.body).toMatchObject({
      name: 'Kế hoạch',
      createdByUserId: manager.id,
    });
    expect(response.body.createdAt).toMatch(/^\d{4}-\d\d-\d\dT.*Z$/);
    const membership = await prisma.workspaceMembership.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: response.body.id,
          userId: manager.id,
        },
      },
    });
    expect(membership).toMatchObject({ role: 'MANAGER', status: 'ACTIVE' });
  });

  it('chỉ liệt kê membership ACTIVE và phân trang theo createdAt rồi id', async () => {
    const member = await registerAndLogin(app, 'thanhvien@example.com');
    const other = await registerAndLogin(app, 'nguoi-khac@example.com');
    const older = new Date('2026-01-01T00:00:00.000Z');
    const newer = new Date('2026-02-01T00:00:00.000Z');
    const ownWorkspaces = [
      {
        id: '10000000-0000-4000-8000-000000000003',
        name: 'Cũ',
        createdAt: older,
      },
      {
        id: '10000000-0000-4000-8000-000000000001',
        name: 'Mới A',
        createdAt: newer,
      },
      {
        id: '10000000-0000-4000-8000-000000000002',
        name: 'Mới B',
        createdAt: newer,
      },
    ];
    for (const workspace of ownWorkspaces) {
      await prisma.workspace.create({
        data: { ...workspace, createdByUserId: member.id },
      });
      await prisma.workspaceMembership.create({
        data: {
          workspaceId: workspace.id,
          userId: member.id,
          role: 'MANAGER',
          status: 'ACTIVE',
        },
      });
    }
    const inactiveId = '20000000-0000-4000-8000-000000000001';
    await prisma.workspace.create({
      data: {
        id: inactiveId,
        name: 'Không hoạt động',
        createdByUserId: member.id,
      },
    });
    await prisma.workspaceMembership.create({
      data: {
        workspaceId: inactiveId,
        userId: member.id,
        role: 'MEMBER',
        status: 'INACTIVE',
      },
    });
    const otherId = '30000000-0000-4000-8000-000000000001';
    await prisma.workspace.create({
      data: { id: otherId, name: 'Của người khác', createdByUserId: other.id },
    });
    await prisma.workspaceMembership.create({
      data: {
        workspaceId: otherId,
        userId: other.id,
        role: 'MANAGER',
        status: 'ACTIVE',
      },
    });

    const first = await request(app.getHttpServer())
      .get('/api/v1/workspaces?page=1&pageSize=2')
      .set('Authorization', `Bearer ${member.accessToken}`)
      .expect(200);
    expect(first.body.total).toBe(3);
    expect(first.body.items.map((item: { id: string }) => item.id)).toEqual([
      '10000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000002',
    ]);
    const second = await request(app.getHttpServer())
      .get('/api/v1/workspaces?page=2&pageSize=2')
      .set('Authorization', `Bearer ${member.accessToken}`)
      .expect(200);
    expect(second.body).toMatchObject({ page: 2, pageSize: 2, total: 3 });
    expect(second.body.items.map((item: { id: string }) => item.id)).toEqual([
      ownWorkspaces[0]!.id,
    ]);
    const invalidPageSize = await request(app.getHttpServer())
      .get('/api/v1/workspaces?pageSize=101')
      .set('Authorization', `Bearer ${member.accessToken}`)
      .expect(400);
    expect(invalidPageSize.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('cho phép Manager và Member đọc workspace, đồng thời che giấu workspace với người ngoài', async () => {
    const manager = await registerAndLogin(app, 'manager-read@example.com');
    const member = await registerAndLogin(app, 'member-read@example.com');
    const outsider = await registerAndLogin(app, 'outsider-read@example.com');
    const created = await request(app.getHttpServer())
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${manager.accessToken}`)
      .send({ name: 'Đọc chung' })
      .expect(201);
    await prisma.workspaceMembership.create({
      data: {
        workspaceId: created.body.id,
        userId: member.id,
        role: 'MEMBER',
        status: 'ACTIVE',
      },
    });

    for (const user of [manager, member]) {
      await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${created.body.id}`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(200);
    }
    const outside = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${created.body.id}`)
      .set('Authorization', `Bearer ${outsider.accessToken}`)
      .expect(404);
    const missing = await request(app.getHttpServer())
      .get('/api/v1/workspaces/40000000-0000-4000-8000-000000000001')
      .set('Authorization', `Bearer ${outsider.accessToken}`)
      .expect(404);
    expect(missing.body).toEqual(outside.body);

    const malformed = await request(app.getHttpServer())
      .get('/api/v1/workspaces/khong-phai-uuid')
      .set('Authorization', `Bearer ${manager.accessToken}`)
      .expect(400);
    expect(malformed.body.error.code).toBe('VALIDATION_ERROR');
    await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${created.body.id}`)
      .expect(401);
  });

  it('chỉ Manager ACTIVE được đổi tên workspace', async () => {
    const manager = await registerAndLogin(app, 'manager-patch@example.com');
    const member = await registerAndLogin(app, 'member-patch@example.com');
    const outsider = await registerAndLogin(app, 'outsider-patch@example.com');
    const created = await request(app.getHttpServer())
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${manager.accessToken}`)
      .send({ name: 'Ban đầu' })
      .expect(201);
    await prisma.workspaceMembership.create({
      data: {
        workspaceId: created.body.id,
        userId: member.id,
        role: 'MEMBER',
        status: 'ACTIVE',
      },
    });

    const updated = await request(app.getHttpServer())
      .patch(`/api/v1/workspaces/${created.body.id}`)
      .set('Authorization', `Bearer ${manager.accessToken}`)
      .send({ name: '  Đã đổi  ' })
      .expect(200);
    expect(updated.body.name).toBe('Đã đổi');
    await request(app.getHttpServer())
      .patch(`/api/v1/workspaces/${created.body.id}`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({ name: 'Không được đổi' })
      .expect(403);
    await request(app.getHttpServer())
      .patch(`/api/v1/workspaces/${created.body.id}`)
      .set('Authorization', `Bearer ${outsider.accessToken}`)
      .send({ name: 'Không nhìn thấy' })
      .expect(404);

    await prisma.workspaceMembership.update({
      where: {
        workspaceId_userId: {
          workspaceId: created.body.id,
          userId: manager.id,
        },
      },
      data: { status: 'INACTIVE' },
    });
    await request(app.getHttpServer())
      .patch(`/api/v1/workspaces/${created.body.id}`)
      .set('Authorization', `Bearer ${manager.accessToken}`)
      .send({ name: 'Không hoạt động' })
      .expect(404);
  });
});
