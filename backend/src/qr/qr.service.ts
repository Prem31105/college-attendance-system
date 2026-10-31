import { Injectable, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export interface QrTokenPayload {
  sid: string; // Session ID
  sub: string; // Subject ID
  iat: number; // Issued at (Unix epoch seconds)
  exp: number; // Expires at (Unix epoch seconds)
  non: string; // Cryptographic nonce (64-char hex)
  sig: string; // HMAC-SHA256 signature
}

@Injectable()
export class QrService {
  private readonly secret: string;
  private readonly refreshIntervalSeconds = 15;
  private readonly tokenValiditySeconds = 30;

  constructor(private prisma: PrismaService) {
    this.secret = process.env.QR_HMAC_SECRET || 'dev_qr_hmac_secret_for_docker_testing_only_change_in_prod_64char_string';
  }

  /**
   * Generates a signed dynamic QR token for a live attendance session.
   * Can be scanned by ALL students concurrently while valid.
   */
  async generateDynamicToken(sessionId: string, subjectId: string): Promise<QrTokenPayload> {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const expiresSeconds = nowSeconds + this.tokenValiditySeconds;
    const nonce = crypto.randomBytes(32).toString('hex');

    const signature = this.calculateSignature(sessionId, subjectId, nowSeconds, expiresSeconds, nonce);

    // Persist token record in database for audit & verification
    await this.prisma.qrToken.create({
      data: {
        sessionId,
        nonce,
        signature,
        issuedAt: new Date(nowSeconds * 1000),
        expiresAt: new Date(expiresSeconds * 1000),
        isActive: true,
      },
    });

    return {
      sid: sessionId,
      sub: subjectId,
      iat: nowSeconds,
      exp: expiresSeconds,
      non: nonce,
      sig: signature,
    };
  }

  /**
   * Validates dynamic QR token integrity, freshness, and cryptographic signature.
   */
  async validateToken(payload: QrTokenPayload): Promise<{ isValid: boolean; reason?: string }> {
    if (!payload.sid || !payload.sub || !payload.iat || !payload.exp || !payload.non || !payload.sig) {
      return { isValid: false, reason: 'MALFORMED_QR_TOKEN_PAYLOAD' };
    }

    const nowSeconds = Math.floor(Date.now() / 1000);

    // 1. Freshness check: Expired token
    if (nowSeconds > payload.exp) {
      return { isValid: false, reason: 'QR_TOKEN_EXPIRED' };
    }

    // 2. Future clock-skew protection (allow max 5 seconds)
    if (payload.iat > nowSeconds + 5) {
      return { isValid: false, reason: 'QR_TOKEN_FUTURE_TIMESTAMP' };
    }

    // 3. Cryptographic HMAC signature verification
    const expectedSig = this.calculateSignature(payload.sid, payload.sub, payload.iat, payload.exp, payload.non);
    const isSigValid = crypto.timingSafeEqual(
      Buffer.from(payload.sig, 'hex'),
      Buffer.from(expectedSig, 'hex'),
    );

    if (!isSigValid) {
      return { isValid: false, reason: 'INVALID_QR_SIGNATURE' };
    }

    // 4. Verify nonce exists in database for this session
    const dbToken = await this.prisma.qrToken.findUnique({
      where: { nonce: payload.non },
    });

    if (!dbToken || dbToken.sessionId !== payload.sid || !dbToken.isActive) {
      return { isValid: false, reason: 'UNKNOWN_OR_REVOKED_QR_NONCE' };
    }

    return { isValid: true };
  }

  private calculateSignature(sessionId: string, subjectId: string, iat: number, exp: number, nonce: string): string {
    const dataToSign = `${sessionId}:${subjectId}:${iat}:${exp}:${nonce}`;
    return crypto.createHmac('sha256', this.secret).update(dataToSign).digest('hex');
  }
}
