import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
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
}
