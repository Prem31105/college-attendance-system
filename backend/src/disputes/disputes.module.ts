import { Module } from '@nestjs/common';
import { DisputesController } from './disputes.controller';
import { DisputesService } from './disputes.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EventsGateway } from '../gateway/events.gateway';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [DisputesController],
  providers: [DisputesService, EventsGateway],
  exports: [DisputesService],
})
export class DisputesModule {}
