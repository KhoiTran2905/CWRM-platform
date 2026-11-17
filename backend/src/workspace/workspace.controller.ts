import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiException } from '../common/errors/api.exception.js';
import {
  CurrentUser,
  type AuthenticatedAccount,
} from '../auth/auth.decorators.js';
import {
  WorkspaceCreateRequest,
  WorkspaceListQuery,
  WorkspacePageResponse,
  WorkspacePatchRequest,
  WorkspaceResponse,
} from './workspace.dto.js';
import { RequirePermission } from './workspace.decorators.js';
import { WorkspaceService } from './workspace.service.js';

@ApiTags('Workspace')
@ApiBearerAuth()
@Controller('workspaces')
export class WorkspaceController {
  constructor(private readonly workspaces: WorkspaceService) {}

  @Get()
  @ApiOperation({
    operationId: 'listMyWorkspaces',
    summary: 'Liệt kê workspace của tôi',
  })
  @ApiResponse({ status: 200, type: WorkspacePageResponse })
  list(
    @CurrentUser() account: AuthenticatedAccount,
    @Query() query: WorkspaceListQuery,
  ) {
    return this.workspaces.list(account.id, query.page, query.pageSize);
  }

  @Post()
  @ApiOperation({ operationId: 'createWorkspace', summary: 'Tạo workspace' })
  @ApiCreatedResponse({ type: WorkspaceResponse })
  create(
    @CurrentUser() account: AuthenticatedAccount,
    @Body() body: WorkspaceCreateRequest,
  ) {
    return this.workspaces.create(account.id, body);
  }

  @Get(':workspaceId')
  @RequirePermission('WORKSPACE_MEMBER')
  @ApiOperation({
    operationId: 'getWorkspace',
    summary: 'Lấy thông tin workspace',
  })
  @ApiResponse({ status: 200, type: WorkspaceResponse })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy workspace được yêu cầu.',
  })
  async get(@Param('workspaceId') workspaceId: string) {
    const workspace = await this.workspaces.get(workspaceId);
    if (!workspace) {
      throw new ApiException(
        'NOT_FOUND',
        404,
        'Không tìm thấy workspace được yêu cầu.',
      );
    }
    return workspace;
  }

  @Patch(':workspaceId')
  @RequirePermission('WORKSPACE_MANAGER')
  @ApiOperation({
    operationId: 'updateWorkspace',
    summary: 'Đổi tên workspace',
  })
  @ApiResponse({ status: 200, type: WorkspaceResponse })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy workspace được yêu cầu.',
  })
  update(
    @Param('workspaceId') workspaceId: string,
    @Body() body: WorkspacePatchRequest,
  ) {
    return this.workspaces.update(workspaceId, body);
  }
}
