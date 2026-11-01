import 'dart:async';
import 'dart:math';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

enum PasswordStrength { weak, fair, good, strong }

class CredentialValidator {
  static const String institutionalDomain = '@college.edu';

  static bool isValidInstitutionalEmail(String email) {
    final trimmed = email.trim().toLowerCase();
    if (!trimmed.endsWith(institutionalDomain)) return false;
    final username = trimmed.substring(0, trimmed.length - institutionalDomain.length);
    if (username.isEmpty) return false;
    final emailRegex = RegExp(r'^[a-zA-Z0-9._%+-]+$');
    return emailRegex.hasMatch(username);
  }

  static bool isValidRollNumber(String roll) {
    final trimmed = roll.trim().toUpperCase();
    final rollRegex = RegExp(r'^[A-Z]{2,4}[0-9]{4}-[0-9]{3,4}$');
    return rollRegex.hasMatch(trimmed);
  }

  static bool isValidRegistrationNumber(String reg) {
    final trimmed = reg.trim();
    return trimmed.length >= 8 && RegExp(r'^[0-9]+$').hasMatch(trimmed);
  }

  static PasswordStrength evaluatePasswordStrength(String password) {
    if (password.length < 8) return PasswordStrength.weak;

    int score = 0;
    if (password.contains(RegExp(r'[a-z]'))) score++;
    if (password.contains(RegExp(r'[A-Z]'))) score++;
    if (password.contains(RegExp(r'[0-9]'))) score++;
    if (password.contains(RegExp(r'[@#$%^&*!_\-+=?]'))) score++;
    if (password.length >= 12) score++;

    if (score <= 2) return PasswordStrength.weak;
    if (score == 3) return PasswordStrength.fair;
    if (score == 4) return PasswordStrength.good;
    return PasswordStrength.strong;
  }
}

class PasswordGenerator {
  static const String _lowercase = 'abcdefghjkmnpqrstuvwxyz';
  static const String _uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  static const String _numbers = '23456789';
  static const String _symbols = r'@#$%&*!+=?';
  static const String _allChars = _lowercase + _uppercase + _numbers + _symbols;

  static String generateStrongPassword({int length = 14}) {
    final rand = Random.secure();
    final chars = <String>[];

    // Ensure at least one character from each set
    chars.add(_lowercase[rand.nextInt(_lowercase.length)]);
    chars.add(_uppercase[rand.nextInt(_uppercase.length)]);
    chars.add(_numbers[rand.nextInt(_numbers.length)]);
    chars.add(_symbols[rand.nextInt(_symbols.length)]);

    for (int i = chars.length; i < length; i++) {
      chars.add(_allChars[rand.nextInt(_allChars.length)]);
    }

    chars.shuffle(rand);
    return chars.join('');
  }
}

class TokenManager {
  static const _storage = FlutterSecureStorage();
  static const _keyAccessToken = 'auth_access_token';
  static const _keyRefreshToken = 'auth_refresh_token';
  static const _keyUserRole = 'auth_user_role';
  static const _keyUserEmail = 'auth_user_email';
  static const _keyOnboardingDone = 'onboarding_completed';

  static Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
    required String role,
    required String email,
  }) async {
    await _storage.write(key: _keyAccessToken, value: accessToken);
    await _storage.write(key: _keyRefreshToken, value: refreshToken);
    await _storage.write(key: _keyUserRole, value: role);
    await _storage.write(key: _keyUserEmail, value: email);
  }

  static Future<String?> getAccessToken() async {
    try {
      return await _storage.read(key: _keyAccessToken).timeout(const Duration(milliseconds: 500));
    } catch (_) {
      return null;
    }
  }

  static Future<String?> getRefreshToken() async {
    try {
      return await _storage.read(key: _keyRefreshToken).timeout(const Duration(milliseconds: 500));
    } catch (_) {
      return null;
    }
  }

  static Future<String?> getUserRole() async {
    try {
      return await _storage.read(key: _keyUserRole).timeout(const Duration(milliseconds: 500));
    } catch (_) {
      return null;
    }
  }

  static Future<String?> getUserEmail() async {
    try {
      return await _storage.read(key: _keyUserEmail).timeout(const Duration(milliseconds: 500));
    } catch (_) {
      return null;
    }
  }

  static Future<bool> isOnboardingCompleted() async {
    try {
      final val = await _storage.read(key: _keyOnboardingDone).timeout(const Duration(milliseconds: 500));
      return val == 'true';
    } catch (_) {
      return true;
    }
  }

  static Future<void> setOnboardingCompleted() async {
    await _storage.write(key: _keyOnboardingDone, value: 'true');
  }

  static Future<void> clearSession() async {
    await _storage.delete(key: _keyAccessToken);
    await _storage.delete(key: _keyRefreshToken);
    await _storage.delete(key: _keyUserRole);
    await _storage.delete(key: _keyUserEmail);
  }
}

class SessionInactivityWatcher {
  static Timer? _timer;
  static const Duration timeoutDuration = Duration(minutes: 15);
  static void Function()? onTimeout;

  static void userActivityDetected() {
    _timer?.cancel();
    _timer = Timer(timeoutDuration, () {
      if (onTimeout != null) {
        onTimeout!();
      }
    });
  }

  static void stop() {
    _timer?.cancel();
    _timer = null;
  }
}
