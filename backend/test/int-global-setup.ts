import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { Client } from 'pg';

export default async function setupIntegrationDatabase(): Promise<void> {
  if (existsSync('.env')) process.loadEnvFile('.env');
  const databaseUrl = process.env.TEST_DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error(
      'Thiếu TEST_DATABASE_URL; hãy cấu hình database riêng cho test:int.',
    );
  }

  let target: URL;
  try {
    target = new URL(databaseUrl);
  } catch {
    throw new Error('TEST_DATABASE_URL không phải URL PostgreSQL hợp lệ.');
  }
  if (!['postgres:', 'postgresql:'].includes(target.protocol)) {
    throw new Error('TEST_DATABASE_URL phải dùng giao thức PostgreSQL.');
  }
  const databaseName = decodeURIComponent(target.pathname.slice(1));
  if (!databaseName.endsWith('_test')) {
    throw new Error(
      'Từ chối chạy test:int: tên database trong TEST_DATABASE_URL phải kết thúc bằng _test.',
    );
  }

  const adminUrl = new URL(target);
  adminUrl.pathname = '/postgres';
  const client = new Client({ connectionString: adminUrl.toString() });
  try {
    await client.connect();
    const exists = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [databaseName],
    );
    if (exists.rowCount === 0) {
      const quotedName = `"${databaseName.replaceAll('"', '""')}"`;
      await client.query(`CREATE DATABASE ${quotedName}`);
    }
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : 'lỗi không xác định';
    throw new Error(
      `Không thể chuẩn bị database tích hợp TEST_DATABASE_URL: ${reason}`,
    );
  } finally {
    await client.end();
  }

  const prismaCli = resolve(
    import.meta.dirname,
    '../node_modules/prisma/build/index.js',
  );
  execFileSync(process.execPath, [prismaCli, 'migrate', 'deploy'], {
    cwd: resolve(import.meta.dirname, '..'),
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  });
}
