import 'package:flutter/material.dart';
import '../core/services/api_service.dart';
import 'dispute_conversation_screen.dart';

class AttendanceHistoryScreen extends StatefulWidget {
  const AttendanceHistoryScreen({super.key});

  @override
  State<AttendanceHistoryScreen> createState() => _AttendanceHistoryScreenState();
}

class _AttendanceHistoryScreenState extends State<AttendanceHistoryScreen> {
  List<Map<String, dynamic>> _history = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    setState(() => _loading = true);
    final history = await ApiService().getAttendanceHistory();
    if (mounted) {
      setState(() {
        _history = history;
        _loading = false;
      });
    }
  }

  void _openDisputeModal(Map<String, dynamic> item) {
    final reasonController = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF0F172A),
        title: Text(
          'Dispute Absent Status: ${item['subjectCode']}',
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${item['subjectName']}',
              style: const TextStyle(fontSize: 13, color: Colors.white70),
            ),
            const SizedBox(height: 4),
            Text(
              'Instructor: ${item['teacherName']} • ${item['classroomName']}',
              style: const TextStyle(fontSize: 12, color: Colors.grey),
            ),
            const SizedBox(height: 16),
            const Text(
              'Please provide a detailed explanation of why your attendance should be verified (e.g. classroom seat location, technical issue):',
              style: TextStyle(fontSize: 12, color: Colors.white60),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: reasonController,
              maxLines: 3,
              style: const TextStyle(color: Colors.white, fontSize: 13),
              decoration: InputDecoration(
                hintText: 'e.g., I attended the lecture in Room 401, seated near the front row...',
                hintStyle: const TextStyle(color: Colors.grey, fontSize: 12),
                filled: true,
                fillColor: const Color(0xFF1E293B),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: Color(0xFF334155)),
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF22C55E),
              foregroundColor: Colors.black,
            ),
            onPressed: () async {
              final reason = reasonController.text.trim();
              if (reason.length < 5) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Reason must be at least 5 characters long.')),
                );
                return;
              }
              Navigator.pop(ctx);
              final res = await ApiService().createDispute(
                sessionId: item['sessionId'],
                recordId: item['recordId'],
                reason: reason,
              );
              if (mounted) {
                if (res['success'] == true) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Dispute submitted successfully to your instructor.'),
                      backgroundColor: Color(0xFF22C55E),
                    ),
                  );
                  await _loadHistory();
                  if (!mounted) return;
                  final disputeData = res['data'];
                  if (disputeData != null && disputeData['id'] != null) {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => DisputeConversationScreen(disputeId: disputeData['id']),
                      ),
                    );
                  }
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(res['error'] ?? 'Failed to submit dispute'),
                      backgroundColor: Colors.redAccent,
                    ),
                  );
                }
              }
            },
            child: const Text('Submit Dispute', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Color _getBadgeColor(String status) {
    switch (status) {
      case 'VERIFIED':
        return const Color(0xFF22C55E);
      case 'ABSENT':
        return const Color(0xFFEF4444);
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
        title: const Text('Attendance History'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadHistory,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _history.isEmpty
              ? const Center(
                  child: Text(
                    'No past attendance sessions found.',
                    style: TextStyle(color: Colors.grey),
                  ),
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: _history.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final h = _history[index];
                    final isVerified = h['status'] == 'VERIFIED';
                    final dispute = h['dispute'];
                    final dateStr = h['sessionDate'] != null
                        ? DateTime.tryParse(h['sessionDate'].toString())?.toLocal().toString().substring(0, 16) ??
                            h['sessionDate'].toString()
                        : 'Recent';

                    return Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        '${h['subjectCode']}: ${h['subjectName']}',
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 14,
                                          color: Colors.white,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        '$dateStr • ${h['classroomName']}',
                                        style: const TextStyle(color: Colors.grey, fontSize: 12),
                                      ),
                                    ],
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: _getBadgeColor(h['status']).withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(color: _getBadgeColor(h['status']).withValues(alpha: 0.4)),
                                  ),
                                  child: Text(
                                    h['status'] as String,
                                    style: TextStyle(
                                      color: _getBadgeColor(h['status']),
                                      fontWeight: FontWeight.bold,
                                      fontSize: 11,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Teacher: ${h['teacherName']}',
                              style: const TextStyle(color: Colors.white60, fontSize: 12),
                            ),
                            if (!isVerified) ...[
                              const Divider(height: 20, color: Color(0xFF334155)),
                              if (dispute != null) ...[
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Row(
                                      children: [
                                        Icon(
                                          Icons.chat_bubble_outline,
                                          size: 16,
                                          color: _getBadgeColor(dispute['status']),
                                        ),
                                        const SizedBox(width: 6),
                                        Text(
                                          'Dispute ${dispute['status']}',
                                          style: TextStyle(
                                            color: _getBadgeColor(dispute['status']),
                                            fontWeight: FontWeight.bold,
                                            fontSize: 12,
                                          ),
                                        ),
                                      ],
                                    ),
                                    TextButton.icon(
                                      onPressed: () {
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (_) => DisputeConversationScreen(
                                              disputeId: dispute['id'],
                                            ),
                                          ),
                                        ).then((_) => _loadHistory());
                                      },
                                      icon: const Icon(Icons.forum, size: 16, color: Color(0xFF38BDF8)),
                                      label: const Text(
                                        'View Discussion',
                                        style: TextStyle(color: Color(0xFF38BDF8), fontSize: 12),
                                      ),
                                    ),
                                  ],
                                ),
                              ] else ...[
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Text(
                                      'Marked absent for this session',
                                      style: TextStyle(color: Colors.grey, fontSize: 12),
                                    ),
                                    ElevatedButton.icon(
                                      onPressed: () => _openDisputeModal(h),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: const Color(0xFFF59E0B),
                                        foregroundColor: Colors.black,
                                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                      ),
                                      icon: const Icon(Icons.report_problem_outlined, size: 14),
                                      label: const Text(
                                        'Report Incorrect',
                                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ],
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
