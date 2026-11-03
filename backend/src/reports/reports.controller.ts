import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('my-stats')
  @Roles(Role.STUDENT)
  async getMyStats(@CurrentUser('studentId') studentId: string) {
    return this.reportsService.getStudentAttendanceStats(studentId);
  }

  @Get('guider')
  @Roles(Role.STUDENT)
  async getMyAttendanceGuider(
    @CurrentUser('studentId') studentId: string,
    @Query('target') target?: string,
  ) {
    const targetPct = target ? parseFloat(target) : 75.0;
    return this.reportsService.getStudentAttendanceGuider(
      studentId,
      isNaN(targetPct) ? 75.0 : targetPct,
    );
  }

  @Get('student/:studentId/guider')
  @Roles(Role.TEACHER, Role.ADMIN)
  async getStudentAttendanceGuider(
    @Param('studentId') studentId: string,
    @Query('target') target?: string,
  ) {
    const targetPct = target ? parseFloat(target) : 75.0;
    return this.reportsService.getStudentAttendanceGuider(
      studentId,
      isNaN(targetPct) ? 75.0 : targetPct,
    );
  }

  @Get('student/:studentId')
  @Roles(Role.TEACHER, Role.ADMIN)
  async getStudentStats(@Param('studentId') studentId: string) {
    return this.reportsService.getStudentAttendanceStats(studentId);
  }

  @Get('subject/:subjectId/section/:sectionId')
  @Roles(Role.TEACHER, Role.ADMIN)
  async getSubjectReport(
    @Param('subjectId') subjectId: string,
    @Param('sectionId') sectionId: string,
  ) {
    return this.reportsService.getSubjectAttendanceReport(subjectId, sectionId);
  }

  @Get('compliance')
  @Roles(Role.TEACHER, Role.ADMIN)
  async getDepartmentCompliance(@Query('departmentId') departmentId?: string) {
    return this.reportsService.getDepartmentComplianceReport(departmentId);
  }

  @Get('export/csv')
  @Roles(Role.TEACHER, Role.ADMIN)
  async exportComplianceCsv(
    @Res() res: Response,
    @Query('departmentId') departmentId?: string,
  ) {
    const csvData = await this.reportsService.exportComplianceCsv(departmentId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="attendance_compliance_report.csv"');
    return res.send(csvData);
  }

  @Get('export/shortage/csv')
  @Roles(Role.TEACHER, Role.ADMIN)
  async exportShortageCsv(
    @Res() res: Response,
    @Query('departmentId') departmentId?: string,
  ) {
    const csvData = await this.reportsService.exportShortageCsv(departmentId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="critical_shortage_attendance_report.csv"');
    return res.send(csvData);
  }
}
