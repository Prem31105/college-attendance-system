import { Controller, Post, Body, Get, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AttendanceService, SubmitAttendanceDto, ManualMarkAttendanceDto } from './attendance.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Post('submit')
  @Roles(Role.STUDENT)
  @HttpCode(HttpStatus.OK)
  async submitAttendance(
    @CurrentUser('studentId') studentId: string,
    @Body() dto: SubmitAttendanceDto,
  ) {
    return this.attendanceService.submitAttendance(studentId, dto);
  }

  @Get('session/:sessionId/live')
  @Roles(Role.TEACHER, Role.ADMIN)
  async getLiveAttendance(@Param('sessionId') sessionId: string) {
    return this.attendanceService.getLiveAttendance(sessionId);
  }

  @Post('manual-mark')
  @Roles(Role.TEACHER)
  @HttpCode(HttpStatus.OK)
  async manualMark(
    @CurrentUser('teacherId') teacherId: string,
    @Body() dto: ManualMarkAttendanceDto,
  ) {
    return this.attendanceService.manualMark(teacherId, dto);
  }
}
