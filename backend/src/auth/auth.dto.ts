import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  registerDecorator,
  type ValidationOptions,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export function MaxUtf8Bytes(
  maximum: number,
  options?: ValidationOptions,
): PropertyDecorator {
  return (target, propertyKey) => {
    registerDecorator({
      name: 'maxUtf8Bytes',
      target: target.constructor,
      propertyName: propertyKey.toString(),
      constraints: [maximum],
      options,
      validator: {
        validate(value: unknown): boolean {
          return (
            typeof value === 'string' &&
            Buffer.byteLength(value, 'utf8') <= maximum
          );
        },
        defaultMessage(): string {
          return `Không được vượt quá ${maximum} byte UTF-8.`;
        },
      },
    });
  };
}

export function CharacterLength(
  minimum: number,
  maximum: number,
  options?: ValidationOptions,
): PropertyDecorator {
  return (target, propertyKey) => {
    registerDecorator({
      name: 'characterLength',
      target: target.constructor,
      propertyName: propertyKey.toString(),
      constraints: [minimum, maximum],
      options,
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'string') return false;
          const length = Array.from(value).length;
          return length >= minimum && length <= maximum;
        },
      },
    });
  };
}

export class RegisterRequest {
  @ApiProperty({ example: 'nguoidung@example.com', maxLength: 320 })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString({ message: 'Email phải là chuỗi.' })
  @CharacterLength(1, 320, { message: 'Email phải dài từ 1 đến 320 ký tự.' })
  @IsEmail({}, { message: 'Email không hợp lệ.' })
  email!: string;

  @ApiProperty({ minLength: 8, maxLength: 72, example: 'matkhau-an-toan' })
  @IsString({ message: 'Mật khẩu phải là chuỗi.' })
  @CharacterLength(8, Number.MAX_SAFE_INTEGER, {
    message: 'Mật khẩu phải có ít nhất 8 ký tự.',
  })
  @MaxUtf8Bytes(72, { message: 'Mật khẩu không được vượt quá 72 byte UTF-8.' })
  password!: string;

  @ApiProperty({ minLength: 1, maxLength: 120, example: 'Nguyễn An' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Tên hiển thị phải là chuỗi.' })
  @CharacterLength(1, 120, {
    message:
      'Tên hiển thị sau khi bỏ khoảng trắng phải dài từ 1 đến 120 ký tự.',
  })
  displayName!: string;
}

export class LoginRequest {
  @ApiProperty({ example: 'nguoidung@example.com' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString({ message: 'Email phải là chuỗi.' })
  @IsNotEmpty({ message: 'Email không được để trống.' })
  @CharacterLength(1, 320, { message: 'Email phải dài từ 1 đến 320 ký tự.' })
  @IsEmail({}, { message: 'Email không hợp lệ.' })
  email!: string;

  @ApiProperty({ minLength: 1, example: 'matkhau-an-toan' })
  @IsString({ message: 'Mật khẩu phải là chuỗi.' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống.' })
  password!: string;
}

export class ProfilePatchRequest {
  @ApiProperty({ minLength: 1, maxLength: 120, example: 'Nguyễn An' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Tên hiển thị phải là chuỗi.' })
  @CharacterLength(1, 120, {
    message:
      'Tên hiển thị sau khi bỏ khoảng trắng phải dài từ 1 đến 120 ký tự.',
  })
  displayName!: string;
}

export class AccountResponse {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'nguoidung@example.com' })
  email!: string;

  @ApiProperty({ example: 'Nguyễn An' })
  displayName!: string;

  @ApiProperty({ example: true })
  isActive!: boolean;
}

export class AuthSessionResponse {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty({ enum: ['Bearer'], example: 'Bearer' })
  tokenType!: 'Bearer';

  @ApiProperty({ example: 3600 })
  expiresIn!: number;

  @ApiProperty({ type: AccountResponse })
  account!: AccountResponse;
}
