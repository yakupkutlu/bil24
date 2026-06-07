import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard, Roles } from '../auth/auth.module';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
export class UsersController {
  constructor(private svc: UsersService) {}

  @Get()
  findAll(@Query() q: any) { return this.svc.findAll(q); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @Post()
  create(@Body() dto: any) { return this.svc.create(dto); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any) { return this.svc.update(id, dto); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.svc.remove(id); }
}
