import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, OsType } from '@prisma/client';

@Controller('devices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DevicesController {
  constructor(private devicesService: DevicesService) {}

  @Post('register')
  @Roles(Role.STUDENT)
  @HttpCode(HttpStatus.CREATED)
  async registerDevice(
    @CurrentUser('studentId') studentId: string,
    @Body()
    body: {
      deviceFingerprint: string;
      publicKeyPem: string;
      deviceModel: string;
      osType: OsType;
      osVersion: string;
    },
  ) {
    return this.devicesService.registerPrimaryDevice(studentId, body);
  }

  @Post('challenge')
  @Roles(Role.STUDENT)
  @HttpCode(HttpStatus.OK)
  async getChallenge(
    @CurrentUser('studentId') studentId: string,
    @Body('deviceId') deviceId: string,
  ) {
    return this.devicesService.generateChallenge(studentId, deviceId);
  }

  @Post('replacement-request')
  @Roles(Role.STUDENT)
  @HttpCode(HttpStatus.OK)
  async requestReplacement(
    @CurrentUser('studentId') studentId: string,
    @Body('reason') reason: string,
  ) {
    return this.devicesService.requestDeviceReplacement(studentId, reason);
  }
}
