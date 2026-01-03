import React, { useState } from 'react';
import AuthPage from './components/Auth/AuthPage';
import AdminDashboard from './components/Admin/AdminDashboard';
import WeaverDashboard from './components/Weaver/WeaverDashboard';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  const handleLogin = (role) => {
    setIsAuthenticated(true);
    setUserRole(role);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
  };

  if (!isAuthenticated) {
    return <AuthPage onLogin={handleLogin} />;
  }

  if (userRole === 'admin') {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  return <WeaverDashboard onLogout={handleLogout} />;
}