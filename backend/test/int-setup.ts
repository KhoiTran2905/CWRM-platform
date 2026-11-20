import { existsSync } from 'node:fs';

if (existsSync('.env')) process.loadEnvFile('.env');
const testDatabaseUrl = process.env.TEST_DATABASE_URL?.trim();
if (!testDatabaseUrl) {
  throw new Error(
    'Thiếu TEST_DATABASE_URL; hãy cấu hình database riêng cho test:int.',
  );
}

process.env.DATABASE_URL = testDatabaseUrl;
process.env.JWT_SECRET = 'cwrm-integration-test-secret-only-never-deploy';
process.env.JWT_EXPIRES_IN_SECONDS = '3600';
process.env.BCRYPT_COST = '4';
