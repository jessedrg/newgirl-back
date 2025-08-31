import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      // Log the specific error for debugging
      console.log('[JwtAuthGuard] Authentication failed:', {
        error: err?.message || 'No error',
        hasUser: !!user,
        info: info?.message || info || 'No info'
      });
      
      // Throw proper UnauthorizedException instead of generic Error
      throw new UnauthorizedException('Invalid or expired token');
    }
    
    return user;
  }
}
