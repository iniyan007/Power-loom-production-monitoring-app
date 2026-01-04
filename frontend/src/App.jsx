import React, { useState, useEffect } from 'react';
import AuthPage from './components/Auth/AuthPage';
import AdminDashboard from './components/Admin/AdminDashboard';
import WeaverDashboard from './components/Weaver/WeaverDashboard';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");

  if (token && storedUser) {
    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setIsAuthenticated(true);
    } catch (err) {
      localStorage.clear();
    }
  }
  setLoading(false);
}, []);


  const handleLogin = (userData) => {
  localStorage.setItem("user", JSON.stringify(userData));
  setUser(userData);
  setIsAuthenticated(true);
};


  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
        <div className="text-xl font-semibold text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
  return <AuthPage onLogin={handleLogin} />;
}

switch (user.role) {
  case "admin":
    return <AdminDashboard onLogout={handleLogout} />;
  case "weaver":
    return <WeaverDashboard onLogout={handleLogout} />;
  default:
    return <AuthPage onLogin={handleLogin} />;
}

}