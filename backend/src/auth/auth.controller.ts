import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  CurrentUser,
  type AuthenticatedAccount,
  Public,
} from './auth.decorators.js';
import {
  AccountResponse,
  AuthSessionResponse,
  LoginRequest,
  ProfilePatchRequest,
  RegisterRequest,
} from './auth.dto.js';
import { AuthService } from './auth.service.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({
    operationId: 'registerAccount',
    summary: 'Đăng ký tài khoản',
  })
  @ApiResponse({ status: 201, type: AccountResponse })
  register(@Body() body: RegisterRequest): Promise<AuthenticatedAccount> {
    return this.auth.register(body);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'login', summary: 'Đăng nhập' })
  @ApiResponse({ status: 200, type: AuthSessionResponse })
  @ApiUnauthorizedResponse({ description: 'Email hoặc mật khẩu không đúng.' })
  login(@Body() body: LoginRequest) {
    return this.auth.login(body);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ operationId: 'logout', summary: 'Đăng xuất' })
  @ApiNoContentResponse({ description: 'Đăng xuất thành công.' })
  logout(): void {}

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    operationId: 'getMyAccount',
    summary: 'Lấy tài khoản hiện tại',
  })
  @ApiResponse({ status: 200, type: AccountResponse })
  getMe(@CurrentUser() account: AuthenticatedAccount): AuthenticatedAccount {
    return account;
  }

  @Patch('me')
  @ApiBearerAuth()
  @ApiOperation({
    operationId: 'updateMyAccount',
    summary: 'Cập nhật tên hiển thị',
  })
  @ApiResponse({ status: 200, type: AccountResponse })
  updateMe(
    @CurrentUser() account: AuthenticatedAccount,
    @Body() body: ProfilePatchRequest,
  ): Promise<AuthenticatedAccount> {
    return this.auth.updateMyAccount(account.id, body.displayName);
  }
}
