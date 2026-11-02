import { Controller, Post, Body, Get, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AttendanceSessionsService } from './attendance-sessions.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceSessionsController {
  constructor(private sessionsService: AttendanceSessionsService) {}

  @Post('start')
  @Roles(Role.TEACHER)
  @HttpCode(HttpStatus.CREATED)
  async startSession(
    @CurrentUser('teacherId') teacherId: string,
    @Body() body: { subjectId: string; sectionId: string; classroomId: string },
  ) {
    return this.sessionsService.startSession(teacherId, body.subjectId, body.sectionId, body.classroomId);
  }

  @Post(':sessionId/close')
  @Roles(Role.TEACHER)
  @HttpCode(HttpStatus.OK)
  async closeSession(
    @Param('sessionId') sessionId: string,
    @CurrentUser('teacherId') teacherId: string,
  ) {
    return this.sessionsService.closeSession(sessionId, teacherId);
  }

  @Get('classrooms/all')
  @Roles(Role.TEACHER, Role.ADMIN, Role.STUDENT)
  async getClassrooms() {
    return this.sessionsService.getAllClassrooms();
  }

  @Get(':sessionId')
  @Roles(Role.TEACHER, Role.ADMIN, Role.STUDENT)
  async getSessionDetails(@Param('sessionId') sessionId: string) {
    return this.sessionsService.getSessionDetails(sessionId);
  }
}
