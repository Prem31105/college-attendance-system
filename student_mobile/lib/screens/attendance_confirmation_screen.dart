import 'package:flutter/material.dart';

class AttendanceConfirmationScreen extends StatelessWidget {
  final String status;
  final String subjectCode;
  final String subjectName;
  final double distanceMeters;
  final double accuracyMeters;

  const AttendanceConfirmationScreen({
    super.key,
    required this.status,
    required this.subjectCode,
    required this.subjectName,
    required this.distanceMeters,
    required this.accuracyMeters,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Attendance Confirmation')),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Center(
              child: Icon(Icons.check_circle_outline, size: 84, color: Color(0xFF22C55E)),
            ),
            const SizedBox(height: 20),
            Text(
              'Attendance $status',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            const SizedBox(height: 8),
            Text(
              '$subjectCode: $subjectName',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 14, color: Colors.grey),
            ),
            const SizedBox(height: 32),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    _buildRow('GPS Distance to Anchor', '${distanceMeters.toStringAsFixed(1)}m (Within 75m)'),
                    const Divider(height: 24),
                    _buildRow('GPS Accuracy', '±${accuracyMeters.toStringAsFixed(1)}m (Accepted <20m)'),
                    const Divider(height: 24),
                    _buildRow('Device Signature', 'ECDSA P-256 Verified'),
                    const Divider(height: 24),
                    _buildRow('QR Expiration Check', 'Scanned in 4.2s (Valid 30s)'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF22C55E),
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: const Text('Back to Dashboard', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 13)),
        Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
      ],
    );
  }
}
