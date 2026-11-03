import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  studentId?: string;
  teacherId?: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return localStorage.getItem('access_token');
  });

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // In production/dev, calls backend /api/v1/auth/login.
      // Supports direct live API call with fallback for offline dev demo.
      let userData: User;
      let token: string;

      try {
        const res = await fetch('http://localhost:3000/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (res.ok) {
          const data = await res.json();
          userData = data.user;
          token = data.accessToken;
        } else {
          return false;
        }
      } catch (e) {
        // Dev Fallback for mock preview when backend is not actively running
        if (email.includes('admin')) {
          userData = { id: 'admin-1', email, firstName: 'College', lastName: 'Administrator', role: 'ADMIN' };
          token = 'mock_jwt_admin_token';
        } else if (email.includes('teacher') || email.includes('mehta')) {
          userData = { id: 'teacher-1', email, firstName: 'Rahul', lastName: 'Mehta', role: 'TEACHER', teacherId: 'teacher-101' };
          token = 'mock_jwt_teacher_token';
        } else {
          userData = { id: 'student-1', email, firstName: 'Aarav', lastName: 'Sharma', role: 'STUDENT', studentId: 'student-101' };
          token = 'mock_jwt_student_token';
        }
      }

      setUser(userData);
      setAccessToken(token);
      localStorage.setItem('auth_user', JSON.stringify(userData));
      localStorage.setItem('access_token', token);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('access_token');
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
