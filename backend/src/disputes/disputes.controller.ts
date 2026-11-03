import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DisputesService } from './disputes.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, DisputeStatus } from '@prisma/client';
import {
  CreateDisputeDto,
  SendDisputeMessageDto,
  ResolveDisputeDto,
  RejectDisputeDto,
} from './dto/dispute.dto';

@Controller('disputes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DisputesController {
  constructor(private disputesService: DisputesService) {}

  @Post()
  @Roles(Role.STUDENT)
  @HttpCode(HttpStatus.CREATED)
  async createDispute(
    @CurrentUser('studentId') studentId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateDisputeDto,
  ) {
    return this.disputesService.createDispute(studentId, userId, dto);
  }

  @Get('student')
  @Roles(Role.STUDENT)
  async getStudentDisputes(@CurrentUser('studentId') studentId: string) {
    return this.disputesService.getStudentDisputes(studentId);
  }

  @Get('teacher')
  @Roles(Role.TEACHER, Role.ADMIN)
  async getTeacherDisputes(
    @CurrentUser('teacherId') teacherId: string,
    @CurrentUser('role') role: string,
    @Query('status') status?: DisputeStatus,
  ) {
    const isAdmin = role === Role.ADMIN;
    return this.disputesService.getTeacherDisputes(teacherId, status, isAdmin);
  }

  @Get(':id')
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN)
  async getDisputeById(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.disputesService.getDisputeById(id, userId, role);
  }

  @Post(':id/messages')
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: SendDisputeMessageDto,
  ) {
    return this.disputesService.sendMessage(id, userId, role, dto.message);
  }

  @Patch(':id/status')
  @Roles(Role.TEACHER, Role.ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('status') status: DisputeStatus,
  ) {
    return this.disputesService.updateStatus(id, userId, status);
  }

  @Post(':id/approve')
  @Roles(Role.TEACHER, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async approveDispute(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ResolveDisputeDto,
  ) {
    return this.disputesService.approveDispute(id, userId, dto?.resolutionNote);
  }

  @Post(':id/reject')
  @Roles(Role.TEACHER, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async rejectDispute(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: RejectDisputeDto,
  ) {
    return this.disputesService.rejectDispute(id, userId, dto.rejectionReason);
  }
}
