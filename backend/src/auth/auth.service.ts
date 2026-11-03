import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RefreshTokenDto } from './dto/login.dto';
import { RegisterStudentDto } from './dto/register.dto';
import { Role, OsType, DeviceStatus } from '@prisma/client';
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

  async registerStudent(dto: RegisterStudentDto) {
    const email = dto.email.trim().toLowerCase();
    const rollNumber = dto.rollNumber.trim().toUpperCase();

    // Institutional email validation
    if (!email.endsWith('@college.edu')) {
      throw new BadRequestException('Registration restricted to @college.edu institutional email addresses');
    }

    // Roll number format validation
    const rollRegex = /^[A-Z]{2,4}[0-9]{4}-[0-9]{3,4}$/;
    if (!rollRegex.test(rollNumber)) {
      throw new BadRequestException('Roll number must match format like CS2026-001');
    }

    // Public key PEM check
    if (!dto.publicKeyPem.includes('BEGIN PUBLIC KEY') || !dto.publicKeyPem.includes('END PUBLIC KEY')) {
      throw new BadRequestException('Invalid Public Key format. Must be a valid PEM encoded ECDSA public key');
    }

    // Check if roll number is already in use by another student
    const existingStudent = await this.prisma.student.findUnique({
      where: { rollNumber },
      include: { user: true },
    });

    // Default academic anchors
    const department = (await this.prisma.department.findFirst()) || { id: 'dept-01' };
    const semester = (await this.prisma.semester.findFirst()) || { id: 'sem-01' };
    const section = (await this.prisma.classSection.findFirst()) || { id: 'sec-01' };

    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });

    let userId: string;
    let studentId: string;

    if (existingStudent) {
      if (existingStudent.user.email !== email) {
        throw new BadRequestException(`Roll number ${rollNumber} is already registered under a different email`);
      }
      // Activate existing account
      userId = existingStudent.userId;
      studentId = existingStudent.id;
      await this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash, isActive: true },
      });
    } else {
      // Check email uniqueness
      const existingUser = await this.prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        userId = existingUser.id;
        await this.prisma.user.update({
          where: { id: userId },
          data: { passwordHash, isActive: true },
        });

        const createdStudent = await this.prisma.student.create({
          data: {
            userId,
            rollNumber,
            registrationNumber: dto.registrationNumber.trim(),
            departmentId: department.id,
            semesterId: semester.id,
            sectionId: section.id,
          },
        });
        studentId = createdStudent.id;
      } else {
        // Create full user & student record
        const createdUser = await this.prisma.user.create({
          data: {
            email,
            passwordHash,
            firstName: dto.firstName || 'Student',
            lastName: dto.lastName || rollNumber,
            role: Role.STUDENT,
            isActive: true,
          },
        });
        userId = createdUser.id;

        const createdStudent = await this.prisma.student.create({
          data: {
            userId,
            rollNumber,
            registrationNumber: dto.registrationNumber.trim(),
            departmentId: department.id,
            semesterId: semester.id,
            sectionId: section.id,
          },
        });
        studentId = createdStudent.id;
      }
    }

    // Register or update primary device
    await this.prisma.registeredDevice.updateMany({
      where: { studentId, status: DeviceStatus.ACTIVE },
      data: { status: DeviceStatus.REVOKED },
    });

    const registeredDevice = await this.prisma.registeredDevice.create({
      data: {
        studentId,
        deviceFingerprint: dto.deviceFingerprint || `fp_${Date.now()}`,
        publicKeyPem: dto.publicKeyPem,
        deviceModel: dto.deviceModel || 'Pixel 6',
        osType: dto.osType || OsType.ANDROID,
        osVersion: dto.osVersion || 'Android 14',
        status: DeviceStatus.ACTIVE,
      },
    });

    const tokens = await this.generateTokens(userId, email, Role.STUDENT);

    return {
      message: 'Student account activated and primary hardware device bound successfully',
      user: {
        id: userId,
        email,
        rollNumber,
        studentId,
        role: Role.STUDENT,
        deviceId: registeredDevice.id,
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

      if (!existingToken) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      // Replay Attack Detection: If token was already revoked, a token reuse attempt is occurring.
      // Invalidate ALL active refresh tokens for this user immediately and record a security audit entry.
      if (existingToken.isRevoked) {
        await this.prisma.refreshToken.updateMany({
          where: { userId: existingToken.userId },
          data: { isRevoked: true },
        });

        await this.prisma.attendanceAuditLog.create({
          data: {
            action: 'SECURITY_ALERT_REFRESH_TOKEN_REUSE',
            entityName: 'RefreshToken',
            entityId: existingToken.id,
            actorId: existingToken.userId,
            oldValue: 'REVOKED_TOKEN_REPRESENTED',
            newValue: 'ALL_USER_SESSIONS_INVALIDATED',
          },
        });

        throw new UnauthorizedException('Security alert: Refresh token reuse detected. All active sessions revoked.');
      }

      if (existingToken.expiresAt < new Date()) {
        throw new UnauthorizedException('Refresh token has expired');
      }

      // Token rotation: revoke previous refresh token atomically
      await this.prisma.refreshToken.update({
        where: { id: existingToken.id },
        data: { isRevoked: true },
      });

      const tokens = await this.generateTokens(payload.sub, payload.email, payload.role);

      return tokens;
    } catch (err: any) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
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
    const jti = crypto.randomBytes(16).toString('hex');
    const payload = { sub: userId, email, role, jti };

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
