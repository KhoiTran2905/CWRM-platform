export interface AppEnv {
  databaseUrl: string;
  port: number;
  corsOrigins: string[];
  nodeEnv: 'development' | 'test' | 'production';
  jwtSecret: string;
  jwtExpiresInSeconds: number;
  bcryptCost: number;
}

/** Lỗi cấu hình môi trường; thông báo luôn nêu tên biến cần sửa. */
export class EnvValidationError extends Error {}

export function validateEnv(env: NodeJS.ProcessEnv): AppEnv {
  const databaseUrl = env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new EnvValidationError(
      'Thiếu biến môi trường bắt buộc: DATABASE_URL.',
    );
  }

  let parsedDatabaseUrl: URL;
  try {
    parsedDatabaseUrl = new URL(databaseUrl);
  } catch {
    throw new EnvValidationError(
      'Biến môi trường DATABASE_URL không phải URL PostgreSQL hợp lệ.',
    );
  }
  if (!['postgres:', 'postgresql:'].includes(parsedDatabaseUrl.protocol)) {
    throw new EnvValidationError(
      'Biến môi trường DATABASE_URL phải dùng giao thức PostgreSQL.',
    );
  }

  const portValue = env.PORT?.trim() || '3001';
  if (!/^\d+$/.test(portValue)) {
    throw new EnvValidationError(
      'Biến môi trường PORT phải là số nguyên từ 1 đến 65535.',
    );
  }
  const port = Number(portValue);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
    throw new EnvValidationError(
      'Biến môi trường PORT phải là số nguyên từ 1 đến 65535.',
    );
  }

  const corsValue = env.CORS_ORIGIN?.trim() || 'http://localhost:3000';
  const corsOrigins = corsValue.split(',').map((origin) => origin.trim());
  if (corsOrigins.some((origin) => !isOrigin(origin))) {
    throw new EnvValidationError(
      'Biến môi trường CORS_ORIGIN phải là danh sách origin HTTP/HTTPS hợp lệ, phân tách bằng dấu phẩy.',
    );
  }

  const nodeEnv = env.NODE_ENV?.trim() || 'development';
  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    throw new EnvValidationError(
      'Biến môi trường NODE_ENV chỉ nhận development, test hoặc production.',
    );
  }

  const jwtSecret = env.JWT_SECRET?.trim();
  if (!jwtSecret) {
    throw new EnvValidationError('Thiếu biến môi trường bắt buộc: JWT_SECRET.');
  }
  if (Array.from(jwtSecret).length < 32) {
    throw new EnvValidationError(
      'Biến môi trường JWT_SECRET phải có ít nhất 32 ký tự sau khi bỏ khoảng trắng hai đầu.',
    );
  }

  const jwtExpiresInSeconds = parseIntegerSetting(
    env.JWT_EXPIRES_IN_SECONDS,
    '3600',
    'JWT_EXPIRES_IN_SECONDS',
    60,
    86400,
  );
  const bcryptCost = parseIntegerSetting(
    env.BCRYPT_COST,
    '10',
    'BCRYPT_COST',
    4,
    15,
  );

  return {
    databaseUrl,
    port,
    corsOrigins,
    nodeEnv: nodeEnv as AppEnv['nodeEnv'],
    jwtSecret,
    jwtExpiresInSeconds,
    bcryptCost,
  };
}

function parseIntegerSetting(
  value: string | undefined,
  defaultValue: string,
  name: string,
  minimum: number,
  maximum: number,
): number {
  const setting = value?.trim() || defaultValue;
  if (!/^\d+$/.test(setting)) {
    throw new EnvValidationError(
      `Biến môi trường ${name} phải là số nguyên từ ${minimum} đến ${maximum}.`,
    );
  }
  const parsed = Number(setting);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new EnvValidationError(
      `Biến môi trường ${name} phải là số nguyên từ ${minimum} đến ${maximum}.`,
    );
  }
  return parsed;
}

function isOrigin(value: string): boolean {
  try {
    const origin = new URL(value);
    return (
      ['http:', 'https:'].includes(origin.protocol) &&
      origin.origin === value &&
      !origin.username &&
      !origin.password
    );
  } catch {
    return false;
  }
}
