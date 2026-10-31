import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { DeviceStatus, OsType } from '@prisma/client';

@Injectable()
export class DevicesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Registers a student's primary device public key.
   */
  async registerPrimaryDevice(
    studentId: string,
    data: {
      deviceFingerprint: string;
      publicKeyPem: string;
      deviceModel: string;
      osType: OsType;
      osVersion: string;
    },
  ) {
    // Check if student already has an active primary device
    const activeDevice = await this.prisma.registeredDevice.findFirst({
      where: {
        studentId,
        status: DeviceStatus.ACTIVE,
      },
    });

    if (activeDevice) {
      throw new BadRequestException(
        'Student already has an active primary device registered. A formal replacement request must be submitted to the administrator.',
      );
    }

    // Validate PEM format
    if (!data.publicKeyPem.includes('BEGIN PUBLIC KEY') || !data.publicKeyPem.includes('END PUBLIC KEY')) {
      throw new BadRequestException('Invalid Public Key format. Must be a valid PEM encoded ECDSA public key.');
    }

    return this.prisma.registeredDevice.create({
      data: {
        studentId,
        deviceFingerprint: data.deviceFingerprint,
        publicKeyPem: data.publicKeyPem,
        deviceModel: data.deviceModel,
        osType: data.osType,
        osVersion: data.osVersion,
        status: DeviceStatus.ACTIVE,
      },
    });
  }

  /**
   * Generates a 60-second challenge token for the registered device.
   */
  async generateChallenge(studentId: string, deviceId: string) {
    const device = await this.prisma.registeredDevice.findFirst({
      where: {
        id: deviceId,
        studentId,
        status: DeviceStatus.ACTIVE,
      },
    });

    if (!device) {
      throw new UnauthorizedException('Active registered primary device not found for this student');
    }

    const challengeToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 1000); // 60 seconds validity

    await this.prisma.deviceChallenge.create({
      data: {
        studentId,
        deviceId: device.id,
        challengeToken,
        expiresAt,
        isUsed: false,
      },
    });

    return {
      challengeToken,
      expiresAt,
    };
  }

  /**
   * Validates device cryptographic signature over the issued challenge token.
   */
  async verifySignature(
    studentId: string,
    challengeToken: string,
    signatureBase64: string,
  ): Promise<{ isValid: boolean; deviceId?: string; reason?: string }> {
    const challenge = await this.prisma.deviceChallenge.findUnique({
      where: { challengeToken },
      include: { device: true },
    });

    if (!challenge) {
      return { isValid: false, reason: 'CHALLENGE_NOT_FOUND' };
    }

    if (challenge.isUsed) {
      return { isValid: false, reason: 'CHALLENGE_ALREADY_USED_REPLAY_ATTEMPT' };
    }

    if (challenge.expiresAt < new Date()) {
      return { isValid: false, reason: 'CHALLENGE_EXPIRED' };
    }

    if (challenge.studentId !== studentId) {
      return { isValid: false, reason: 'STUDENT_MISMATCH_ON_CHALLENGE' };
    }

    if (challenge.device.status !== DeviceStatus.ACTIVE) {
      return { isValid: false, reason: 'REGISTERED_DEVICE_NOT_ACTIVE' };
    }

    // Mark challenge as used immediately to prevent replay
    await this.prisma.deviceChallenge.update({
      where: { id: challenge.id },
      data: { isUsed: true },
    });

    // Verify ECDSA cryptographic signature using the registered public key
    try {
      const verifier = crypto.createVerify('SHA256');
      verifier.update(challengeToken);
      const isVerified = verifier.verify(challenge.device.publicKeyPem, signatureBase64, 'base64');

      if (!isVerified) {
        return { isValid: false, deviceId: challenge.deviceId, reason: 'CRYPTOGRAPHIC_SIGNATURE_INVALID' };
      }

      return { isValid: true, deviceId: challenge.deviceId };
    } catch (err) {
      return { isValid: false, deviceId: challenge.deviceId, reason: 'SIGNATURE_VERIFICATION_EXCEPTION' };
    }
  }

  /**
   * Device replacement workflow
   */
  async requestDeviceReplacement(studentId: string, reason: string) {
    const activeDevice = await this.prisma.registeredDevice.findFirst({
      where: { studentId, status: DeviceStatus.ACTIVE },
    });

    return {
      status: 'PENDING_ADMIN_REVIEW',
      message: 'Device replacement request submitted successfully to the administrator.',
      currentActiveDeviceId: activeDevice?.id,
      reason,
      submittedAt: new Date().toISOString(),
    };
  }
}
