import { Injectable } from '@nestjs/common';
import { AttendanceStatus } from '@prisma/client';

export interface RiskEvaluationFactors {
  qrValid: boolean;
  qrExpired: boolean;
  gpsValid: boolean;
  distanceMeters: number;
  gpsAccuracy: number;
  isMockLocation: boolean;
  deviceSignatureValid: boolean;
  integrityPassed: boolean;
  biometricConfirmed?: boolean;
}

export interface RiskEvaluationResult {
  status: AttendanceStatus;
  riskScore: number; // 0.0 (safest) to 1.0 (fraudulent)
  reasonCode: string;
  verificationLayerMask: number;
  factors: Record<string, any>;
}

@Injectable()
export class RiskService {
  /**
   * Evaluates all independent verification layers and computes risk verdict.
   */
  evaluate(factors: RiskEvaluationFactors): RiskEvaluationResult {
    let riskScore = 0.0;
    let mask = 0;
    const reasons: string[] = [];

    // Layer 1: Dynamic QR (Bit 0: 1)
    if (factors.qrValid) {
      mask |= 1;
    } else {
      riskScore += 0.5;
      reasons.push(factors.qrExpired ? 'QR_EXPIRED' : 'QR_INVALID_SIGNATURE');
    }

    // Layer 2: GPS Geofence (Bit 1: 2)
    if (factors.gpsValid && !factors.isMockLocation) {
      mask |= 2;
    } else {
      if (factors.isMockLocation) {
        riskScore += 0.8;
        reasons.push('GPS_MOCK_LOCATION_ACTIVE');
      } else if (factors.distanceMeters > 75) {
        riskScore += 0.4;
        reasons.push(`OUT_OF_GEOFENCE_${Math.round(factors.distanceMeters)}M`);
      } else {
        riskScore += 0.2;
        reasons.push(`POOR_GPS_ACCURACY_${Math.round(factors.gpsAccuracy)}M`);
      }
    }

    // Layer 3: Hardware Device Signature (Bit 2: 4)
    if (factors.deviceSignatureValid) {
      mask |= 4;
    } else {
      riskScore += 0.5;
      reasons.push('DEVICE_CRYPTO_SIGNATURE_FAILED');
    }

    // Layer 4: Device Integrity Attestation (Bit 3: 8)
    if (factors.integrityPassed) {
      mask |= 8;
    } else {
      riskScore += 0.1; // Minor penalty for fallback/unsupported devices
    }

    // Layer 5: Optional Local Biometrics (Bit 4: 16)
    if (factors.biometricConfirmed) {
      mask |= 16;
      riskScore = Math.max(0, riskScore - 0.05); // Biometric confirmation reduces risk
    }

    // Clamp score to [0.0, 1.0]
    riskScore = Math.min(1.0, Math.max(0.0, Math.round(riskScore * 100) / 100));

    // Decision Logic: Enforce strict 75m geofence and 20m accuracy requirements
    let status: AttendanceStatus;
    let primaryReason = 'ALL_VERIFICATION_CHECKS_PASSED';

    if (!factors.qrValid) {
      status = AttendanceStatus.REJECTED;
      primaryReason = factors.qrExpired ? 'QR_EXPIRED' : 'QR_INVALID_SIGNATURE';
    } else if (!factors.deviceSignatureValid) {
      status = AttendanceStatus.REJECTED;
      primaryReason = 'DEVICE_CRYPTO_SIGNATURE_FAILED';
    } else if (factors.isMockLocation) {
      status = AttendanceStatus.SUSPICIOUS;
      primaryReason = 'GPS_MOCK_LOCATION_ACTIVE';
    } else if (factors.distanceMeters > 75) {
      status = AttendanceStatus.REJECTED;
      primaryReason = `OUT_OF_GEOFENCE_RADIUS (${Math.round(factors.distanceMeters)}m > 75m boundary)`;
    } else if (factors.gpsAccuracy > 20) {
      status = AttendanceStatus.REJECTED;
      primaryReason = `GPS_ACCURACY_TOO_POOR_RETRY (±${Math.round(factors.gpsAccuracy)}m exceeds 20m limit)`;
    } else if (!factors.integrityPassed) {
      status = AttendanceStatus.PENDING;
      primaryReason = 'DEVICE_INTEGRITY_VERIFICATION_PENDING';
    } else {
      status = AttendanceStatus.VERIFIED;
    }

    return {
      status,
      riskScore,
      reasonCode: primaryReason,
      verificationLayerMask: mask,
      factors: {
        distanceMeters: factors.distanceMeters,
        gpsAccuracy: factors.gpsAccuracy,
        isMockLocation: factors.isMockLocation,
        deviceSignatureValid: factors.deviceSignatureValid,
        integrityPassed: factors.integrityPassed,
        biometricConfirmed: factors.biometricConfirmed,
      },
    };
  }
}
