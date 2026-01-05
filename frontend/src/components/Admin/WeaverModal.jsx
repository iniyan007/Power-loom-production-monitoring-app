import React, { useState} from 'react';
import { X } from 'lucide-react';

const WeaverModal = ({ isOpen, onClose, onSelect, weavers }) => {
  const [shiftType, setShiftType] = useState("Morning");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Select Weaver</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* ✅ Shift Dropdown (NO DESIGN BREAK) */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Select Shift
          </label>
          <select
            value={shiftType}
            onChange={(e) => setShiftType(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="Morning">Morning</option>
            <option value="Evening">Evening</option>
            <option value="Night">Night</option>
          </select>
        </div>

        {/* Weaver List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {weavers.map((weaver) => (
            <button
              key={weaver.id}
              onClick={() => {
                onSelect(weaver, shiftType);
                onClose();
              }}
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-indigo-50 transition-colors border border-gray-200 hover:border-indigo-300"
            >
              <p className="font-semibold text-gray-800">{weaver.name}</p>
              <p className="text-sm text-gray-500">{weaver.email}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeaverModal;
