import { Reflector } from '@nestjs/core';
import type { PrismaService } from '../prisma/prisma.service.js';
import { WorkspacePermissionGuard } from './workspace-permission.guard.js';

const workspaceId = '22222222-2222-4222-8222-222222222222';
const userId = '11111111-1111-4111-8111-111111111111';

function makeContext(
  permission: 'WORKSPACE_MEMBER' | 'WORKSPACE_MANAGER',
  id = workspaceId,
) {
  const request = {
    params: { workspaceId: id },
    user: { id: userId },
  };
  const handler = () => undefined;
  return {
    context: {
      getHandler: () => handler,
      getClass: () => class WorkspaceController {},
      switchToHttp: () => ({ getRequest: () => request }),
    } as never,
    reflector: { getAllAndOverride: vi.fn().mockReturnValue(permission) },
  };
}

describe('Bộ bảo vệ quyền workspace', () => {
  it('che giấu workspace thiếu membership hoặc membership INACTIVE bằng cùng 404', async () => {
    const prisma = {
      workspaceMembership: {
        findUnique: vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({
          role: 'MANAGER',
          status: 'INACTIVE',
        }),
      },
    };
    const reflector = new Reflector();
    const guard = new WorkspacePermissionGuard(
      reflector,
      prisma as unknown as PrismaService,
    );
    const outsider = makeContext('WORKSPACE_MEMBER');
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(
      'WORKSPACE_MEMBER',
    );
    await expect(guard.canActivate(outsider.context)).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Không tìm thấy workspace được yêu cầu.',
    });
    await expect(guard.canActivate(outsider.context)).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Không tìm thấy workspace được yêu cầu.',
    });
  });

  it('trả 403 cho MEMBER ACTIVE khi cần MANAGER', async () => {
    const reflector = new Reflector();
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(
      'WORKSPACE_MANAGER',
    );
    const prisma = {
      workspaceMembership: {
        findUnique: vi
          .fn()
          .mockResolvedValue({ role: 'MEMBER', status: 'ACTIVE' }),
      },
    };
    const guard = new WorkspacePermissionGuard(
      reflector,
      prisma as unknown as PrismaService,
    );
    const { context } = makeContext('WORKSPACE_MANAGER');

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: 'Bạn không có quyền thực hiện thao tác này.',
    });
  });

  it('trả 400 khi workspaceId không phải UUID', async () => {
    const reflector = new Reflector();
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(
      'WORKSPACE_MEMBER',
    );
    const prisma = { workspaceMembership: { findUnique: vi.fn() } };
    const guard = new WorkspacePermissionGuard(
      reflector,
      prisma as unknown as PrismaService,
    );
    const { context } = makeContext('WORKSPACE_MEMBER', 'sai-dinh-dang');

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      status: 400,
    });
    expect(prisma.workspaceMembership.findUnique).not.toHaveBeenCalled();
  });
});
