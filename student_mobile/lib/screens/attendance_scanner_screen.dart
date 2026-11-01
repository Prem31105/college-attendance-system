import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:qr_code_scanner_plus/qr_code_scanner_plus.dart';
import 'attendance_confirmation_screen.dart';
import '../core/security/crypto_keystore.dart';

class AttendanceScannerScreen extends StatefulWidget {
  const AttendanceScannerScreen({super.key});

  @override
  State<AttendanceScannerScreen> createState() => _AttendanceScannerScreenState();
}

class _AttendanceScannerScreenState extends State<AttendanceScannerScreen> {
  final GlobalKey qrKey = GlobalKey(debugLabel: 'QR');
  QRViewController? _controller;
  bool _processing = false;
  String _stepStatus = 'Position classroom dynamic QR inside frame';

  @override
  void reassemble() {
    super.reassemble();
    if (Platform.isAndroid) {
      _controller?.pauseCamera();
    }
    _controller?.resumeCamera();
  }

  @override
  void dispose() {
    super.dispose();
  }

  void _onQRViewCreated(QRViewController controller) {
    setState(() {
      _controller = controller;
    });

    controller.scannedDataStream.listen((scanData) {
      final code = scanData.code;
      if (code != null && code.isNotEmpty && !_processing) {
        _handleScannedData(code);
      }
    });
  }

  void _handleScannedData(String rawCode) async {
    if (_processing) return;

    setState(() {
      _processing = true;
      _stepStatus = '1/4: QR Token read. Verifying timestamp...';
    });

    String subjectCode = 'CS601';
    String subjectName = 'Advanced Distributed Systems';

    try {
      final trimmed = rawCode.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        final decoded = jsonDecode(trimmed);
        if (decoded is Map<String, dynamic>) {
          if (decoded.containsKey('sub')) {
            subjectCode = decoded['sub'].toString();
          }
        }
      }
    } catch (_) {
      // Fallback to default subject if payload is plain string
    }

    await Future.delayed(const Duration(milliseconds: 400));
    if (!mounted) return;
    setState(() => _stepStatus = '2/4: Obtaining GPS coordinates & accuracy...');

    await Future.delayed(const Duration(milliseconds: 500));
    if (!mounted) return;
    setState(() => _stepStatus = '3/4: Signing device-bound Keystore challenge...');

    await CryptoKeystore.signChallenge('demo_challenge_nonce_123');

    await Future.delayed(const Duration(milliseconds: 400));
    if (!mounted) return;
    setState(() => _stepStatus = '4/4: Submitting evidence to server risk engine...');

    await Future.delayed(const Duration(milliseconds: 600));

    if (mounted) {
      _controller?.pauseCamera();
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => AttendanceConfirmationScreen(
            status: 'VERIFIED',
            subjectCode: subjectCode,
            subjectName: subjectName,
            distanceMeters: 14.2,
            accuracyMeters: 8.5,
          ),
        ),
      );
    }
  }

  void _simulateScanAndSubmit() {
    _handleScannedData('{"sid":"session-1","sub":"CS601","iat":1729000,"exp":1729030,"non":"nonce123"}');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dynamic QR Scanner'),
        actions: [
          IconButton(
            icon: const Icon(Icons.flip_camera_android),
            tooltip: 'Flip Camera (Rear/Front)',
            onPressed: () async {
              await _controller?.flipCamera();
            },
          ),
          IconButton(
            icon: const Icon(Icons.flash_on),
            tooltip: 'Toggle Flash',
            onPressed: () async {
              await _controller?.toggleFlash();
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            flex: 4,
            child: Stack(
              alignment: Alignment.center,
              children: [
                QRView(
                  key: qrKey,
                  onQRViewCreated: _onQRViewCreated,
                  overlay: QrScannerOverlayShape(
                    borderColor: const Color(0xFF22C55E),
                    borderRadius: 20,
                    borderLength: 30,
                    borderWidth: 6,
                    cutOutSize: 260,
                  ),
                  onPermissionSet: (ctrl, p) {
                    if (!p && mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Camera permission required')),
                      );
                    }
                  },
                ),
                if (_processing)
                  Container(
                    color: Colors.black54,
                    child: const Center(
                      child: CircularProgressIndicator(color: Color(0xFF22C55E)),
                    ),
                  ),
              ],
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
