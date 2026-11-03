import { Controller, Post, Get, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { RandomVerificationService } from './random-verification.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, RandomVerificationStatus } from '@prisma/client';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class RandomVerificationController {
  constructor(private randomVerificationService: RandomVerificationService) {}

  @Post('sessions/:sessionId/random-verification/trigger')
  @Roles(Role.TEACHER)
  @HttpCode(HttpStatus.OK)
  async triggerChallenge(
    @Param('sessionId') sessionId: string,
    @CurrentUser('teacherId') teacherId: string,
    @Body('sampleCount') sampleCount?: number,
  ) {
    return this.randomVerificationService.triggerRandomVerification(
      sessionId,
      teacherId,
      sampleCount || 3,
    );
  }

  @Post('random-verification/:challengeId/outcome')
  @Roles(Role.TEACHER)
  @HttpCode(HttpStatus.OK)
  async recordOutcome(
    @Param('challengeId') challengeId: string,
    @CurrentUser('teacherId') teacherId: string,
    @Body() body: { status: RandomVerificationStatus; notes?: string },
  ) {
    return this.randomVerificationService.recordOutcome(
      challengeId,
      teacherId,
      body.status,
      body.notes,
    );
  }

  @Get('sessions/:sessionId/random-verification')
  @Roles(Role.TEACHER, Role.ADMIN)
  async getSessionChallenges(@Param('sessionId') sessionId: string) {
    return this.randomVerificationService.getSessionChallenges(sessionId);
  }
}
