import 'dart:convert';
import 'package:flutter/material.dart';
import 'attendance_confirmation_screen.dart';
import '../core/security/crypto_keystore.dart';

class AttendanceScannerScreen extends StatefulWidget {
  const AttendanceScannerScreen({super.key});

  @override
  State<AttendanceScannerScreen> createState() => _AttendanceScannerScreenState();
}

class _AttendanceScannerScreenState extends State<AttendanceScannerScreen> {
  bool _processing = false;
  String _stepStatus = 'Position classroom dynamic QR inside frame';

  void _simulateScanAndSubmit() async {
    setState(() {
      _processing = true;
      _stepStatus = '1/4: QR Token read. Verifying timestamp...';
    });

    await Future.delayed(const Duration(milliseconds: 400));
    setState(() => _stepStatus = '2/4: Obtaining GPS coordinates & accuracy...');

    await Future.delayed(const Duration(milliseconds: 500));
    setState(() => _stepStatus = '3/4: Signing device-bound Keystore challenge...');

    final signature = await CryptoKeystore.signChallenge('demo_challenge_nonce_123');

    await Future.delayed(const Duration(milliseconds: 400));
    setState(() => _stepStatus = '4/4: Submitting evidence to server risk engine...');

    await Future.delayed(const Duration(milliseconds: 600));

    if (mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => const AttendanceConfirmationScreen(
            status: 'VERIFIED',
            subjectCode: 'CS601',
            subjectName: 'Advanced Distributed Systems',
            distanceMeters: 14.2,
            accuracyMeters: 8.5,
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Dynamic QR Scanner')),
      body: Column(
        children: [
          Expanded(
            flex: 4,
            child: Container(
              color: Colors.black,
              child: Center(
                child: Container(
                  width: 250,
                  height: 250,
                  decoration: BoxDecoration(
                    border: Border.all(color: const Color(0xFF22C55E), width: 3),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      const Icon(Icons.qr_code_2, size: 100, color: Colors.white24),
                      if (_processing)
                        const CircularProgressIndicator(color: Color(0xFF22C55E)),
                    ],
                  ),
                ),
              ),
            ),
          ),
          Expanded(
            flex: 2,
            child: Container(
              padding: const EdgeInsets.all(24),
              color: const Color(0xFF0F172A),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    _stepStatus,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 13, color: Colors.grey, fontWeight: FontWeight.w500),
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton.icon(
                    onPressed: _processing ? null : _simulateScanAndSubmit,
                    icon: const Icon(Icons.camera_alt, color: Colors.black),
                    label: const Text('Capture Dynamic QR Code', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.black)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF22C55E),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
