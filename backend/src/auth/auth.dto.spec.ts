import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterRequest } from './auth.dto.js';

describe('Giới hạn byte mật khẩu', () => {
  it('từ chối 25 ký tự ệ vì chúng chiếm 75 byte UTF-8', async () => {
    const input = plainToInstance(RegisterRequest, {
      email: 'nguoidung@example.com',
      password: 'ệ'.repeat(25),
      displayName: 'Người dùng',
    });
    const errors = await validate(input);

    expect(Buffer.byteLength(input.password, 'utf8')).toBe(75);
    expect(
      errors.find((error) => error.property === 'password')?.constraints,
    ).toHaveProperty('maxUtf8Bytes');
  });
});
