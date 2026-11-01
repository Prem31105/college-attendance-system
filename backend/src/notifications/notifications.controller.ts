import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { QueryNotificationsDto } from './dto/query-notifications.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Retrieves paginated notifications for the current authenticated user
   */
  @Get()
  async getNotifications(
    @CurrentUser('id') userId: string,
    @Query() query: QueryNotificationsDto,
  ) {
    return this.notificationsService.getUserNotifications(userId, query);
  }

  /**
   * Retrieves unread notification count for badge rendering
   */
  @Get('unread-count')
  async getUnreadCount(@CurrentUser('id') userId: string) {
    return this.notificationsService.getUnreadCount(userId);
  }

  /**
   * Retrieves detail of a single notification and marks it as read
   */
  @Get(':id')
  async getNotificationDetail(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.getNotificationDetail(id, userId);
  }

  /**
   * Marks a single notification as read
   */
  @Patch(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.markAsRead(id, userId);
  }

  /**
   * Marks all unread notifications for the user as read
   */
  @Post('mark-all-read')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  /**
   * Dispatches role-authorized announcement (TEACHER or ADMIN only)
   */
  @Post('announce')
  @Roles(Role.TEACHER, Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createAnnouncement(
    @CurrentUser() user: any,
    @Body() dto: CreateAnnouncementDto,
  ) {
    return this.notificationsService.createAnnouncement(user, dto);
  }
}
