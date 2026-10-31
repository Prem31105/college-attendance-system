import React from 'react';
import {
  Users,
  GraduationCap,
  Building2,
  AlertTriangle,
  FileCheck2,
  TrendingUp,
  ShieldAlert,
  Server,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const stats = [
    { label: 'Total Enrolled Students', value: '1,420', change: '+12% this year', icon: Users, color: 'text-blue-400' },
    { label: 'Faculty Members', value: '86', change: 'Across 6 departments', icon: GraduationCap, color: 'text-emerald-400' },
    { label: 'Configured Geofences', value: '34 Classrooms', change: 'Avg Radius: 75m', icon: Building2, color: 'text-purple-400' },
    { label: 'Suspicious Incidents', value: '3 Pending', change: 'Requires admin review', icon: AlertTriangle, color: 'text-amber-400' },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Institutional Analytics Overview</h1>
        <p className="text-sm text-slate-400 mt-1">
          Autonomous Attendance System • Real-Time Security & Campus Compliance
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="glass-panel rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">{s.label}</span>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-slate-400 mt-1">{s.change}</div>
          </div>
        ))}
      </div>

      {/* System Health & Attendance Quality */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">Attendance Quality Breakdown</h2>
            <TrendingUp className="h-4 w-4 text-brand-400" />
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Clean Biometric & Geofence Verified</span>
                <span className="font-semibold text-emerald-400">92.4%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '92.4%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Teacher Manual Override with Reason</span>
                <span className="font-semibold text-blue-400">6.1%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '6.1%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Flagged / Rejected (Proxy Attempt)</span>
                <span className="font-semibold text-red-400">1.5%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: '1.5%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">Security & Infrastructure Status</h2>
            <Server className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-300">PostgreSQL Database</span>
              <span className="text-emerald-400 font-semibold">Active & Synced</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-300">Redis Cache & Nonce Deduplicator</span>
              <span className="text-emerald-400 font-semibold">Healthy (Latency: 1.2ms)</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-300">Dynamic QR Cryptographic Signer</span>
              <span className="text-emerald-400 font-semibold">HMAC-SHA256 Ready</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-300">Geofence Distance Engine</span>
              <span className="text-emerald-400 font-semibold">Haversine (Max Acc: 20m)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
