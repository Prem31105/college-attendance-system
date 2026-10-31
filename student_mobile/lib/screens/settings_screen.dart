import 'package:flutter/material.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _biometricEnabled = true;
  bool _notificationsEnabled = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Column(
              children: [
                SwitchListTile(
                  value: _biometricEnabled,
                  onChanged: (val) => setState(() => _biometricEnabled = val),
                  title: const Text('Biometric Quick Authentication', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  subtitle: const Text('Authorize attendance submission using device fingerprint or Face ID', style: TextStyle(fontSize: 12, color: Colors.grey)),
                  activeColor: const Color(0xFF22C55E),
                ),
                const Divider(height: 1),
                SwitchListTile(
                  value: _notificationsEnabled,
                  onChanged: (val) => setState(() => _notificationsEnabled = val),
                  title: const Text('Attendance Alerts & Verification', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  subtitle: const Text('Receive active session alerts and random physical check calls', style: TextStyle(fontSize: 12, color: Colors.grey)),
                  activeColor: const Color(0xFF22C55E),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          const Card(
            child: Padding(
              padding: EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Security Architecture & Privacy', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.white)),
                  SizedBox(height: 8),
                  Text(
                    '• Face recognition & selfie verification are strictly disabled by policy.\n'
                    '• Background location tracking is never performed; coordinates are captured only at the exact moment of QR submission.\n'
                    '• Biometric credentials are authenticated directly by the operating system and never transmitted.',
                    style: TextStyle(fontSize: 12, color: Colors.grey, height: 1.5),
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
