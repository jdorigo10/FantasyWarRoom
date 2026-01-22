import { create } from 'zustand';
import { Player, DraftSettings, DraftPick, MOCK_PLAYERS, INITIAL_SETTINGS } from './mockData';

interface DraftState {
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
  
  // Actions
  updateSettings: (settings: Partial<DraftSettings>) => void;
  updateFilters: (filters: Partial<DraftState['filters']>) => void;
  makePick: (playerId: string) => void;
  undoLastPick: () => void;
  resetDraft: () => void;
  simulatePick: () => void; // AI helper to pick for CPU
}

const STORAGE_KEY = 'fantasy-warroom-settings';

const loadSettings = (): DraftSettings => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse stored settings', e);
    }
  }
  return INITIAL_SETTINGS;
};

export const useDraftStore = create<DraftState>((set, get) => ({
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

  updateSettings: (newSettings) => set((state) => {
    const updated = { ...state.settings, ...newSettings };
    
    // Auto-update viewedTeamId if user team changed
    if (newSettings.teams) {
      const userTeam = newSettings.teams.find(t => t.isUser);
      if (userTeam) updated.viewedTeamId = userTeam.id;
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return { settings: updated };
  }),

  updateFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters }
  })),

  makePick: (playerId) => set((state) => {
    const isUserPick = isUserTurn(state.currentPickIndex, state.settings);
    
    // Add to picked list
    const newPickedPlayers = [...state.pickedPlayers, playerId];
    
    // Add to history
    const newPick: DraftPick = {
      round: Math.floor(state.currentPickIndex / state.settings.teamCount) + 1,
      pickOverall: state.currentPickIndex + 1,
      playerId,
      pickedBy: isUserPick ? "User" : "CPU"
    };

    return {
      pickedPlayers: newPickedPlayers,
      picks: [...state.picks, newPick],
      currentPickIndex: state.currentPickIndex + 1,
      myRoster: isUserPick ? [...state.myRoster, playerId] : state.myRoster
    };
  }),

  undoLastPick: () => set((state) => {
    if (state.currentPickIndex === 0) return state;
    const lastPick = state.picks[state.picks.length - 1];
    const newRoster = lastPick.pickedBy === "User" 
      ? state.myRoster.filter(id => id !== lastPick.playerId)
      : state.myRoster;

    return {
      pickedPlayers: state.pickedPlayers.slice(0, -1),
      picks: state.picks.slice(0, -1),
      currentPickIndex: state.currentPickIndex - 1,
      myRoster: newRoster
    };
  }),

  resetDraft: () => set({
    pickedPlayers: [],
    picks: [],
    currentPickIndex: 0,
    myRoster: [],
    filters: {
      search: "",
      pos: "All",
      team: "All",
      showDrafted: false
    }
  }),

  simulatePick: () => {
    const state = get();
    // Simple logic: pick highest projected player not taken
    const availablePlayers = state.players.filter(p => !state.pickedPlayers.includes(p.id));
    if (availablePlayers.length > 0) {
      state.makePick(availablePlayers[0].id);
    }
  }
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
