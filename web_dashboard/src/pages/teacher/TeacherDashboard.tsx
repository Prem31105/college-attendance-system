import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { QrCode, Users, BookOpen, Clock, Play, CheckCircle2 } from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const assignedClasses = [
    {
      id: 'sub-1',
      code: 'CS601',
      name: 'Advanced Distributed Systems',
      section: 'Section A',
      room: 'Room 401',
      building: 'Tech Block A',
      enrolled: 48,
      avgAttendance: '88.4%',
      nextSession: '10:00 AM - 11:30 AM',
    },
    {
      id: 'sub-2',
      code: 'CS602',
      name: 'Cryptography & Network Security',
      section: 'Section A',
      room: 'Room 402',
      building: 'Tech Block A',
      enrolled: 42,
      avgAttendance: '92.1%',
      nextSession: '02:00 PM - 03:30 PM',
    },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Welcome back, Dr. {user?.lastName || 'Professor'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Department of Computer Science & Engineering • Academic Year 2026-2027
          </p>
        </div>

        <button
          onClick={() => navigate('/teacher/live')}
          className="flex items-center space-x-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-brand-400 transition-all shadow-lg shadow-brand-500/20 active:scale-95"
        >
          <Play className="h-4 w-4 fill-slate-950" />
          <span>Start Active Attendance Session</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Assigned Subjects</span>
            <BookOpen className="h-4 w-4 text-brand-400" />
          </div>
          <div className="text-2xl font-bold text-white">2 Subjects</div>
          <div className="text-xs text-slate-400 mt-1">B.Tech CSE - Semester 6</div>
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Enrolled Students</span>
            <Users className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">90 Students</div>
          <div className="text-xs text-slate-400 mt-1">Across 2 active sections</div>
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Class Attendance Average</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">90.2%</div>
          <div className="text-xs text-emerald-400/80 mt-1">Above 75% institutional quota</div>
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Geofence Compliance</span>
            <QrCode className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">99.4%</div>
          <div className="text-xs text-slate-400 mt-1">Zero proxy duplicates logged</div>
        </div>
      </div>

      {/* Assigned Classes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Assigned Classes & Schedules</h2>
          <span className="text-xs text-slate-400">Click class to view live attendance controls</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assignedClasses.map((cls) => (
            <div
              key={cls.id}
              className="glass-panel glass-panel-hover rounded-2xl p-6 relative overflow-hidden group cursor-pointer"
              onClick={() => navigate('/teacher/live')}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-block rounded-md bg-brand-500/10 px-2.5 py-1 text-xs font-semibold text-brand-400 border border-brand-500/20">
                    {cls.code}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-2">{cls.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{cls.section}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Average Rate</div>
                  <div className="text-lg font-bold text-emerald-400">{cls.avgAttendance}</div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400">Location:</span>
                  <div className="font-medium text-slate-200 mt-0.5">{cls.room} ({cls.building})</div>
                </div>
                <div>
                  <span className="text-slate-400">Schedule:</span>
                  <div className="font-medium text-slate-200 mt-0.5">{cls.nextSession}</div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <span className="text-xs text-slate-400">{cls.enrolled} Students Enrolled</span>
                <span className="inline-flex items-center space-x-1 text-xs font-semibold text-brand-400 group-hover:translate-x-1 transition-transform">
                  <span>Launch Live QR</span>
                  <span>→</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
