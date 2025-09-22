import React, { useMemo, useState } from 'react';
import './App.css';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import AuthPage from './components/auth/AuthPage';
import AdminDashboard from './components/dashboards/AdminDashboard';
import MentorDashboard from './components/dashboards/MentorDashboard';
import StudentDashboard from './components/dashboards/StudentDashboard';
import StudentDetail from './components/student';

export const AuthContext = React.createContext(null);

function ProtectedRoute({ children, roles }) {
  const { user } = React.useContext(AuthContext);
  if (!user) return <Navigate to="/auth" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={`/${user.role.toLowerCase()}`} replace />;
  return children;
}

function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });

  const authValue = useMemo(() => ({
    user,
    login: (data) => {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      const path = data.user.role === 'Admin' ? '/admin' : data.user.role === 'Mentor' ? '/mentor' : '/student';
      navigate(path, { replace: true });
    },
    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      navigate('/auth', { replace: true });
    }
  }), [user, navigate]);

  return (
    <AuthContext.Provider value={authValue}>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/admin" element={
          <ProtectedRoute roles={["Admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/mentor" element={
          <ProtectedRoute roles={["Mentor"]}>
            <MentorDashboard />
          </ProtectedRoute>
        } />
        <Route path="/student" element={
          <ProtectedRoute roles={["Student"]}>
            <StudentDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/students/:id" element={
          <StudentDetail />
        } />
        <Route path="/" element={<Navigate to={user ? `/${user.role.toLowerCase()}` : '/auth'} replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthContext.Provider>
  );
}

export default App;
