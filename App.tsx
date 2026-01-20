import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings, Coffee, Brain, MonitorOff, Sparkles } from 'lucide-react';
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
    // Simple validation and cleanup
    let cleanUrl = url.toLowerCase();
    // Remove protocol if present for cleaner storage, though rule filter handles it mostly
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
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 p-4 md:p-8 gap-6 max-w-7xl mx-auto w-[800px] h-[600px] md:w-full md:h-full">
      
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onSave={updateSettings} 
        settings={timerSettings} 
      />

      {/* Left Column: Timer & Controls */}
      <div className="flex-1 flex flex-col gap-6">
        
        {/* Header */}
        <header className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20 text-white">
            <MonitorOff className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">TomatoFocus</h1>
            <p className="text-slate-500 text-sm">Stay productive, block distractions.</p>
          </div>
        </header>

        {/* Timer Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 flex flex-col items-center justify-center relative overflow-hidden">
          
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
            title="Timer Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Mode Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-8 w-full max-w-sm">
            {[
              { id: TimerMode.WORK, label: 'Work', icon: Brain },
              { id: TimerMode.SHORT_BREAK, label: 'Short Break', icon: Coffee },
              { id: TimerMode.LONG_BREAK, label: 'Long Break', icon: Sparkles },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => switchMode(m.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
                  mode === m.id 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <m.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{m.label}</span>
              </button>
            ))}
          </div>

          <div className="mb-8">
            <CircularTimer 
              timeLeft={timeLeft} 
              totalTime={getTotalTime()} 
              mode={mode}
              isRunning={isRunning}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTimer}
              className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transition-all transform hover:scale-105 active:scale-95 ${
                isRunning 
                  ? 'bg-slate-900 shadow-slate-900/20' 
                  : 'bg-red-500 shadow-red-500/30'
              }`}
            >
              {isRunning ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
            </button>
            
            <button
              onClick={resetTimer}
              className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* AI Tip Section */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100/50 relative">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-indigo-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Focus Assistant
            </h3>
            <button 
              onClick={fetchMotivation}
              disabled={isLoadingTip}
              className="text-xs bg-white/80 hover:bg-white text-indigo-600 px-3 py-1 rounded-full shadow-sm border border-indigo-100 transition-all disabled:opacity-50"
            >
              {isLoadingTip ? 'Thinking...' : 'Get Motivation'}
            </button>
          </div>
          
          <div className="min-h-[3rem]">
            {aiTip ? (
              <p className="text-indigo-800 text-sm italic leading-relaxed">
                "{aiTip.text}"
              </p>
            ) : (
              <p className="text-indigo-400 text-sm">
                Need a push? Ask the AI for advice on how to avoid your blocked sites.
              </p>
            )}
          </div>
        </div>

      </div>

      {/* Right Column: Block List */}
      <div className="w-full md:w-96 flex-shrink-0">
        <BlockList 
          sites={blockedSites} 
          onAddSite={addSite} 
          onRemoveSite={removeSite}
          isLocked={isRunning && mode === TimerMode.WORK}
        />
      </div>
      
    </div>
  );
}

export default App;