import { RiskService } from './risk.service';
import { AttendanceStatus } from '@prisma/client';

describe('RiskService', () => {
  let service: RiskService;

  beforeEach(() => {
    service = new RiskService();
  });

  it('should return VERIFIED when all independent layers pass cleanly', () => {
    const verdict = service.evaluate({
      qrValid: true,
      qrExpired: false,
      gpsValid: true,
      distanceMeters: 15,
      gpsAccuracy: 8,
      isMockLocation: false,
      deviceSignatureValid: true,
      integrityPassed: true,
      biometricConfirmed: true,
    });

    expect(verdict.status).toBe(AttendanceStatus.VERIFIED);
    expect(verdict.riskScore).toBeLessThan(0.2);
    expect(verdict.verificationLayerMask & 1).toBe(1); // QR bit set
    expect(verdict.verificationLayerMask & 2).toBe(2); // GPS bit set
    expect(verdict.verificationLayerMask & 4).toBe(4); // Device bit set
  });

  it('should return REJECTED when QR token signature is invalid', () => {
    const verdict = service.evaluate({
      qrValid: false,
      qrExpired: false,
      gpsValid: true,
      distanceMeters: 15,
      gpsAccuracy: 8,
      isMockLocation: false,
      deviceSignatureValid: true,
      integrityPassed: true,
    });

    expect(verdict.status).toBe(AttendanceStatus.REJECTED);
    expect(verdict.reasonCode).toContain('QR_INVALID_SIGNATURE');
  });

  it('should return REJECTED when student is far outside geofence (200m away)', () => {
    const verdict = service.evaluate({
      qrValid: true,
      qrExpired: false,
      gpsValid: false,
      distanceMeters: 200,
      gpsAccuracy: 10,
      isMockLocation: false,
      deviceSignatureValid: true,
      integrityPassed: true,
    });

    expect(verdict.status).toBe(AttendanceStatus.REJECTED);
  });

  it('should return SUSPICIOUS when mock location app is detected', () => {
    const verdict = service.evaluate({
      qrValid: true,
      qrExpired: false,
      gpsValid: false,
      distanceMeters: 10,
      gpsAccuracy: 5,
      isMockLocation: true,
      deviceSignatureValid: true,
      integrityPassed: true,
    });

    expect(verdict.status).toBe(AttendanceStatus.SUSPICIOUS);
    expect(verdict.reasonCode).toContain('GPS_MOCK_LOCATION_ACTIVE');
  });
});
