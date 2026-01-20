import React from 'react';
import { TimerMode } from '../types';

interface CircularTimerProps {
  timeLeft: number; // in seconds
  totalTime: number; // in seconds
  mode: TimerMode;
  isRunning: boolean;
}

const CircularTimer: React.FC<CircularTimerProps> = ({ timeLeft, totalTime, mode, isRunning }) => {
  const radius = 120;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  
  const strokeDashoffset = circumference - (timeLeft / totalTime) * circumference;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getColor = () => {
    switch (mode) {
      case TimerMode.WORK: return 'stroke-red-500';
      case TimerMode.SHORT_BREAK: return 'stroke-teal-500';
      case TimerMode.LONG_BREAK: return 'stroke-blue-500';
      default: return 'stroke-red-500';
    }
  };

  const getLabel = () => {
     switch (mode) {
      case TimerMode.WORK: return 'FOCUS';
      case TimerMode.SHORT_BREAK: return 'SHORT BREAK';
      case TimerMode.LONG_BREAK: return 'LONG BREAK';
      default: return 'FOCUS';
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      <svg
        height={radius * 2}
        width={radius * 2}
        className="transform -rotate-90"
      >
        <circle
          stroke="currentColor"
          className="text-slate-200"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          fill="transparent"
        />
        <circle
          stroke="currentColor"
          className={`${getColor()} transition-all duration-500 ease-in-out`}
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          fill="transparent"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-slate-800">
        <span className="text-sm font-semibold tracking-widest opacity-60 mb-1">{getLabel()}</span>
        <span className="text-6xl font-bold font-mono tracking-tighter">
          {formatTime(timeLeft)}
        </span>
        <span className={`text-xs mt-2 px-2 py-0.5 rounded-full ${isRunning ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
          {isRunning ? 'RUNNING' : 'PAUSED'}
        </span>
      </div>
    </div>
  );
};

export default CircularTimer;