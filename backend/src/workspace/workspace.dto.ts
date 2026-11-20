import { Transform, Type } from 'class-transformer';
import { IsInt, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CharacterLength } from '../auth/auth.dto.js';

export class WorkspaceCreateRequest {
  @ApiProperty({ minLength: 1, maxLength: 160, example: 'Marketing' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Tên workspace phải là chuỗi.' })
  @CharacterLength(1, 160, {
    message:
      'Tên workspace sau khi bỏ khoảng trắng phải dài từ 1 đến 160 ký tự.',
  })
  name!: string;
}

export class WorkspacePatchRequest {
  @ApiProperty({ minLength: 1, maxLength: 160, example: 'Marketing' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Tên workspace phải là chuỗi.' })
  @CharacterLength(1, 160, {
    message:
      'Tên workspace sau khi bỏ khoảng trắng phải dài từ 1 đến 160 ký tự.',
  })
  name!: string;
}

export class WorkspaceListQuery {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @Type(() => Number)
  @IsInt({ message: 'page phải là số nguyên.' })
  @Min(1, { message: 'page phải từ 1 trở lên.' })
  page = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @Type(() => Number)
  @IsInt({ message: 'pageSize phải là số nguyên.' })
  @Min(1, { message: 'pageSize phải từ 1 trở lên.' })
  @Max(100, { message: 'pageSize không được vượt quá 100.' })
  pageSize = 20;
}

export class WorkspaceResponse {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Marketing' })
  name!: string;

  @ApiProperty({ format: 'uuid' })
  createdByUserId!: string;

  @ApiProperty({ format: 'date-time', example: '2026-11-17T10:00:00.000Z' })
  createdAt!: string;
}

export class WorkspacePageResponse {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  pageSize!: number;

  @ApiProperty({ example: 0 })
  total!: number;

  @ApiProperty({ type: [WorkspaceResponse] })
  items!: WorkspaceResponse[];
}
