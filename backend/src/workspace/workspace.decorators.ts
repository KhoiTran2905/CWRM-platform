import { SetMetadata } from '@nestjs/common';

export type WorkspacePermission = 'WORKSPACE_MEMBER' | 'WORKSPACE_MANAGER';
export const WORKSPACE_PERMISSION_KEY = 'cwrm:workspace-permission';
export const RequirePermission = (permission: WorkspacePermission) =>
  SetMetadata(WORKSPACE_PERMISSION_KEY, permission);
