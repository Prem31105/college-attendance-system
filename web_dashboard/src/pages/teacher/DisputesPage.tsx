import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  AlertCircle,
  RefreshCw,
  User,
  BookOpen,
  Calendar,
  ShieldAlert,
} from 'lucide-react';

interface DisputeItem {
  id: string;
  studentId: string;
  teacherId: string;
  sessionId: string;
  attendanceRecordId: string | null;
  status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';
  reason: string;
  resolutionNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  student: {
    rollNumber: string;
    registrationNumber: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  session: {
    subject: {
      code: string;
      name: string;
    };
    classroom: {
      name: string;
    };
    startTime: string;
  };
  messages: Array<{
    id: string;
    senderId: string;
    message: string;
    createdAt: string;
    isRead: boolean;
    sender?: {
      id: string;
      firstName: string;
      lastName: string;
      role: string;
    };
  }>;
}

export const DisputesPage: React.FC = () => {
  const { user, accessToken } = useAuth();
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<DisputeItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED'>('ALL');
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchDisputes = useCallback(async () => {
    try {
      const token = accessToken || localStorage.getItem('access_token');
      const res = await fetch('http://localhost:3000/api/v1/disputes/teacher', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data: DisputeItem[] = await res.json();
        setDisputes(data);
        if (selectedDispute) {
          const updated = data.find((d) => d.id === selectedDispute.id);
          if (updated) setSelectedDispute(updated);
        }
      }
    } catch (_) {
    } finally {
      setLoading(false);
    }
  }, [accessToken, selectedDispute]);

  useEffect(() => {
    fetchDisputes();
    const interval = setInterval(fetchDisputes, 4000);
    return () => clearInterval(interval);
  }, [fetchDisputes]);

  const selectDisputeAndFetchDetails = async (dispute: DisputeItem) => {
    setSelectedDispute(dispute);
    try {
      const token = accessToken || localStorage.getItem('access_token');
      const res = await fetch(`http://localhost:3000/api/v1/disputes/${dispute.id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const full = await res.json();
        setSelectedDispute(full);
      }
    } catch (_) {}
  };

  const handleSendReply = async () => {
    if (!selectedDispute || !replyMessage.trim() || sendingReply) return;
    setSendingReply(true);
    try {
      const token = accessToken || localStorage.getItem('access_token');
      const res = await fetch(`http://localhost:3000/api/v1/disputes/${selectedDispute.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: replyMessage.trim() }),
      });
      if (res.ok) {
        setReplyMessage('');
        await selectDisputeAndFetchDetails(selectedDispute);
        await fetchDisputes();
      }
    } catch (_) {
    } finally {
      setSendingReply(false);
    }
  };

  const handleMarkUnderReview = async () => {
    if (!selectedDispute) return;
    setActionLoading(true);
    try {
      const token = accessToken || localStorage.getItem('access_token');
      const res = await fetch(`http://localhost:3000/api/v1/disputes/${selectedDispute.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: 'UNDER_REVIEW' }),
      });
      if (res.ok) {
        setSuccessMessage('Dispute marked under review.');
        setTimeout(() => setSuccessMessage(null), 3000);
        await selectDisputeAndFetchDetails(selectedDispute);
        await fetchDisputes();
      }
    } catch (_) {
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveDispute = async () => {
    if (!selectedDispute || actionLoading) return;
    setActionLoading(true);
    try {
      const token = accessToken || localStorage.getItem('access_token');
      const res = await fetch(`http://localhost:3000/api/v1/disputes/${selectedDispute.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ resolutionNote: 'Attendance verified in classroom; dispute approved.' }),
      });
      if (res.ok) {
        setSuccessMessage('Attendance dispute approved! Status updated to VERIFIED in PostgreSQL.');
        setTimeout(() => setSuccessMessage(null), 4000);
        await selectDisputeAndFetchDetails(selectedDispute);
        await fetchDisputes();
      }
    } catch (_) {
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectDispute = async () => {
    if (!selectedDispute || !rejectionReason.trim() || actionLoading) return;
    setActionLoading(true);
    try {
      const token = accessToken || localStorage.getItem('access_token');
      const res = await fetch(`http://localhost:3000/api/v1/disputes/${selectedDispute.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ rejectionReason: rejectionReason.trim() }),
      });
      if (res.ok) {
        setSuccessMessage('Dispute rejected with documented justification.');
        setRejectionModalOpen(false);
        setRejectionReason('');
        setTimeout(() => setSuccessMessage(null), 4000);
        await selectDisputeAndFetchDetails(selectedDispute);
        await fetchDisputes();
      }
    } catch (_) {
    } finally {
      setActionLoading(false);
    }
  };

  const filteredDisputes = disputes.filter((d) => {
    if (activeTab === 'ALL') return true;
    return d.status === activeTab;
  });

  const getStatusBadge = (status: DisputeItem['status']) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center space-x-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/30">
            <Clock className="h-3 w-3" />
            <span>Pending</span>
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center space-x-1 rounded-full bg-blue-500/15 px-2.5 py-0.5 text-xs font-semibold text-blue-400 border border-blue-500/30">
            <RefreshCw className="h-3 w-3" />
            <span>Under Review</span>
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center space-x-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-3 w-3" />
            <span>Approved & Present</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center space-x-1 rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-semibold text-red-400 border border-red-500/30">
            <XCircle className="h-3 w-3" />
            <span>Rejected</span>
          </span>
        );
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <MessageSquare className="h-6 w-6 text-brand-400" />
            <span>Student Attendance Disputes & Inquiries</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Review student dispute appeals, send two-way messages, and adjudicate attendance corrections.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Live Polling Active</span>
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>

      {successMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Grid: Left List, Right Conversation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* Left Column: Dispute List */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          {/* Tab Filter */}
          <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs">
            {(['ALL', 'PENDING', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 font-medium rounded-lg transition-all ${
                  activeTab === tab
                    ? 'bg-brand-500 text-slate-950 font-semibold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {loading ? (
              <div className="text-center py-12 text-xs text-slate-500">Loading disputes...</div>
            ) : filteredDisputes.length === 0 ? (
              <div className="glass-panel rounded-2xl p-8 text-center text-slate-400 text-xs">
                No disputes found matching filter.
              </div>
            ) : (
              filteredDisputes.map((d) => {
                const isSelected = selectedDispute?.id === d.id;
                return (
                  <div
                    key={d.id}
                    onClick={() => selectDisputeAndFetchDetails(d)}
                    className={`cursor-pointer rounded-xl border p-4 transition-all ${
                      isSelected
                        ? 'border-brand-500/50 bg-slate-800/80 shadow-md shadow-brand-500/10'
                        : 'border-slate-800/80 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-sm text-white flex items-center space-x-1.5">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          <span>
                            {d.student.user.firstName} {d.student.user.lastName}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">({d.student.rollNumber})</span>
                        </div>
                        <div className="text-xs text-brand-400 font-medium mt-0.5">
                          {d.session.subject.code}: {d.session.subject.name}
                        </div>
                      </div>
                      {getStatusBadge(d.status)}
                    </div>

                    <div className="mt-2 text-xs text-slate-300 line-clamp-2 bg-slate-950/40 rounded-lg p-2 border border-slate-800/60">
                      "{d.reason}"
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(d.createdAt).toLocaleDateString()}</span>
                      </span>
                      <span>{d.messages?.length || 1} message(s)</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Conversation & Resolution Actions */}
        <div className="lg:col-span-7 glass-panel rounded-2xl p-5 flex flex-col justify-between">
          {selectedDispute ? (
            <>
              {/* Conversation Header */}
              <div className="pb-4 border-b border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-base font-bold text-white">
                        {selectedDispute.student.user.firstName} {selectedDispute.student.user.lastName}
                      </h2>
                      <span className="text-xs text-slate-400">Roll: {selectedDispute.student.rollNumber}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {selectedDispute.session.subject.code} • {selectedDispute.session.classroom.name} • Session:{' '}
                      {new Date(selectedDispute.session.startTime).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {getStatusBadge(selectedDispute.status)}
                  </div>
                </div>

                {/* Dispute Action Controls (if not resolved) */}
                {selectedDispute.status !== 'RESOLVED' && selectedDispute.status !== 'REJECTED' && (
                  <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap items-center gap-2">
                    {selectedDispute.status === 'PENDING' && (
                      <button
                        onClick={handleMarkUnderReview}
                        disabled={actionLoading}
                        className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-400 hover:bg-blue-500/20"
                      >
                        Mark Under Review
                      </button>
                    )}

                    <button
                      onClick={handleApproveDispute}
                      disabled={actionLoading}
                      className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition shadow-sm"
                    >
                      Approve Correction (Mark Present)
                    </button>

                    <button
                      onClick={() => setRejectionModalOpen(true)}
                      disabled={actionLoading}
                      className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20"
                    >
                      Reject Dispute
                    </button>
                  </div>
                )}

                {selectedDispute.resolutionNote && (
                  <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 text-xs text-slate-300">
                    <span className="font-semibold text-slate-400">Resolution Note: </span>
                    {selectedDispute.resolutionNote}
                  </div>
                )}
              </div>

              {/* Chat Messages Body */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3 max-h-[380px] my-2 pr-2">
                {selectedDispute.messages?.map((m) => {
                  const isTeacherSender =
                    m.sender?.role === 'TEACHER' || m.senderId === user?.id;

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isTeacherSender ? 'items-end' : 'items-start'}`}
                    >
                      <div className="text-[10px] text-slate-400 mb-1 px-1">
                        {isTeacherSender ? 'You (Instructor)' : `${selectedDispute.student.user.firstName} (Student)`} •{' '}
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-xs max-w-[80%] leading-relaxed ${
                          isTeacherSender
                            ? 'bg-brand-500 text-slate-950 font-medium rounded-tr-none'
                            : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/60'
                        }`}
                      >
                        {m.message}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message Input Box */}
              <div className="pt-3 border-t border-slate-800 flex items-center space-x-2">
                <input
                  type="text"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendReply();
                  }}
                  placeholder="Type a response to the student..."
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                />
                <button
                  onClick={handleSendReply}
                  disabled={sendingReply || !replyMessage.trim()}
                  className="flex items-center space-x-1.5 rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-semibold text-slate-950 hover:bg-brand-400 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 py-16 text-center space-y-2">
              <MessageSquare className="h-10 w-10 text-slate-700" />
              <div className="text-sm font-semibold text-slate-400">No Dispute Selected</div>
              <p className="text-xs text-slate-400 max-w-sm">
                Select a dispute from the left inbox to view the complete conversation history, message the student, and resolve attendance.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Rejection Modal */}
      {rejectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-red-500/30">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <span>Reject Attendance Dispute</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Please provide a clear justification explaining why this dispute is rejected. This reason will be recorded in the audit trail and delivered to the student.
            </p>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Physical classroom attendance check confirmed absence; GPS showed out of zone."
              className="mt-4 w-full h-24 rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs text-white placeholder-slate-500 focus:border-red-500 focus:outline-none"
            />

            <div className="mt-4 flex items-center justify-end space-x-2">
              <button
                onClick={() => setRejectionModalOpen(false)}
                className="rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectDispute}
                disabled={!rejectionReason.trim() || actionLoading}
                className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
