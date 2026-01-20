import React, { useState } from 'react';
import { Trash2, Lock, Plus, Globe } from 'lucide-react';
import { BlockedSite } from '../types';

interface BlockListProps {
  sites: BlockedSite[];
  onAddSite: (url: string) => void;
  onRemoveSite: (id: string) => void;
  isLocked: boolean;
}

const BlockList: React.FC<BlockListProps> = ({ sites, onAddSite, onRemoveSite, isLocked }) => {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    if (inputValue.trim()) {
      onAddSite(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 h-full flex flex-col">
      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <Lock className={`w-5 h-5 ${isLocked ? 'text-red-500' : 'text-slate-400'}`} />
        Blocked Distractions
      </h3>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="example.com"
            disabled={isLocked}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:opacity-50"
          />
        </div>
        <button
          onClick={handleAdd}
          disabled={!inputValue.trim() || isLocked}
          className="bg-slate-900 text-white p-2 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {sites.length === 0 && (
          <div className="text-center py-8 text-slate-400 text-sm">
            No sites blocked yet.<br/>Add distractions to avoid.
          </div>
        )}
        
        {sites.map((site) => (
          <div 
            key={site.id}
            className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
              isLocked 
                ? 'bg-red-50 border-red-100' 
                : 'bg-white border-slate-100 hover:border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                isLocked ? 'bg-red-200 text-red-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {site.url.charAt(0).toUpperCase()}
              </div>
              <span className={`text-sm truncate font-medium ${isLocked ? 'text-red-800' : 'text-slate-700'}`}>
                {site.url}
              </span>
            </div>
            
            {isLocked ? (
              <Lock className="w-4 h-4 text-red-400" />
            ) : (
              <button
                onClick={() => onRemoveSite(site.id)}
                className="text-slate-400 hover:text-red-500 transition-colors p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
      
      {isLocked && (
        <div className="mt-4 text-xs text-center text-red-500 font-medium bg-red-50 py-2 rounded-lg animate-pulse">
          Site management locked while focusing!
        </div>
      )}
    </div>
  );
};

export default BlockList;