import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EventsGateway } from './gateway/events.gateway';
import { QrService } from './qr/qr.service';
import { QrController } from './qr/qr.controller';
import { GpsService } from './gps/gps.service';
import { DevicesService } from './devices/devices.service';
import { DevicesController } from './devices/devices.controller';
import { RiskService } from './risk/risk.service';
import { AttendanceSessionsService } from './attendance-sessions/attendance-sessions.service';
import { AttendanceSessionsController } from './attendance-sessions/attendance-sessions.controller';
import { AttendanceService } from './attendance/attendance.service';
import { AttendanceController } from './attendance/attendance.controller';
import { RandomVerificationService } from './random-verification/random-verification.service';
import { ReportsService } from './reports/reports.service';
import { ReportsController } from './reports/reports.controller';
import { AdminService } from './admin/admin.service';
import { AdminController } from './admin/admin.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [
    AttendanceController,
    AttendanceSessionsController,
    QrController,
    DevicesController,
    ReportsController,
    AdminController,
  ],
  providers: [
    EventsGateway,
    QrService,
    GpsService,
    DevicesService,
    RiskService,
    AttendanceSessionsService,
    AttendanceService,
    RandomVerificationService,
    ReportsService,
    AdminService,
  ],
})
export class AppModule {}
