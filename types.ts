export enum TimerMode {
  WORK = 'WORK',
  SHORT_BREAK = 'SHORT_BREAK',
  LONG_BREAK = 'LONG_BREAK'
}

export interface TimerSettings {
  workDuration: number; // in minutes
  shortBreakDuration: number;
  longBreakDuration: number;
}

export interface BlockedSite {
  id: string;
  url: string;
  favicon?: string;
}

export interface FocusTip {
  text: string;
  type: 'motivation' | 'strategy' | 'scolding';
}

export interface SavedTimerState {
  mode: TimerMode;
  timeLeft: number;
  isRunning: boolean;
  targetEndTime: number | null;
  lastUpdated: number;
}