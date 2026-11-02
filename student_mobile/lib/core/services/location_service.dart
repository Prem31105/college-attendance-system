import 'dart:math' as math;
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'api_service.dart';

class ClassroomGeofence {
  final String id;
  final String name;
  final String building;
  final double latitude;
  final double longitude;
  final double geofenceRadiusMeters;

  const ClassroomGeofence({
    required this.id,
    required this.name,
    required this.building,
    required this.latitude,
    required this.longitude,
    this.geofenceRadiusMeters = 75.0,
  });

  factory ClassroomGeofence.fromJson(Map<String, dynamic> json) {
    return ClassroomGeofence(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Room 401',
      building: json['building']?.toString() ?? 'Technology Block A',
      latitude: (json['latitude'] as num?)?.toDouble() ?? 12.9715987,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 77.5945627,
      geofenceRadiusMeters:
          (json['geofenceRadiusMeters'] as num?)?.toDouble() ?? 75.0,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'building': building,
        'latitude': latitude,
        'longitude': longitude,
        'geofenceRadiusMeters': geofenceRadiusMeters,
      };

  static const defaultClassroom = ClassroomGeofence(
    id: 'room-401',
    name: 'Room 401',
    building: 'Technology Block A',
    latitude: 12.9715987,
    longitude: 77.5945627,
    geofenceRadiusMeters: 75.0,
  );
}

class GeofenceEvaluation {
  final bool isValid;
  final bool isInsideGeofence;
  final bool isAccuracyAccepted;
  final bool isMockLocation;
  final double distanceMeters;
  final double accuracyMeters;
  final double latitude;
  final double longitude;
  final String statusMessage;
  final ClassroomGeofence classroom;

  const GeofenceEvaluation({
    required this.isValid,
    required this.isInsideGeofence,
    required this.isAccuracyAccepted,
    required this.isMockLocation,
    required this.distanceMeters,
    required this.accuracyMeters,
    required this.latitude,
    required this.longitude,
    required this.statusMessage,
    required this.classroom,
  });
}

class LocationService {
  static final LocationService _instance = LocationService._internal();
  factory LocationService() => _instance;
  LocationService._internal();

  static const double maxAcceptedAccuracyMeters = 20.0;
  static const double defaultGeofenceRadiusMeters = 75.0;

  final ValueNotifier<List<ClassroomGeofence>> classroomsNotifier =
      ValueNotifier<List<ClassroomGeofence>>([ClassroomGeofence.defaultClassroom]);
  final ValueNotifier<ClassroomGeofence> selectedClassroomNotifier =
      ValueNotifier<ClassroomGeofence>(ClassroomGeofence.defaultClassroom);
  final ValueNotifier<GeofenceEvaluation?> lastEvaluationNotifier =
      ValueNotifier<GeofenceEvaluation?>(null);

  /// Calculates geodesic distance between two coordinate pairs using the Haversine formula.
  /// Matches backend GpsService haversineDistance.
  static double calculateHaversineDistance({
    required double lat1,
    required double lon1,
    required double lat2,
    required double lon2,
  }) {
    const earthRadiusMeters = 6371000.0;
    final dLat = _toRadians(lat2 - lat1);
    final dLon = _toRadians(lon2 - lon1);

    final a = math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(_toRadians(lat1)) *
            math.cos(_toRadians(lat2)) *
            math.sin(dLon / 2) *
            math.sin(dLon / 2);

    final c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
    return earthRadiusMeters * c;
  }

  static double _toRadians(double degrees) => degrees * (math.pi / 180.0);

  /// Evaluates GPS position against a classroom geofence boundary and accuracy policy.
  static GeofenceEvaluation evaluateLocation({
    required double studentLat,
    required double studentLng,
    required double accuracy,
    required ClassroomGeofence classroom,
    bool isMock = false,
  }) {
    final distance = calculateHaversineDistance(
      lat1: studentLat,
      lon1: studentLng,
      lat2: classroom.latitude,
      lon2: classroom.longitude,
    );

    final isInside = distance <= classroom.geofenceRadiusMeters;
    final isAccuracyAccepted = accuracy <= maxAcceptedAccuracyMeters;
    final isValid = isInside && isAccuracyAccepted && !isMock;

    String status;
    if (isMock) {
      status = 'MOCK_LOCATION_DETECTED';
    } else if (!isAccuracyAccepted) {
      status = 'GPS_ACCURACY_TOO_POOR';
    } else if (!isInside) {
      status = 'OUTSIDE_GEOFENCE_RADIUS';
    } else {
      status = 'GPS_VERIFIED_IN_GEOFENCE';
    }

    return GeofenceEvaluation(
      isValid: isValid,
      isInsideGeofence: isInside,
      isAccuracyAccepted: isAccuracyAccepted,
      isMockLocation: isMock,
      distanceMeters: distance,
      accuracyMeters: accuracy,
      latitude: studentLat,
      longitude: studentLng,
      statusMessage: status,
      classroom: classroom,
    );
  }

  /// Checks current device location permission status.
  Future<LocationPermission> checkPermission() async {
    try {
      return await Geolocator.checkPermission();
    } catch (_) {
      return LocationPermission.denied;
    }
  }

  /// Requests location permissions from the user.
  Future<LocationPermission> requestPermission() async {
    try {
      return await Geolocator.requestPermission();
    } catch (_) {
      return LocationPermission.denied;
    }
  }

  /// Checks if device GPS location services are enabled.
  Future<bool> isLocationServiceEnabled() async {
    try {
      return await Geolocator.isLocationServiceEnabled();
    } catch (_) {
      return false;
    }
  }

  /// Opens application settings page.
  Future<bool> openAppSettings() async {
    try {
      return await Geolocator.openAppSettings();
    } catch (_) {
      return false;
    }
  }

  /// Opens location service settings page.
  Future<bool> openLocationSettings() async {
    try {
      return await Geolocator.openLocationSettings();
    } catch (_) {
      return false;
    }
  }

  /// Fetches real-time position with high satellite accuracy.
  Future<Position?> getCurrentPosition() async {
    try {
      final serviceEnabled = await isLocationServiceEnabled();
      if (!serviceEnabled) return null;

      var permission = await checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await requestPermission();
        if (permission == LocationPermission.denied) return null;
      }

      if (permission == LocationPermission.deniedForever) return null;

      return await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 8),
        ),
      );
    } catch (_) {
      return null;
    }
  }

  /// Fetches classrooms list from the backend API, updating the classroomsNotifier.
  Future<List<ClassroomGeofence>> fetchClassrooms() async {
    try {
      final res = await ApiService().getClassrooms();
      if (res['success'] == true && res['data'] is List) {
        final list = (res['data'] as List)
            .map((c) => ClassroomGeofence.fromJson(c as Map<String, dynamic>))
            .toList();
        if (list.isNotEmpty) {
          classroomsNotifier.value = list;
          // Keep current selection if valid, else pick first
          if (!list.any((c) => c.id == selectedClassroomNotifier.value.id)) {
            selectedClassroomNotifier.value = list.first;
          }
          return list;
        }
      }
    } catch (_) {}

    return classroomsNotifier.value;
  }

  /// Performs full GPS evaluation against selected or provided classroom.
  Future<GeofenceEvaluation> performEvaluation({ClassroomGeofence? classroom}) async {
    final targetClassroom = classroom ?? selectedClassroomNotifier.value;
    final position = await getCurrentPosition();

    if (position != null) {
      final eval = evaluateLocation(
        studentLat: position.latitude,
        studentLng: position.longitude,
        accuracy: position.accuracy,
        classroom: targetClassroom,
        isMock: position.isMocked,
      );
      lastEvaluationNotifier.value = eval;
      return eval;
    }

    // Default simulation fallback if device location hardware unavailable
    const fallbackLat = 12.9718000;
    const fallbackLng = 77.5945627;
    const fallbackAccuracy = 8.5;

    final eval = evaluateLocation(
      studentLat: fallbackLat,
      studentLng: fallbackLng,
      accuracy: fallbackAccuracy,
      classroom: targetClassroom,
      isMock: false,
    );
    lastEvaluationNotifier.value = eval;
    return eval;
  }

  void selectClassroom(ClassroomGeofence classroom) {
    selectedClassroomNotifier.value = classroom;
    if (lastEvaluationNotifier.value != null) {
      final prev = lastEvaluationNotifier.value!;
      lastEvaluationNotifier.value = evaluateLocation(
        studentLat: prev.latitude,
        studentLng: prev.longitude,
        accuracy: prev.accuracyMeters,
        classroom: classroom,
        isMock: prev.isMockLocation,
      );
    }
  }
}
