import React, { useState, useEffect } from 'react';
import { X, Save, Clock } from 'lucide-react';
import { TimerSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: TimerSettings) => void;
  settings: TimerSettings;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, settings }) => {
  const [localSettings, setLocalSettings] = useState<TimerSettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleChange = (key: keyof TimerSettings, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      setLocalSettings(prev => ({ ...prev, [key]: numValue }));
    }
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
      {/* Width constrained to 360px to fit comfortably in 400px popup */}
      <div className="bg-white rounded-2xl shadow-2xl w-[360px] overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-500" />
            Timer Settings
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Focus Duration (minutes)</label>
              <input
                type="number"
                value={localSettings.workDuration}
                onChange={(e) => handleChange('workDuration', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/50 text-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Short Break</label>
                <input
                  type="number"
                  value={localSettings.shortBreakDuration}
                  onChange={(e) => handleChange('shortBreakDuration', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-slate-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Long Break</label>
                <input
                  type="number"
                  value={localSettings.longBreakDuration}
                  onChange={(e) => handleChange('longBreakDuration', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm flex items-center gap-2 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;