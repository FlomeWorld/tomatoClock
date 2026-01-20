import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings, Coffee, Brain, MonitorOff, Sparkles, Shield, Timer as TimerIcon, List } from 'lucide-react';
import CircularTimer from './components/CircularTimer';
import BlockList from './components/BlockList';
import SettingsModal from './components/SettingsModal';
import { TimerMode, TimerSettings, BlockedSite, FocusTip } from './types';
import { getFocusMotivation } from './services/geminiService';
import { loadBlockedSites, saveBlockedSites, updateBlockingRules } from './services/extensionService';

const DEFAULT_SETTINGS: TimerSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
};

function App() {
  // State
  const [activeTab, setActiveTab] = useState<'timer' | 'blocked'>('timer');
  const [timerSettings, setTimerSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [mode, setMode] = useState<TimerMode>(TimerMode.WORK);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_SETTINGS.workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [blockedSites, setBlockedSites] = useState<BlockedSite[]>([]);
  const [aiTip, setAiTip] = useState<FocusTip | null>(null);
  const [isLoadingTip, setIsLoadingTip] = useState(false);

  // Refs
  const timerRef = useRef<number | null>(null);

  // Load initial data
  useEffect(() => {
    const init = async () => {
      const savedSites = await loadBlockedSites();
      setBlockedSites(savedSites);
    };
    init();
  }, []);

  // Sync blocking rules whenever relevant state changes
  useEffect(() => {
    const shouldBlock = isRunning && mode === TimerMode.WORK;
    updateBlockingRules(blockedSites, shouldBlock);
  }, [isRunning, mode, blockedSites]);

  // Helper to get duration for a mode
  const getDurationForMode = (m: TimerMode, settings: TimerSettings) => {
    switch (m) {
      case TimerMode.WORK: return settings.workDuration;
      case TimerMode.SHORT_BREAK: return settings.shortBreakDuration;
      case TimerMode.LONG_BREAK: return settings.longBreakDuration;
      default: return settings.workDuration;
    }
  };

  // Handlers
  const switchMode = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(getDurationForMode(newMode, timerSettings) * 60);
  };

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(getDurationForMode(mode, timerSettings) * 60);
  };

  const updateSettings = (newSettings: TimerSettings) => {
    setTimerSettings(newSettings);
    if (!isRunning) {
       setTimeLeft(getDurationForMode(mode, newSettings) * 60);
    }
  };

  const getTotalTime = () => {
    return getDurationForMode(mode, timerSettings) * 60;
  };

  const addSite = (url: string) => {
    let cleanUrl = url.toLowerCase();
    cleanUrl = cleanUrl.replace(/^https?:\/\//, '').replace(/^www\./, '');
    const newSite = { id: Date.now().toString(), url: cleanUrl };
    const newSites = [...blockedSites, newSite];
    setBlockedSites(newSites);
    saveBlockedSites(newSites);
  };

  const removeSite = (id: string) => {
    const newSites = blockedSites.filter(s => s.id !== id);
    setBlockedSites(newSites);
    saveBlockedSites(newSites);
  };

  const fetchMotivation = async () => {
    setIsLoadingTip(true);
    const tip = await getFocusMotivation(blockedSites, mode);
    setAiTip(tip);
    setIsLoadingTip(false);
  };

  // Timer Effect
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft]);

  return (
    <div className="w-full h-full flex flex-col bg-slate-50">
      
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onSave={updateSettings} 
        settings={timerSettings} 
      />

      {/* Header */}
      <header className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-4 shrink-0 relative z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white shadow-sm">
            <MonitorOff className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold text-slate-900">TomatoFocus</h1>
        </div>
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
        >
          <Settings className="w-5 h-5" />
        </button>
      </header>

      {/* Top Navigation Tabs */}
      <div className="h-12 bg-white border-b border-slate-100 flex shrink-0 z-10">
        <button
          onClick={() => setActiveTab('timer')}
          className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium transition-all relative ${
            activeTab === 'timer' ? 'text-red-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <TimerIcon className="w-4 h-4" />
          Timer
          {activeTab === 'timer' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('blocked')}
          className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium transition-all relative ${
            activeTab === 'blocked' ? 'text-red-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Shield className="w-4 h-4" />
          Block List
          {activeTab === 'blocked' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-500" />
          )}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        
        {/* Timer View */}
        <div className={`absolute inset-0 flex flex-col overflow-y-auto custom-scrollbar p-4 transition-transform duration-300 ${activeTab === 'timer' ? 'translate-x-0' : '-translate-x-full'}`}>
          
          {/* Mode Selector */}
          <div className="flex bg-slate-200/50 p-1 rounded-lg mb-6 shrink-0">
            {[
              { id: TimerMode.WORK, label: 'Focus', icon: Brain },
              { id: TimerMode.SHORT_BREAK, label: 'Short', icon: Coffee },
              { id: TimerMode.LONG_BREAK, label: 'Long', icon: Sparkles },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => switchMode(m.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  mode === m.id 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <m.icon className="w-3.5 h-3.5" />
                <span>{m.label}</span>
              </button>
            ))}
          </div>

          {/* Timer Display */}
          <div className="flex-1 flex flex-col items-center justify-center min-h-[250px]">
            <div className="scale-90 transform">
              <CircularTimer 
                timeLeft={timeLeft} 
                totalTime={getTotalTime()} 
                mode={mode}
                isRunning={isRunning}
              />
            </div>

            <div className="flex items-center gap-4 mt-6">
              <button
                onClick={toggleTimer}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all active:scale-95 ${
                  isRunning 
                    ? 'bg-slate-900 shadow-slate-900/20' 
                    : 'bg-red-500 shadow-red-500/30'
                }`}
              >
                {isRunning ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
              </button>
              
              <button
                onClick={resetTimer}
                className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-300 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* AI Tip (Compact) */}
          <div className="mt-4 bg-indigo-50/50 rounded-xl p-3 border border-indigo-100/50">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Focus Assistant
              </span>
              <button 
                onClick={fetchMotivation}
                disabled={isLoadingTip}
                className="text-[10px] font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
              >
                {isLoadingTip ? '...' : 'New Tip'}
              </button>
            </div>
            <p className="text-xs text-indigo-800 italic leading-relaxed min-h-[2.5em]">
              {aiTip ? `"${aiTip.text}"` : "Need motivation? Ask the assistant."}
            </p>
          </div>
        </div>

        {/* Block List View */}
        <div className={`absolute inset-0 p-4 transition-transform duration-300 flex flex-col ${activeTab === 'blocked' ? 'translate-x-0' : 'translate-x-full'}`}>
           <BlockList 
            sites={blockedSites} 
            onAddSite={addSite} 
            onRemoveSite={removeSite}
            isLocked={isRunning && mode === TimerMode.WORK}
          />
        </div>

      </div>
    </div>
  );
}

export default App;