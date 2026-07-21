import React, { useMemo, useState, useEffect } from "react";
import { useDraftStore } from "@/lib/draftStore";
import { useLiveStrategies } from "@/hooks/useLiveStrategies";
import { useStrategyStore } from "@/hooks/useSavedStrategy";
import { cn } from "@/lib/utils";
import { createBasePlayer } from "@/lib/dataLoader";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Info, ArrowUpDown, Plus, X, Save, Delete, Pencil, ChevronDown, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_YEAR, Player, POSITION_LIST, Position } from "@/lib/baseData";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command";

export interface SavedStrategy {
    id: string;
    rank: number;
    name: string;
    description: string;

    rounds: StrategyRound[];

    state: string;
}

export interface StrategyRound {
    round: number;
    players: Player[];
}

const defaultRounds: StrategyRound[] = Array.from({ length: 16 }, (_, index) => ({
    round: index + 1,
    players: []
}));

function generateNewId(savedStrats: SavedStrategy[]): number {
    const existingIds = new Set(
        savedStrats.map(strat => Number(strat.id))
    );

    let newId: number;

    do {
        newId = Math.floor(Math.random() * 100000000);
    } while (existingIds.has(newId));

    return newId;
}

function SortableStrategyButton(
    {strategy, selectedStrat, setSelectedStrat, savedStrats, userActualPicks}: {
        strategy: SavedStrategy;
        selectedStrat: SavedStrategy | null;
        setSelectedStrat: (strategy: SavedStrategy | null) => void;
        savedStrats: SavedStrategy[];
        userActualPicks: Record<number, Player>
    }) 
{
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({
        id: strategy.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center"
        >
            {/* Drag handle only */}
            <div
                {...attributes}
                {...listeners}
                className="cursor-grab px-1 font-mono"
            >
                ⋮⋮⋮
            </div>
            <Button
                className={cn(
                    "rounded border shrink-0 h-18 w-70 mb-2",
                    strategy.id === selectedStrat?.id
                        ? "bg-secondary/40 border-primary/20 hover:bg-primary/20"
                        : "bg-primary/10 border-primary/20 hover:bg-primary/20"
                )}
                onClick={() =>
                    setSelectedStrat(
                        strategy.id !== selectedStrat?.id
                            ? strategy
                            : null
                    )
                }
            >
                <div className="w-full text-left">
                    {isActiveStrategy(savedStrats, userActualPicks, strategy.id) ? (
                        <div className="flex items-start mb-1 mt-1">
                            <div className="text-[12px] font-bold text-primary truncate mr-2">
                                #{strategy.rank}
                            </div>

                            <div className="text-[12px] text-white uppercase font-mono text-center tracking-wider">
                                {strategy.name}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-start mb-1 mt-1">
                            <div className="text-[12px] font-bold text-[#BF3A2C] truncate mr-2">
                                X
                            </div>

                            <div className="text-[12px] text-white/50 uppercase font-mono text-center tracking-wider">
                                {strategy.name}
                            </div>
                        </div>
                    )}

                    <span className="text-left text-[10px] text-[#8b949e] uppercase font-mono opacity-80">
                        {strategy.description}
                    </span>
                </div>

                <div>
                {strategy.id === "" && (
                    <div className="text-[8px] text-primary uppercase font-bold animate-pulse">
                        Active
                    </div>
                )}

                {strategy.state === "NOT_SAVED" && (
                    <div className="text-[8px] text-[#BF3A2C] uppercase font-bold animate-pulse">
                        Not Saved
                    </div>
                )}
                </div>
            </Button>
        </div>
    );
}

function isActiveStrategy(savedStrats: SavedStrategy[], userActualPicks: Record<number, Player>, strategyId: string): boolean {
    const matchingStrategies = savedStrats.filter(strategy => {
        return Object.entries(userActualPicks).every(([roundStr, pickedPlayer]) => {
            // Ignore rounds 9+
            if (Number(roundStr) > 8) {
                return true;
            }

            const round = strategy.rounds.find(r => r.round === Number(roundStr));

            if (!round) {
                return false;
            }

            return round.players.some(
                p => p.position === pickedPlayer.position
            );
        });
    });

    return matchingStrategies.some(
        strat => strat.id === strategyId
    );
}

export function SavedStrategyView() {
    const {players, settings, picks, pickedPlayers, currentPickIndex} = useDraftStore();
    const userActualPicks = useMemo(() => {
        const map: Record<number, Player> = {};
        picks.filter(p => p.pickedBy === 'User').forEach(p => {
        const player = players.find(pl => pl.id === p.playerId);
        if (player) map[p.round] = player;
        });
        return map;
    }, [picks, players]);

    const [openPopover, setOpenPopover] = useState<string | null>(null);

    const { savedStrats, setSavedStrats, selectedStrat, setSelectedStrat, loaded, loadStrategies } = useStrategyStore();

    // Load strategies from DB
    useEffect(() => {
        if (!loaded) {
            loadStrategies();
        }
    }, []);

    // Create a new Strategy
    function createStrategy() {
        let newId = generateNewId(savedStrats);
        let newRank = savedStrats.length+1;

        let newStrat: SavedStrategy = {
            id: (newId).toString(), 
            rank: newRank,
            name: "New Strategy",
            description: "Description",
            rounds: structuredClone(defaultRounds),
            state: 'NOT_SAVED'
        };

        setSavedStrats([...savedStrats, newStrat]);
        setSelectedStrat(newStrat);
    };

    // Save changes of Strategy to DB
    async function saveChanges(strategy: SavedStrategy, updateDBOnly: Boolean) {
        let changedStrat = {
            ...strategy,
            state: 'SAVED'
        };

        // If a player isnt set yet remove
        changedStrat.rounds.forEach((round) => {
            round.players = round.players.filter(
                (player) =>
                    player.position !== "All" &&
                    player.name !== "New Player"
            );
        });

        const payload = {
            id: Number(changedStrat.id),
            year: API_YEAR,
            pick: settings.position,
            teams: settings.teamCount,
            rank: changedStrat.rank,
            name: changedStrat.name,
            description: changedStrat.description,
            rounds: changedStrat.rounds.map(round =>
                round.players.map(player => player.id).join(", ")
            ),
        };

        const response = await fetch("http://localhost:8000/api/saveStrategy", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error("Failed to Save Strategy");
        }

        if (!updateDBOnly) {
            setSelectedStrat(changedStrat);

            setSavedStrats(
                savedStrats.map(strat =>
                    strat.id === changedStrat.id
                        ? changedStrat
                        : strat
                )
            );
        }
    };

    // Delete strategy from DB
    async function deleteStrategy() {
        if (selectedStrat) {
            const confirmed = window.confirm(
                "Are you sure you want to delete this strategy?"
            );

            if (confirmed) {
                const res = await fetch(
                    `http://localhost:8000/api/deleteStrategy?id=${selectedStrat.id}`,
                    {
                        method: "DELETE",
                    }
                );
                if (!res.ok) {
                    throw new Error(`Failed to Delete Strategies`);
                }

                const updatedStrats = savedStrats
                    .filter(strat => strat.id !== selectedStrat.id)
                    .map((strat, index) => ({
                        ...strat,
                        rank: index + 1,
                        state: 'SAVED'
                    }));
                
                updatedStrats.forEach(strat => {
                    saveChanges(strat, true);
                });

                setSavedStrats(updatedStrats);

                setSelectedStrat(null);
            }
        }
    }

    // Handle moving a Strategy in Rankings
    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        const oldIndex = savedStrats.findIndex(
            strat => strat.id === active.id
        );

        const newIndex = savedStrats.findIndex(
            strat => strat.id === over.id
        );

        const reordered = arrayMove(
            savedStrats,
            oldIndex,
            newIndex
        );

        const ranked = reordered.map((strat, index) => ({
            ...strat,
            rank: index + 1,
            state: 'SAVED'
        }));

        // Save updated rankings
        ranked.forEach(strat => {
            saveChanges(strat, true);
        });

        setSavedStrats(ranked);
    }

    // Updates Name and Description
    const updateStrategyDetails = (
        field: "name" | "description",
        value: string
    ) => {
        if (!selectedStrat) return;

        const updated = {
            ...selectedStrat,
            [field]: value,
            state: 'NOT_SAVED',
        };

        setSelectedStrat(updated);

        setSavedStrats(
            savedStrats.map((strat) =>
                strat.id === updated.id ? updated : strat
            )
        );
    };

    // Adds a new blank player field to a round
    const addPlayerSlot = (roundNumber: number) => {
        if (!selectedStrat) return;

        const updated = {
            ...selectedStrat,
            state: 'NOT_SAVED',
        };

        const playerId = "0";
        const name = "New Player";
        let newPlayer = createBasePlayer({playerId, name});
        updated.rounds[roundNumber-1].players.push(newPlayer);

        setSelectedStrat(updated);

        setSavedStrats(
            savedStrats.map((strat) =>
                strat.id === updated.id ? updated : strat
            )
        );
    };

    // Update the position of a player
    const updatePlayerPosition = (
        roundNumber: number,
        playerIndex: number,
        position: Position
    ) => {
        if (!selectedStrat) return;

        const playerId = "0";
        const name = "New Player";
        let newPlayer = createBasePlayer({playerId, name});
        newPlayer.position = position;

        const updatedStrategy = {
            ...selectedStrat,
            state: "NOT_SAVED",
            rounds: selectedStrat.rounds.map((round) =>
                round.round === roundNumber
                    ? {
                        ...round,
                        players: round.players.map((player, index) =>
                            index === playerIndex
                                ? newPlayer
                                : player
                        ),
                    }
                    : round
            ),
        };

        setSelectedStrat(updatedStrategy);

        setSavedStrats(
            savedStrats.map((strategy) =>
                strategy.id === updatedStrategy.id
                    ? updatedStrategy
                    : strategy
            )
        );
    };

    // Updated an added player
    const updatePlayer = (
        roundNumber: number,
        playerIndex: number,
        selectedPlayer: Player
    ) => {
        if (!selectedStrat) return;

        const updatedStrategy = {
            ...selectedStrat,
            state: "NOT_SAVED",
            rounds: selectedStrat.rounds.map((round) =>
                round.round === roundNumber
                    ? {
                        ...round,
                        players: round.players.map((player, index) =>
                            index === playerIndex
                                ? {
                                        ...player,
                                        ...selectedPlayer,
                                    }
                                : player
                        ),
                    }
                    : round
            ),
        };

        setSelectedStrat(updatedStrategy);

        setSavedStrats(
            savedStrats.map((strategy) =>
                strategy.id === updatedStrategy.id
                    ? updatedStrategy
                    : strategy
            )
        );

        // Close the popover
        setOpenPopover(null);
    };

    // Removes player from its round strat
    const deletePlayerSlot = (
        roundNumber: number,
        playerIndex: number
    ) => {
        if (!selectedStrat) return;

        const updatedStrategy = {
            ...selectedStrat,
            state: "NOT_SAVED",
            rounds: selectedStrat.rounds.map((round) =>
                round.round === roundNumber
                    ? {
                        ...round,
                        players: round.players.filter(
                            (_, index) => index !== playerIndex
                        ),
                    }
                    : round
            ),
        };

        setSelectedStrat(updatedStrategy);

        setSavedStrats(
            savedStrats.map((strategy) =>
                strategy.id === updatedStrategy.id
                    ? updatedStrategy
                    : strategy
            )
        );
    };
    
    return (
        <div className="flex-1 min-h-0 overflow-hidden p-6 flex flex-col space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-display font-bold tracking-tight uppercase italic">
                    Saved Strategies
                </h2>
                <div className="flex items-center gap-3">
                    <Info className="h-3 w-3 text-primary" />
                    <span className="text-l text-[#8b949e] font-semibold uppercase tracking-widest">Pick {settings.position} {" ("}{settings.teamCount}{" Team Draft)"}</span>
                </div>
            </div>

            {/* Content */}
            <div className="grid grid-cols-[320px_1fr] gap-6 flex-1 min-h-0 overflow-hidden">
                {/* Strategy Cards */}
                <Card className="flex-1 min-h-0 bg-[#161b22] border-[#30363d] overflow-hidden flex flex-col shadow-2xl items-center">
                    <div className="w-full bg-[#0d1117] border-b border-[#30363d]">
                        <div className="relative flex items-center justify-center h-16 px-4">
                            <h2 className="text-m font-bold font-display tracking-[0.2em] text-primary uppercase">
                                Strategy
                            </h2>
                            <Button size="sm" className="absolute right-3 h-7 bg-primary/10 text-primary hover:bg-primary hover:text-black font-bold text-[10px] uppercase border border-primary/30 shadow-[0_0_10px_rgba(46,160,67,0.05)]"
                                    onClick={() => createStrategy()}>
                                <Plus className="mr-0 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                     <div className="flex flex-col gap-2 overflow-y-auto mt-5">
                        <DndContext onDragEnd={handleDragEnd}
                                    modifiers={[
                                        restrictToVerticalAxis,
                                        restrictToParentElement
                                    ]}
                        >
                            <SortableContext
                                items={savedStrats.map(strat => strat.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {savedStrats.length > 0 ? (
                                    savedStrats.map(strategy => (
                                        <SortableStrategyButton
                                            key={strategy.id}
                                            strategy={strategy}
                                            selectedStrat={selectedStrat}
                                            setSelectedStrat={setSelectedStrat}
                                            savedStrats={savedStrats}
                                            userActualPicks={userActualPicks}
                                        />
                                    ))
                                ) : (
                                    <p className="text-[14px] text-[#adbac7] text-center mt-5">
                                        No Saved Strategies
                                    </p>
                                )}
                            </SortableContext>
                        </DndContext>
                    </div>
                </Card>

                {/* Strategy Details */}
                <Card className="flex-1 min-h-0 bg-[#161b22] border-[#30363d] overflow-hidden flex flex-col shadow-2xl items-center">
                    <div className="w-full bg-[#0d1117] border-b border-[#30363d]">
                        <div className="relative flex items-center justify-center h-16 px-4">
                            {!selectedStrat ? (
                                <h2 className="text-m font-bold font-display tracking-[0.2em] text-primary uppercase">
                                    Details
                                </h2>
                            ) : (
                                <div className="flex flex-col items-center w-full mr-25 ml-25">
                                    <div className="relative w-full mt-2">
                                        <input
                                            value={selectedStrat?.name ?? ""}
                                            onChange={(e) => updateStrategyDetails("name", e.target.value)}
                                            className="w-full bg-transparent text-center text-[16px] font-bold font-display tracking-[0.2em] text-primary uppercase outline-none border border-transparent rounded hover:border-white/40 focus:border-primary pr-8"
                                        />

                                        <Pencil
                                            size={14}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                                        />
                                    </div>

                                    <div className="relative w-full mt-0 mb-2">
                                        <input
                                            value={selectedStrat?.description ?? ""}
                                            onChange={(e) => updateStrategyDetails("description", e.target.value)}
                                            className="w-full bg-transparent text-center text-[14px] text-[#adbac7]/90 uppercase outline-none border border-transparent rounded hover:border-white/40 focus:border-primary pr-8"
                                        />

                                        <Pencil
                                            size={14}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {selectedStrat && (
                                <Button className="absolute right-3 h-7 bg-primary/10 text-primary hover:bg-primary hover:text-black font-bold text-[10px] uppercase border border-primary/30 shadow-[0_0_10px_rgba(46,160,67,0.05)]"
                                        size="sm" disabled={(selectedStrat?.state == 'SAVED')} onClick={() => saveChanges(selectedStrat, false)}>
                                    <Save className="mr-1 h-4 w-4" />
                                    Save
                                </Button>
                            )}
                        </div>
                    </div>
                    {selectedStrat ? (
                        <div className="flex flex-col h-full w-full">
                            <div className="flex-1 min-h-0 border-b border-[#30363d]">
                                <ScrollArea className="h-full">
                                    <div className="space-y-3 pr-4 mb-5">
                                        {selectedStrat.rounds.map((round) => (
                                            <div
                                                key={round.round}
                                                className="rounded-lg border border-white/10 bg-white/5 p-3 mr-3 ml-5 mt-4"
                                            >
                                                <div className="text-[15px] font-bold text-primary mb-2">
                                                    Round {round.round}
                                                </div>

                                                <div className="space-y-2 ml-3 mr-15">
                                                    {round.players.map((player, index) => {
                                                        const popoverId = `${round.round}-${index}`;

                                                        const selectedPlayerIds = round.players
                                                            .map((p) => p.id)
                                                            .filter((id): id is string => id !== undefined);

                                                        const availablePlayers =
                                                            player.position === "All"
                                                                ? []
                                                                : players
                                                                    .filter((p) => p.position === player.position)
                                                                    .filter(
                                                                        (p) =>
                                                                            // Keep the currently selected player in the list
                                                                            p.id === player.id ||
                                                                            !selectedPlayerIds.includes(p.id)
                                                                    )
                                                                    .sort((a, b) => a.rank - b.rank);
                                                        return (
                                                            <div
                                                                key={`${round.round}-${index}`}
                                                                className="flex items-center gap-3 rounded-md bg-black/20 p-2"
                                                            >
                                                                {/* Position */}
                                                                <Select
                                                                    value={player.position === "All" ? "" : player.position}
                                                                    onValueChange={(value) =>
                                                                        updatePlayerPosition(
                                                                            round.round,
                                                                            index,
                                                                            (value || "All") as Position
                                                                        )
                                                                    }
                                                                >
                                                                    <SelectTrigger className="w-[160px]">
                                                                        <SelectValue placeholder="Position" />
                                                                    </SelectTrigger>

                                                                    <SelectContent>
                                                                        {POSITION_LIST.filter((p) => p !== "FLEX").map((position) => (
                                                                            <SelectItem key={position} value={position}
                                                                                className="
                                                                                    cursor-pointer
                                                                                    focus:bg-primary
                                                                                    focus:text-primary-foreground
                                                                                    data-[highlighted]:bg-primary
                                                                                    data-[highlighted]:text-primary-foreground
                                                                                "
                                                                            >
                                                                                {position}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>

                                                                {/* Player Search */}
                                                                <Popover
                                                                    open={openPopover === popoverId}
                                                                    onOpenChange={(open) =>
                                                                        setOpenPopover(open ? popoverId : null)
                                                                    }
                                                                >
                                                                    <PopoverTrigger asChild>
                                                                        <Button
                                                                            variant="outline"
                                                                            className={`w-64 justify-start ${
                                                                                player.name === "New Player"
                                                                                    ? "text-muted-foreground border-white/10"
                                                                                    : "border-white/20"
                                                                            }`}
                                                                        >
                                                                            {player.name === "New Player"
                                                                                ? "Select Player"
                                                                                : player.name}
                                                                        </Button>
                                                                    </PopoverTrigger>

                                                                    <PopoverContent className="w-72 p-0 border-white/5 max-h-180 overflow-y-auto">
                                                                        <Command>
                                                                            <CommandInput placeholder="Search player..." />

                                                                            <CommandEmpty>
                                                                                No players found.
                                                                            </CommandEmpty>

                                                                            <CommandGroup>
                                                                                {availablePlayers.map((option) => (
                                                                                    <CommandItem
                                                                                        key={option.id}
                                                                                        value={option.name}
                                                                                        className="
                                                                                            cursor-pointer
                                                                                            data-[selected=true]:bg-primary
                                                                                            data-[selected=true]:text-primary-foreground
                                                                                        "
                                                                                        onSelect={() =>
                                                                                            updatePlayer(
                                                                                                round.round,
                                                                                                index,
                                                                                                option
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        {option.name}
                                                                                    </CommandItem>
                                                                                ))}
                                                                            </CommandGroup>
                                                                        </Command>
                                                                    </PopoverContent>
                                                                </Popover>

                                                                {/* Team */}
                                                                <div className="w-10 text-center text-xs text-muted-foreground font-medium">
                                                                    {(player.teamInfo.teamAbbv == "FA") ? "" : player.teamInfo.teamAbbv}
                                                                </div>

                                                                {/* PPG */}
                                                                <div className="ml-auto w-14 text-right font-bold text-primary mr-3">
                                                                    {player.ppg.toFixed(1)}
                                                                </div>

                                                                <Button size="sm" className="absolute right-12 h-7 bg-primary/10 text-primary hover:bg-primary hover:text-black font-bold text-[10px] uppercase border border-primary/30 shadow-[0_0_10px_rgba(46,160,67,0.05)]"
                                                                        onClick={() => deletePlayerSlot(round.round, index)}>
                                                                    <X className="mr-0 h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        );
                                                    })}

                                                    {round.players.length < 5 && (round.players.length == 0 || (round.players[round.players.length - 1] && round.players[round.players.length - 1].position !== "All" && round.players[round.players.length - 1].name !== "New Player")) && (
                                                        <button
                                                            type="button"
                                                            onClick={() => addPlayerSlot(round.round)}
                                                            className="w-full rounded-md border border-dashed border-white/20 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary"
                                                        >
                                                            + Add Player
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>

                            <div className="p-4 flex justify-center bg-[#0d1117] border-b border-[#30363d]">
                                <Button
                                    className="mt-auto h-10 w-128 self-center mb-16 bg-[#BF3A2C]/10 text-[#BF3A2C] hover:bg-[#BF3A2C] hover:text-white font-bold text-[10px] uppercase border border-[#BF3A2C]/30 shadow-[0_0_10px_rgba(46,160,67,0.05)]"
                                    onClick={() => deleteStrategy()}
                                >
                                    Delete
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-[14px] text-[#adbac7] text-center mt-5">
                            No Strategy Selected
                        </p>
                    )}
                </Card>
            </div>
    </div>
    );
}