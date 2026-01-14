import React, { useState } from 'react';
import { X, Calendar, Clock } from 'lucide-react';

const WeaverModal = ({ isOpen, onClose, onSelect, weavers }) => {
  const [selectedWeaver, setSelectedWeaver] = useState(null);
  const [shiftType, setShiftType] = useState("Morning");
  const [selectedDate, setSelectedDate] = useState("");

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get minimum selectable date (today)
  const minDate = getTodayDate();

  const handleSubmit = () => {
    if (!selectedWeaver || !selectedDate) {
      alert("Please select a weaver and date");
      return;
    }

    onSelect(selectedWeaver, shiftType, selectedDate);
    
    // Reset form
    setSelectedWeaver(null);
    setShiftType("Morning");
    setSelectedDate("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Assign Weaver & Shift</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Date Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
            <Calendar size={16} />
            Select Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={minDate}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Shift will be active on selected date only
          </p>
        </div>

        {/* Shift Type Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
            <Clock size={16} />
            Select Shift
          </label>
          <select
            value={shiftType}
            onChange={(e) => setShiftType(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="Morning">Morning (6:00 AM - 2:00 PM)</option>
            <option value="Evening">Evening (2:00 PM - 10:00 PM)</option>
            <option value="Night">Night (10:00 PM - 6:00 AM)</option>
          </select>
        </div>

        {/* Weaver Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Select Weaver
          </label>
          <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-2">
            {weavers.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No weavers available</p>
            ) : (
              weavers.map((weaver) => (
                <button
                  key={weaver.id}
                  onClick={() => setSelectedWeaver(weaver)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all border ${
                    selectedWeaver?.id === weaver.id
                      ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-200'
                      : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <p className="font-semibold text-gray-800">{weaver.name}</p>
                  <p className="text-sm text-gray-500">{weaver.email}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Summary */}
        {selectedWeaver && selectedDate && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-semibold text-blue-900">Assignment Summary:</p>
            <p className="text-sm text-blue-700 mt-1">
              <strong>{selectedWeaver.name}</strong> will be assigned to{' '}
              <strong>{shiftType}</strong> shift on{' '}
              <strong>{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}</strong>
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedWeaver || !selectedDate}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
              selectedWeaver && selectedDate
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Assign Shift
          </button>
        </div>
      </div>
    </div>
  );
};

export default WeaverModal;