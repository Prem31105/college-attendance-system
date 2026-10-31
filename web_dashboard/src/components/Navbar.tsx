import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogOut, UserCircle, Bell } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-900/80 px-6 backdrop-blur-md">
      <div className="flex items-center space-x-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-white">SmartCampus Attendance</h1>
          <p className="text-xs text-slate-400">Dynamic QR & GPS Verified Portal</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button
          className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          title="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-500"></span>
        </button>

        <div className="flex items-center space-x-3 border-l border-slate-800 pl-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-200 border border-slate-700">
            <UserCircle className="h-6 w-6" />
          </div>
          <div className="hidden text-left sm:block">
            <div className="text-xs font-semibold text-slate-200">
              {user ? `${user.firstName} ${user.lastName}` : 'Guest User'}
            </div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-brand-400">
              {user?.role || 'Guest'}
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center space-x-1 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20"
          title="Log out"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};
