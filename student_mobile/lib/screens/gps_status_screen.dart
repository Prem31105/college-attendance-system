import 'package:flutter/material.dart';

class GpsStatusScreen extends StatefulWidget {
  const GpsStatusScreen({super.key});

  @override
  State<GpsStatusScreen> createState() => _GpsStatusScreenState();
}

class _GpsStatusScreenState extends State<GpsStatusScreen> {
  bool _testing = false;
  double _latitude = 12.9718000;
  double _longitude = 77.5945627;
  double _accuracy = 8.5; // in meters
  bool _isMockLocation = false;
  double _distanceToClassroom = 14.2; // in meters
  final double _geofenceLimit = 75.0; // in meters

  void _refreshGps() {
    setState(() => _testing = true);
    Future.delayed(const Duration(milliseconds: 700), () {
      if (mounted) {
        setState(() {
          _testing = false;
          _accuracy = 7.2;
          _distanceToClassroom = 12.8;
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final bool accuracyPassed = _accuracy <= 20.0;
    final bool geofencePassed = _distanceToClassroom <= _geofenceLimit;

    return Scaffold(
      appBar: AppBar(title: const Text('GPS & Geofence Diagnostics')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Overall Status Card
            Card(
              color: (accuracyPassed && geofencePassed && !_isMockLocation)
                  ? const Color(0xFF064E3B)
                  : const Color(0xFF7F1D1D),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    Icon(
                      (accuracyPassed && geofencePassed && !_isMockLocation)
                          ? Icons.check_circle_outline
                          : Icons.error_outline,
                      size: 40,
                      color: Colors.white,
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            (accuracyPassed && geofencePassed && !_isMockLocation)
                                ? 'GPS Signal Ready for Attendance'
                                : 'Geofence / Accuracy Issue Detected',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            (accuracyPassed && geofencePassed && !_isMockLocation)
                                ? 'Within Room 401 75m geofence with high accuracy.'
                                : 'Accuracy must be <=20m and distance <=75m.',
                            style: const TextStyle(fontSize: 12, color: Colors.white70),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Metrics Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    _buildMetricRow(
                      'Satellite Accuracy',
                      '±${_accuracy.toStringAsFixed(1)}m',
                      accuracyPassed ? 'Accepted (<= 20m)' : 'Too Poor (> 20m)',
                      accuracyPassed ? const Color(0xFF22C55E) : Colors.amber,
                    ),
                    const Divider(height: 24),
                    _buildMetricRow(
                      'Distance to Room 401',
                      '${_distanceToClassroom.toStringAsFixed(1)}m',
                      geofencePassed ? 'Inside 75m Boundary' : 'Out of Range',
                      geofencePassed ? const Color(0xFF22C55E) : Colors.redAccent,
                    ),
                    const Divider(height: 24),
                    _buildMetricRow(
                      'Mock Location Detector',
                      _isMockLocation ? 'MOCK ACTIVE' : 'Clean Hardware GPS',
                      _isMockLocation ? 'Flagged Fraudulent' : 'Passed',
                      _isMockLocation ? Colors.redAccent : const Color(0xFF22C55E),
                    ),
                    const Divider(height: 24),
                    _buildMetricRow(
                      'Captured Coordinates',
                      '${_latitude.toStringAsFixed(6)}, ${_longitude.toStringAsFixed(6)}',
                      'Fresh Snapshot',
                      Colors.grey,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            ElevatedButton.icon(
              onPressed: _testing ? null : _refreshGps,
              icon: _testing
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                  : const Icon(Icons.refresh, color: Colors.black),
              label: Text(
                _testing ? 'Acquiring Satellites...' : 'Test & Refresh GPS Signal',
                style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.black),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF22C55E),
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricRow(String title, String value, String subtitle, Color statusColor) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(color: Colors.grey, fontSize: 13)),
            const SizedBox(height: 2),
            Text(subtitle, style: TextStyle(color: statusColor, fontSize: 11, fontWeight: FontWeight.bold)),
          ],
        ),
        Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14, fontFamily: 'monospace')),
      ],
    );
  }
}
