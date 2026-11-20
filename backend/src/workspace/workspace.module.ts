import { Module } from '@nestjs/common';
import { WorkspaceController } from './workspace.controller.js';
import { WorkspacePermissionGuard } from './workspace-permission.guard.js';
import { WorkspaceService } from './workspace.service.js';

@Module({
  controllers: [WorkspaceController],
  providers: [WorkspaceService, WorkspacePermissionGuard],
  exports: [WorkspacePermissionGuard],
})
export class WorkspaceModule {}
