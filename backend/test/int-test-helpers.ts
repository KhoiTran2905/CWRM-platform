import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp, registerNotFoundFallback } from '../src/app.setup.js';
import { validateEnv } from '../src/config/env.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

export async function createIntegrationApp(): Promise<INestApplication<App>> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleFixture.createNestApplication();
  configureApp(app, validateEnv(process.env));
  await app.init();
  registerNotFoundFallback(app);
  return app;
}

export async function clearPublicTables(prisma: PrismaService): Promise<void> {
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
      AND tablename <> '_prisma_migrations' ORDER BY tablename
  `;
  if (tables.length === 0) return;
  const tableList = tables
    .map(({ tablename }) => `"public"."${tablename.replaceAll('"', '""')}"`)
    .join(', ');
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`,
  );
}

export async function registerAndLogin(
  app: INestApplication<App>,
  email: string,
  displayName = 'Người dùng',
): Promise<{ id: string; accessToken: string }> {
  const password = 'mat-khau-kiem-thu-123';
  const registered = await request(app.getHttpServer())
    .post('/api/v1/auth/register')
    .send({ email, password, displayName })
    .expect(201);
  const loggedIn = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email, password })
    .expect(200);
  return {
    id: registered.body.id as string,
    accessToken: loggedIn.body.accessToken as string,
  };
}
