import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email-service.interface';

@Injectable()
export class SmtpEmailService implements EmailService {
  private readonly logger = new Logger(SmtpEmailService.name);
  private readonly host: string;
  private readonly port: number;
  private readonly user: string;
  private readonly pass: string;
  private readonly from: string;

  constructor(private configService: ConfigService) {
    this.host = this.configService.get<string>('SMTP_HOST') || 'localhost';
    this.port = Number(this.configService.get<string>('SMTP_PORT')) || 1025;
    this.user = this.configService.get<string>('SMTP_USER') || '';
    this.pass = this.configService.get<string>('SMTP_PASS') || '';
    this.from = this.configService.get<string>('SMTP_FROM') || 'noreply@educonnect.local';
  }

  async sendMail(to: string, subject: string, body: string): Promise<void> {
    this.logger.log(`Sending email to ${to}: ${subject}`);
    // TODO: Implement actual Nodemailer send
    // const transporter = nodemailer.createTransport({ host, port, auth: { user, pass } });
    // await transporter.sendMail({ from: this.from, to, subject, html: body });
  }
}
