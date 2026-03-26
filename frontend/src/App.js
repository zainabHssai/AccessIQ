import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage          from './pages/LoginPage';
import RegisterPage       from './pages/RegisterPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import AdminLayout        from './pages/admin/AdminLayout';
import ReviewerLayout     from './pages/reviewer/ReviewerLayout';
import { authAPI }        from './api';

// ── Auth Context ─────────────────────────────
export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    authAPI.me()
      .then(r => { setUser(r.data); localStorage.setItem('user', JSON.stringify(r.data)); })
      .catch(() => { localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:32, height:32, border:'3px solid #e2e2e2', borderTopColor:'#e84c2e', borderRadius:'50%', animation:'spin .7s linear infinite', margin:'0 auto 12px' }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color:'#646464', fontSize:13 }}>Chargement…</p>
      </div>
    </div>
  );

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Route Guards ─────────────────────────────
function RequireAuth({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/login" replace />;
  return children;
}

// ── App ──────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/register"        element={<RegisterPage />} />
          <Route path="/change-password" element={<ChangePasswordPage forced={true} />} />

          {/* Admin */}
          <Route path="/admin/*" element={
            <RequireAuth role="admin">
              <AdminLayout />
            </RequireAuth>
          }/>

          {/* Manager / Responsable App */}
          <Route path="/manager/*" element={
            <RequireAuth role="reviewer">
              <ReviewerLayout />
            </RequireAuth>
          }/>

          {/* Redirect par défaut selon rôle */}
          <Route path="*" element={<RoleRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/manager/dashboard" replace />;
}
