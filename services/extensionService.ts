import { BlockedSite, SavedTimerState, TimerMode } from '../types';

declare var chrome: any;

// Helper to check if we are running as a Chrome Extension
const isExtension = () => {
  return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
};

// --- Blocked Sites Storage ---

export const saveBlockedSites = async (sites: BlockedSite[]) => {
  if (!isExtension()) {
    localStorage.setItem('blockedSites', JSON.stringify(sites));
    return;
  }
  await chrome.storage.local.set({ blockedSites: sites });
};

export const loadBlockedSites = async (): Promise<BlockedSite[]> => {
  if (!isExtension()) {
    const saved = localStorage.getItem('blockedSites');
    return saved ? JSON.parse(saved) : [];
  }
  const result = await chrome.storage.local.get('blockedSites');
  return result.blockedSites || [];
};

// --- Timer State Storage ---

export const saveTimerState = async (state: SavedTimerState) => {
  if (!isExtension()) {
    localStorage.setItem('timerState', JSON.stringify(state));
    return;
  }
  await chrome.storage.local.set({ timerState: state });
};

export const loadTimerState = async (): Promise<SavedTimerState | null> => {
  if (!isExtension()) {
    const saved = localStorage.getItem('timerState');
    return saved ? JSON.parse(saved) : null;
  }
  const result = await chrome.storage.local.get('timerState');
  return result.timerState || null;
};

// --- Blocking Rules ---

export const updateBlockingRules = async (sites: BlockedSite[], isBlockingEnabled: boolean) => {
  if (!isExtension()) {
    // console.log(`[Dev Mode] Blocking enabled: ${isBlockingEnabled}. Sites:`, sites);
    return;
  }

  // 1. Get existing dynamic rules to remove them first (clean slate)
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const existingRuleIds = existingRules.map((rule: any) => rule.id);

  // 2. If blocking is disabled, just remove rules and return
  if (!isBlockingEnabled || sites.length === 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingRuleIds
    });
    return;
  }

  // 3. Create new rules
  // We start IDs at 1. Ensure IDs are integers.
  const newRules = sites.map((site, index) => ({
    id: index + 1,
    priority: 1,
    action: { type: chrome.declarativeNetRequest.RuleActionType.BLOCK },
    condition: {
      urlFilter: site.url, 
      resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME] 
    }
  }));

  // 4. Update Chrome
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existingRuleIds,
    addRules: newRules
  });
};