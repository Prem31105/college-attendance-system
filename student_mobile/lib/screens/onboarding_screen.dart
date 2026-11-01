import 'package:flutter/material.dart';
import '../core/security/security_utils.dart';
import 'login_screen.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<Map<String, dynamic>> _slides = [
    {
      'icon': Icons.qr_code_scanner,
      'title': 'Dynamic Anti-Proxy QR',
      'subtitle': 'High-Security Rolling Tokens',
      'description':
          'Classroom sessions project cryptographically signed dynamic QR codes that refresh every 15 seconds with 30s validity, eliminating photo sharing and proxy scans.',
      'color': const Color(0xFF22C55E),
    },
    {
      'icon': Icons.radar,
      'title': '75m Classroom Geofence',
      'subtitle': 'Sub-20m Accuracy Boundary',
      'description':
          'Automated Haversine distance verification ensures you are physically present within the 75-meter boundary of the lecture hall with mock location spoofing detection.',
      'color': const Color(0xFF3B82F6),
    },
    {
      'icon': Icons.security,
      'title': 'Hardware-Bound Key',
      'subtitle': 'ECDSA P-256 Device Keystore',
      'description':
          'Your student account is uniquely bound to this physical phone. Every attendance mark signs a server challenge inside the secure enclave hardware.',
      'color': const Color(0xFFA855F7),
    },
  ];

  void _finishOnboarding() async {
    await TokenManager.setOnboardingCompleted();
    if (mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: SafeArea(
        child: Column(
          children: [
            // Top Bar with Skip Button
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'SmartCampus',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white),
                  ),
                  if (_currentPage < _slides.length - 1)
                    TextButton(
                      onPressed: _finishOnboarding,
                      child: const Text('Skip', style: TextStyle(color: Colors.grey)),
                    )
                  else
                    const SizedBox(height: 48),
                ],
              ),
            ),

            // Page View Carousel
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                itemCount: _slides.length,
                onPageChanged: (index) => setState(() => _currentPage = index),
                itemBuilder: (context, index) {
                  final slide = _slides[index];
                  return Center(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.all(24.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(24),
                            decoration: BoxDecoration(
                              color: (slide['color'] as Color).withValues(alpha: 0.12),
                              shape: BoxShape.circle,
                              border: Border.all(color: (slide['color'] as Color).withValues(alpha: 0.3), width: 2),
                            ),
                            child: Icon(
                              slide['icon'] as IconData,
                              size: 64,
                              color: slide['color'] as Color,
                            ),
                          ),
                          const SizedBox(height: 24),
                          Text(
                            slide['title'] as String,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            slide['subtitle'] as String,
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: slide['color'] as Color,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            slide['description'] as String,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              fontSize: 13,
                              height: 1.4,
                              color: Colors.grey,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),

            // Indicator Dots & Action Buttons
            Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(
                      _slides.length,
                      (index) => AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        width: _currentPage == index ? 24 : 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: _currentPage == index
                              ? (_slides[_currentPage]['color'] as Color)
                              : Colors.white24,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 28),
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: () {
                        if (_currentPage < _slides.length - 1) {
                          _pageController.nextPage(
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeInOut,
                          );
                        } else {
                          _finishOnboarding();
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _slides[_currentPage]['color'] as Color,
                        foregroundColor: Colors.black,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: Text(
                        _currentPage < _slides.length - 1 ? 'Next' : 'Get Started',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('Already onboarded? ', style: TextStyle(color: Colors.grey, fontSize: 13)),
                      TextButton(
                        onPressed: _finishOnboarding,
                        child: const Text('Sign In', style: TextStyle(color: Color(0xFF22C55E), fontSize: 13, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
