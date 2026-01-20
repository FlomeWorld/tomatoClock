import { BlockedSite, FocusTip } from '../types';

// Local database of motivation and strategies
const WORK_QUOTES = [
  "Focus on the process, not the outcome.",
  "You can do anything, but not everything. Focus.",
  "Distractions are the enemy of greatness.",
  "One tomato at a time.",
  "Deep work creates value.",
  "Your future self is watching.",
  "Stay on target.",
  "Discipline is choosing what you want most over what you want now.",
  "The only way to do great work is to love what you do.",
  "Don't watch the clock; do what it does. Keep going."
];

const BREAK_QUOTES = [
  "Rest is productive.",
  "Step away from the screen.",
  "Hydrate and stretch.",
  "Give your eyes a break.",
  "Breathe deeply.",
  "A tired mind makes mistakes. Rest up.",
  "Go look at something green.",
  "Stand up and move around."
];

const SCOLDING_QUOTES = [
  "You said you wanted to work. Prove it.",
  "Close that tab. You have goals.",
  "Is scrolling paying your bills?",
  "That site isn't going anywhere. Your time is.",
  "Focus. You can browse later."
];

export const getFocusMotivation = async (
  blockedSites: BlockedSite[], 
  currentMode: string
): Promise<FocusTip | null> => {
  // Simulate a brief "thinking" delay for UI consistency
  await new Promise(resolve => setTimeout(resolve, 600));

  let text = "";
  let type: 'motivation' | 'strategy' | 'scolding' = 'motivation';

  if (currentMode === 'WORK') {
    // 30% chance of being "strict" if they have blocked sites
    if (blockedSites.length > 0 && Math.random() > 0.7) {
      text = SCOLDING_QUOTES[Math.floor(Math.random() * SCOLDING_QUOTES.length)];
      type = 'scolding';
    } else {
      text = WORK_QUOTES[Math.floor(Math.random() * WORK_QUOTES.length)];
      type = 'motivation';
    }
  } else {
    text = BREAK_QUOTES[Math.floor(Math.random() * BREAK_QUOTES.length)];
    type = 'strategy';
  }

  return { text, type };
};