import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from '../common/entities/all.entities';
import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard, Roles } from '../auth/auth.module';

@Injectable()
export class SettingsService {
  constructor(@InjectRepository(SystemSetting) private repo: Repository<SystemSetting>) {}

  private async getMap(): Promise<Record<string, string>> {
    const rows = await this.repo.find();
    return rows.reduce((acc, r) => { acc[r.key] = r.value; return acc; }, {} as Record<string, string>);
  }

  async getAll() {
    const map = await this.getMap();
    return {
      site_name: map['site_name'] ?? 'Bilet Sistemi',
      vat_rate: parseFloat(map['vat_rate'] ?? '18'),
      commission_rate: parseFloat(map['commission_rate'] ?? '5'),
      currency: map['currency'] ?? 'TRY',
      smtp_host: map['smtp_host'] ?? '',
      smtp_port: parseInt(map['smtp_port'] ?? '587'),
      smtp_user: map['smtp_user'] ?? '',
      smtp_pass: '', // never expose
      smtp_from: map['smtp_from'] ?? '',
      sms_provider: map['sms_provider'] ?? '',
      sms_api_key: '', // never expose
      sms_sender: map['sms_sender'] ?? '',
      send_ticket_email: map['send_ticket_email'] === 'true',
      send_ticket_sms: map['send_ticket_sms'] === 'true',
      send_reminder_email: map['send_reminder_email'] === 'true',
      send_reminder_hours: parseInt(map['send_reminder_hours'] ?? '24'),
      ticket_logo_url: map['ticket_logo_url'] ?? '',
      ticket_primary_color: map['ticket_primary_color'] ?? '#6366f1',
      qr_expires_hours: parseInt(map['qr_expires_hours'] ?? '0'),
    };
  }

  async getFullSettings(): Promise<Record<string, string>> {
    return this.getMap();
  }

  async update(dto: Record<string, any>) {
    for (const [key, value] of Object.entries(dto)) {
      if (value === '' || value === undefined || value === null) continue;
      if (key === 'smtp_pass' || key === 'sms_api_key') {
        if (!value) continue; // don't wipe with empty
      }
      let row = await this.repo.findOne({ where: { key } });
      if (!row) row = this.repo.create({ key, value: String(value) });
      else row.value = String(value);
      await this.repo.save(row);
    }
    return this.getAll();
  }
}

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
export class SettingsController {
  constructor(private svc: SettingsService) {}
  @Get() getAll() { return this.svc.getAll(); }
  @Patch() update(@Body() dto: any) { return this.svc.update(dto); }
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
@Module({
  imports: [TypeOrmModule.forFeature([SystemSetting])],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
