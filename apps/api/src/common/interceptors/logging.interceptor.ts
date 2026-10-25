import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Logs every HTTP request with method, path, status and duration.
 * Render log format: [HTTP] POST /api/v1/auth/login 201 142ms
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const { method, originalUrl } = req;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const status = context.switchToHttp().getResponse().statusCode;
          this.logger.log(`${method} ${originalUrl} ${status} ${Date.now() - start}ms`);
        },
        error: (err) => {
          const status = err?.status ?? err?.statusCode ?? 500;
          this.logger.warn(`${method} ${originalUrl} ${status} ${Date.now() - start}ms`);
        },
      }),
    );
  }
}
