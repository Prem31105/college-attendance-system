import 'package:flutter/material.dart';
import '../core/services/api_service.dart';
import 'dispute_conversation_screen.dart';
import 'attendance_history_screen.dart';

class AttendanceCorrectionScreen extends StatefulWidget {
  const AttendanceCorrectionScreen({super.key});

  @override
  State<AttendanceCorrectionScreen> createState() => _AttendanceCorrectionScreenState();
}

class _AttendanceCorrectionScreenState extends State<AttendanceCorrectionScreen> {
  List<Map<String, dynamic>> _disputes = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadDisputes();
  }

  Future<void> _loadDisputes() async {
    setState(() => _loading = true);
    final disputes = await ApiService().getStudentDisputes();
    if (mounted) {
      setState(() {
        _disputes = disputes;
        _loading = false;
      });
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'RESOLVED':
        return const Color(0xFF22C55E);
      case 'UNDER_REVIEW':
        return const Color(0xFF38BDF8);
      case 'REJECTED':
        return const Color(0xFFEF4444);
      case 'PENDING':
      default:
        return const Color(0xFFF59E0B);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Attendance Disputes'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadDisputes,
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadDisputes,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Information Header Banner
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
                      ),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFF334155)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.shield_outlined, color: Color(0xFF38BDF8), size: 20),
                            SizedBox(width: 8),
                            Text(
                              'Dispute & Resolution Center',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'If you were present in the classroom but marked absent, file a dispute from your Attendance History to discuss and resolve it directly with your course teacher.',
                          style: TextStyle(fontSize: 12, color: Colors.white70, height: 1.4),
                        ),
                        const SizedBox(height: 12),
                        ElevatedButton.icon(
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => const AttendanceHistoryScreen()),
                            ).then((_) => _loadDisputes());
                          },
                          icon: const Icon(Icons.history, size: 16),
                          label: const Text('Go to Attendance History to Dispute'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF22C55E),
                            foregroundColor: Colors.black,
                            textStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  const Text(
                    'Your Active & Past Disputes',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  const SizedBox(height: 12),

                  if (_disputes.isEmpty)
                    const Card(
                      child: Padding(
                        padding: EdgeInsets.all(24.0),
                        child: Column(
                          children: [
                            Icon(Icons.forum_outlined, size: 40, color: Colors.grey),
                            SizedBox(height: 10),
                            Text(
                              'No disputes filed yet.',
                              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
                            ),
                            SizedBox(height: 4),
                            Text(
                              'All your attendance records are up to date.',
                              style: TextStyle(fontSize: 12, color: Colors.grey),
                            ),
                          ],
                        ),
                      ),
                    )
                  else
                    ..._disputes.map((d) {
                      final status = d['status'] as String? ?? 'PENDING';
                      final subject = d['session']?['subject']?['code'] ?? 'Subject';
                      final teacherUser = d['teacher']?['user'];
                      final teacherName = teacherUser != null
                          ? 'Prof. ${teacherUser['firstName']} ${teacherUser['lastName']}'
                          : 'Instructor';
                      final messages = (d['messages'] as List?) ?? [];
                      final lastMsg = messages.isNotEmpty ? messages.last['message'] : d['reason'];

                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: InkWell(
                          borderRadius: BorderRadius.circular(12),
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => DisputeConversationScreen(
                                  disputeId: d['id'],
                                  initialData: d,
                                ),
                              ),
                            ).then((_) => _loadDisputes());
                          },
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      subject,
                                      style: const TextStyle(
                                        fontSize: 15,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white,
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: _getStatusColor(status).withValues(alpha: 0.15),
                                        borderRadius: BorderRadius.circular(6),
                                        border: Border.all(color: _getStatusColor(status).withValues(alpha: 0.4)),
                                      ),
                                      child: Text(
                                        status.replaceAll('_', ' '),
                                        style: TextStyle(
                                          color: _getStatusColor(status),
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  teacherName,
                                  style: const TextStyle(fontSize: 12, color: Colors.white70),
                                ),
                                const SizedBox(height: 10),
                                Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF1E293B),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.chat_bubble_outline, size: 14, color: Colors.grey),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          lastMsg?.toString() ?? '',
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(fontSize: 12, color: Colors.white70),
                                        ),
                                      ),
                                      const Icon(Icons.chevron_right, size: 16, color: Colors.grey),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    }),
                ],
              ),
            ),
    );
  }
}
