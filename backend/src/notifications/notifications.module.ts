import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsGateway } from '../gateway/events.gateway';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, EventsGateway],
  exports: [NotificationsService],
})
export class NotificationsModule {}
