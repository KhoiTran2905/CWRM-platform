import {
  createParamDecorator,
  SetMetadata,
  type ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';

export const IS_PUBLIC_KEY = 'cwrm:is-public';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export interface AuthenticatedAccount {
  id: string;
  email: string;
  displayName: string;
  isActive: boolean;
}

export type AuthenticatedRequest = Request & { user: AuthenticatedAccount };

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedAccount =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
