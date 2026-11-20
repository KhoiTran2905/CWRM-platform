import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { isUUID } from 'class-validator';
import type { Request } from 'express';
import { ApiException } from '../common/errors/api.exception.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthenticatedRequest } from '../auth/auth.decorators.js';
import {
  WORKSPACE_PERMISSION_KEY,
  type WorkspacePermission,
} from './workspace.decorators.js';

@Injectable()
export class WorkspacePermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission = this.reflector.getAllAndOverride<WorkspacePermission>(
      WORKSPACE_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!permission) return true;

    const request = context
      .switchToHttp()
      .getRequest<Request & AuthenticatedRequest>();
    const workspaceId = request.params.workspaceId;
    if (typeof workspaceId !== 'string' || !isUUID(workspaceId, 'all')) {
      throw new ApiException(
        'VALIDATION_ERROR',
        400,
        'Mã workspace phải có định dạng UUID hợp lệ.',
        {
          fields: {
            workspaceId: ['Mã workspace phải có định dạng UUID hợp lệ.'],
          },
        },
      );
    }

    const membership = await this.prisma.workspaceMembership.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId: request.user.id },
      },
      select: { role: true, status: true },
    });
    if (!membership || membership.status !== 'ACTIVE') {
      throw new ApiException(
        'NOT_FOUND',
        404,
        'Không tìm thấy workspace được yêu cầu.',
      );
    }
    if (permission === 'WORKSPACE_MANAGER' && membership.role !== 'MANAGER') {
      throw new ApiException(
        'FORBIDDEN',
        403,
        'Bạn không có quyền thực hiện thao tác này.',
      );
    }
    return true;
  }
}
