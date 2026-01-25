import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Zap, Clock, User, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MachineDetailModal = ({ isOpen, onClose, machine, authToken }) => {
  const [activeTab, setActiveTab] = useState('live');
  const [liveData, setLiveData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && machine) {
      fetchLiveData();
      fetchHistoryData();
      
      // Auto-refresh live data every 5 seconds
      const interval = setInterval(fetchLiveData, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, machine]);

  const fetchLiveData = async () => {
    if (!machine) return;
    
    try {
      const response = await fetch(
        `http://localhost:5000/api/sensor/live/${machine.id}`,
        { headers: { Authorization: authToken } }
      );
      const data = await response.json();
      setLiveData(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch live data:', err);
      setLoading(false);
    }
  };

  const fetchHistoryData = async () => {
    if (!machine) return;
    
    try {
      const response = await fetch(
        `http://localhost:5000/api/sensor/history/${machine.id}`,
        { headers: { Authorization: authToken } }
      );
      const data = await response.json();
      setHistoryData(data);
    } catch (err) {
      console.error('Failed to fetch history data:', err);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-IN', { 
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (!isOpen || !machine) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold mb-2">{machine?.loomId || 'N/A'}</h2>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-2">
                  <User size={16} />
                  {machine?.weaverName || 'Unassigned'}
                </span>
                {machine?.shiftType && (
                  <span className="flex items-center gap-2">
                    <Clock size={16} />
                    {machine.shiftType} Shift
                  </span>
                )}
                <span className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                  machine?.isRunning ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  {machine?.isRunning ? 'Running' : 'Stopped'}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab('live')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'live'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Live Data
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'history'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              History
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-600">Loading data...</div>
            </div>
          ) : activeTab === 'live' ? (
            <div>
              {/* Current Stats */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="text-blue-600" size={24} />
                    <h3 className="text-sm font-medium text-gray-600">Length Weaved</h3>
                  </div>
                  <p className="text-3xl font-bold text-blue-900">
                    {liveData.length > 0 
                      ? `${liveData[liveData.length - 1].production.toFixed(2)} m`
                      : '0 m'
                    }
                  </p>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="text-yellow-600" size={24} />
                    <h3 className="text-sm font-medium text-gray-600">Power Consumed</h3>
                  </div>
                  <p className="text-3xl font-bold text-yellow-900">
                    {liveData.length > 0 
                      ? `${liveData[liveData.length - 1].energy.toFixed(2)} kWh`
                      : '0 kWh'
                    }
                  </p>
                </div>
              </div>

              {/* Live Charts */}
              {liveData.length > 0 ? (
                <>
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp size={20} className="text-blue-600" />
                      Production Over Time
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={liveData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="timestamp" 
                          tickFormatter={formatTime}
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis 
                          label={{ value: 'Length (m)', angle: -90, position: 'insideLeft' }}
                          style={{ fontSize: '12px' }}
                        />
                        <Tooltip 
                          labelFormatter={formatTime}
                          formatter={(value) => [`${value.toFixed(2)} m`, 'Production']}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="production" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          name="Length Weaved"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Zap size={20} className="text-yellow-600" />
                      Energy Consumption
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={liveData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="timestamp" 
                          tickFormatter={formatTime}
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis 
                          label={{ value: 'Energy (kWh)', angle: -90, position: 'insideLeft' }}
                          style={{ fontSize: '12px' }}
                        />
                        <Tooltip 
                          labelFormatter={formatTime}
                          formatter={(value) => [`${value.toFixed(2)} kWh`, 'Energy']}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="energy" 
                          stroke="#eab308" 
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          name="Power Consumed"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp size={40} className="text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No Live Data</h3>
                  <p className="text-gray-600">
                    {machine?.isRunning 
                      ? 'Data will appear once the loom starts generating sensor readings'
                      : 'Start the loom to begin collecting data'
                    }
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div>
              {/* History View */}
              {historyData.length > 0 ? (
                <div className="space-y-6">
                  {historyData.map((session, index) => (
                    <div key={index} className="border rounded-xl p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <User size={18} className="text-indigo-600" />
                            {session.weaverName}
                          </h3>
                          <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                            <Calendar size={14} />
                            {formatDate(session.startTime)} • {session.shiftType} Shift
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Duration</p>
                          <p className="text-lg font-semibold">
                            {Math.floor((new Date(session.endTime) - new Date(session.startTime)) / (1000 * 60 * 60))}h {
                              Math.floor(((new Date(session.endTime) - new Date(session.startTime)) % (1000 * 60 * 60)) / (1000 * 60))
                            }m
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Total Production</p>
                          <p className="text-2xl font-bold text-blue-900">
                            {session.totalProduction.toFixed(2)} m
                          </p>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Total Energy</p>
                          <p className="text-2xl font-bold text-yellow-900">
                            {session.totalEnergy.toFixed(2)} kWh
                          </p>
                        </div>
                      </div>

                      {session.sensorData && session.sensorData.length > 0 && (
                        <div className="space-y-4">
                          <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={session.sensorData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="timestamp" 
                                tickFormatter={formatTime}
                                style={{ fontSize: '11px' }}
                              />
                              <YAxis style={{ fontSize: '11px' }} />
                              <Tooltip labelFormatter={formatTime} />
                              <Line 
                                type="monotone" 
                                dataKey="production" 
                                stroke="#3b82f6" 
                                strokeWidth={2}
                                dot={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar size={40} className="text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No History Data</h3>
                  <p className="text-gray-600">
                    Historical data will appear after shifts are completed
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MachineDetailModal;