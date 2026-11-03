import 'dart:async';
import 'package:flutter/material.dart';
import '../core/services/api_service.dart';

class DisputeConversationScreen extends StatefulWidget {
  final String disputeId;
  final Map<String, dynamic>? initialData;

  const DisputeConversationScreen({
    super.key,
    required this.disputeId,
    this.initialData,
  });

  @override
  State<DisputeConversationScreen> createState() => _DisputeConversationScreenState();
}

class _DisputeConversationScreenState extends State<DisputeConversationScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  Map<String, dynamic>? _dispute;
  bool _loading = true;
  bool _sending = false;
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    _dispute = widget.initialData;
    _fetchDetails();
    _pollTimer = Timer.periodic(const Duration(seconds: 4), (_) => _fetchDetails(silent: true));
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _fetchDetails({bool silent = false}) async {
    if (!silent) setState(() => _loading = true);
    final data = await ApiService().getDisputeById(widget.disputeId);
    if (mounted) {
      setState(() {
        if (data != null) _dispute = data;
        _loading = false;
      });
    }
  }

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty || _sending) return;

    setState(() => _sending = true);
    final res = await ApiService().sendDisputeMessage(widget.disputeId, text);
    if (!mounted) return;

    setState(() => _sending = false);
    if (res['success'] == true) {
      _messageController.clear();
      await _fetchDetails(silent: true);
      // Scroll to bottom
      Future.delayed(const Duration(milliseconds: 200), () {
        if (_scrollController.hasClients) {
          _scrollController.animateTo(
            _scrollController.position.maxScrollExtent,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOut,
          );
        }
      });
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['error'] ?? 'Failed to send message'),
          backgroundColor: Colors.redAccent,
        ),
      );
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'RESOLVED':
        return const Color(0xFF22C55E); // emerald
      case 'UNDER_REVIEW':
        return const Color(0xFF38BDF8); // sky
      case 'REJECTED':
        return const Color(0xFFEF4444); // red
      case 'PENDING':
      default:
        return const Color(0xFFF59E0B); // amber
    }
  }

  @override
  Widget build(BuildContext context) {
    final status = _dispute?['status'] ?? 'PENDING';
    final isClosed = status == 'RESOLVED' || status == 'REJECTED';
    final subjectCode = _dispute?['session']?['subject']?['code'] ?? 'Subject';
    final subjectName = _dispute?['session']?['subject']?['name'] ?? '';
    final teacherUser = _dispute?['teacher']?['user'];
    final teacherName = teacherUser != null ? 'Prof. ${teacherUser['firstName']} ${teacherUser['lastName']}' : 'Instructor';
    final classroom = _dispute?['session']?['classroom']?['name'] ?? 'Classroom';
    final messages = (_dispute?['messages'] as List?) ?? [];

    return Scaffold(
      appBar: AppBar(
        title: Text('Dispute: $subjectCode'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => _fetchDetails(),
            tooltip: 'Refresh Discussion',
          ),
        ],
      ),
      body: _loading && _dispute == null
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Status Header
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: _getStatusColor(status).withValues(alpha: 0.12),
                    border: Border(
                      bottom: BorderSide(color: _getStatusColor(status).withValues(alpha: 0.3)),
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: _getStatusColor(status),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          status.replaceAll('_', ' '),
                          style: const TextStyle(
                            color: Colors.black,
                            fontWeight: FontWeight.bold,
                            fontSize: 11,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              subjectName.isNotEmpty ? subjectName : subjectCode,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                                color: Colors.white,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              '$teacherName • $classroom',
                              style: const TextStyle(fontSize: 11, color: Colors.white70),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // Resolution / Rejection Banner
                if (status == 'RESOLVED')
                  Container(
                    width: double.infinity,
                    margin: const EdgeInsets.all(12),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF22C55E).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFF22C55E).withValues(alpha: 0.5)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.check_circle, color: Color(0xFF22C55E), size: 24),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Attendance Approved & Updated to VERIFIED',
                                style: TextStyle(
                                  color: Color(0xFF22C55E),
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                ),
                              ),
                              if (_dispute?['resolutionNote'] != null)
                                Padding(
                                  padding: const EdgeInsets.only(top: 2),
                                  child: Text(
                                    'Note: ${_dispute!['resolutionNote']}',
                                    style: const TextStyle(color: Colors.white70, fontSize: 11),
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                if (status == 'REJECTED')
                  Container(
                    width: double.infinity,
                    margin: const EdgeInsets.all(12),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEF4444).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFEF4444).withValues(alpha: 0.5)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.cancel, color: Color(0xFFEF4444), size: 24),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Dispute Rejected by Instructor',
                                style: TextStyle(
                                  color: Color(0xFFEF4444),
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                ),
                              ),
                              if (_dispute?['resolutionNote'] != null)
                                Padding(
                                  padding: const EdgeInsets.only(top: 2),
                                  child: Text(
                                    'Justification: ${_dispute!['resolutionNote']}',
                                    style: const TextStyle(color: Colors.white70, fontSize: 11),
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                // Conversation Message List
                Expanded(
                  child: messages.isEmpty
                      ? const Center(
                          child: Text(
                            'No messages yet. Send a response to your teacher below.',
                            style: TextStyle(color: Colors.grey, fontSize: 13),
                          ),
                        )
                      : ListView.builder(
                          controller: _scrollController,
                          padding: const EdgeInsets.all(16),
                          itemCount: messages.length,
                          itemBuilder: (context, index) {
                            final m = messages[index];
                            final senderRole = m['sender']?['role'] ?? '';
                            final isStudentMsg = senderRole == 'STUDENT';
                            final senderName = m['sender'] != null
                                ? (isStudentMsg
                                    ? 'You'
                                    : 'Prof. ${m['sender']['lastName']}')
                                : (isStudentMsg ? 'You' : 'Teacher');

                            return Align(
                              alignment: isStudentMsg ? Alignment.centerRight : Alignment.centerLeft,
                              child: Container(
                                margin: const EdgeInsets.only(bottom: 12),
                                constraints: BoxConstraints(
                                  maxWidth: MediaQuery.of(context).size.width * 0.78,
                                ),
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                decoration: BoxDecoration(
                                  color: isStudentMsg
                                      ? const Color(0xFF1E3A8A)
                                      : const Color(0xFF334155),
                                  borderRadius: BorderRadius.only(
                                    topLeft: const Radius.circular(14),
                                    topRight: const Radius.circular(14),
                                    bottomLeft: Radius.circular(isStudentMsg ? 14 : 2),
                                    bottomRight: Radius.circular(isStudentMsg ? 2 : 14),
                                  ),
                                  border: Border.all(
                                    color: isStudentMsg
                                        ? const Color(0xFF3B82F6)
                                        : const Color(0xFF475569),
                                  ),
                                ),
                                child: Column(
                                  crossAxisAlignment:
                                      isStudentMsg ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Text(
                                          senderName,
                                          style: TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 11,
                                            color: isStudentMsg
                                                ? const Color(0xFF93C5FD)
                                                : const Color(0xFF38BDF8),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      m['message'] ?? '',
                                      style: const TextStyle(fontSize: 13, color: Colors.white, height: 1.3),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                ),

                // Reply Input Bar
                if (!isClosed)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: const BoxDecoration(
                      color: Color(0xFF0F172A),
                      border: Border(top: BorderSide(color: Color(0xFF1E293B))),
                    ),
                    child: SafeArea(
                      child: Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _messageController,
                              textCapitalization: TextCapitalization.sentences,
                              minLines: 1,
                              maxLines: 4,
                              decoration: InputDecoration(
                                hintText: 'Message $teacherName...',
                                hintStyle: const TextStyle(color: Colors.grey, fontSize: 13),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                filled: true,
                                fillColor: const Color(0xFF1E293B),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(20),
                                  borderSide: BorderSide.none,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          _sending
                              ? const SizedBox(
                                  width: 40,
                                  height: 40,
                                  child: Padding(
                                    padding: EdgeInsets.all(8.0),
                                    child: CircularProgressIndicator(strokeWidth: 2),
                                  ),
                                )
                              : IconButton.filled(
                                  onPressed: _sendMessage,
                                  icon: const Icon(Icons.send_rounded, size: 20),
                                  style: IconButton.styleFrom(
                                    backgroundColor: const Color(0xFF22C55E),
                                    foregroundColor: Colors.black,
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
