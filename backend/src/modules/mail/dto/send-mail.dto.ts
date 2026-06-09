export interface SendMailDto {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}
