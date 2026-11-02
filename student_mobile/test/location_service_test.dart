import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:student_mobile/core/services/location_service.dart';
import 'package:student_mobile/screens/gps_status_screen.dart';

void main() {
  group('LocationService & Haversine Geofence Tests', () {
    const room401 = ClassroomGeofence(
      id: 'room-401',
      name: 'Room 401',
      building: 'Technology Block A',
      latitude: 12.9715987,
      longitude: 77.5945627,
      geofenceRadiusMeters: 75.0,
    );

    test('Haversine distance calculation is zero for identical coordinates', () {
      final distance = LocationService.calculateHaversineDistance(
        lat1: 12.9715987,
        lon1: 77.5945627,
        lat2: 12.9715987,
        lon2: 77.5945627,
      );
      expect(distance, 0.0);
    });

    test('Haversine distance calculates ~22m for nearby coordinate offset', () {
      final distance = LocationService.calculateHaversineDistance(
        lat1: 12.9715987,
        lon1: 77.5945627,
        lat2: 12.9718000,
        lon2: 77.5945627,
      );
      // Offset of ~0.0002013 degrees latitude is approx 22.3 meters
      expect(distance, greaterThan(20.0));
      expect(distance, lessThan(25.0));
    });

    test('Geofence evaluation accepts valid position within 75m boundary and <=20m accuracy', () {
      final eval = LocationService.evaluateLocation(
        studentLat: 12.9718000,
        studentLng: 77.5945627,
        accuracy: 8.5,
        classroom: room401,
        isMock: false,
      );

      expect(eval.isValid, true);
      expect(eval.isInsideGeofence, true);
      expect(eval.isAccuracyAccepted, true);
      expect(eval.isMockLocation, false);
      expect(eval.statusMessage, 'GPS_VERIFIED_IN_GEOFENCE');
    });

    test('Geofence evaluation rejects when accuracy exceeds 20m threshold', () {
      final eval = LocationService.evaluateLocation(
        studentLat: 12.9718000,
        studentLng: 77.5945627,
        accuracy: 25.0, // Exceeds 20m
        classroom: room401,
        isMock: false,
      );

      expect(eval.isValid, false);
      expect(eval.isInsideGeofence, true);
      expect(eval.isAccuracyAccepted, false);
      expect(eval.statusMessage, 'GPS_ACCURACY_TOO_POOR');
    });

    test('Geofence evaluation rejects when distance exceeds classroom radius (>75m)', () {
      final eval = LocationService.evaluateLocation(
        studentLat: 12.9750000, // ~380m away
        studentLng: 77.5945627,
        accuracy: 5.0,
        classroom: room401,
        isMock: false,
      );

      expect(eval.isValid, false);
      expect(eval.isInsideGeofence, false);
      expect(eval.isAccuracyAccepted, true);
      expect(eval.statusMessage, 'OUTSIDE_GEOFENCE_RADIUS');
    });

    test('Geofence evaluation rejects when mock location spoofing is detected', () {
      final eval = LocationService.evaluateLocation(
        studentLat: 12.9718000,
        studentLng: 77.5945627,
        accuracy: 5.0,
        classroom: room401,
        isMock: true, // Flagged spoofing
      );

      expect(eval.isValid, false);
      expect(eval.isMockLocation, true);
      expect(eval.statusMessage, 'MOCK_LOCATION_DETECTED');
    });

    test('ClassroomGeofence parses JSON and handles defaults correctly', () {
      final json = {
        'id': 'lab-2',
        'name': 'AI & Robotics Lab',
        'building': 'Block B',
        'latitude': 12.9720,
        'longitude': 77.5950,
        'geofenceRadiusMeters': 60.0,
      };

      final classroom = ClassroomGeofence.fromJson(json);
      expect(classroom.id, 'lab-2');
      expect(classroom.name, 'AI & Robotics Lab');
      expect(classroom.building, 'Block B');
      expect(classroom.latitude, 12.9720);
      expect(classroom.longitude, 77.5950);
      expect(classroom.geofenceRadiusMeters, 60.0);
    });
  });

  group('GpsStatusScreen Radar Widgets Tests', () {
    testWidgets('GpsStatusScreen renders radar visualizer, metrics and refresh button', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        const MaterialApp(
          home: GpsStatusScreen(),
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));

      // Header
      expect(find.text('GPS Geofence Radar'), findsOneWidget);

      // Radar card
      expect(find.text('Live Geofence Radar'), findsOneWidget);
      expect(find.text('75m Boundary'), findsOneWidget);

      // Metrics
      expect(find.text('Target Classroom Anchor'), findsOneWidget);
      expect(find.text('Distance to Geofence Anchor'), findsOneWidget);
      expect(find.text('Satellite Accuracy'), findsOneWidget);
      expect(find.text('Mock Location Detector'), findsOneWidget);
      expect(find.text('Live Coordinates'), findsOneWidget);

      // Radar Action Button presence
      expect(find.byIcon(Icons.radar), findsWidgets);
      expect(find.byWidgetPredicate((w) => w is ButtonStyleButton), findsWidgets);
    });
  });
}
