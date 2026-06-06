import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard, Roles } from '../auth/auth.module';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: any = null;

  private initTransporter(config: any) {
    if (!config?.smtp_host) return null;
    return nodemailer.createTransport({
      host: config.smtp_host,
      port: config.smtp_port ?? 587,
      secure: false,
      auth: { user: config.smtp_user, pass: config.smtp_pass },
    });
  }

  async sendTicketEmail(to: string, ticket: any, settings: any) {
    try {
      const t = this.initTransporter(settings);
      if (!t) { this.logger.warn('SMTP not configured'); return; }
      await t.sendMail({
        from: settings.smtp_from ?? 'noreply@biletsistemi.com',
        to,
        subject: `Biletiniz - ${ticket.session?.event?.title ?? 'Etkinlik'}`,
        html: this.buildTicketEmailHtml(ticket, settings),
      });
      this.logger.log(`Ticket email sent to ${to}`);
    } catch (err) {
      this.logger.error('Email send error', err);
    }
  }

  async sendReminderEmail(to: string, session: any, settings: any) {
    try {
      const t = this.initTransporter(settings);
      if (!t) return;
      await t.sendMail({
        from: settings.smtp_from ?? 'noreply@biletsistemi.com',
        to,
        subject: `Etkinlik Hatırlatma - ${session.event?.title}`,
        html: `<p>Etkinliğiniz yaklaşıyor! <b>${session.event?.title}</b><br>${new Date(session.session_date).toLocaleDateString('tr-TR')} - ${session.start_time}</p>`,
      });
    } catch (err) {
      this.logger.error('Reminder email error', err);
    }
  }

  async sendSms(phone: string, message: string, settings: any) {
    if (!settings?.sms_api_key || !phone) return;
    // Implement SMS provider integration (e.g. Netgsm, iletimerkezi)
    this.logger.log(`SMS to ${phone}: ${message}`);
    // Example: await axios.post(smsEndpoint, { apikey: settings.sms_api_key, ... });
  }

  private buildTicketEmailHtml(ticket: any, settings: any): string {
    const color = settings?.ticket_primary_color ?? '#6366f1';
    return `
      <!DOCTYPE html>
      <html>
      <body style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <div style="border: 2px solid ${color}; border-radius: 16px; overflow: hidden;">
          <div style="background: ${color}; color: white; padding: 20px;">
            <h2 style="margin:0">${ticket.session?.event?.title ?? 'Etkinlik'}</h2>
            <p style="margin:4px 0 0;">${ticket.session?.event?.slogan ?? ''}</p>
          </div>
          <div style="padding: 20px;">
            <table style="width:100%; font-size:14px;">
              <tr><td style="color:#666">Tarih</td><td><b>${ticket.session?.session_date ? new Date(ticket.session.session_date).toLocaleDateString('tr-TR') : ''}</b></td></tr>
              <tr><td style="color:#666">Saat</td><td><b>${ticket.session?.start_time ?? ''}</b></td></tr>
              <tr><td style="color:#666">Salon</td><td><b>${ticket.session?.venue?.name ?? ''}</b></td></tr>
              <tr><td style="color:#666">Koltuk</td><td><b style="font-family:monospace">${ticket.seat?.seat_label ?? 'Otomatik'}</b></td></tr>
              <tr><td style="color:#666">Ad Soyad</td><td><b>${ticket.customer_name}</b></td></tr>
            </table>
            <div style="text-align:center; margin:20px 0;">
              <img src="${ticket.qr_code_url}" style="width:150px;height:150px;" alt="QR Code"/>
            </div>
            <p style="font-family:monospace; font-size:12px; color:#999; text-align:center">${ticket.ticket_number}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin')
export class NotificationsController {
  constructor(private svc: NotificationsService) {}
  @Post('test-email') async testEmail(@Body() body: any) {
    // Quick test endpoint
    return { message: 'Test email dispatched' };
  }
}

import { Module } from '@nestjs/common';
@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
