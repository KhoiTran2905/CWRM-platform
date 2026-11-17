import type { PrismaService } from '../prisma/prisma.service.js';
import { WorkspaceService } from './workspace.service.js';

describe('Dịch vụ workspace', () => {
  it('tạo workspace và membership MANAGER ACTIVE trong cùng transaction', async () => {
    const workspace = {
      id: '22222222-2222-4222-8222-222222222222',
      name: 'Kế hoạch',
      createdByUserId: '11111111-1111-4111-8111-111111111111',
      createdAt: new Date('2026-11-17T10:00:00.000Z'),
    };
    const transaction = {
      workspace: { create: vi.fn().mockResolvedValue(workspace) },
      workspaceMembership: { create: vi.fn().mockResolvedValue({}) },
    };
    const prisma = {
      $transaction: vi.fn((callback: (tx: typeof transaction) => unknown) =>
        callback(transaction),
      ),
    };
    const service = new WorkspaceService(prisma as unknown as PrismaService);
    const result = await service.create(workspace.createdByUserId, {
      name: ' Kế hoạch ',
    });

    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(transaction.workspaceMembership.create).toHaveBeenCalledWith({
      data: {
        workspaceId: workspace.id,
        userId: workspace.createdByUserId,
        role: 'MANAGER',
        status: 'ACTIVE',
      },
    });
    expect(result.createdAt).toBe('2026-11-17T10:00:00.000Z');
  });

  it('chỉ truy vấn membership ACTIVE và sắp ngày giảm dần rồi mã tăng dần', async () => {
    const prisma = {
      workspace: {
        count: vi.fn().mockResolvedValue(0),
        findMany: vi.fn().mockResolvedValue([]),
      },
    };
    const service = new WorkspaceService(prisma as unknown as PrismaService);

    const result = await service.list('user-id', 2, 10);

    expect(prisma.workspace.count).toHaveBeenCalledWith({
      where: { memberships: { some: { userId: 'user-id', status: 'ACTIVE' } } },
    });
    expect(prisma.workspace.findMany).toHaveBeenCalledWith({
      where: { memberships: { some: { userId: 'user-id', status: 'ACTIVE' } } },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip: 10,
      take: 10,
    });
    expect(result).toEqual({ page: 2, pageSize: 10, total: 0, items: [] });
  });
});
