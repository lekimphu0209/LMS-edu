/** Contract gửi email — inject qua token EMAIL_SERVICE của EmailModule. */
export interface EmailService {
  sendMail(to: string, subject: string, body: string): Promise<void>;
}
