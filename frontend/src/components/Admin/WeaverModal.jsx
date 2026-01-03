import React from 'react';
import { X } from 'lucide-react';

const WeaverModal = ({ isOpen, onClose, onSelect, weavers }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Select Weaver</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {weavers.map((weaver) => (
            <button
              key={weaver.id}
              onClick={() => {
                onSelect(weaver);
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