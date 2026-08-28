import {
  ForbiddenException,
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';

import type { AuthenticatedRequest } from '../auth/auth.decorators';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (request.authUser?.role !== 'admin') {
      throw new ForbiddenException('Acesso restrito à administração.');
    }
    return true;
  }
}
