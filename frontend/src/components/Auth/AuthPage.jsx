import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'https://power-loom-production-monitoring-app.onrender.com/api';

const AuthPage = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'admin'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
  setError('');
  setLoading(true);

  try {
    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    const payload = isLogin
      ? { email: formData.email, password: formData.password, role: formData.role }
      : formData;

    const response = await axios.post(`${API_URL}${endpoint}`, payload);

    if (isLogin) {
      // ✅ LOGIN FLOW
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      onLogin(response.data.user);
    } else {
      // ✅ SIGNUP FLOW
      alert("Signup successful! Please login to continue.");

      // Switch to login page
      setIsLogin(true);

      // Clear password field
      setFormData({
        email: formData.email,
        password: '',
        name: '',
        role: 'admin'
      });
    }
  } catch (err) {
    setError(err.response?.data?.message || 'An error occurred');
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Weaving Management
          </h1>
          <p className="text-gray-600">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-5">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter your name"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter your password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isLogin ? 'Login As' : 'Role'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormData({ ...formData, role: 'admin' })}
                className={`py-3 px-4 rounded-lg font-medium transition-all ${
                  formData.role === 'admin'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Admin
              </button>
              <button
                onClick={() => setFormData({ ...formData, role: 'weaver' })}
                className={`py-3 px-4 rounded-lg font-medium transition-all ${
                  formData.role === 'weaver'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Weaver
              </button>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg disabled:bg-indigo-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;