import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  ShieldCheck,
  RefreshCw,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserCheck,
  Edit3,
  XCircle,
  Radio,
} from 'lucide-react';

interface AttendanceRecordItem {
  id: string;
  studentId: string;
  rollNumber: string;
  name: string;
  status: 'VERIFIED' | 'PENDING' | 'SUSPICIOUS' | 'REJECTED';
  distanceMeters: number;
  markedAt: string;
  reasonCode: string;
}

export const LiveSessionPage: React.FC = () => {
  const [secondsLeft, setSecondsLeft] = useState(15);
  const [sessionActive, setSessionActive] = useState(true);
  const [qrToken, setQrToken] = useState<string>('');
  const [showManualModal, setShowManualModal] = useState(false);
  const [showRandomModal, setShowRandomModal] = useState(false);
  const [manualReason, setManualReason] = useState('');
  const [manualRoll, setManualRoll] = useState('CS2026-004');

  const [records, setRecords] = useState<AttendanceRecordItem[]>([
    {
      id: 'rec-1',
      studentId: 'stud-1',
      rollNumber: 'CS2026-001',
      name: 'John Doe',
      status: 'VERIFIED',
      distanceMeters: 14.2,
      markedAt: 'Just now',
      reasonCode: 'ALL_CHECKS_PASSED',
    },
    {
      id: 'rec-2',
      studentId: 'stud-2',
      rollNumber: 'CS2026-002',
      name: 'Jane Roe',
      status: 'VERIFIED',
      distanceMeters: 22.8,
      markedAt: '1m ago',
      reasonCode: 'ALL_CHECKS_PASSED',
    },
    {
      id: 'rec-3',
      studentId: 'stud-3',
      rollNumber: 'CS2026-003',
      name: 'Alex Chen',
      status: 'SUSPICIOUS',
      distanceMeters: 312.4,
      markedAt: '2m ago',
      reasonCode: 'OUT_OF_GEOFENCE_312M',
    },
  ]);

  // Dynamic QR auto-refresh cycle (15 seconds)
  useEffect(() => {
    const generateToken = () => {
      const payload = {
        sid: 'sess-cs601-live-01',
        sub: 'CS601',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 30,
        non: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        sig: 'hmac_sha256_mock_sig_' + Date.now(),
      };
      setQrToken(JSON.stringify(payload));
    };

    generateToken();

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          generateToken();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const verifiedCount = records.filter((r) => r.status === 'VERIFIED').length;
  const suspiciousCount = records.filter((r) => r.status === 'SUSPICIOUS').length;
  const totalEnrolled = 48;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualReason) return;

    const newRecord: AttendanceRecordItem = {
      id: `rec-manual-${Date.now()}`,
      studentId: `stud-${Date.now()}`,
      rollNumber: manualRoll,
      name: 'Student Override',
      status: 'VERIFIED',
      distanceMeters: 0,
      markedAt: 'Just now',
      reasonCode: `MANUAL_OVERRIDE: ${manualReason}`,
    };

    setRecords([newRecord, ...records]);
    setManualReason('');
    setShowManualModal(false);
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 glass-panel rounded-2xl p-6 border-brand-500/20">
        <div>
          <div className="flex items-center space-x-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Live Active Session
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-xs text-slate-400">Room 401 (Tech Block A) • Geofence: 75m</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1">CS601: Advanced Distributed Systems</h1>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowRandomModal(true)}
            className="flex items-center space-x-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 transition-all"
          >
            <UserCheck className="h-4 w-4" />
            <span>Random Physical Check</span>
          </button>

          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center space-x-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-all"
          >
            <Edit3 className="h-4 w-4" />
            <span>Manual Override</span>
          </button>

          <button
            onClick={() => setSessionActive(false)}
            className="flex items-center space-x-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-all"
          >
            <XCircle className="h-4 w-4" />
            <span>Close Session</span>
          </button>
        </div>
      </div>

      {/* Main Grid: QR Projection on Left, Real-Time Submissions on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Dynamic QR Display */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center relative">
          <div className="w-full flex items-center justify-between text-xs text-slate-400 mb-6">
            <span className="flex items-center space-x-1.5 font-medium text-slate-300">
              <Radio className="h-4 w-4 text-brand-400 animate-pulse" />
              <span>Projected QR Stream</span>
            </span>
            <div className="flex items-center space-x-1 text-brand-400 font-mono font-bold bg-brand-500/10 px-2.5 py-1 rounded-md border border-brand-500/20">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>{secondsLeft}s</span>
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl shadow-2xl border-4 border-brand-500/30">
            {qrToken ? (
              <QRCodeSVG
                value={qrToken}
                size={260}
                level="M"
                includeMargin={false}
              />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center text-slate-900">
                Generating Token...
              </div>
            )}
          </div>

          <p className="text-xs text-slate-400 mt-6 max-w-xs leading-relaxed">
            Instruct students to point their mobile camera at this dynamic QR. Multiple students can scan concurrently.
          </p>

          <div className="mt-4 flex items-center space-x-4 text-[11px] text-slate-400">
            <span className="flex items-center space-x-1 text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              <span>HMAC-SHA256 Signed</span>
            </span>
            <span>•</span>
            <span>Valid 30 Seconds</span>
          </div>
        </div>

        {/* Real-time Scanned Students Board */}
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-panel rounded-xl p-4">
              <div className="text-xs text-slate-400">Verified Present</div>
              <div className="text-xl font-bold text-emerald-400 mt-1">{verifiedCount}</div>
            </div>
            <div className="glass-panel rounded-xl p-4">
              <div className="text-xs text-slate-400">Suspicious / Flagged</div>
              <div className="text-xl font-bold text-amber-400 mt-1">{suspiciousCount}</div>
            </div>
            <div className="glass-panel rounded-xl p-4">
              <div className="text-xs text-slate-400">Total Class Size</div>
              <div className="text-xl font-bold text-white mt-1">{totalEnrolled}</div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">Live Verified Attendance Stream</h2>
              <span className="text-xs text-slate-400 font-mono">Real-time WebSocket</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 font-semibold">Roll No</th>
                    <th className="pb-3 font-semibold">Student Name</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">GPS Distance</th>
                    <th className="pb-3 font-semibold text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {records.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 font-mono font-medium text-slate-300">{rec.rollNumber}</td>
                      <td className="py-3 font-medium text-white">{rec.name}</td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                            rec.status === 'VERIFIED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400 font-mono">{rec.distanceMeters.toFixed(1)}m</td>
                      <td className="py-3 text-right text-slate-400">{rec.markedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Mark Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl border-slate-700">
            <h3 className="text-lg font-bold text-white mb-2">Manual Attendance Override</h3>
            <p className="text-xs text-slate-400 mb-4">
              All manual changes are permanently recorded in the immutable audit log with your instructor identity.
            </p>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Student Roll Number</label>
                <input
                  type="text"
                  value={manualRoll}
                  onChange={(e) => setManualRoll(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2 px-3 text-sm text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Mandatory Reason <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value)}
                  placeholder="e.g., Device battery exhausted; physically present in classroom."
                  required
                  rows={3}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2 px-3 text-sm text-white placeholder-slate-400"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-brand-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-brand-400"
                >
                  Confirm & Audit Mark
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Random Physical Verification Modal */}
      {showRandomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 shadow-2xl border-purple-500/30">
            <div className="flex items-center space-x-2 text-purple-400 mb-2">
              <UserCheck className="h-5 w-5" />
              <h3 className="text-lg font-bold text-white">Random Physical Verification</h3>
            </div>
            <p className="text-xs text-slate-400 mb-6">
              The system randomly sampled the following present students for in-person verification.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between rounded-xl bg-slate-900/80 p-3 border border-slate-800">
                <div>
                  <div className="text-sm font-semibold text-white">John Doe</div>
                  <div className="text-xs text-slate-400">Roll: CS2026-001 • Seat: Tech Block</div>
                </div>
                <span className="rounded bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                  Physically Verified
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-900/80 p-3 border border-slate-800">
                <div>
                  <div className="text-sm font-semibold text-white">Jane Roe</div>
                  <div className="text-xs text-slate-400">Roll: CS2026-002 • Seat: Tech Block</div>
                </div>
                <span className="rounded bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                  Physically Verified
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowRandomModal(false)}
                className="rounded-xl bg-purple-500 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-600"
              >
                Complete Verification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
