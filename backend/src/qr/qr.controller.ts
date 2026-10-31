import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { QrService } from './qr.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Controller('qr')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QrController {
  constructor(
    private qrService: QrService,
    private prisma: PrismaService,
  ) {}

  @Get('session/:sessionId/refresh')
  @Roles(Role.TEACHER)
  async refreshSessionQr(@Param('sessionId') sessionId: string) {
    const session = await this.prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.status !== 'ACTIVE') {
      return { active: false, message: 'Session is not active' };
    }

    const token = await this.qrService.generateDynamicToken(sessionId, session.subjectId);
    return token;
  }
}
