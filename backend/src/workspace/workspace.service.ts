import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { WorkspaceCreateRequest } from './workspace.dto.js';

@Injectable()
export class WorkspaceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, input: WorkspaceCreateRequest) {
    return this.prisma.$transaction(async (transaction) => {
      const workspace = await transaction.workspace.create({
        data: { name: input.name.trim(), createdByUserId: userId },
      });
      await transaction.workspaceMembership.create({
        data: {
          workspaceId: workspace.id,
          userId,
          role: 'MANAGER',
          status: 'ACTIVE',
        },
      });
      return formatWorkspace(workspace);
    });
  }

  async list(userId: string, page: number, pageSize: number) {
    const where = {
      memberships: { some: { userId, status: 'ACTIVE' as const } },
    };
    const [total, items] = await Promise.all([
      this.prisma.workspace.count({ where }),
      this.prisma.workspace.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return { page, pageSize, total, items: items.map(formatWorkspace) };
  }

  async get(workspaceId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace) return null;
    return formatWorkspace(workspace);
  }

  async update(workspaceId: string, input: WorkspaceCreateRequest) {
    const workspace = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { name: input.name.trim() },
    });
    return formatWorkspace(workspace);
  }
}

function formatWorkspace(workspace: {
  id: string;
  name: string;
  createdByUserId: string;
  createdAt: Date;
}) {
  return {
    id: workspace.id,
    name: workspace.name,
    createdByUserId: workspace.createdByUserId,
    createdAt: workspace.createdAt.toISOString(),
  };
}
