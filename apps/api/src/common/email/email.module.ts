import { Module } from '@nestjs/common';
import { SmtpEmailService } from './smtp-email.service';

export const EMAIL_SERVICE = Symbol('EMAIL_SERVICE');

/** EmailModule — cung cấp EMAIL_SERVICE (SMTP) để inject nơi cần gửi mail. */
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
