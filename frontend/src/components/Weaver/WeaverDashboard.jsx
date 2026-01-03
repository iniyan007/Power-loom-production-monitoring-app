import React from 'react';

const WeaverDashboard = ({ onLogout }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Weaver Dashboard
        </h1>
        <p className="text-gray-600 mb-6">Coming soon...</p>
        <button
          onClick={onLogout}
          className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default WeaverDashboard;