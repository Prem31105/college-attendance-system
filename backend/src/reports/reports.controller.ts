import { Controller, Get, Param, UseGuards } from '@nestjs/common';
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
