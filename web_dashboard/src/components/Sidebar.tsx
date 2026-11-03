import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  QrCode,
  Users,
  Building2,
  AlertTriangle,
  History,
  FileSpreadsheet,
  LayoutDashboard,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const teacherLinks = [
    { to: '/teacher', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/teacher/live', label: 'Live QR Attendance', icon: QrCode },
    { to: '/teacher/disputes', label: 'Attendance Disputes', icon: MessageSquare },
    { to: '/teacher/reports', label: 'Reports & Exports', icon: FileSpreadsheet },
  ];

  const adminLinks = [
    { to: '/admin', label: 'System Analytics', icon: LayoutDashboard },
    { to: '/admin/classrooms', label: 'Geofences & Rooms', icon: Building2 },
    { to: '/admin/disputes', label: 'Dispute Overviews', icon: MessageSquare },
    { to: '/admin/suspicious', label: 'Suspicious Incidents', icon: AlertTriangle },
    { to: '/admin/audit', label: 'Security Audit Logs', icon: History },
  ];

  const links = isAdmin ? adminLinks : teacherLinks;

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/50 p-4 min-h-[calc(100vh-4rem)] flex flex-col justify-between">
      <div className="space-y-6">
        <div>
          <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {isAdmin ? 'Admin Console' : 'Faculty Console'}
          </div>
          <nav className="mt-3 space-y-1">
            {links.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/teacher' || item.to === '/admin'}
                className={({ isActive }) =>
                  `flex items-center space-x-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`
                }
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex items-center space-x-2 text-xs font-semibold text-brand-400">
            <ShieldCheck className="h-4 w-4" />
            <span>Security Protected</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
            Dynamic QR expires in 30s. GPS Geofence boundary locked to 75m.
          </p>
        </div>
      </div>

      <div className="text-center text-[11px] text-slate-400">
        Autonomous Attendance v1.0
      </div>
    </aside>
  );
};
