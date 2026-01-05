import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import axios from 'axios';
import MachineCard from './MachineCard';
import WeaverModal from './WeaverModal';

const API_URL = 'http://localhost:5000/api';

const AdminDashboard = ({ onLogout }) => {
  const [machines, setMachines] = useState([]);
  const [availableWeavers, setAvailableWeavers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedMachineId, setSelectedMachineId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Get auth token
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: token };
  };

  // Fetch machines/looms
  const fetchMachines = async () => {
    try {
      const response = await axios.get(`${API_URL}/looms`, {
        headers: getAuthHeader()
      });
      setMachines(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load machines');
      setLoading(false);
    }
  };

  // Fetch available weavers
  const fetchWeavers = async () => {
    try {
      const response = await axios.get(`${API_URL}/looms/weavers`, {
        headers: getAuthHeader()
      });
      setAvailableWeavers(response.data);
    } catch (err) {
      console.error('Failed to load weavers:', err);
    }
  };

  useEffect(() => {
    fetchMachines();
    fetchWeavers();
  }, []);

  const addMachine = async () => {
    try {
      const loomId = `LOOM-${Date.now()}`;
      const response = await axios.post(
        `${API_URL}/looms`,
        { loomId },
        { headers: getAuthHeader() }
      );
      setMachines([...machines, response.data]);
    } catch (err) {
      setError('Failed to add machine');
    }
  };

  const deleteMachine = async (id) => {
    try {
      await axios.delete(`${API_URL}/looms/${id}`, {
        headers: getAuthHeader()
      });
      setMachines(machines.filter((m) => m.id !== id));
    } catch (err) {
      setError('Failed to delete machine');
    }
  };

  const assignWeaver = (machineId) => {
    setSelectedMachineId(machineId);
    setShowModal(true);
  };

  const handleWeaverSelect = async (weaver, shiftType) => {
  try {
    // 1️⃣ Assign weaver to loom
    const response = await axios.put(
      `${API_URL}/looms/${selectedMachineId}/assign`,
      { weaverId: weaver.id },
      { headers: getAuthHeader() }
    );

    // 2️⃣ Assign shift
    await axios.post(
      `${API_URL}/shifts/assign`,
      {
        loomId: selectedMachineId,
        weaverId: weaver.id,
        shiftType,
        startTime: new Date()
      },
      { headers: getAuthHeader() }
    );

    // 3️⃣ Update UI
    setMachines(
      machines.map((m) =>
        m.id === selectedMachineId
          ? { ...m, weaverName: response.data.weaverName }
          : m
      )
    );

    setShowModal(false);
  } catch (err) {
    setError("Failed to assign weaver and shift");
  }
};

const unassignWeaver = async (machineId) => {
  try {
    await axios.put(
      `${API_URL}/looms/${machineId}/unassign`,
      {},
      { headers: getAuthHeader() }
    );

    setMachines(
      machines.map((m) =>
        m.id === machineId
          ? { ...m, weaverName: null, weaverId: null }
          : m
      )
    );
  } catch (err) {
    setError("Failed to unassign weaver");
  }
};

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onLogout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-xl font-semibold text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-600">Manage weaving machines</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Add Machine Button */}
        <div className="mb-6">
          <button
            onClick={addMachine}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold shadow-lg"
          >
            <Plus size={20} />
            Add New Machine
          </button>
        </div>

        {/* Machines Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {machines.map((machine) => (
            <MachineCard
              key={machine.id}
              machine={machine}
              onAssignWeaver={assignWeaver}
              onDelete={deleteMachine}
            />
          ))}
        </div>

        {machines.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No machines added yet. Click "Add New Machine" to get started.
            </p>
          </div>
        )}
      </div>

      {/* Weaver Assignment Modal */}
      <WeaverModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSelect={handleWeaverSelect}
        weavers={availableWeavers}
      />
    </div>
  );
};

export default AdminDashboard;