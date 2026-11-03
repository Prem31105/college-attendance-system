import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('prof.mehta@college.edu');
  const [password, setPassword] = useState('TeacherSecure123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const success = await login(email, password);
    setLoading(false);

    if (success) {
      if (email.includes('admin')) {
        navigate('/admin');
      } else {
        navigate('/teacher');
      }
    } else {
      setError('Invalid credentials. Please verify your email and password.');
    }
  };

  const handleQuickFill = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20 mb-4 glow-brand">
            <ShieldCheck className="h-9 w-9" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">SmartCampus Attendance</h1>
          <p className="text-sm text-slate-400 mt-1">Multi-Layer Verified Attendance System</p>
        </div>

        <div className="glass-panel rounded-2xl p-6 sm:p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-6">Faculty & Administrator Sign In</h2>

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Institutional Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="name@college.edu"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center space-x-2 rounded-xl bg-brand-500 py-3 text-sm font-semibold text-slate-950 transition-all hover:bg-brand-400 active:scale-[0.98] disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3 text-center">
              Quick Test Credentials
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('prof.mehta@college.edu', 'TeacherSecure123!')}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-left hover:border-brand-500/30"
              >
                <div>
                  <div className="text-xs font-medium text-slate-200">Teacher</div>
                  <div className="text-[10px] text-slate-400">Prof. Rahul Mehta</div>
                </div>
                <CheckCircle2 className="h-3.5 w-3.5 text-brand-400" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('admin@college.edu', 'AdminSecure123!')}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-left hover:border-brand-500/30"
              >
                <div>
                  <div className="text-xs font-medium text-slate-200">Admin</div>
                  <div className="text-[10px] text-slate-400">System Admin</div>
                </div>
                <CheckCircle2 className="h-3.5 w-3.5 text-brand-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
