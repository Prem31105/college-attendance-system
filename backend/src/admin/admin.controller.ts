import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('analytics')
  async getAnalytics() {
    return this.adminService.getDashboardAnalytics();
  }

  @Get('suspicious')
  async getSuspiciousIncidents() {
    return this.adminService.getSuspiciousIncidents();
  }

  @Post('resolve-suspicious/:recordId')
  async resolveSuspicious(
    @Param('recordId') recordId: string,
    @CurrentUser('id') adminId: string,
    @Body() body: { resolution: 'VERIFIED' | 'REJECTED'; note: string },
  ) {
    return this.adminService.resolveSuspiciousRecord(recordId, adminId, body.resolution, body.note);
  }

  @Get('classrooms')
  async getClassrooms() {
    return this.adminService.getAllClassrooms();
  }

  @Post('classrooms')
  async createClassroom(
    @Body() body: { name: string; building: string; latitude: number; longitude: number; geofenceRadiusMeters?: number },
  ) {
    return this.adminService.createClassroom(body);
  }

  @Patch('classrooms/:id')
  async updateClassroom(
    @Param('id') id: string,
    @Body() body: { name?: string; building?: string; latitude?: number; longitude?: number; geofenceRadiusMeters?: number },
  ) {
    return this.adminService.updateClassroom(id, body);
  }

  @Delete('classrooms/:id')
  async deleteClassroom(@Param('id') id: string) {
    return this.adminService.deleteClassroom(id);
  }

  @Get('audit-logs')
  async getAuditLogs() {
    return this.adminService.getAuditLogs();
  }
}
