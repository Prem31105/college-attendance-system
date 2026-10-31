import { GpsService } from './gps.service';

describe('GpsService', () => {
  let service: GpsService;

  beforeEach(() => {
    service = new GpsService();
  });

  it('should verify student within classroom geofence (30m away, accuracy 10m)', () => {
    // Room 401: 12.9715987, 77.5945627
    // Student located ~30 meters away: 12.9718000, 77.5945627
    const result = service.verifyLocation({
      studentLat: 12.9718,
      studentLng: 77.5945627,
      studentAccuracy: 10,
      classroomLat: 12.9715987,
      classroomLng: 77.5945627,
      geofenceRadiusMeters: 75,
      isMockLocation: false,
    });

    expect(result.isValid).toBe(true);
    expect(result.distanceMeters).toBeLessThanOrEqual(75);
    expect(result.reasonCode).toBe('GPS_VERIFIED_IN_GEOFENCE');
  });

  it('should reject student located outside classroom geofence (500m away)', () => {
    const result = service.verifyLocation({
      studentLat: 12.9760, // ~500m away
      studentLng: 77.5945627,
      studentAccuracy: 10,
      classroomLat: 12.9715987,
      classroomLng: 77.5945627,
      geofenceRadiusMeters: 75,
      isMockLocation: false,
    });

    expect(result.isValid).toBe(false);
    expect(result.distanceMeters).toBeGreaterThan(75);
    expect(result.reasonCode).toBe('OUT_OF_GEOFENCE_RADIUS');
    expect(result.isSuspicious).toBe(true);
  });

  it('should reject GPS reading with poor accuracy (> 20m)', () => {
    const result = service.verifyLocation({
      studentLat: 12.9715987,
      studentLng: 77.5945627,
      studentAccuracy: 45, // Poor accuracy 45m
      classroomLat: 12.9715987,
      classroomLng: 77.5945627,
      geofenceRadiusMeters: 75,
      isMockLocation: false,
    });

    expect(result.isValid).toBe(false);
    expect(result.reasonCode).toBe('GPS_ACCURACY_TOO_POOR_RETRY');
  });

  it('should flag mock location applications', () => {
    const result = service.verifyLocation({
      studentLat: 12.9715987,
      studentLng: 77.5945627,
      studentAccuracy: 5,
      classroomLat: 12.9715987,
      classroomLng: 77.5945627,
      geofenceRadiusMeters: 75,
      isMockLocation: true,
    });

    expect(result.isValid).toBe(false);
    expect(result.isSuspicious).toBe(true);
    expect(result.reasonCode).toBe('GPS_MOCK_LOCATION_DETECTED');
  });
});
