import { create } from "zustand";
import { StrategyRound, SavedStrategy } from '@/components/draft/SavedStrategyView';
import { API_YEAR, Player } from '@/lib/baseData';
import { useDraftStore } from "@/lib/draftStore";

interface StrategyStore {
    savedStrats: SavedStrategy[];
    setSavedStrats: (strats: SavedStrategy[]) => void;

    selectedStrat: SavedStrategy | null;
    setSelectedStrat: (strat : SavedStrategy | null) => void;

    loaded: boolean;
    setLoaded: (isLoaded: boolean) => void;
    loadStrategies: () => void;
}

export const useStrategyStore = create<StrategyStore>((set, get) => ({
    savedStrats: [],
    setSavedStrats: (strats) => set({ savedStrats: strats }),

    selectedStrat: null,
    setSelectedStrat: (strat) => set({ selectedStrat : strat }),

    loaded: false,
    setLoaded: (isLoaded) => set({ loaded: isLoaded }),
    loadStrategies: async () => {
        const { settings, players } = useDraftStore.getState();
        const year = API_YEAR;
        const pick = settings.position;
        const teams = settings.teamCount;

        const res = await fetch(`http://localhost:8000/api/strategies?year=${year}&pick=${pick}&teams=${teams}`);
        if (!res.ok) {
            throw new Error(`Failed to Saved Strategies`);
        }

        const data = await res.json() as {strategies: any[]};

        let strats: SavedStrategy[] = [];
        for (const s of data.strategies) {
            const rounds: StrategyRound[] = s.rounds.map(
                (roundString: string, index: number) => {
                    const roundPlayers: Player[] = [];

                    if (roundString) {
                        for (const playerIdString of roundString.split(",")) {
                            const playerId = String(playerIdString.trim());

                            const player = players.find(
                                p => p.id === playerId
                            );

                            if (player) {
                                roundPlayers.push(player);
                            }
                        }
                    }

                    return {
                        round: index + 1,
                        players: roundPlayers,
                    };
                }
            );

            strats.push({
                id: String(s.id),
                rank: Number(s.rank),
                name: s.name,
                description: s.description,
                rounds,
                state: "SAVED",
            });
        }

        strats.sort((a, b) => a.rank - b.rank);

        set({ savedStrats: strats });

        if (get().savedStrats.length > 0) {
            set({ selectedStrat: get().savedStrats[0] });
        }
        else {
            set({ selectedStrat: null });
        }

        set({ loaded: true });
    },
}));

export const initializeStrategyStore = () => {
    if (! useStrategyStore.getState().loaded) {
        useStrategyStore.getState().loadStrategies();
    }
};
