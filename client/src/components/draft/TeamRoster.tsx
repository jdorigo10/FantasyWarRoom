import React, { useEffect, useRef, useState, useMemo } from "react";
import { useDraftStore } from "@/lib/draftStore";
import { Player } from "@/lib/baseData";
import { useLiveStrategies } from "@/hooks/useLiveStrategies";
import { initializeStrategyStore, useStrategyStore } from "@/hooks/useSavedStrategy";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { TrendingUp, BotMessageSquare, ChevronDown, Medal, Trophy } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

function backupsOfPosFor(
  pos: "QB" | "TE",
  filledRoster: Array<{ slot: string; player: any; placeholder: any }>,
  rosterPlayers: Array<any>
) {
  const startersOfPos = filledRoster.filter(
    s => s.slot !== "BENCH" && s.player?.position === pos
  ).length;

  const rosterPlayersOfPos = rosterPlayers.filter(p => p.position === pos).length;
  return rosterPlayersOfPos - startersOfPos;
}

export function TeamRoster() {
  const [, setLocation] = useLocation();
  const { players, picks, settings, updateSettings, currentPickIndex, pickedPlayers } = useDraftStore();
  const userActualPicks = useMemo(() => {
      const map: Record<number, Player> = {};
      picks.filter(p => p.pickedBy === 'User').forEach(p => {
      const player = players.find(pl => pl.id === p.playerId);
      if (player) map[p.round] = player;
      });
      return map;
  }, [picks, players]);

  const viewedTeam = settings.teams.find(t => t.id === settings.viewedTeamId) || settings.teams[0];

  // Helper for pick info
  const getPickDetails = (index: number) => {
    if (index < 0) return null;
    const round = Math.floor(index / settings.teamCount) + 1;
    const pickInRound = (index % settings.teamCount) + 1;
    const isEvenRound = (round - 1) % 2 === 0;
    
    let teamIndex;
    if (isEvenRound) {
        teamIndex = pickInRound - 1;
    } else {
        teamIndex = settings.teamCount - pickInRound;
    }
    
    // Safety check
    if (teamIndex < 0 || teamIndex >= settings.teams.length) return null;
    
    return {
        round,
        pick: pickInRound,
        overall: index + 1,
        team: settings.teams[teamIndex]
    };
  };
  
  // Calculate picks until user
  let nextUserPickIndex = -1;
  // search forward for next user pick
  for (let i = currentPickIndex; i < settings.rounds * settings.teamCount; i++) {
      const details = getPickDetails(i);
      if (details?.team?.isUser) {
          nextUserPickIndex = i
          break;
      }
  }
  
  // Calculate Live Suggestion
  const { scenarios } = useLiveStrategies();
  const liveSuggestions: (Player | null)[] = [];
  if (scenarios.length > 0) {
    for (let i = 0; i < Math.min(5, scenarios.length); i++) {
      let suggestedPlayer = null;

      const topStrategy = scenarios[i];
      const allStrategyPlayers = Object.values(topStrategy.players);
      // Find the player in the strategy with the lowest pickOverall that is >= currentPickIndex + 1
      // This represents the next player the user should target according to the best strategy.
      
      suggestedPlayer = allStrategyPlayers
          .filter((p: any) => p.pickOverall >= currentPickIndex + 1)
          .sort((a: any, b: any) => a.pickOverall - b.pickOverall)[0];

      liveSuggestions.push(suggestedPlayer);
    }
  }
  else {
    liveSuggestions.push(null);
  }

  // Calculate Saved Suggestion
  initializeStrategyStore();
  const { savedStrats } = useStrategyStore();
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
  const topStrategy =
      matchingStrategies.length > 0
          ? matchingStrategies.sort((a, b) => a.rank - b.rank)[0]
          : null;
  const savedSuggestions: (Player | null)[] = [];
  if (topStrategy) {
    const round = topStrategy.rounds[Math.floor(nextUserPickIndex / settings.teamCount)];

    const pickedPlayerIds = new Set(
        picks.map(pick => pick.playerId)
    );

    const availablePlayers = round.players.filter(
        player => !pickedPlayerIds.has(player.id)
    );

    savedSuggestions.push(...availablePlayers);
    if (savedSuggestions.length === 0) {
        savedSuggestions.push(null);
    }
  } else {
      savedSuggestions.push(null);
  }

  // Define roster slots
  const rosterSlots = [
    { slot: "QB", pos: ["QB"] },
    { slot: "RB", pos: ["RB"] },
    { slot: "RB", pos: ["RB"] },
    { slot: "WR", pos: ["WR"] },
    { slot: "WR", pos: ["WR"] },
    { slot: "TE", pos: ["TE"] },
    { slot: "FLEX", pos: ["RB", "WR", "TE"] },
    { slot: "DST", pos: ["DST"] },
    { slot: "K", pos: ["K"] },
    { slot: "BENCH", pos: ["ANY"] },
    { slot: "BENCH", pos: ["ANY"] },
    { slot: "BENCH", pos: ["ANY"] },
    { slot: "BENCH", pos: ["ANY"] },
    { slot: "BENCH", pos: ["ANY"] },
    { slot: "BENCH", pos: ["ANY"] },
    { slot: "BENCH", pos: ["ANY"] },
  ];

  const teamPicks = picks.filter(p => {
    const pickIndex = picks.indexOf(p);
    const round = Math.floor(pickIndex / settings.teamCount);
    const posInRound = pickIndex % settings.teamCount;
    
    let pickTeamIndex: number;
    if (round % 2 === 0) {
      pickTeamIndex = posInRound;
    } else {
      pickTeamIndex = settings.teamCount - 1 - posInRound;
    }
    
    return settings.teams[pickTeamIndex]?.id === viewedTeam.id;
  });

  const rosterPlayers = teamPicks.map(p => players.find(pl => pl.id === p.playerId)).filter(Boolean) as typeof players;
  
  // Assign players to slots
  const filledRoster = rosterSlots.map(slot => ({ ...slot, player: null as any, placeholder: null as any }));
  const remainingPlayers = [...rosterPlayers];

  // First pass: Match exact positions (except Flex/Bench)
  filledRoster.forEach(slot => {
    if (slot.slot !== "FLEX" && slot.slot !== "BENCH") {
      const matchIndex = remainingPlayers.findIndex(p => slot.pos.includes(p.position));
      if (matchIndex !== -1) {
        slot.player = remainingPlayers.splice(matchIndex, 1)[0];
      }
    }
  });

  // Second pass: Fill Flex
  const flexSlot = filledRoster.find(s => s.slot === "FLEX");
  if (flexSlot) {
    const matchIndex = remainingPlayers.findIndex(p => flexSlot.pos.includes(p.position));
    if (matchIndex !== -1) {
      flexSlot.player = remainingPlayers.splice(matchIndex, 1)[0];
    }
  }

  // Third pass: Fill Bench
  filledRoster.forEach(slot => {
    if (slot.slot === "BENCH" && remainingPlayers.length > 0) {
      slot.player = remainingPlayers.shift();
    }
  });

  // Fourth pass: Add placeholders for empty slots
  const availablePlayers = players.filter(p => !picks.find(pk => pk.playerId === p.id));
  
  // Keep track of which placeholders are assigned so we don't repeat them
  const assignedPlaceholderIds = new Set<string>();

  filledRoster.forEach(slot => {
    if (!slot.player) {
      if (slot.slot !== "BENCH") {
        const bestAvailable = availablePlayers
          .filter(p => !assignedPlaceholderIds.has(p.id))
          .filter(p => {
            if (slot.slot === "FLEX") {
              return ["RB", "WR"].includes(p.position);
            }
            return slot.pos.includes(p.position);
          })
          .sort((a, b) => b.ppg - a.ppg)[0];
        
        if (bestAvailable) {
          slot.placeholder = bestAvailable;
          assignedPlaceholderIds.add(bestAvailable.id);
        }
      }
    }
  });

  // Re-evaluate bench placeholders
  const benchSuggestedPositions = new Set<string>();
  const starterSlots = filledRoster.filter(s => s.slot !== "BENCH");
  const emptyBenchSlots = filledRoster.filter(s => s.slot === "BENCH" && !s.player).length;

  filledRoster.forEach((slot) => {
    if (slot.slot === "BENCH" && !slot.player) {
      const remainingBenchSlots =
        emptyBenchSlots - filledRoster.filter(
          s => s.slot === "BENCH" && !s.player && s !== slot
        ).length;

      const starterQB = filledRoster.some(
        s => s.slot !== "BENCH" && s.player?.position === "QB"
      );
      const starterTE = filledRoster.some(
        s => s.slot !== "BENCH" && s.player?.position === "TE"
      );
      const hasFlex = starterSlots.some(s => s.slot === "FLEX" && s.player);

      const backupQBNeeded = starterQB &&
        !filledRoster.some(
          s => s.slot !== "BENCH" && s.player?.position === "QB" && s.player?.name !== undefined
        ); // placeholder, replaced below

      const backupTENeeded = starterTE &&
        !filledRoster.some(
          s => s.slot !== "BENCH" && s.player?.position === "TE" && s.player?.name !== undefined
        ); // placeholder, replaced below

      const fullPositions = (["QB", "RB", "WR", "TE", "DST", "K"] as const).filter(pos => {
        if (benchSuggestedPositions.has(pos as any)) return false;

        if (pos === "DST" || pos === "K") return false;

        const startersOfPos = filledRoster.filter(
          s => s.slot !== "BENCH" && s.player?.position === pos
        ).length;

        if (pos === "QB" || pos === "TE") {
          return startersOfPos > 0 && hasFlex && backupsOfPosFor(pos, filledRoster, rosterPlayers) === 0;
        }

        if (pos === "RB" || pos === "WR") {
          const hasRequiredStarters = startersOfPos >= 2;

          if (!hasRequiredStarters) return false;

          if (remainingBenchSlots === 2) {
            if (backupQBNeeded && backupTENeeded) return false;
            return true;
          }

          if (remainingBenchSlots === 1) {
            if (backupQBNeeded || backupTENeeded) return false;
            return true;
          }

          return true;
        }

        return false;
      });

      if (fullPositions.length > 0) {
        const bestForBench = availablePlayers
          .filter(p => !assignedPlaceholderIds.has(p.id))
          .filter(p => fullPositions.includes(p.position as any))
          .sort((a, b) => b.ppg - a.ppg)[0];

        if (bestForBench) {
          slot.placeholder = bestForBench;
          assignedPlaceholderIds.add(bestForBench.id);
          benchSuggestedPositions.add(bestForBench.position);
        }
      }
    }
  });

  const startersPpg = filledRoster
    .filter(s => s.slot !== "BENCH" && s.player)
    .reduce((sum, s) => sum + s.player.ppg, 0);

  return (
    <div className="flex flex-col h-full space-y-4 overflow-hidden">
      <Card className="bg-[#161b22] border-[#30363d] flex flex-col flex-1 min-h-160 max-h-272 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-[#30363d] flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-display font-bold tracking-[0.2em] text-primary uppercase truncate mr-4">{viewedTeam.name}'s Roster</h2>
            <Select
                value={settings.viewedTeamId}
                onValueChange={(value) =>
                    updateSettings({ viewedTeamId: value })
                }
            >
                <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Roster" />
                </SelectTrigger>
                <SelectContent className="max-h-150 overflow-y-auto">
                    {settings.teams.map((t, idx) => (
                        <SelectItem
                            key={t.id}
                            value={t.id}
                            className="
                                cursor-pointer
                                focus:bg-primary
                                focus:text-primary-foreground
                                data-[highlighted]:bg-primary
                                data-[highlighted]:text-primary-foreground
                            "
                        >
                            {idx + 1}. {t.name}{t.isUser ? " (user)" : ""}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[#8b949e] uppercase font-mono font-bold tracking-wider">Projected PPG</span>
            <span className="text-2xl font-mono font-bold text-white tracking-tight">{startersPpg.toFixed(1)}</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-hide">
          {filledRoster.map((slot, idx) => {
            const isBenchDivider = slot.slot === "BENCH" && filledRoster[idx-1]?.slot !== "BENCH";
            return (
              <React.Fragment key={idx}>
                {isBenchDivider && (
                  <div className="py-3 flex items-center gap-3">
                    <div className="h-px flex-1 bg-[#30363d]" />
                    <span className="text-[12px] font-mono text-[#8b949e] uppercase tracking-[0.2em] font-bold">Bench</span>
                    <div className="h-px flex-1 bg-[#30363d]" />
                  </div>
                )}
                <div className={cn(
                  "flex items-center justify-between p-1.5 px-2.5 rounded border transition-all duration-200 min-h-[42px]",
                  slot.player 
                    ? "bg-[#0d1117] border-[#30363d] hover:border-primary/40 shadow-sm" 
                    : slot.placeholder
                      ? "bg-primary/5 border-primary/20 border-dashed"
                      : "bg-transparent border-dashed border-[#21262d] opacity-30"
                )}>
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 text-[10px] font-mono font-bold text-[#8b949e] uppercase text-center flex-shrink-0">
                      {slot.slot}
                    </div>
                    {slot.player ? (
                      <div className="truncate">
                        <div className="text-[13px] font-bold text-white truncate leading-snug">
                          {slot.player.name}
                        </div>
                        <div className="text-[10px] text-[#8b949e] uppercase font-mono mt-1 truncate flex items-center gap-3">
                          <span className="font-bold">{slot.player.position} • {slot.player.teamInfo.teamAbbv}</span>
                          <span className="text-[#6e7681] opacity-80 uppercase">Bye {slot.player.teamInfo.byeWeek}</span>
                        </div>
                      </div>
                    ) : slot.placeholder ? (
                      <div className="truncate opacity-50">
                        <div className="text-[13px] font-bold text-primary/80 truncate leading-snug flex items-center gap-2">
                          {slot.placeholder.name}
                        </div>
                        <div className="text-[10px] text-[#8b949e] uppercase font-mono mt-1 truncate flex items-center gap-3">
                          <span className="font-bold">{slot.placeholder.position} • {slot.placeholder.teamInfo.teamAbbv}</span>
                          <span className="opacity-80 uppercase">Bye {slot.placeholder.teamInfo.byeWeek}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] font-mono text-[#484f58] uppercase italic tracking-widest py-2.5">Empty</div>
                    )}
                  </div>
                  {(slot.player || slot.placeholder) && (
                    <div className="text-right flex-shrink-0 ml-3">
                      <div className={cn(
                        "text-[13px] font-mono font-bold",
                        slot.player ? "text-primary" : "text-primary/40 italic"
                      )}>
                        {slot.player?.ppg || slot.placeholder?.ppg}
                      </div>
                    </div>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </Card>

      
      <Card className="flex flex-col min-h-24 bg-[#1c2128] border-primary/20 border-2 p-2 shadow-[0_0_20px_rgba(46,160,67,0.1)] overflow-hidden">
        <div className="text-sm font-bold font-display text-center mb-1 mt-0 shrink-0 tracking-[0.2em] text-primary uppercase">
          Suggested Picks for Round {Math.floor(nextUserPickIndex / settings.teamCount) + 1}
        </div>
        <div className="flex items-center justify-between">
          <span className="pl-13 text-[10px] text-[#8b949e] uppercase font-mono text-center tracking-wider">Live Strategy</span>
          <span className="pr-13 text-[10px] text-[#8b949e] uppercase font-mono text-center tracking-wider">Saved Strategy</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 flex-1 min-h-0">
          {/* Live Suggestions */}
          <div className="flex flex-col gap-2 overflow-y-auto pr-0">
            {(liveSuggestions.length >0) && liveSuggestions.map((player, index) =>
              player ? (
                <Button
                  key={player.id}
                  className="p-2 bg-primary/10 rounded border border-primary/20 hover:bg-primary/20 shrink-0"
                  onClick={() => setLocation("/liveStrategy")}
                >
                  <div className="w-full text-left">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="text-[12px] font-bold text-primary truncate">
                        {player.name}
                      </div>

                      <div className="text-[12px] font-semibold text-primary flex-shrink-0">
                        {player.ppg}
                      </div>
                    </div>

                    <div className="text-[10px] text-[#8b949e] uppercase font-mono mt-1 truncate flex items-center gap-3">
                      <span className="font-bold">{player.position} • {player.teamInfo.teamAbbv}</span>
                      <span className="text-[#6e7681] opacity-80 uppercase">Bye {player.teamInfo.byeWeek}</span>
                    </div>
                  </div>
                </Button>
              ) : (
                <Button
                  key={`live-empty-${index}`}
                  className="p-2 bg-white/10 rounded border border-dashed border-white/20 hover:bg-white/20 shrink-0 min-h-13.5"
                  onClick={() => setLocation("/liveStrategy")}
                >
                  <p className="text-[12px] text-[#adbac7] text-center">
                    No live strategy
                  </p>
                </Button>
              )
            )}
          </div>

          {/* Saved Strategy */}
          <div className="flex flex-col gap-2 overflow-y-auto pl-0">
            {(savedSuggestions.length >0) && savedSuggestions.map((player, index) =>
              player ? (
                <Button
                  key={player.id}
                  className="p-2 bg-primary/10 rounded border border-primary/20 hover:bg-primary/20 shrink-0"
                  onClick={() => setLocation("/savedStrategy")}
                >
                  <div className="w-full text-left">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="text-[12px] font-bold text-primary truncate">
                        {player.name}
                      </div>

                      <div className="text-[12px] font-semibold text-primary flex-shrink-0">
                        {player.ppg}
                      </div>
                    </div>

                    <div className="text-[10px] text-[#8b949e] uppercase font-mono mt-1 truncate flex items-center gap-3">
                      <span className="font-bold">{player.position} • {player.teamInfo.teamAbbv}</span>
                      <span className="text-[#6e7681] opacity-80 uppercase">Bye {player.teamInfo.byeWeek}</span>
                    </div>
                  </div>
                </Button>
              ) : (
                <Button
                  key={`saved-empty-${index}`}
                  className="p-2 bg-white/10 rounded border border-dashed border-white/20 hover:bg-white/20 shrink-0 min-h-13.5"
                  onClick={() => setLocation("/savedStrategy")}
                >
                  <p className="text-[12px] text-[#adbac7] text-center">
                    No saved strategy
                  </p>
                </Button>
              )
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
