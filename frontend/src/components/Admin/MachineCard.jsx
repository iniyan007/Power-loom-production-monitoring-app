import React from "react";
import { Ruler, Clock, Power, User, X, UserX } from "lucide-react";

const MachineCard = ({ machine, onAssignWeaver, onUnassignWeaver, onDelete }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all p-6 border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          {machine.weaverName ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <User size={18} className="text-indigo-600" />
                <span className="text-lg font-bold text-gray-800">
                  {machine.weaverName}
                </span>
              </div>
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => onAssignWeaver(machine.id)}
                  className="text-xs px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200 transition-colors"
                >
                  Reassign
                </button>
                <button
                  onClick={() => onUnassignWeaver(machine.id)}
                  className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors flex items-center gap-1"
                >
                  <UserX size={14} />
                  Unassign
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

          {/* Shift Info */}
          {machine.shiftType && (
            <p className="text-sm text-gray-500">
              Shift: <span className="font-medium">{machine.shiftType}</span>
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

      {/* Status Badge */}
      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Status</span>
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
    </div>
  );
};

export default MachineCard;