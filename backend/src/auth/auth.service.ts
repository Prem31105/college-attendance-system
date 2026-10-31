import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RefreshTokenDto } from './dto/login.dto';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email.toLowerCase() },
      include: {
        student: {
          include: {
            department: true,
            section: true,
          },
        },
        teacher: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await argon2.verify(user.passwordHash, loginDto.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        studentId: user.student?.id,
        rollNumber: user.student?.rollNumber,
        teacherId: user.teacher?.id,
        employeeId: user.teacher?.employeeId,
      },
      ...tokens,
    };
  }

  async refreshToken(dto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'dev_jwt_refresh_secret_for_docker_testing_only_change_in_prod_64char_string',
      });

      const tokenHash = crypto.createHash('sha256').update(dto.refreshToken).digest('hex');

      const existingToken = await this.prisma.refreshToken.findUnique({
        where: { tokenHash },
      });

      if (!existingToken || existingToken.isRevoked || existingToken.expiresAt < new Date()) {
        // Potential reuse attack detected: Revoke all tokens for this user
        if (existingToken) {
          await this.prisma.refreshToken.updateMany({
            where: { userId: existingToken.userId },
            data: { isRevoked: true },
          });
        }
        throw new UnauthorizedException('Refresh token is invalid, revoked, or expired');
      }

      // Rotate: Revoke the old token
      await this.prisma.refreshToken.update({
        where: { id: existingToken.id },
        data: { isRevoked: true },
      });

      // Generate a new token pair
      const tokens = await this.generateTokens(payload.sub, payload.email, payload.role);

      return tokens;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash },
        data: { isRevoked: true },
      });
    } else {
      await this.prisma.refreshToken.updateMany({
        where: { userId },
        data: { isRevoked: true },
      });
    }
    return { success: true, message: 'Logged out successfully' };
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessSecret = process.env.JWT_ACCESS_SECRET || 'dev_jwt_access_secret_for_docker_testing_only_change_in_prod_64char_string';
    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'dev_jwt_refresh_secret_for_docker_testing_only_change_in_prod_64char_string';

    const accessToken = this.jwtService.sign(payload, {
      secret: accessSecret,
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: '7d',
    });

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes
    };
  }
}
