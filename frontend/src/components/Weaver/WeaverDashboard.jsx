import React, { useState, useEffect } from "react";
import { Play, Pause, User, Clock, Calendar, TrendingUp, Zap } from "lucide-react";
import { API_URL } from "../../config/apiConfig";

const WeaverDashboard = ({ onLogout }) => {
  const [assignedMachines, setAssignedMachines] = useState([]);
  const [upcomingShifts, setUpcomingShifts] = useState([]);
  const [machineStats, setMachineStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState('');

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return { Authorization: token };
  };

  const fetchAssignedShifts = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${API_URL}/shifts/my-active-shift`,
        { headers: { Authorization: token } }
      );

      const data = await res.json();

      if (Array.isArray(data)) {
        const machines = data.map((shift) => ({
          id: shift.loomId._id,
          shiftId: shift._id,
          loomId: shift.loomId.loomId,
          shiftType: shift.shiftType,
          status: shift.loomId.status,
          runningSince: shift.loomId.runningSince,
          shiftStartTime: shift.startTime,
          shiftEndTime: shift.endTime,
          scheduledDate: shift.scheduledDate
        }));
        
        setAssignedMachines(machines);
        
        // Fetch stats for each machine
        machines.forEach(machine => {
          fetchMachineStats(machine.id);
        });
      } else {
        setAssignedMachines([]);
      }
      setError('');
    } catch (err) {
      console.error("Failed to load assigned looms", err);
      setError("Failed to load assigned looms");
      setAssignedMachines([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMachineStats = async (loomId) => {
    try {
      const token = localStorage.getItem("token");
      
      // Fetch current loom data
      const loomResponse = await fetch(
        `${API_URL}/looms/${loomId}`,
        { headers: { Authorization: token } }
      );
      
      if (loomResponse.ok) {
        const loomData = await loomResponse.json();
        
        setMachineStats(prev => ({
          ...prev,
          [loomId]: {
            production: loomData.length || 0,
            energy: loomData.power || 0
          }
        }));
      }
    } catch (err) {
      console.error(`Failed to fetch stats for loom ${loomId}:`, err);
    }
  };

  const fetchUpcomingShifts = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${API_URL}/shifts/my-all-upcoming-shifts`,
        { headers: { Authorization: token } }
      );

      const data = await res.json();
      
      // Group shifts by date for better organization
      const groupedShifts = data.reduce((acc, shift) => {
        const date = new Date(shift.scheduledDate).toLocaleDateString('en-IN');
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(shift);
        return acc;
      }, {});

      setUpcomingShifts(groupedShifts);
    } catch (err) {
      console.error("Failed to load upcoming shifts", err);
    }
  };

  useEffect(() => {
    fetchAssignedShifts();
    fetchUpcomingShifts();

    const refreshInterval = setInterval(() => {
      fetchAssignedShifts();
      fetchUpcomingShifts();
    }, 5000);

    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const toggleMachine = async (machine) => {
    try {
      const currentTime = new Date();
      const shiftStart = new Date(machine.shiftStartTime);

      // Check if shift has started
      if (machine.status === "stopped" && currentTime < shiftStart) {
        const startTime = shiftStart.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit'
        });
        alert(`Your ${machine.shiftType} shift starts at ${startTime}. Please wait until then.`);
        return;
      }

      const token = localStorage.getItem("token");

      const endpoint =
        machine.status === "running"
          ? `/api/looms/${machine.id}/stop`
          : `/api/looms/${machine.id}/start`;

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { Authorization: token },
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.message || "Failed to toggle loom");
        return;
      }

      await fetchAssignedShifts();
      setError('');
    } catch (err) {
      console.error("Failed to toggle loom:", err);
      setError("Failed to toggle loom");
    }
  };

  const formatTime = (runningSince) => {
    if (!runningSince) return "00:00:00";

    const diff = Math.floor((now - new Date(runningSince)) / 1000);
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;

    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatShiftTime = (time) => {
    if (!time) return "";
    const date = new Date(time);
    return date.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateWithDay = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const isToday = (date) => {
    const today = new Date();
    const compareDate = new Date(date);
    return today.toDateString() === compareDate.toDateString();
  };

  const isTomorrow = (date) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const compareDate = new Date(date);
    return tomorrow.toDateString() === compareDate.toDateString();
  };

  const getDaysUntil = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isShiftActive = (machine) => {
    const currentTime = new Date();
    const shiftStart = new Date(machine.shiftStartTime);
    const shiftEnd = new Date(machine.shiftEndTime);
    
    return currentTime >= shiftStart && currentTime <= shiftEnd;
  };

  const canStartLoom = (machine) => {
    const currentTime = new Date();
    const shiftStart = new Date(machine.shiftStartTime);
    const thirtyMinsBefore = new Date(shiftStart.getTime() - 30 * 60 * 1000);
    
    return currentTime >= thirtyMinsBefore;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg font-semibold text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Weaver Dashboard
            </h1>
            <p className="text-sm text-gray-600">
              Today's shifts • Auto-refresh: 5s
            </p>
          </div>
          <button
            onClick={onLogout}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Today's Active Shifts */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Today's Assigned Shifts</h2>
          
          {assignedMachines.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <User size={48} className="text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                No Shifts Today
              </h3>
              <p className="text-gray-600">
                You don't have any shifts assigned for today. Check your upcoming shifts below.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {assignedMachines.map((machine) => {
                const shiftActive = isShiftActive(machine);
                const canStart = canStartLoom(machine);
                const stats = machineStats[machine.id] || { production: 0, energy: 0 };

                return (
                  <div
                    key={machine.shiftId}
                    className="bg-white rounded-2xl shadow-2xl p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold">{machine.loomId}</h3>
                        <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                          <Calendar size={14} />
                          {formatDate(machine.scheduledDate)}
                        </p>
                      </div>
                      <span
                        className={`w-3 h-3 rounded-full ${
                          machine.status === "running"
                            ? "bg-green-500 animate-pulse"
                            : "bg-red-500"
                        }`}
                        title={machine.status === "running" ? "Running" : "Stopped"}
                      />
                    </div>

                    <div className="flex items-center gap-4 mb-4 text-sm">
                      <span className="font-medium flex items-center gap-1 bg-indigo-50 px-3 py-1 rounded-full">
                        <Clock size={14} />
                        {machine.shiftType}
                      </span>
                      <span className="text-gray-600">
                        {formatShiftTime(machine.shiftStartTime)} - {formatShiftTime(machine.shiftEndTime)}
                      </span>
                    </div>

                    {/* Production and Energy Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="text-blue-600" size={18} />
                          <p className="text-xs text-gray-600">Production</p>
                        </div>
                        <p className="text-2xl font-bold text-blue-900">
                          {stats.production.toFixed(2)} m
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <Zap className="text-yellow-600" size={18} />
                          <p className="text-xs text-gray-600">Energy</p>
                        </div>
                        <p className="text-2xl font-bold text-yellow-900">
                          {stats.energy.toFixed(2)} kWh
                        </p>
                      </div>
                    </div>

                    {!shiftActive && (
                      <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-lg text-sm">
                        {canStart 
                          ? `⏰ Your shift starts at ${formatShiftTime(machine.shiftStartTime)}`
                          : `⏳ Shift not yet available. Available 30 minutes before start time.`
                        }
                      </div>
                    )}

                    {shiftActive && (
                      <div className="text-center mb-6">
                        <p className="text-sm text-gray-500 mb-2">Running Time</p>
                        <p className="text-4xl font-mono font-bold">
                          {formatTime(machine.runningSince)}
                        </p>
                      </div>
                    )}

                    <button
                      onClick={() => toggleMachine(machine)}
                      disabled={!canStart}
                      className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
                        !canStart
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : machine.status === "running"
                          ? "bg-red-500 text-white hover:bg-red-600"
                          : "bg-green-500 text-white hover:bg-green-600"
                      }`}
                    >
                      {machine.status === "running" ? (
                        <>
                          <Pause />
                          Stop Loom
                        </>
                      ) : (
                        <>
                          <Play />
                          Start Loom
                        </>
                      )}
                    </button>

                    <div className="mt-4 pt-4 border-t text-center">
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          machine.status === "running"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {machine.status === "running" ? "● RUNNING" : "● STOPPED"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming Shifts - All Future Shifts */}
        {Object.keys(upcomingShifts).length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Upcoming Shifts</h2>
            <div className="space-y-4">
              {Object.entries(upcomingShifts)
                .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
                .map(([date, shifts]) => {
                  const firstShiftDate = shifts[0].scheduledDate;
                  const daysUntil = getDaysUntil(firstShiftDate);
                  
                  let dateLabel = formatDateWithDay(firstShiftDate);
                  if (isToday(firstShiftDate)) {
                    dateLabel = `Today - ${formatDate(firstShiftDate)}`;
                  } else if (isTomorrow(firstShiftDate)) {
                    dateLabel = `Tomorrow - ${formatDate(firstShiftDate)}`;
                  } else if (daysUntil <= 7) {
                    dateLabel = `In ${daysUntil} days - ${formatDateWithDay(firstShiftDate)}`;
                  }

                  return (
                    <div key={date} className="bg-white rounded-2xl shadow-xl overflow-hidden">
                      {/* Date Header */}
                      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-lg">{dateLabel}</h3>
                          <span className="text-black bg-white bg-opacity-20 px-3 py-1 rounded-full ">
                            {shifts.length} {shifts.length === 1 ? 'Shift' : 'Shifts'}
                          </span>
                        </div>
                      </div>

                      {/* Shifts for this date */}
                      <div className="p-6 space-y-3">
                        {shifts
                          .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
                          .map((shift) => (
                            <div
                              key={shift._id}
                              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-lg ${
                                  shift.shiftType === 'Morning' ? 'bg-yellow-100' :
                                  shift.shiftType === 'Evening' ? 'bg-orange-100' :
                                  'bg-indigo-100'
                                }`}>
                                  <Clock size={24} className={
                                    shift.shiftType === 'Morning' ? 'text-yellow-600' :
                                    shift.shiftType === 'Evening' ? 'text-orange-600' :
                                    'text-indigo-600'
                                  } />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-800">
                                    {shift.loomId.loomId} - {shift.shiftType} Shift
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {formatShiftTime(shift.startTime)} - {formatShiftTime(shift.endTime)}
                                  </p>
                                </div>
                              </div>
                              <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                                Scheduled
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* No Upcoming Shifts */}
        {Object.keys(upcomingShifts).length === 0 && assignedMachines.length === 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar size={48} className="text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              No Shifts Scheduled
            </h3>
            <p className="text-gray-600">
              You don't have any shifts assigned yet. Please contact your administrator.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeaverDashboard;