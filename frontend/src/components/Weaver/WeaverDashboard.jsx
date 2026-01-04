import React, { useState, useEffect } from 'react';
import { Play, Pause, Clock, Ruler, Power, User } from 'lucide-react';

const WeaverDashboard = ({ onLogout }) => {
  // Mock assigned machine data - Replace with API call
  const [assignedMachine, setAssignedMachine] = useState({
    id: 1,
    machineName: 'Machine A',
    length: '0 meters',
    power: '0 kWh',
    isRunning: false,
    startTime: null,
    elapsedTime: 0
  });

  const [timer, setTimer] = useState(0);

  // Timer effect
  useEffect(() => {
    let interval = null;
    if (assignedMachine.isRunning) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [assignedMachine.isRunning]);

  // Format time as HH:MM:SS
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start/Stop machine
  const toggleMachine = () => {
    if (!assignedMachine.isRunning) {
      // Start machine - Call API here
      const currentTime = new Date().toLocaleTimeString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        hour12: false 
      });
      setAssignedMachine({
        ...assignedMachine,
        isRunning: true,
        startTime: currentTime
      });
      // API call: POST /api/machine/start
    } else {
      // Stop machine - Call API here
      setAssignedMachine({
        ...assignedMachine,
        isRunning: false
      });
      // API call: POST /api/machine/stop
    }
  };

  // Mock function to simulate real-time updates (replace with WebSocket or polling)
  useEffect(() => {
    if (assignedMachine.isRunning) {
      // Simulate data updates every 5 seconds
      const updateInterval = setInterval(() => {
        // In real implementation, fetch from backend
        setAssignedMachine((prev) => ({
          ...prev,
          length: `${(Math.random() * 100).toFixed(2)} meters`,
          power: `${(Math.random() * 50).toFixed(2)} kWh`
        }));
      }, 5000);

      return () => clearInterval(updateInterval);
    }
  }, [assignedMachine.isRunning]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Weaver Dashboard
              </h1>
              <p className="text-sm text-gray-600">Monitor your assigned machine</p>
            </div>
            <button
              onClick={onLogout}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Assigned Machine Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-indigo-100">
          {/* Machine Header */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 p-3 rounded-full">
                <User size={28} className="text-indigo-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {assignedMachine.machineName}
                </h2>
                <p className="text-sm text-gray-500">Your assigned machine</p>
              </div>
            </div>
            
            {/* Status Badge */}
            <div className={`px-4 py-2 rounded-full font-semibold ${
              assignedMachine.isRunning 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {assignedMachine.isRunning ? 'Running' : 'Stopped'}
            </div>
          </div>

          {/* Timer Display */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-center">
              <p className="text-white text-sm font-medium mb-2">Work Duration</p>
              <p className="text-5xl font-bold text-white font-mono">
                {formatTime(timer)}
              </p>
              {assignedMachine.startTime && (
                <p className="text-indigo-100 text-sm mt-2">
                  Started at: {assignedMachine.startTime} IST
                </p>
              )}
            </div>
          </div>

          {/* Machine Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Length */}
            <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-500 p-2 rounded-lg">
                  <Ruler size={24} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Length Weaved
                </h3>
              </div>
              <p className="text-3xl font-bold text-blue-600">
                {assignedMachine.length}
              </p>
              <p className="text-sm text-gray-500 mt-1">Real-time measurement</p>
            </div>

            {/* Power */}
            <div className="bg-yellow-50 rounded-xl p-6 border-2 border-yellow-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-yellow-500 p-2 rounded-lg">
                  <Power size={24} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Power Consumed
                </h3>
              </div>
              <p className="text-3xl font-bold text-yellow-600">
                {assignedMachine.power}
              </p>
              <p className="text-sm text-gray-500 mt-1">Current consumption</p>
            </div>
          </div>

          {/* Start/Stop Button */}
          <button
            onClick={toggleMachine}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-3 ${
              assignedMachine.isRunning
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {assignedMachine.isRunning ? (
              <>
                <Pause size={24} />
                Stop Machine
              </>
            ) : (
              <>
                <Play size={24} />
                Start Machine
              </>
            )}
          </button>

          {/* Info Note */}
          <div className="mt-6 bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded">
            <div className="flex items-start gap-3">
              <Clock size={20} className="text-indigo-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-indigo-800">
                  Real-time Monitoring
                </p>
                <p className="text-xs text-indigo-600 mt-1">
                  Data will update automatically when connected to backend. 
                  Press start to begin tracking your work session.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* No Machine Assigned (Optional - show this if no machine assigned) */}
        {/* Uncomment this section if you want to show when no machine is assigned
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
          <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <User size={48} className="text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            No Machine Assigned
          </h2>
          <p className="text-gray-600">
            Please contact your administrator to assign a machine to you.
          </p>
        </div>
        */}
      </div>
    </div>
  );
};

export default WeaverDashboard;