import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import type { PublicUser } from './auth.types';

export type AuthenticatedRequest = {
  authUser?: PublicUser;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): PublicUser | undefined =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().authUser,
);
