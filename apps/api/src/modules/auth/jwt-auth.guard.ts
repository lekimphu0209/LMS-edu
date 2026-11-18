import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Guard yêu cầu JWT access token hợp lệ (strategy 'jwt' của JwtStrategy). */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
