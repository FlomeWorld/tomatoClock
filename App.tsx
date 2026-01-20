import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings, Coffee, Brain, MonitorOff, Sparkles, Shield, Timer as TimerIcon } from 'lucide-react';
import CircularTimer from './components/CircularTimer';
import BlockList from './components/BlockList';
import SettingsModal from './components/SettingsModal';
import { TimerMode, TimerSettings, BlockedSite, FocusTip } from './types';
import { getFocusMotivation } from './services/geminiService';
import { loadBlockedSites, saveBlockedSites, updateBlockingRules, saveTimerState, loadTimerState } from './services/extensionService';

const DEFAULT_SETTINGS: TimerSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
};

function App() {
  // State
  const [activeTab, setActiveTab] = useState<'timer' | 'blocked'>('timer');
  const [timerSettings, setTimerSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [mode, setMode] = useState<TimerMode>(TimerMode.WORK);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_SETTINGS.workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedCycles, setCompletedCycles] = useState(0); // Track progress for long break

  const [blockedSites, setBlockedSites] = useState<BlockedSite[]>([]);
  const [aiTip, setAiTip] = useState<FocusTip | null>(null);
  const [isLoadingTip, setIsLoadingTip] = useState(false);

  // Refs
  const timerRef = useRef<number | null>(null);
  const targetTimeRef = useRef<number | null>(null);

  // Helper to get duration for a mode
  const getDurationForMode = (m: TimerMode, settings: TimerSettings) => {
    switch (m) {
      case TimerMode.WORK: return settings.workDuration;
      case TimerMode.SHORT_BREAK: return settings.shortBreakDuration;
      case TimerMode.LONG_BREAK: return settings.longBreakDuration;
      default: return settings.workDuration;
    }
  };

  // --- Initialization ---
  useEffect(() => {
    const init = async () => {
      // 0. Request Notifications
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }

      // 1. Load Blocked Sites
      const savedSites = await loadBlockedSites();
      setBlockedSites(savedSites);

      // 2. Load Timer State
      const savedState = await loadTimerState();
      
      if (savedState) {
        setMode(savedState.mode);
        setCompletedCycles(savedState.completedCycles || 0);
        
        if (savedState.isRunning && savedState.targetEndTime) {
          // Timer was running. Calculate remaining time based on target.
          const now = Date.now();
          const remainingSeconds = Math.ceil((savedState.targetEndTime - now) / 1000);
          
          if (remainingSeconds > 0) {
            setTimeLeft(remainingSeconds);
            setIsRunning(true);
            targetTimeRef.current = savedState.targetEndTime;
          } else {
            // Timer expired while closed. 
            // Trigger completion logic immediately to catch up.
            await handleTimerComplete(savedState.mode, savedState.completedCycles || 0);
          }
        } else {
          // Timer was paused or stopped
          setTimeLeft(savedState.timeLeft);
          setIsRunning(false);
          targetTimeRef.current = null;
        }
      }
    };
    init();
  }, []);

  // --- Logic Sync ---

  // Sync blocking rules whenever relevant state changes
  useEffect(() => {
    const shouldBlock = isRunning && mode === TimerMode.WORK;
    updateBlockingRules(blockedSites, shouldBlock);
  }, [isRunning, mode, blockedSites]);


  // --- Core Timer Logic ---

  const sendNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
       // Using chrome.notifications if available (Extension API), else fallback
       // @ts-ignore
       if (typeof chrome !== 'undefined' && chrome.notifications) {
          // @ts-ignore
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'logo192.png', // Ensure you have an icon, or uses default
            title: title,
            message: body,
            priority: 2
          });
       } else {
         new Notification(title, { body, icon: 'logo192.png' });
       }
    }
  };

  // This function handles the "Alarm" and auto-switching
  const handleTimerComplete = async (currentMode: TimerMode, cycles: number) => {
    let nextMode: TimerMode = TimerMode.WORK;
    let nextCycles = cycles;

    // 1. Determine Next Mode
    if (currentMode === TimerMode.WORK) {
      nextCycles = cycles + 1;
      const interval = timerSettings.longBreakInterval || 4;
      
      if (nextCycles % interval === 0) {
        nextMode = TimerMode.LONG_BREAK;
        sendNotification("Great Focus!", `You've done ${nextCycles} cycles. Enjoy a Long Break.`);
      } else {
        nextMode = TimerMode.SHORT_BREAK;
        sendNotification("Break Time!", "Take a short break to recharge.");
      }
    } else {
      // Break is over, back to work
      nextMode = TimerMode.WORK;
      sendNotification("Break Over", "Time to focus again!");
    }

    // 2. Set State
    setMode(nextMode);
    setCompletedCycles(nextCycles);
    
    // 3. Auto-Start Next Timer
    const nextDurationMinutes = getDurationForMode(nextMode, timerSettings);
    const nextDurationSeconds = nextDurationMinutes * 60;
    const nextTarget = Date.now() + (nextDurationSeconds * 1000);

    setTimeLeft(nextDurationSeconds);
    setMode(nextMode);
    setIsRunning(true);
    targetTimeRef.current = nextTarget;

    // 4. Save State
    await saveTimerState({
      mode: nextMode,
      timeLeft: nextDurationSeconds,
      isRunning: true,
      targetEndTime: nextTarget,
      lastUpdated: Date.now(),
      completedCycles: nextCycles
    });
  };

  // --- Timer Interval ---
  useEffect(() => {
    if (isRunning) {
      if (timerRef.current) window.clearInterval(timerRef.current);

      timerRef.current = window.setInterval(() => {
        if (targetTimeRef.current) {
          const now = Date.now();
          const diff = Math.ceil((targetTimeRef.current - now) / 1000);
          
          if (diff <= 0) {
            // --- TIMER FINISHED ---
            // Don't just stop. Proceed to next cycle.
            if (timerRef.current) clearInterval(timerRef.current);
            handleTimerComplete(mode, completedCycles);
          } else {
            setTimeLeft(diff);
          }
        } else {
          // Fallback logic
          setTimeLeft((prev) => {
             if (prev <= 1) {
               // Fallback completion
               handleTimerComplete(mode, completedCycles);
               return 0;
             }
             return prev - 1;
          });
        }
      }, 1000);
    } else {
      if (timerRef.current) window.clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [isRunning, mode, completedCycles, timerSettings]); // Added dependencies to ensure fresh closure


  // --- Actions ---

  const switchMode = async (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    const newTime = getDurationForMode(newMode, timerSettings) * 60;
    setTimeLeft(newTime);
    targetTimeRef.current = null;

    // Save state
    await saveTimerState({
      mode: newMode,
      timeLeft: newTime,
      isRunning: false,
      targetEndTime: null,
      lastUpdated: Date.now(),
      completedCycles
    });
  };

  const toggleTimer = async () => {
    if (!isRunning) {
      // STARTING
      if (timeLeft <= 0) return;

      const target = Date.now() + timeLeft * 1000;
      targetTimeRef.current = target;
      setIsRunning(true);

      await saveTimerState({
        mode,
        timeLeft,
        isRunning: true,
        targetEndTime: target,
        lastUpdated: Date.now(),
        completedCycles
      });
    } else {
      // PAUSING
      setIsRunning(false);
      targetTimeRef.current = null;

      await saveTimerState({
        mode,
        timeLeft,
        isRunning: false,
        targetEndTime: null,
        lastUpdated: Date.now(),
        completedCycles
      });
    }
  };

  const resetTimer = async () => {
    setIsRunning(false);
    const newTime = getDurationForMode(mode, timerSettings) * 60;
    setTimeLeft(newTime);
    targetTimeRef.current = null;
    
    // Resetting usually implies resetting the current session, not necessarily all cycles
    // But if they are manually resetting, let's just reset the current timer.

    await saveTimerState({
      mode,
      timeLeft: newTime,
      isRunning: false,
      targetEndTime: null,
      lastUpdated: Date.now(),
      completedCycles
    });
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
            
            {/* Cycle Count Indicator */}
            <div className="mt-2 text-xs font-semibold text-slate-400 tracking-wider">
               CYCLE {completedCycles + 1}
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