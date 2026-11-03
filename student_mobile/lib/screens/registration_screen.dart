import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../core/security/security_utils.dart';
import '../core/security/crypto_keystore.dart';
import '../core/services/api_service.dart';

class RegistrationScreen extends StatefulWidget {
  const RegistrationScreen({super.key});

  @override
  State<RegistrationScreen> createState() => _RegistrationScreenState();
}

class _RegistrationScreenState extends State<RegistrationScreen> {
  final _rollController = TextEditingController(text: 'CS2026-001');
  final _emailController = TextEditingController(text: 'aarav.sharma@college.edu');
  final _regNumberController = TextEditingController(text: '202698765432');
  final _passwordController = TextEditingController();

  bool _obscurePassword = true;
  bool _enrolling = false;
  PasswordStrength _strength = PasswordStrength.weak;
  String? _rollError;
  String? _emailError;
  String? _regError;

  @override
  void initState() {
    super.initState();
    _passwordController.addListener(_onPasswordChanged);
  }

  @override
  void dispose() {
    _passwordController.removeListener(_onPasswordChanged);
    _passwordController.dispose();
    _rollController.dispose();
    _emailController.dispose();
    _regNumberController.dispose();
    super.dispose();
  }

  void _onPasswordChanged() {
    setState(() {
      _strength = CredentialValidator.evaluatePasswordStrength(_passwordController.text);
    });
  }

  void _generateStrongPassword() {
    final generated = PasswordGenerator.generateStrongPassword(length: 16);
    setState(() {
      _passwordController.text = generated;
      _obscurePassword = false;
    });
    Clipboard.setData(ClipboardData(text: generated));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Strong password generated and copied to clipboard!'),
        backgroundColor: Color(0xFF22C55E),
      ),
    );
  }

  void _enrollDeviceAndActivate() async {
    final roll = _rollController.text.trim();
    final email = _emailController.text.trim();
    final reg = _regNumberController.text.trim();
    final pass = _passwordController.text;

    bool hasError = false;

    if (!CredentialValidator.isValidRollNumber(roll)) {
      _rollError = 'Format must be CS2026-001';
      hasError = true;
    } else {
      _rollError = null;
    }

    if (!CredentialValidator.isValidInstitutionalEmail(email)) {
      _emailError = 'Must end with @college.edu';
      hasError = true;
    } else {
      _emailError = null;
    }

    if (!CredentialValidator.isValidRegistrationNumber(reg)) {
      _regError = 'Must be at least 8 digits';
      hasError = true;
    } else {
      _regError = null;
    }

    if (pass.length < 8) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Password must be at least 8 characters long')),
      );
      hasError = true;
    }

    if (hasError) {
      setState(() {});
      return;
    }

    setState(() => _enrolling = true);

    try {
      // Cryptographic device key generation and retrieval
      final publicKeyPem = await CryptoKeystore.getOrCreatePublicKeyPem();

      final result = await ApiService().registerStudent(
        email: email,
        rollNumber: roll,
        registrationNumber: reg,
        password: pass,
        publicKeyPem: publicKeyPem,
      );

      if (!mounted) return;
      setState(() => _enrolling = false);

      if (result['success'] == true) {
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            backgroundColor: const Color(0xFF1E293B),
            title: const Row(
              children: [
                Icon(Icons.verified, color: Color(0xFF22C55E)),
                SizedBox(width: 8),
                Text('Device Bound & Registered', style: TextStyle(color: Colors.white, fontSize: 18)),
              ],
            ),
            content: Text(
              'Hardware ECDSA P-256 keypair successfully registered on server for account $roll ($email). You can now sign in on this device.',
              style: const TextStyle(color: Colors.grey, fontSize: 13),
            ),
            actions: [
              ElevatedButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  Navigator.pop(context);
                },
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF22C55E), foregroundColor: Colors.black),
                child: const Text('Back to Sign In'),
              ),
            ],
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['error'] ?? 'Registration failed'),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _enrolling = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Registration error: $e'),
          backgroundColor: Colors.redAccent,
        ),
      );
    }
  }

  Color _getStrengthColor() {
    switch (_strength) {
      case PasswordStrength.weak:
        return Colors.redAccent;
      case PasswordStrength.fair:
        return Colors.orangeAccent;
      case PasswordStrength.good:
        return const Color(0xFF3B82F6);
      case PasswordStrength.strong:
        return const Color(0xFF22C55E);
    }
  }

  String _getStrengthText() {
    switch (_strength) {
      case PasswordStrength.weak:
        return 'Weak';
      case PasswordStrength.fair:
        return 'Fair';
      case PasswordStrength.good:
        return 'Good';
      case PasswordStrength.strong:
        return 'Strong';
    }
  }

  double _getStrengthValue() {
    switch (_strength) {
      case PasswordStrength.weak:
        return 0.25;
      case PasswordStrength.fair:
        return 0.50;
      case PasswordStrength.good:
        return 0.75;
      case PasswordStrength.strong:
        return 1.0;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(title: const Text('Account & Device Activation')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: AutofillGroup(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Security Info Banner
              Container(
                padding: const EdgeInsets.all(16.0),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFF22C55E).withValues(alpha: 0.3)),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.shield_outlined, color: Color(0xFF22C55E), size: 32),
                    SizedBox(width: 14),
                    Expanded(
                      child: Text(
                        'Hardware Keystore Binding: A hardware-backed ECDSA P-256 cryptographic key will be permanently registered for this device.',
                        style: TextStyle(fontSize: 12, color: Colors.grey, height: 1.4),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Roll Number
              TextField(
                controller: _rollController,
                autofillHints: const [AutofillHints.username],
                decoration: InputDecoration(
                  labelText: 'Roll Number',
                  hintText: 'CS2026-001',
                  errorText: _rollError,
                  prefixIcon: const Icon(Icons.badge_outlined),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  filled: true,
                  fillColor: const Color(0xFF1E293B),
                ),
              ),
              const SizedBox(height: 16),

              // Institutional Email
              TextField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                autofillHints: const [AutofillHints.email],
                decoration: InputDecoration(
                  labelText: 'Institutional Email',
                  hintText: 'student@college.edu',
                  errorText: _emailError,
                  prefixIcon: const Icon(Icons.email_outlined),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  filled: true,
                  fillColor: const Color(0xFF1E293B),
                ),
              ),
              const SizedBox(height: 16),

              // Registration Number
              TextField(
                controller: _regNumberController,
                keyboardType: TextInputType.number,
                autofillHints: const [AutofillHints.telephoneNumber],
                decoration: InputDecoration(
                  labelText: 'University Registration Number',
                  hintText: '202698765432',
                  errorText: _regError,
                  prefixIcon: const Icon(Icons.confirmation_number_outlined),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  filled: true,
                  fillColor: const Color(0xFF1E293B),
                ),
              ),
              const SizedBox(height: 16),

              // Password Input with Generator
              TextField(
                controller: _passwordController,
                obscureText: _obscurePassword,
                autofillHints: const [AutofillHints.newPassword],
                decoration: InputDecoration(
                  labelText: 'Set Password',
                  prefixIcon: const Icon(Icons.lock_outline),
                  suffixIcon: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.auto_fix_high, color: Color(0xFF22C55E)),
                        tooltip: 'Generate Strong Password',
                        onPressed: _generateStrongPassword,
                      ),
                      IconButton(
                        icon: Icon(_obscurePassword ? Icons.visibility_off : Icons.visibility),
                        onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                      ),
                    ],
                  ),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  filled: true,
                  fillColor: const Color(0xFF1E293B),
                ),
              ),
              const SizedBox(height: 8),

              // Password Strength Indicator
              if (_passwordController.text.isNotEmpty) ...[
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Strength: ${_getStrengthText()}',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: _getStrengthColor())),
                      Text('${_passwordController.text.length} chars',
                          style: const TextStyle(fontSize: 11, color: Colors.grey)),
                    ],
                  ),
                ),
                const SizedBox(height: 4),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: _getStrengthValue(),
                    backgroundColor: const Color(0xFF334155),
                    color: _getStrengthColor(),
                    minHeight: 6,
                  ),
                ),
                const SizedBox(height: 12),
              ],

              // Action: Generate Strong Password Button
              OutlinedButton.icon(
                onPressed: _generateStrongPassword,
                icon: const Icon(Icons.key, size: 18),
                label: const Text('Generate Strong Password & Copy'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFF22C55E),
                  side: const BorderSide(color: Color(0xFF22C55E)),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 24),

              // Enroll & Activate Button
              ElevatedButton(
                onPressed: _enrolling ? null : _enrollDeviceAndActivate,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF22C55E),
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: _enrolling
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                    : const Text('Enroll Device & Activate Account', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
