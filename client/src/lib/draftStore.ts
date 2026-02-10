import { create } from 'zustand';
import { Position, NFLTeamAbbv, Player, PlayerTeam, DraftSettings, INITIAL_SETTINGS } from './baseData';

export interface DraftPick {
  round: number;
  pickOverall: number;
  playerId: string;
  pickedBy: "User" | "CPU";
  teamId: string;
}

interface DraftState {
  settings: DraftSettings;
  players: Player[];
  pickedPlayers: string[]; // IDs of picked players
  picks: DraftPick[];
  currentPickIndex: number; // Overall pick number (0-based)
  myRoster: string[]; // IDs of players picked by user
  filters: {
    search: string;
    pos: Position;
    team: NFLTeamAbbv;
    showDrafted: boolean;
  };
  rankingsFilters: {
    search: string;
    pos: Position;
    team: NFLTeamAbbv;
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
  simulatePick: () => void;
  togglePlayerTag: (playerId: string, tag: "favorite" | "target") => void;
  getPlayerTags: (playerId: string) => string[];
  setPlayers: (players: Player[]) => void;
}

const STORAGE_KEY = 'fantasy-warroom-settings';
const TAGS_KEY = 'fantasy-warroom-player-tags';

// Load and validate tags - uses player NAME as key (not ID)
// Also cleans up tags for players that no longer exist in the app
const loadTags = (players: Player[]): Record<string, string[]> => {
  const stored = localStorage.getItem(TAGS_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as Record<string, string[]>;
      
      // Get all valid player names from current data
      const validPlayerNames = new Set(players.map(p => p.name));
      
      // Filter out any players that no longer exist
      const cleaned: Record<string, string[]> = {};
      let hasChanges = false;
      
      for (const [playerName, tags] of Object.entries(parsed)) {
        if (validPlayerNames.has(playerName) && tags.length > 0) {
          cleaned[playerName] = tags;
        } else {
          hasChanges = true; // Mark that we removed something
        }
      }
      
      // Save cleaned version if we removed stale entries
      if (hasChanges) {
        localStorage.setItem(TAGS_KEY, JSON.stringify(cleaned));
      }
      
      return cleaned;
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

export const useDraftStore = create<DraftState>((set, get) => ({
  settings: loadSettings(),
  players: [], // Will be populated by dataLoader
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
  playerTags: {},

  updateSettings: (newSettings) => set((state) => {
    const updated = { ...state.settings, ...newSettings };
    
    if (newSettings.teams) {
      const userTeam = newSettings.teams.find(t => t.isUser);
      if (userTeam) updated.viewedTeamId = userTeam.id;
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return { settings: updated };
  }),

  updateFilters: (newFilters) => set((state) => {
    const filters = { ...state.filters, ...newFilters };
    const rankingsFilters = { ...state.rankingsFilters };
    
    if ('showDrafted' in newFilters) {
      rankingsFilters.showDrafted = newFilters.showDrafted!;
    }
    
    return { filters, rankingsFilters };
  }),

  updateRankingsFilters: (newFilters) => set((state) => {
    const rankingsFilters = { ...state.rankingsFilters, ...newFilters };
    const filters = { ...state.filters };
    
    if ('showDrafted' in newFilters) {
      filters.showDrafted = newFilters.showDrafted!;
    }
    
    return { filters, rankingsFilters };
  }),

  makePick: (playerId) => set((state) => {
    const isUserPick = isUserTurn(state.currentPickIndex, state.settings);
    const player = state.players.find(p => p.id === playerId);
    
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

    const newPickedPlayers = [...state.pickedPlayers, playerId];
    
    const newPick: DraftPick = {
      round: Math.floor(state.currentPickIndex / state.settings.teamCount) + 1,
      pickOverall: state.currentPickIndex + 1,
      playerId,
      pickedBy: isUserPick ? "User" : "CPU",
      teamId: getCurrentPickTeamId(state.currentPickIndex, state.settings)
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
    },
    rankingsFilters: {
      search: "",
      pos: "All",
      team: "All",
      showDrafted: false
    }
  }),

  simulatePick: () => {
    const state = get();
    const availablePlayers = state.players.filter(p => !state.pickedPlayers.includes(p.id));
    if (availablePlayers.length === 0) {
      return;
    }

    const pickIndex = state.currentPickIndex;
    const round = Math.floor(pickIndex / state.settings.teamCount) + 1; // 1-based round
    const isUserPicking = isUserTurn(pickIndex, state.settings);

    // Determine roster for the team that is picking
    const rosterIds = isUserPicking
      ? state.myRoster
      : state.picks.filter(p => p.teamId === getCurrentPickTeamId(pickIndex, state.settings)).map(p => p.playerId);

    const rosterPlayers = rosterIds
      .map(id => state.players.find(pl => pl.id === id))
      .filter(Boolean) as Player[];

    const counts: Record<string, number> = {
      QB: rosterPlayers.filter(p => p.position === "QB").length,
      RB: rosterPlayers.filter(p => p.position === "RB").length,
      WR: rosterPlayers.filter(p => p.position === "WR").length,
      TE: rosterPlayers.filter(p => p.position === "TE").length,
      DST: rosterPlayers.filter(p => p.position === "DST").length,
      K: rosterPlayers.filter(p => p.position === "K").length
    };

    // Position limits per team
    const softLimits: Record<string, number> = { QB: 1, RB: 3, WR: 3, TE: 1, DST: 1, K: 1 };
    const hardLimits: Record<string, number> = { QB: 3, RB: 8, WR: 8, TE: 3, DST: 2, K: 1 };

    // Build candidate list with round-based restrictions
    let candidates = availablePlayers
      .filter(p => {
        const pos = p.position;
        
        // Check hard position limits
        if ((counts[pos] ?? 0) >= (hardLimits[pos] ?? 999)) return false;
        
        // Round restrictions for QB (don't take 2nd QB before round 10)
        if (pos === "QB" && round < 10 && counts.QB >= 1) return false;
        
        // Round restrictions for TE (don't take 2nd TE before round 8)
        if (pos === "TE" && round < 8 && counts.TE >= 1) return false;

        // If 3 RBs already, dont take another before round 8
        if (pos === "RB" && round < 8 && counts.RB >= 3) return false;

        // If 3 WRs already, dont take another before round 8
        if (pos === "WR" && round < 8 && counts.WR >= 3) return false;
        
        // No DST until after round 9
        if (pos === "DST" && round <= 9) return false;
        
        // No K until after round 11
        if (pos === "K" && round <= 11) return false;
        
        return true;
      })
      .slice()
      .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));

    if (candidates.length === 0) {
      return;
    }

        // Helper function to apply randomness with reshuffling
    const applyRankRandomness = (candidateList: Player[]): Player[] => {
      // 50% chance to reshuffle with ±5 constraints
      if (Math.random() < 0.5) {
        return candidateList;
      }
      
      // Apply randomness: each player can move ±5 spots from original rank
      const reshuffled = candidateList.map((player, index) => {
        const originalRank = player.rank ?? 999;
        const minRank = Math.max(1, originalRank - 5);
        const maxRank = originalRank + 5;
        
        // Find players that fall within this player's range
        const playersInRange = candidateList.filter(p => {
          const rank = p.rank ?? 999;
          return rank >= minRank && rank <= maxRank;
        });
        
        // Randomly select from the range (different player possible)
        if (playersInRange.length > 0) {
          return playersInRange[Math.floor(Math.random() * playersInRange.length)];
        }
        return player;
      });
      
      // Remove duplicates and maintain sorted order
      const seen = new Set<string>();
      const unique = reshuffled.filter(p => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });
      
      return unique.sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
    };

    // Apply randomness to candidates
    candidates = applyRankRandomness(candidates);

    if (candidates.length === 0) {
      return;
    }

    // If round <= 8: only prioritize filling a position if we don't have ANY at that position yet
    if (round <= 8) {
      const needyPositions = ["QB", "RB", "WR", "TE"].filter(pos => counts[pos] < softLimits[pos]);
      
      if (needyPositions.length > 0) {
        for (const cand of candidates) {
          if (needyPositions.includes(cand.position)) {
            state.makePick(cand.id);
            return;
          }
        }
      }
      
      state.makePick(candidates[0].id);
      return;
    }

    // After round 8: generally take best available, but try to secure DST/K if missing
    const TOP_LOOKUP = state.settings.teamCount * 2; // Look at top 2 rounds worth of players available

    if (counts.DST === 0 && round >= 10) {
      const bestDst = candidates.slice(0, TOP_LOOKUP).find(c => c.position === "DST");
      if (bestDst) {
        state.makePick(bestDst.id);
        return;
      }
    }

    if (counts.K === 0 && round >= 12) {
      const bestK = candidates.slice(0, TOP_LOOKUP).find(c => c.position === "K");
      if (bestK) {
        state.makePick(bestK.id);
        return;
      }
    }

    // If no DST/K taken by round 15/16 respectively, force take
    if (counts.DST === 0 && round === 15) {
      const bestDst = candidates.find(c => c.position === "DST");
      if (bestDst) {
        state.makePick(bestDst.id);
        return;
      }
    }
    if (counts.K === 0 && round === 16) {
      const bestK = candidates.find(c => c.position === "K");
      if (bestK) {
        state.makePick(bestK.id);
        return;
      }
    }

    // Otherwise pick best available
    state.makePick(candidates[0].id);
  },

  togglePlayerTag: (playerId, tag) => set((state) => {
    // Find player by ID to get their name
    const player = state.players.find(p => p.id === playerId);
    if (!player) return state;
    
    const playerName = player.name;
    const currentTags = state.playerTags[playerName] || [];
    let newTags;
    if (currentTags.includes(tag)) {
      newTags = currentTags.filter(t => t !== tag);
    } else {
      newTags = [...currentTags, tag];
    }
    const updated = { ...state.playerTags, [playerName]: newTags };
    localStorage.setItem(TAGS_KEY, JSON.stringify(updated));
    return { playerTags: updated };
  }),

  // Helper to get tags for a player by ID (looks up by name internally)
  getPlayerTags: (playerId: string) => {
    const state = get();
    const player = state.players.find(p => p.id === playerId);
    if (!player) return [];
    return state.playerTags[player.name] || [];
  },

  // Set players from dataLoader
  setPlayers: (players) => {
    set({ playerTags: loadTags(players) });
    set({ players });
  }
}));

// Helper to determine if it's user's turn (Snake Draft)
export const isUserTurn = (pickIndex: number, settings: DraftSettings) => {
  const round = Math.floor(pickIndex / settings.teamCount);
  const positionInRound = pickIndex % settings.teamCount;
  
  if (round % 2 === 0) {
    return positionInRound === (settings.position - 1);
  } else {
    return positionInRound === (settings.teamCount - settings.position);
  }
};

// Helper to get the team ID of the current pick (Snake Draft)
export const getCurrentPickTeamId = (pickIndex: number, settings: DraftSettings) => {
  const round = Math.floor(pickIndex / settings.teamCount);

  let pickPosition;
  if (round % 2 === 0) {
    pickPosition = pickIndex % settings.teamCount;
  } else {
    pickPosition = settings.teamCount - (pickIndex % settings.teamCount) - 1;
  }

  const teamNumber = pickPosition;
  return `team-${teamNumber}`;
};
