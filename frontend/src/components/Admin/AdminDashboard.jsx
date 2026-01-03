import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import MachineCard from './MachineCard';
import WeaverModal from './WeaverModal';

const AdminDashboard = ({ onLogout }) => {
  const [machines, setMachines] = useState([
    {
      id: 1,
      weaverName: '',
      length: '-',
      startTime: '-',
      endTime: '-',
      power: '-'
    }
  ]);
  const [showModal, setShowModal] = useState(false);
  const [selectedMachineId, setSelectedMachineId] = useState(null);

  // Mock weavers data - Replace with API call
  const availableWeavers = [
    { id: 1, name: 'Apoorva', email: 'apoorva@example.com' },
    { id: 2, name: 'Barath', email: 'barath@example.com' },
    { id: 3, name: 'Iniyan', email: 'iniyan@example.com' },
    { id: 4, name: 'Gayathri', email: 'gayathri@example.com' }
  ];

  const addMachine = () => {
    const newMachine = {
      id: machines.length + 1,
      weaverName: '',
      length: '-',
      startTime: '-',
      endTime: '-',
      power: '-'
    };
    setMachines([...machines, newMachine]);
  };

  const deleteMachine = (id) => {
    setMachines(machines.filter((m) => m.id !== id));
  };

  const assignWeaver = (machineId) => {
    setSelectedMachineId(machineId);
    setShowModal(true);
  };

  const handleWeaverSelect = (weaver) => {
    setMachines(
      machines.map((m) =>
        m.id === selectedMachineId ? { ...m, weaverName: weaver.name } : m
      )
    );
  };

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
              onClick={onLogout}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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