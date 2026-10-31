import { Injectable } from '@nestjs/common';

export interface GpsVerificationInput {
  studentLat: number;
  studentLng: number;
  studentAccuracy: number;
  classroomLat: number;
  classroomLng: number;
  geofenceRadiusMeters?: number;
  isMockLocation?: boolean;
}

export interface GpsVerificationResult {
  isValid: boolean;
  distanceMeters: number;
  accuracyMeters: number;
  isSuspicious: boolean;
  reasonCode: string;
}

@Injectable()
export class GpsService {
  private readonly defaultRadiusMeters = 75;
  private readonly maxAccuracyMeters = 20;

  /**
   * Verifies GPS coordinates against classroom location using the Haversine formula.
   */
  verifyLocation(input: GpsVerificationInput): GpsVerificationResult {
    const {
      studentLat,
      studentLng,
      studentAccuracy,
      classroomLat,
      classroomLng,
      geofenceRadiusMeters = this.defaultRadiusMeters,
      isMockLocation = false,
    } = input;

    // 1. Calculate precise geodesic distance via Haversine formula
    const distanceMeters = this.haversineDistance(
      studentLat,
      studentLng,
      classroomLat,
      classroomLng,
    );

    // 2. Check for explicit mock location flag
    if (isMockLocation) {
      return {
        isValid: false,
        distanceMeters,
        accuracyMeters: studentAccuracy,
        isSuspicious: true,
        reasonCode: 'GPS_MOCK_LOCATION_DETECTED',
      };
    }

    // 3. Check GPS accuracy
    if (studentAccuracy > this.maxAccuracyMeters) {
      return {
        isValid: false,
        distanceMeters,
        accuracyMeters: studentAccuracy,
        isSuspicious: studentAccuracy > 100, // Very poor accuracy is suspicious
        reasonCode: 'GPS_ACCURACY_TOO_POOR_RETRY',
      };
    }

    // 4. Check geofence boundary (with 5-meter tolerance for edge variance)
    const effectiveRadius = geofenceRadiusMeters + 5;
    if (distanceMeters > effectiveRadius) {
      return {
        isValid: false,
        distanceMeters,
        accuracyMeters: studentAccuracy,
        isSuspicious: distanceMeters >= 300, // Scanning from > 300m away is suspicious
        reasonCode: 'OUT_OF_GEOFENCE_RADIUS',
      };
    }

    return {
      isValid: true,
      distanceMeters,
      accuracyMeters: studentAccuracy,
      isSuspicious: false,
      reasonCode: 'GPS_VERIFIED_IN_GEOFENCE',
    };
  }

  /**
   * Haversine formula for spherical distance in meters.
   */
  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const EARTH_RADIUS_METERS = 6371000;
    const toRadians = (deg: number) => (deg * Math.PI) / 180;

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(EARTH_RADIUS_METERS * c * 10) / 10;
  }
}
