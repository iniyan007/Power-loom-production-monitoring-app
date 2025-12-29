// ...existing code...
import { useState } from "react";
import { api } from "../services/api";

export default function WeaverDashboard() {
  const [shiftId, setShiftId] = useState("");

  const markAttendance = async () => {
    await api.post(`/shifts/attendance/${shiftId}`);
    alert("Attendance marked");
  };

  const endShift = async () => {
    await api.post(`/shifts/end/${shiftId}`);
    alert("Shift ended");
  };

  const logout = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-xl mx-auto bg-white shadow-md rounded-lg p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-800">Weaver Dashboard</h1>
          <button
            onClick={logout}
            className="text-sm bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-600">Shift ID</label>
          <input
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Shift ID"
            onChange={e => setShiftId(e.target.value)}
            value={shiftId}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={markAttendance}
            className="flex-1 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
          >
            Mark Present
          </button>

          <button
            onClick={endShift}
            className="flex-1 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition"
          >
            End Shift
          </button>
        </div>
      </div>
    </div>
  );
}
// ...existing code...