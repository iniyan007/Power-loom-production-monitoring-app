import React, { useState, useEffect } from "react";
import { Play, Pause, Clock, Ruler, Power, User } from "lucide-react";

const WeaverDashboard = ({ onLogout }) => {
  const [assignedMachine, setAssignedMachine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(0);

  // Fetch assigned shift
  useEffect(() => {
    const fetchAssignedShift = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(
          "http://localhost:5000/api/shifts/my-active-shift",
          {
            headers: { Authorization: token },
          }
        );

        const data = await res.json();

        if (data && data.loomId && data.loomId.currentWeaver) {
          setAssignedMachine({
            id: data.loomId._id,
            machineName: data.loomId.loomId,
            shiftType: data.shiftType, // ✅ ADD THIS
            length: "0 meters",
            power: "0 kWh",
            isRunning: false,
            startTime: null,
          });
        } else {
          setAssignedMachine(null);
        }
      } catch (err) {
        console.error("Failed to load shift", err);
        setAssignedMachine(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedShift();
  }, []);

  // Timer
  useEffect(() => {
    let interval;
    if (assignedMachine?.isRunning) {
      interval = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [assignedMachine?.isRunning]);
  
  useEffect(() => {
    if (!assignedMachine?.isRunning) return;

    const interval = setInterval(() => {
      const allowed = isWithinShiftTime(assignedMachine.shiftType);

      if (!allowed) {
        alert("Shift time is over. Loom stopped automatically.");

        setAssignedMachine((prev) => ({
          ...prev,
          isRunning: false,
        }));

        // OPTIONAL: notify backend
        // fetch(`/api/shifts/end/${SHIFT_ID}`, { method: "POST", headers: { Authorization: token } });
      }
    }, 60000); // check every minute

    return () => clearInterval(interval);
  }, [assignedMachine?.isRunning]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleMachine = () => {
    if (!assignedMachine) return;

    // ❌ Block start outside shift time
    if (!assignedMachine.isRunning) {
      const allowed = isWithinShiftTime(assignedMachine.shiftType);

      if (!allowed) {
        alert(
          `You can only start the loom during your ${assignedMachine.shiftType} shift`
        );
        return;
      }

      const startTime = new Date().toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour12: false,
      });

      setAssignedMachine({
        ...assignedMachine,
        isRunning: true,
        startTime,
      });

      return;
    }

    // Stop manually
    setAssignedMachine({
      ...assignedMachine,
      isRunning: false,
    });
  };
  const isWithinShiftTime = (shiftType) => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const current = hours * 60 + minutes;

    const toMinutes = (h, m) => h * 60 + m;

    if (shiftType === "Morning") {
      return current >= toMinutes(6, 0) && current < toMinutes(14, 0);
    }

    if (shiftType === "Evening") {
      return current >= toMinutes(14, 0) && current < toMinutes(22, 0);
    }

    if (shiftType === "Night") {
      return current >= toMinutes(22, 0) || current < toMinutes(6, 0);
    }

    return false;
  };

  // 🔄 Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg font-semibold text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Weaver Dashboard
            </h1>
            <p className="text-sm text-gray-600">
              Monitor your assigned machine
            </p>
          </div>
          <button
            onClick={onLogout}
            className="px-6 py-2 bg-red-500 text-white rounded-lg"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {!assignedMachine ? (
          // ❌ NO SHIFT ASSIGNED
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <User size={48} className="text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              No Loom / Shift Assigned
            </h2>
            <p className="text-gray-600">
              Please contact your administrator to assign a machine.
            </p>
          </div>
        ) : (
          // ✅ DASHBOARD (your design preserved)
          <>
            {/* Timer */}
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <h2 className="text-xl font-bold mb-4">
                {assignedMachine.machineName}
              </h2>

              <div className="text-center mb-6">
                <p className="text-4xl font-mono">{formatTime(timer)}</p>
                {assignedMachine.startTime && (
                  <p className="text-sm text-gray-500">
                    Started at {assignedMachine.startTime} IST
                  </p>
                )}
              </div>

              <button
                onClick={toggleMachine}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 ${
                  assignedMachine.isRunning
                    ? "bg-red-500 text-white"
                    : "bg-green-500 text-white"
                }`}
              >
                {assignedMachine.isRunning ? <Pause /> : <Play />}
                {assignedMachine.isRunning ? "Stop Machine" : "Start Machine"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WeaverDashboard;
