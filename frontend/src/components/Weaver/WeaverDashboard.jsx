import React, { useState, useEffect } from "react";
import { Play, Pause, User, Clock } from "lucide-react";

const WeaverDashboard = ({ onLogout }) => {
  const [assignedMachines, setAssignedMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState('');

  /* ================= FETCH ASSIGNED LOOMS ================= */
  const fetchAssignedShifts = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        "http://localhost:5000/api/shifts/my-active-shift",
        { headers: { Authorization: token } }
      );

      const data = await res.json();

      if (Array.isArray(data)) {
        setAssignedMachines(
          data.map((shift) => ({
            id: shift.loomId._id,
            loomId: shift.loomId.loomId,
            shiftType: shift.shiftType,
            status: shift.loomId.status,
            runningSince: shift.loomId.runningSince,
            shiftEndTime: shift.endTime
          }))
        );
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

  useEffect(() => {
    fetchAssignedShifts();

    // ✅ Auto-refresh every 5 seconds
    const refreshInterval = setInterval(() => {
      fetchAssignedShifts();
    }, 5000);

    return () => clearInterval(refreshInterval);
  }, []);

  /* ================= GLOBAL TICK (FOR TIMER) ================= */
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  /* ================= START / STOP LOOM ================= */
  const toggleMachine = async (machine) => {
    try {
      if (machine.status === "stopped" && !isWithinShiftTime(machine.shiftType)) {
        alert(`You can only start during ${machine.shiftType} shift`);
        return;
      }

      const token = localStorage.getItem("token");

      const endpoint =
        machine.status === "running"
          ? `/api/looms/${machine.id}/stop`
          : `/api/looms/${machine.id}/start`;

      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: "POST",
        headers: { Authorization: token },
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.message || "Failed to toggle loom");
        return;
      }

      // ✅ Refresh data from server instead of local update
      await fetchAssignedShifts();
      setError('');
    } catch (err) {
      console.error("Failed to toggle loom:", err);
      setError("Failed to toggle loom");
    }
  };

  /* ================= SHIFT TIME CHECK ================= */
  const isWithinShiftTime = (shiftType) => {
    const now = new Date();
    const current = now.getHours() * 60 + now.getMinutes();

    const toMin = (h, m) => h * 60 + m;

    if (shiftType === "Morning")
      return current >= toMin(6, 0) && current < toMin(14, 0);

    if (shiftType === "Evening")
      return current >= toMin(14, 0) && current < toMin(22, 0);

    if (shiftType === "Night")
      return current >= toMin(22, 0) || current < toMin(6, 0);

    return false;
  };

  /* ================= FORMAT TIMER ================= */
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

  /* ================= FORMAT SHIFT END TIME ================= */
  const formatShiftEndTime = (endTime) => {
    if (!endTime) return "";
    const date = new Date(endTime);
    return date.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  /* ================= CHECK IF SHIFT ENDED ================= */
  const isShiftEnded = (endTime) => {
    if (!endTime) return false;
    return now > new Date(endTime).getTime();
  };

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg font-semibold text-gray-600">Loading...</p>
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Weaver Dashboard
            </h1>
            <p className="text-sm text-gray-600">
              Monitor your assigned looms • Auto-refresh: 5s
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

      <div className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {assignedMachines.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <User size={48} className="text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              No Loom Assigned
            </h2>
            <p className="text-gray-600">
              Please contact administrator to assign you a loom and shift.
            </p>
          </div>
        ) : (
          assignedMachines.map((machine) => {
            const shiftEnded = isShiftEnded(machine.shiftEndTime);
            const canOperate = isWithinShiftTime(machine.shiftType) && !shiftEnded;

            return (
              <div
                key={machine.id}
                className="bg-white rounded-2xl shadow-2xl p-8 mb-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold">{machine.loomId}</h2>
                  <span
                    className={`w-3 h-3 rounded-full ${
                      machine.status === "running"
                        ? "bg-green-500 animate-pulse"
                        : "bg-red-500"
                    }`}
                    title={machine.status === "running" ? "Running" : "Stopped"}
                  />
                </div>

                <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                  <span className="font-medium">
                    Shift: {machine.shiftType}
                  </span>
                  {machine.shiftEndTime && (
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      Ends: {formatShiftEndTime(machine.shiftEndTime)}
                    </span>
                  )}
                </div>

                {shiftEnded && (
                  <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-lg text-sm">
                    ⚠️ Your shift has ended. Loom controls are disabled.
                  </div>
                )}

                {!canOperate && !shiftEnded && (
                  <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-800 rounded-lg text-sm">
                    ℹ️ You can only operate during your {machine.shiftType} shift
                  </div>
                )}

                <div className="text-center mb-6">
                  <p className="text-sm text-gray-500 mb-2">Running Time</p>
                  <p className="text-4xl font-mono font-bold">
                    {formatTime(machine.runningSince)}
                  </p>
                </div>

                <button
                  onClick={() => toggleMachine(machine)}
                  disabled={shiftEnded}
                  className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
                    shiftEnded
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
          })
        )}
      </div>
    </div>
  );
};

export default WeaverDashboard;