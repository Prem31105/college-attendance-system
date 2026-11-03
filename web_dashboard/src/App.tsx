import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { LiveSessionPage } from './pages/teacher/LiveSessionPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ClassroomsPage } from './pages/admin/ClassroomsPage';
import { DisputesPage } from './pages/teacher/DisputesPage';

const ProtectedLayout: React.FC<{ allowedRole?: 'TEACHER' | 'ADMIN' }> = ({ allowedRole }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole && user.role !== 'ADMIN') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 bg-slate-950/40 overflow-y-auto">
          <Routes>
            {/* Teacher Routes */}
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/teacher/live" element={<LiveSessionPage />} />
            <Route path="/teacher/disputes" element={<DisputesPage />} />
            <Route path="/teacher/reports" element={<TeacherDashboard />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/classrooms" element={<ClassroomsPage />} />
            <Route path="/admin/disputes" element={<DisputesPage />} />
            <Route path="/admin/suspicious" element={<AdminDashboard />} />
            <Route path="/admin/audit" element={<AdminDashboard />} />

            {/* Default redirect based on role */}
            <Route
              path="*"
              element={<Navigate to={user.role === 'ADMIN' ? '/admin' : '/teacher'} replace />}
            />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
