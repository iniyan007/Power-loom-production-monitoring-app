import React, { useState, useEffect } from "react";
import { Ruler, Clock, Power, User, X, UserX, BarChart3, Calendar, Edit } from "lucide-react";

const API_URL = "https://power-loom-production-monitoring-app.onrender.com/api";

// Machine Card Component
const MachineCard = ({ machine, onAssignWeaver, onUnassignWeaver, onDelete, onViewDetails, onRefresh }) => {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledShifts, setScheduledShifts] = useState([]);
  const [loading, setLoading] = useState(false);

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return { Authorization: token };
  };

  const fetchScheduledShifts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/shifts/loom/${machine.id}`, {
        headers: getAuthHeader(),
      });
      const data = await response.json();
      
      // Filter future and today's incomplete shifts
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const futureShifts = data.filter(shift => {
        const shiftDate = new Date(shift.scheduledDate);
        shiftDate.setHours(0, 0, 0, 0);
        return !shift.completed && shiftDate >= today;
      });
      
      setScheduledShifts(futureShifts);
    } catch (err) {
      console.error("Failed to load scheduled shifts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewSchedule = () => {
    fetchScheduledShifts();
    setShowScheduleModal(true);
  };

  const hasScheduledShifts = machine.weaverName || scheduledShifts.length > 0;

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all p-6 border border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            {/* Status: Currently Assigned or Scheduled */}
            {machine.weaverName ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <User size={18} className="text-indigo-600" />
                  <span className="text-lg font-bold text-gray-800">
                    {machine.weaverName}
                  </span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    Active Today
                  </span>
                </div>
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => onAssignWeaver(machine.id)}
                    className="text-xs px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200 transition-colors"
                  >
                    Assign New
                  </button>
                  <button
                    onClick={handleViewSchedule}
                    className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors flex items-center gap-1"
                  >
                    <Calendar size={14} />
                    View Schedule
                  </button>
                  <button
                    onClick={() => onUnassignWeaver(machine.id)}
                    className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors flex items-center gap-1"
                  >
                    <UserX size={14} />
                    Clear All
                  </button>
                </div>
              </div>
            ) : scheduledShifts.length > 0 ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={18} className="text-blue-600" />
                  <span className="text-lg font-bold text-gray-800">
                    Scheduled ({scheduledShifts.length})
                  </span>
                </div>
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => onAssignWeaver(machine.id)}
                    className="text-xs px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200 transition-colors"
                  >
                    Add Shift
                  </button>
                  <button
                    onClick={handleViewSchedule}
                    className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors flex items-center gap-1"
                  >
                    <Calendar size={14} />
                    View & Edit
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => onAssignWeaver(machine.id)}
                className="text-lg font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-2 mb-2"
              >
                <User size={20} />
                Assign Weaver
              </button>
            )}

            {/* Loom ID + Running Status */}
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <span
                className={`w-3 h-3 rounded-full ${
                  machine.isRunning ? "bg-green-500 animate-pulse" : "bg-red-500"
                }`}
                title={machine.isRunning ? "Running" : "Stopped"}
              />
              <span>
                Loom ID: <span className="font-medium">{machine.loomId}</span>
              </span>
            </div>

            {/* Current Shift Info */}
            {machine.shiftType && (
              <p className="text-sm text-gray-500">
                Current Shift: <span className="font-medium">{machine.shiftType}</span>
              </p>
            )}
          </div>

          <button
            onClick={() => onDelete(machine.id)}
            className="text-red-500 hover:text-red-700 transition-colors"
            title="Delete Machine"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center gap-3 text-gray-700">
            <Ruler size={18} className="text-blue-500" />
            <div>
              <p className="text-xs text-gray-500">Length Weaved</p>
              <p className="font-semibold">{machine.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-gray-700">
            <Clock size={18} className="text-green-500" />
            <div>
              <p className="text-xs text-gray-500">Shift Timing (IST)</p>
              <p className="font-semibold">
                {machine.startTime} - {machine.endTime}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-gray-700">
            <Power size={18} className="text-yellow-500" />
            <div>
              <p className="text-xs text-gray-500">Power Consumed</p>
              <p className="font-semibold">{machine.power}</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => onViewDetails(machine)}
          className="w-full mt-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-semibold hover:from-indigo-600 hover:to-purple-600 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
        >
          <BarChart3 size={20} />
          View Detailed Analytics
        </button>

        <div className="mt-4 pt-4 border-t text-center">
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full ${
              machine.isRunning
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {machine.isRunning ? "● RUNNING" : "● STOPPED"}
          </span>
        </div>
      </div>

      {/* Schedule Management Modal */}
      <ScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        machine={machine}
        shifts={scheduledShifts}
        loading={loading}
        onRefresh={() => {
          fetchScheduledShifts();
          onRefresh();
        }}
      />
    </>
  );
};

// Schedule Management Modal
const ScheduleModal = ({ isOpen, onClose, machine, shifts, loading, onRefresh }) => {
  const [editingShift, setEditingShift] = useState(null);
  const [availableWeavers, setAvailableWeavers] = useState([]);
  const [selectedWeaver, setSelectedWeaver] = useState(null);
  const [selectedShiftType, setSelectedShiftType] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return { Authorization: token };
  };

  useEffect(() => {
    if (isOpen) {
      fetchWeavers();
    }
  }, [isOpen]);

  const fetchWeavers = async () => {
    try {
      const response = await fetch(`${API_URL}/looms/weavers`, {
        headers: getAuthHeader(),
      });
      const data = await response.json();
      setAvailableWeavers(data);
    } catch (err) {
      console.error("Failed to load weavers:", err);
    }
  };

  const handleEditShift = (shift) => {
    setEditingShift(shift);
    setSelectedWeaver(shift.weaverId._id);
    setSelectedShiftType(shift.shiftType);
    setSelectedDate(new Date(shift.scheduledDate).toISOString().split('T')[0]);
  };

  const handleUpdateShift = async () => {
    try {
      // Delete old shift
      await fetch(`${API_URL}/shifts/${editingShift._id}`, {
        method: "DELETE",
        headers: getAuthHeader(),
      });

      // Create new shift with updated details
      await fetch(`${API_URL}/shifts/assign`, {
        method: "POST",
        headers: {
          ...getAuthHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          loomId: machine.id,
          weaverId: selectedWeaver,
          shiftType: selectedShiftType,
          scheduledDate: selectedDate,
        }),
      });

      setEditingShift(null);
      onRefresh();
      alert("Shift updated successfully!");
    } catch (err) {
      console.error("Failed to update shift:", err);
      alert("Failed to update shift");
    }
  };

  const handleDeleteShift = async (shiftId) => {
    if (!confirm("Are you sure you want to delete this shift?")) return;

    try {
      await fetch(`${API_URL}/shifts/${shiftId}`, {
        method: "DELETE",
        headers: getAuthHeader(),
      });

      onRefresh();
      alert("Shift deleted successfully!");
    } catch (err) {
      console.error("Failed to delete shift:", err);
      alert("Failed to delete shift");
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (time) => {
    return new Date(time).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">Shift Schedule</h2>
              <p className="text-sm opacity-90">Loom ID: {machine.loomId}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-600">Loading shifts...</div>
            </div>
          ) : shifts.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar size={40} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Scheduled Shifts</h3>
              <p className="text-gray-600">
                Click "Assign Weaver" to schedule shifts for this loom
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {shifts.map((shift) => (
                <div key={shift._id} className="border rounded-xl p-4 hover:shadow-lg transition-shadow">
                  {editingShift?._id === shift._id ? (
                    // Edit Mode
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Weaver
                        </label>
                        <select
                          value={selectedWeaver}
                          onChange={(e) => setSelectedWeaver(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                          {availableWeavers.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.name} ({w.email})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date
                        </label>
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Shift Type
                        </label>
                        <select
                          value={selectedShiftType}
                          onChange={(e) => setSelectedShiftType(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="Morning">Morning (6:00 AM - 2:00 PM)</option>
                          <option value="Evening">Evening (2:00 PM - 10:00 PM)</option>
                          <option value="Night">Night (10:00 PM - 6:00 AM)</option>
                        </select>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={handleUpdateShift}
                          className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => setEditingShift(null)}
                          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <User size={18} className="text-indigo-600" />
                          <span className="font-semibold text-gray-800">
                            {shift.weaverId.name}
                          </span>
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                            {shift.shiftType}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {formatDate(shift.scheduledDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditShift(shift)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Shift"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteShift(shift._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Shift"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MachineCard;