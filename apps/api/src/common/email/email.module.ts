import { Module } from '@nestjs/common';
import { SmtpEmailService } from './smtp-email.service';

export const EMAIL_SERVICE = Symbol('EMAIL_SERVICE');

@Module({
  providers: [
    {
      provide: EMAIL_SERVICE,
      useClass: SmtpEmailService,
    },
  ],
  exports: [EMAIL_SERVICE],
})
export class EmailModule {}
