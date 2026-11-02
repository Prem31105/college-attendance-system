import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../core/services/location_service.dart';

class GpsStatusScreen extends StatefulWidget {
  const GpsStatusScreen({super.key});

  @override
  State<GpsStatusScreen> createState() => _GpsStatusScreenState();
}

class _GpsStatusScreenState extends State<GpsStatusScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  bool _testing = false;
  LocationPermission _permission = LocationPermission.unableToDetermine;
  bool _serviceEnabled = true;
  GeofenceEvaluation? _evaluation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat();

    _initializeGps();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  Future<void> _initializeGps() async {
    setState(() => _testing = true);
    await LocationService().fetchClassrooms();
    _serviceEnabled = await LocationService().isLocationServiceEnabled();
    _permission = await LocationService().checkPermission();
    _evaluation = await LocationService().performEvaluation();
    if (mounted) {
      setState(() => _testing = false);
    }
  }

  Future<void> _refreshGps() async {
    setState(() => _testing = true);
    _serviceEnabled = await LocationService().isLocationServiceEnabled();
    _permission = await LocationService().checkPermission();
    _evaluation = await LocationService().performEvaluation();
    if (mounted) {
      setState(() => _testing = false);
    }
  }

  Future<void> _requestPermission() async {
    final result = await LocationService().requestPermission();
    setState(() => _permission = result);
    _refreshGps();
  }

  @override
  Widget build(BuildContext context) {
    final eval = _evaluation ??
        LocationService.evaluateLocation(
          studentLat: 12.9718000,
          studentLng: 77.5945627,
          accuracy: 8.5,
          classroom: LocationService().selectedClassroomNotifier.value,
          isMock: false,
        );

    final bool isReady = eval.isValid;
    final Color statusColor = eval.isMockLocation
        ? Colors.redAccent
        : (!eval.isInsideGeofence
            ? Colors.redAccent
            : (!eval.isAccuracyAccepted
                ? Colors.amber
                : const Color(0xFF22C55E)));

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        title: const Text('GPS Geofence Radar'),
        backgroundColor: const Color(0xFF1E293B),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh Location',
            onPressed: _testing ? null : _refreshGps,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Permission Banner (if needed)
            if (!_serviceEnabled)
              _buildWarningBanner(
                title: 'Location Services Disabled',
                message: 'Device GPS is turned off. Please turn on location services.',
                buttonLabel: 'Enable Location',
                onPressed: () => LocationService().openLocationSettings(),
              )
            else if (_permission == LocationPermission.denied)
              _buildWarningBanner(
                title: 'Location Permission Needed',
                message: 'Classroom geofence verification requires high-accuracy location.',
                buttonLabel: 'Grant Permission',
                onPressed: _requestPermission,
              )
            else if (_permission == LocationPermission.deniedForever)
              _buildWarningBanner(
                title: 'Location Permission Permanently Denied',
                message: 'Please enable location permissions in App Settings.',
                buttonLabel: 'Open Settings',
                onPressed: () => LocationService().openAppSettings(),
              ),

            // Classroom Target Selector
            _buildClassroomSelector(),
            const SizedBox(height: 16),

            // Visual Radar Canvas
            _buildRadarCard(eval, statusColor),
            const SizedBox(height: 16),

            // Overall Status Summary Card
            Card(
              color: isReady
                  ? const Color(0xFF064E3B)
                  : const Color(0xFF450A0A),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: BorderSide(color: statusColor.withValues(alpha: 0.6)),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Icon(
                      isReady ? Icons.check_circle : Icons.warning_amber_rounded,
                      color: statusColor,
                      size: 32,
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            isReady
                                ? 'GPS Signal Ready for Attendance'
                                : (eval.isMockLocation
                                    ? 'Mock Location Spoofing Detected'
                                    : (!eval.isInsideGeofence
                                        ? 'Outside Classroom Geofence'
                                        : 'GPS Accuracy Too Poor')),
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            isReady
                                ? 'Within ${eval.classroom.name} boundary (${eval.distanceMeters.toStringAsFixed(1)}m <= ${eval.classroom.geofenceRadiusMeters.toStringAsFixed(0)}m, ±${eval.accuracyMeters.toStringAsFixed(1)}m).'
                                : (eval.isMockLocation
                                    ? 'Mock provider detected. Fake GPS is strictly prohibited.'
                                    : (!eval.isInsideGeofence
                                        ? 'You are ${eval.distanceMeters.toStringAsFixed(1)}m away. Move within ${eval.classroom.geofenceRadiusMeters.toStringAsFixed(0)}m of ${eval.classroom.name}.'
                                        : 'Accuracy is ±${eval.accuracyMeters.toStringAsFixed(1)}m. Satellite accuracy must be <= 20m.')),
                            style: const TextStyle(fontSize: 11, color: Colors.white70),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Metrics Card
            Card(
              color: const Color(0xFF1E293B),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    _buildMetricRow(
                      'Target Classroom Anchor',
                      '${eval.classroom.name} (${eval.classroom.building})',
                      'Configured Anchor: ${eval.classroom.latitude.toStringAsFixed(5)}, ${eval.classroom.longitude.toStringAsFixed(5)}',
                      const Color(0xFF3B82F6),
                    ),
                    const Divider(height: 20, color: Color(0xFF334155)),
                    _buildMetricRow(
                      'Distance to Geofence Anchor',
                      '${eval.distanceMeters.toStringAsFixed(1)} m',
                      eval.isInsideGeofence
                          ? 'Inside ${eval.classroom.geofenceRadiusMeters.toStringAsFixed(0)}m Geofence'
                          : 'Outside Boundary (${(eval.distanceMeters - eval.classroom.geofenceRadiusMeters).toStringAsFixed(1)}m out)',
                      eval.isInsideGeofence ? const Color(0xFF22C55E) : Colors.redAccent,
                    ),
                    const Divider(height: 20, color: Color(0xFF334155)),
                    _buildMetricRow(
                      'Satellite Accuracy',
                      '±${eval.accuracyMeters.toStringAsFixed(1)} m',
                      eval.isAccuracyAccepted ? 'Accepted (<= 20m)' : 'Too Poor (> 20m)',
                      eval.isAccuracyAccepted ? const Color(0xFF22C55E) : Colors.amber,
                    ),
                    const Divider(height: 20, color: Color(0xFF334155)),
                    _buildMetricRow(
                      'Mock Location Detector',
                      eval.isMockLocation ? 'MOCK DETECTED' : 'Clean Hardware GPS',
                      eval.isMockLocation ? 'Rejected Fraudulent' : 'Genuine Satellite Hardware',
                      eval.isMockLocation ? Colors.redAccent : const Color(0xFF22C55E),
                    ),
                    const Divider(height: 20, color: Color(0xFF334155)),
                    _buildMetricRow(
                      'Live Coordinates',
                      '${eval.latitude.toStringAsFixed(6)}, ${eval.longitude.toStringAsFixed(6)}',
                      'Device Location Fix',
                      Colors.grey,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Refresh Signal Button
            ElevatedButton.icon(
              onPressed: _testing ? null : _refreshGps,
              icon: _testing
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                    )
                  : const Icon(Icons.radar, color: Colors.black),
              label: Text(
                _testing ? 'Acquiring Satellites...' : 'Scan & Update Geofence Radar',
                style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.black),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF22C55E),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWarningBanner({
    required String title,
    required String message,
    required String buttonLabel,
    required VoidCallback onPressed,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.amber.shade900.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.amber.shade700),
      ),
      child: Row(
        children: [
          const Icon(Icons.location_off, color: Colors.amber, size: 28),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.amber, fontSize: 13)),
                const SizedBox(height: 2),
                Text(message, style: const TextStyle(color: Colors.white70, fontSize: 11)),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: onPressed,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.amber,
              foregroundColor: Colors.black,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              textStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
            ),
            child: Text(buttonLabel),
          ),
        ],
      ),
    );
  }

  Widget _buildClassroomSelector() {
    return ValueListenableBuilder<List<ClassroomGeofence>>(
      valueListenable: LocationService().classroomsNotifier,
      builder: (context, classrooms, _) {
        return ValueListenableBuilder<ClassroomGeofence>(
          valueListenable: LocationService().selectedClassroomNotifier,
          builder: (context, selected, _) {
            return Card(
              color: const Color(0xFF1E293B),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Row(
                  children: [
                    const Icon(Icons.meeting_room, color: Color(0xFF22C55E), size: 22),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Configurable Classroom Geofence',
                            style: TextStyle(color: Colors.grey, fontSize: 11),
                          ),
                          DropdownButtonHideUnderline(
                            child: DropdownButton<String>(
                              isExpanded: true,
                              value: selected.id,
                              dropdownColor: const Color(0xFF1E293B),
                              items: classrooms.map((c) {
                                return DropdownMenuItem<String>(
                                  value: c.id,
                                  child: Text(
                                    '${c.name} (${c.building}) — ${c.geofenceRadiusMeters.toStringAsFixed(0)}m',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                    ),
                                  ),
                                );
                              }).toList(),
                              onChanged: (newId) {
                                if (newId != null) {
                                  final match = classrooms.firstWhere(
                                    (c) => c.id == newId,
                                    orElse: () => ClassroomGeofence.defaultClassroom,
                                  );
                                  LocationService().selectClassroom(match);
                                  _refreshGps();
                                }
                              },
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildRadarCard(GeofenceEvaluation eval, Color statusColor) {
    return Card(
      color: const Color(0xFF1E293B),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    Icon(Icons.radar, color: Color(0xFF22C55E), size: 18),
                    SizedBox(width: 6),
                    Text(
                      'Live Geofence Radar',
                      style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 13),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: statusColor),
                  ),
                  child: Text(
                    eval.isInsideGeofence ? 'IN RANGE' : 'OUT OF RANGE',
                    style: TextStyle(color: statusColor, fontSize: 10, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 220,
              width: double.infinity,
              child: AnimatedBuilder(
                animation: _pulseController,
                builder: (context, _) {
                  return CustomPaint(
                    painter: _RadarPainter(
                      pulseProgress: _pulseController.value,
                      distanceMeters: eval.distanceMeters,
                      geofenceRadiusMeters: eval.classroom.geofenceRadiusMeters,
                      statusColor: statusColor,
                      isInside: eval.isInsideGeofence,
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildLegendItem('Classroom (Center)', Colors.white),
                _buildLegendItem('75m Boundary', const Color(0xFF3B82F6)),
                _buildLegendItem('Your Device', statusColor),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLegendItem(String label, Color color) {
    return Row(
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(shape: BoxShape.circle, color: color),
        ),
        const SizedBox(width: 5),
        Text(label, style: const TextStyle(fontSize: 10, color: Colors.grey)),
      ],
    );
  }

  Widget _buildMetricRow(String title, String value, String subtitle, Color statusColor) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(color: Colors.grey, fontSize: 12)),
              const SizedBox(height: 2),
              Text(subtitle, style: TextStyle(color: statusColor, fontSize: 11, fontWeight: FontWeight.bold)),
            ],
          ),
        ),
        const SizedBox(width: 12),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 13,
            fontFamily: 'monospace',
          ),
        ),
      ],
    );
  }
}

class _RadarPainter extends CustomPainter {
  final double pulseProgress;
  final double distanceMeters;
  final double geofenceRadiusMeters;
  final Color statusColor;
  final bool isInside;

  _RadarPainter({
    required this.pulseProgress,
    required this.distanceMeters,
    required this.geofenceRadiusMeters,
    required this.statusColor,
    required this.isInside,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final maxRadius = math.min(size.width, size.height) / 2 - 10;

    final gridPaint = Paint()
      ..color = const Color(0xFF334155).withValues(alpha: 0.6)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    // Crosshairs
    canvas.drawLine(Offset(center.dx, center.dy - maxRadius), Offset(center.dx, center.dy + maxRadius), gridPaint);
    canvas.drawLine(Offset(center.dx - maxRadius, center.dy), Offset(center.dx + maxRadius, center.dy), gridPaint);

    // Inner concentric circles (25m, 50m)
    final radius25 = maxRadius * 0.33;
    final radius50 = maxRadius * 0.66;
    canvas.drawCircle(center, radius25, gridPaint);
    canvas.drawCircle(center, radius50, gridPaint);

    // 75m Geofence boundary circle (Boundary marked with primary blue)
    final geofencePaint = Paint()
      ..color = const Color(0xFF3B82F6)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;
    canvas.drawCircle(center, maxRadius, geofencePaint);

    // Animated radar pulse ring
    final pulsePaint = Paint()
      ..color = statusColor.withValues(alpha: (1.0 - pulseProgress) * 0.5)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;
    canvas.drawCircle(center, maxRadius * pulseProgress, pulsePaint);

    // Center Anchor (Classroom)
    final anchorPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;
    canvas.drawCircle(center, 5, anchorPaint);

    // Device location blip
    // Map distance relative to 75m boundary (clamped to max visual distance 120m)
    final clampedDistance = math.min(120.0, distanceMeters);
    final visualDistance = (clampedDistance / geofenceRadiusMeters) * maxRadius;

    // Fixed angle (45 degrees up-right) for steady visual representation
    const angle = -math.pi / 4;
    final deviceX = center.dx + visualDistance * math.cos(angle);
    final deviceY = center.dy + visualDistance * math.sin(angle);
    final deviceOffset = Offset(deviceX, deviceY);

    // Device pulse glow
    final glowPaint = Paint()
      ..color = statusColor.withValues(alpha: 0.3)
      ..style = PaintingStyle.fill;
    canvas.drawCircle(deviceOffset, 12, glowPaint);

    // Device core dot
    final devicePaint = Paint()
      ..color = statusColor
      ..style = PaintingStyle.fill;
    canvas.drawCircle(deviceOffset, 6, devicePaint);

    // Line from anchor to device
    final linePaint = Paint()
      ..color = statusColor.withValues(alpha: 0.5)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;
    canvas.drawLine(center, deviceOffset, linePaint);
  }

  @override
  bool shouldRepaint(covariant _RadarPainter oldDelegate) {
    return oldDelegate.pulseProgress != pulseProgress ||
        oldDelegate.distanceMeters != distanceMeters ||
        oldDelegate.statusColor != statusColor;
  }
}
