import { validateEnv } from './env.js';

describe('validateEnv', () => {
  const envBase = {
    DATABASE_URL: 'postgresql://localhost/cwrm',
    JWT_SECRET: 'day-la-khoa-bi-mat-danh-rieng-cho-kiem-thu',
  };

  it('báo rõ DATABASE_URL khi thiếu', () => {
    expect(() => validateEnv({})).toThrow('DATABASE_URL');
  });

  it('báo rõ PORT khi giá trị sai', () => {
    expect(() => validateEnv({ ...envBase, PORT: 'abc' })).toThrow('PORT');
  });

  it('điền giá trị mặc định cho port, origin CORS và môi trường', () => {
    expect(validateEnv(envBase)).toEqual({
      databaseUrl: 'postgresql://localhost/cwrm',
      port: 3001,
      corsOrigins: ['http://localhost:3000'],
      nodeEnv: 'development',
      jwtSecret: envBase.JWT_SECRET,
      jwtExpiresInSeconds: 3600,
      bcryptCost: 10,
    });
  });

  it('yêu cầu JWT_SECRET đủ dài sau khi bỏ khoảng trắng', () => {
    expect(() => validateEnv({ ...envBase, JWT_SECRET: ' qua ngan ' })).toThrow(
      'JWT_SECRET',
    );
  });

  it('chấp nhận cấu hình JWT và bcrypt trong miền cho phép', () => {
    expect(
      validateEnv({
        ...envBase,
        JWT_EXPIRES_IN_SECONDS: '86400',
        BCRYPT_COST: '4',
      }),
    ).toMatchObject({ jwtExpiresInSeconds: 86400, bcryptCost: 4 });
  });

  it.each([
    ['JWT_EXPIRES_IN_SECONDS', '59'],
    ['JWT_EXPIRES_IN_SECONDS', '86401'],
    ['JWT_EXPIRES_IN_SECONDS', '1.5'],
    ['BCRYPT_COST', '3'],
    ['BCRYPT_COST', '16'],
    ['BCRYPT_COST', '10.5'],
  ])('báo đúng biến %s khi giá trị %s sai miền', (key, value) => {
    expect(() => validateEnv({ ...envBase, [key]: value })).toThrow(key);
  });
});
