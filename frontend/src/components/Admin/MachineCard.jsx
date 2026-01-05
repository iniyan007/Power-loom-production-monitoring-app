import React from "react";
import { Ruler, Clock, Power, User, X } from 'lucide-react';

const MachineCard = ({ machine, onAssignWeaver, onDelete }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all p-6 border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <button
            onClick={() => onAssignWeaver(machine.id)}
            className="text-lg font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-2 mb-2"
          >
            <User size={20} />
            {machine.weaverName || 'Assign Weaver'}
          </button>

          {/* ✅ Loom ID (NEW) */}
          <p className="text-sm text-gray-600">
            Loom ID: <span className="font-medium">{machine.loomId}</span>
          </p>

          {/* ✅ Shift Type (NEW) */}
          {machine.shiftType && (
            <p className="text-sm text-gray-500">
              Shift: <span className="font-medium">{machine.shiftType}</span>
            </p>
          )}

          {machine.weaverName && (
            <p className="text-sm text-gray-500">Click name to reassign</p>
          )}
        </div>

        <button
          onClick={() => onDelete(machine.id)}
          className="text-red-500 hover:text-red-700 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="space-y-3">
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
    </div>
  );
};

export default MachineCard;
