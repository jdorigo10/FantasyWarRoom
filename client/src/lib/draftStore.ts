import { create } from 'zustand';
import { Player, DraftSettings, MOCK_PLAYERS, INITIAL_SETTINGS } from './mockData';
import { createDraftSession, updateDraftSession } from './api';
import type { DraftSession } from '@shared/schema';

export interface DraftPick {
  round: number;
  pickOverall: number;
  playerId: string;
  pickedBy: "User" | "CPU";
}

interface DraftState {
  sessionId: string | null; // Current draft session ID
  settings: DraftSettings;
  players: Player[];
  pickedPlayers: string[]; // IDs of picked players
  picks: DraftPick[];
  currentPickIndex: number; // Overall pick number (0-based)
  myRoster: string[]; // IDs of players picked by user
  filters: {
    search: string;
    pos: string;
    team: string;
    showDrafted: boolean;
  };
  rankingsFilters: {
    search: string;
    pos: string;
    team: string;
    showDrafted: boolean;
  };
  playerTags: Record<string, string[]>;
  
  // Actions
  updateSettings: (settings: Partial<DraftSettings>) => void;
  updateFilters: (filters: Partial<DraftState['filters']>) => void;
  updateRankingsFilters: (filters: Partial<DraftState['rankingsFilters']>) => void;
  makePick: (playerId: string) => void;
  undoLastPick: () => void;
  resetDraft: () => void;
  simulatePick: () => void; // AI helper to pick for CPU
  togglePlayerTag: (playerId: string, tag: "favorite" | "target") => void;
  saveSession: () => Promise<void>; // Save current draft to backend
  loadSession: (session: DraftSession) => void; // Load a draft session
}

const STORAGE_KEY = 'fantasy-warroom-settings';
const TAGS_KEY = 'fantasy-warroom-player-tags';
const SESSION_ID_KEY = 'fantasy-warroom-session-id';

const loadTags = (): Record<string, string[]> => {
  const stored = localStorage.getItem(TAGS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse stored tags', e);
    }
  }
  return {};
};

const loadSettings = (): DraftSettings => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Ensure config-driven values are always up to date, overriding storage
      return {
        ...parsed,
        draftYear: INITIAL_SETTINGS.draftYear,
        scoring: INITIAL_SETTINGS.scoring
      };
    } catch (e) {
      console.error('Failed to parse stored settings', e);
    }
  }
  return INITIAL_SETTINGS;
};

const loadSessionId = (): string | null => {
  return localStorage.getItem(SESSION_ID_KEY);
};

// Debounce helper for auto-save
let saveTimeout: NodeJS.Timeout | null = null;
const debouncedSave = (saveFn: () => Promise<void>, delay = 2000) => {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => saveFn(), delay);
};

export const useDraftStore = create<DraftState>((set, get) => ({
  sessionId: loadSessionId(),
  settings: loadSettings(),
  players: MOCK_PLAYERS,
  pickedPlayers: [],
  picks: [],
  currentPickIndex: 0,
  myRoster: [],
  filters: {
    search: "",
    pos: "All",
    team: "All",
    showDrafted: false
  },
  rankingsFilters: {
    search: "",
    pos: "All",
    team: "All",
    showDrafted: false
  },
  playerTags: loadTags(),

  updateSettings: (newSettings) => set((state) => {
    const updated = { ...state.settings, ...newSettings };
    
    // Auto-update viewedTeamId if user team changed
    if (newSettings.teams) {
      const userTeam = newSettings.teams.find(t => t.isUser);
      if (userTeam) updated.viewedTeamId = userTeam.id;
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    debouncedSave(() => get().saveSession());
    return { settings: updated };
  }),

  updateFilters: (newFilters) => set((state) => {
    const filters = { ...state.filters, ...newFilters };
    const rankingsFilters = { ...state.rankingsFilters };
    
    // Sync showDrafted across both filter sets
    if ('showDrafted' in newFilters) {
      rankingsFilters.showDrafted = newFilters.showDrafted!;
    }
    
    return { filters, rankingsFilters };
  }),

  updateRankingsFilters: (newFilters) => set((state) => {
    const rankingsFilters = { ...state.rankingsFilters, ...newFilters };
    const filters = { ...state.filters };
    
    // Sync showDrafted across both filter sets
    if ('showDrafted' in newFilters) {
      filters.showDrafted = newFilters.showDrafted!;
    }
    
    return { filters, rankingsFilters };
  }),

  makePick: (playerId) => set((state) => {
    const isUserPick = isUserTurn(state.currentPickIndex, state.settings);
    const player = state.players.find(p => p.id === playerId);
    
    // Position constraints
    if (isUserPick && player) {
      const myPlayers = state.picks
        .filter(p => p.pickedBy === "User")
        .map(p => state.players.find(pl => pl.id === p.playerId))
        .filter(Boolean) as Player[];
      
      const counts: Record<string, number> = {
        QB: myPlayers.filter(p => p.position === "QB").length,
        RB: myPlayers.filter(p => p.position === "RB").length,
        WR: myPlayers.filter(p => p.position === "WR").length,
        TE: myPlayers.filter(p => p.position === "TE").length,
        DST: myPlayers.filter(p => p.position === "DST").length,
        K: myPlayers.filter(p => p.position === "K").length,
        FLEX: 0
      };

      const limits: Record<string, number> = { QB: 4, RB: 8, WR: 8, TE: 3, DST: 3, K: 3, FLEX: 99 };
      
      const posKey = player.position as string;
      if (counts[posKey] >= limits[posKey]) {
        alert(`Position Limit Reached: You cannot draft more than ${limits[posKey]} ${posKey}s.`);
        return state;
      }
    }

    // Add to picked list
    const newPickedPlayers = [...state.pickedPlayers, playerId];
    
    // Add to history
    const newPick: DraftPick = {
      round: Math.floor(state.currentPickIndex / state.settings.teamCount) + 1,
      pickOverall: state.currentPickIndex + 1,
      playerId,
      pickedBy: isUserPick ? "User" : "CPU"
    };

    const newState = {
      pickedPlayers: newPickedPlayers,
      picks: [...state.picks, newPick],
      currentPickIndex: state.currentPickIndex + 1,
      myRoster: isUserPick ? [...state.myRoster, playerId] : state.myRoster
    };
    
    // Auto-save after pick
    debouncedSave(() => get().saveSession(), 500);
    
    return newState;
  }),

  undoLastPick: () => set((state) => {
    if (state.currentPickIndex === 0) return state;
    const lastPick = state.picks[state.picks.length - 1];
    const newRoster = lastPick.pickedBy === "User" 
      ? state.myRoster.filter(id => id !== lastPick.playerId)
      : state.myRoster;

    const newState = {
      pickedPlayers: state.pickedPlayers.slice(0, -1),
      picks: state.picks.slice(0, -1),
      currentPickIndex: state.currentPickIndex - 1,
      myRoster: newRoster
    };
    
    // Auto-save after undo
    debouncedSave(() => get().saveSession(), 500);
    
    return newState;
  }),

  resetDraft: () => set((state) => {
    // Clear session ID on reset
    localStorage.removeItem(SESSION_ID_KEY);
    
    return {
      sessionId: null,
      pickedPlayers: [],
      picks: [],
      currentPickIndex: 0,
      myRoster: [],
      filters: {
        search: "",
        pos: "All",
        team: "All",
        showDrafted: false
      },
      rankingsFilters: {
        search: "",
        pos: "All",
        team: "All",
        showDrafted: false
      }
    };
  }),

  simulatePick: () => {
    const state = get();
    // Simple logic: pick highest projected player not taken
    const availablePlayers = state.players.filter(p => !state.pickedPlayers.includes(p.id));
    if (availablePlayers.length > 0) {
      state.makePick(availablePlayers[0].id);
    }
  },

  togglePlayerTag: (playerId, tag) => set((state) => {
    const currentTags = state.playerTags[playerId] || [];
    let newTags;
    if (currentTags.includes(tag)) {
      newTags = currentTags.filter(t => t !== tag);
    } else {
      newTags = [...currentTags, tag];
    }
    const updated = { ...state.playerTags, [playerId]: newTags };
    localStorage.setItem(TAGS_KEY, JSON.stringify(updated));
    
    // Auto-save tags to backend
    debouncedSave(() => get().saveSession());
    
    return { playerTags: updated };
  }),

  saveSession: async () => {
    const state = get();
    try {
      const sessionData = {
        sessionName: `Draft ${new Date().toLocaleDateString()}`,
        settings: state.settings,
        picks: state.picks,
        currentPickIndex: state.currentPickIndex,
        playerTags: state.playerTags
      };

      if (state.sessionId) {
        // Update existing session
        await updateDraftSession(state.sessionId, sessionData);
      } else {
        // Create new session
        const newSession = await createDraftSession(sessionData);
        localStorage.setItem(SESSION_ID_KEY, newSession.id);
        set({ sessionId: newSession.id });
      }
    } catch (error) {
      console.error('Failed to save draft session:', error);
    }
  },

  loadSession: (session: DraftSession) => set(() => {
    const settings = session.settings as DraftSettings;
    const picks = session.picks as DraftPick[];
    const playerTags = session.playerTags as Record<string, string[]>;
    
    // Update localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    localStorage.setItem(TAGS_KEY, JSON.stringify(playerTags));
    localStorage.setItem(SESSION_ID_KEY, session.id);
    
    // Extract picked players from picks
    const pickedPlayers = picks.map(p => p.playerId);
    const myRoster = picks.filter(p => p.pickedBy === "User").map(p => p.playerId);
    
    return {
      sessionId: session.id,
      settings,
      picks,
      currentPickIndex: session.currentPickIndex,
      pickedPlayers,
      myRoster,
      playerTags
    };
  })
}));

// Helper to determine if it's user's turn (Snake Draft)
export const isUserTurn = (pickIndex: number, settings: DraftSettings) => {
  const round = Math.floor(pickIndex / settings.teamCount);
  const positionInRound = pickIndex % settings.teamCount; // 0 to 11 (for 12 teams)
  
  // Snake draft logic
  if (round % 2 === 0) {
    // Even rounds (0, 2, 4...) -> Normal order (1-12)
    // User at pos 1 (index 0) picks at 0.
    return positionInRound === (settings.position - 1);
  } else {
    // Odd rounds (1, 3, 5...) -> Reverse order (12-1)
    // User at pos 1 picks last.
    return positionInRound === (settings.teamCount - settings.position);
  }
};
