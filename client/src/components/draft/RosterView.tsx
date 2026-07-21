import React, { useEffect, useMemo, useRef, useState } from "react";
import { Player } from "@/lib/baseData";
import { useLocation } from "wouter";
import { getCurrentPickTeamId, getNextPickTeamId, useDraftStore } from "@/lib/draftStore";
import { useLiveStrategies } from "@/hooks/useLiveStrategies";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, ArrowUpDown, ExternalLink } from "lucide-react";

export function RosterView() {
      const { picks, players, settings, currentPickIndex } = useDraftStore();
      const isDetached = typeof window !== "undefined" && window.name === "roster-popup";
      const [refreshKey, setRefreshKey] = useState(0);

      useEffect(() => {
        if (!isDetached) return;

        const handleStorage = (event: StorageEvent) => {
          if (event.key === "fantasy-warroom-draft-state") {
            setRefreshKey((value) => value + 1);
          }
        };

        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
      }, [isDetached]);

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
      const currentPick = getPickDetails(currentPickIndex);

      const userTeamId = settings.teams.find(team => team.isUser)?.id;
      const accentColor = settings.accentColor || "#388bfd";
      const currentPickTeamId = getCurrentPickTeamId(currentPickIndex, settings);
      const nextPickTeamId = getNextPickTeamId(currentPickIndex, settings);
      const scrollContainerRef = useRef<HTMLDivElement>(null);

      // Check if draft is completed
      const isDraftComplete = (currentPick?.overall ?? 0) > (16 * settings.teams.length);

      const positionLabels = [
          "QB",
          "RB",
          "RB",
          "WR",
          "WR",
          "TE",
          "FLEX",
          "DST",
          "K",
          "BENCH",
          "BENCH",
          "BENCH",
          "BENCH",
          "BENCH",
          "BENCH",
      ];

      const getRosterSlotsForTeam = (teamId: string) => {
        const rosterSlots = [
          { slot: "QB", pos: ["QB"], player: null as Player | null },
          { slot: "RB", pos: ["RB"], player: null as Player | null },
          { slot: "RB", pos: ["RB"], player: null as Player | null },
          { slot: "WR", pos: ["WR"], player: null as Player | null },
          { slot: "WR", pos: ["WR"], player: null as Player | null },
          { slot: "TE", pos: ["TE"], player: null as Player | null },
          { slot: "FLEX", pos: ["RB", "WR", "TE"], player: null as Player | null },
          { slot: "DST", pos: ["DST"], player: null as Player | null },
          { slot: "K", pos: ["K"], player: null as Player | null },
          { slot: "BENCH", pos: ["ANY"], player: null as Player | null },
          { slot: "BENCH", pos: ["ANY"], player: null as Player | null },
          { slot: "BENCH", pos: ["ANY"], player: null as Player | null },
          { slot: "BENCH", pos: ["ANY"], player: null as Player | null },
          { slot: "BENCH", pos: ["ANY"], player: null as Player | null },
          { slot: "BENCH", pos: ["ANY"], player: null as Player | null },
        ];

        const teamPicks = picks.filter(pick => {
          const pickIndex = picks.indexOf(pick);
          const round = Math.floor(pickIndex / settings.teamCount);
          const posInRound = pickIndex % settings.teamCount;

          let pickTeamIndex: number;
          if (round % 2 === 0) {
            pickTeamIndex = posInRound;
          } else {
            pickTeamIndex = settings.teamCount - 1 - posInRound;
          }

          return settings.teams[pickTeamIndex]?.id === teamId;
        });

        const rosterPlayers = teamPicks
          .map(pick => players.find(player => player.id === pick.playerId))
          .filter(Boolean) as Player[];

        const remainingPlayers = [...rosterPlayers];

        rosterSlots.forEach(slot => {
          if (slot.slot !== "FLEX" && slot.slot !== "BENCH") {
            const matchIndex = remainingPlayers.findIndex(player => slot.pos.includes(player.position));
            if (matchIndex !== -1) {
              slot.player = remainingPlayers.splice(matchIndex, 1)[0];
            }
          }
        });

        const flexSlot = rosterSlots.find(slot => slot.slot === "FLEX");
        if (flexSlot) {
          const matchIndex = remainingPlayers.findIndex(player => flexSlot.pos.includes(player.position));
          if (matchIndex !== -1) {
            flexSlot.player = remainingPlayers.splice(matchIndex, 1)[0];
          }
        }

        rosterSlots.forEach(slot => {
          if (slot.slot === "BENCH" && remainingPlayers.length > 0) {
            slot.player = remainingPlayers.shift() ?? null;
          }
        });

        return rosterSlots;
      };

      const getProjectedStartingPpg = (teamId: string) => {
          const rosterSlots = getRosterSlotsForTeam(teamId);
          return rosterSlots
            .filter(slot => slot.slot !== "BENCH")
            .reduce((sum, slot) => sum + (slot.player?.ppg ?? 0), 0);
      };

      const getPickArrowName = (team: { id: string, name: string }) => {
          if (team.id !== currentPickTeamId || isDraftComplete) return team.name;

          const currentTeamIndex = settings.teams.findIndex(teamItem => teamItem.id === currentPickTeamId);
          if (currentTeamIndex === -1) return team.name;

          const nextTeamIndex = settings.teams.findIndex(teamItem => teamItem.id === nextPickTeamId);

          if (nextTeamIndex == -1) {
            if (currentTeamIndex == 0) {
                return "⬅ " + team.name;
            }
            else {
                return team.name + " ➡";
            }
          }
          return nextTeamIndex > currentTeamIndex ?  team.name + " ➡" : "⬅ " + team.name;
      };

      const getTeamColumnClasses = (team: { id: string }, isHeader = false) => {
          const isUserTeam = team.id === userTeamId;
          const isCurrentPickTeam = team.id === currentPickTeamId;

          if (isCurrentPickTeam && !isDraftComplete) {
              return cn(
                  "border-2",
                  isHeader ? "text-[#f0f6fc] bg-transparent backdrop-blur-sm" : "text-[#f0f6fc] bg-[#0f1419]/50",
                  isUserTeam ? "font-bold" : ""
              );
          }

          if (isUserTeam) {
              return cn(isHeader ? "border border-[#7C7C7C] bg-[#0f1419]/30 text-white font-bold backdrop-blur-sm" : "border border-[#7C7C7C] bg-[#0f1419]/0 text-white font-bold");
          }

          return cn(
              isHeader ? "border border-[#30363d] bg-[#0f1419] text-[#f0f6fc]" : "border border-[#30363d] bg-[#0f1419]/50 text-[#8b949e]"
          );
      };

      useEffect(() => {
          const container = scrollContainerRef.current;
          if (!container) return;

          const teamIndex = settings.teams.findIndex(team => team.id === currentPickTeamId);
          if (teamIndex === -1) return;

          const columnWidth = 140 + 4;
          const targetScrollLeft = Math.max(0, (teamIndex + 1) * columnWidth - container.clientWidth / 2);
          container.scrollTo({ left: targetScrollLeft, behavior: "smooth" });
      }, [currentPickTeamId, currentPickIndex, settings.teams.length]);

      const getTeamColumnStyle = (team: { id: string }, isHeader = false) => {
          if (team.id !== currentPickTeamId || isDraftComplete) {
              return undefined;
          }

          if (isHeader) {
            return {
                borderColor: accentColor,
                color: accentColor,
                backgroundColor: `${accentColor}08`,
                backdropFilter: "blur(40px)",
                boxShadow: `0 0 0 1px ${accentColor}55, 0 0 12px ${accentColor}33`,
            } as React.CSSProperties;
          }

          return {
            borderColor: `${accentColor}38`,
          } as React.CSSProperties;
      };

      const openDetachedRoster = () => {
          const url = `${window.location.origin}/roster-popup`;
          const popup = window.open(url, "roster-popup", "width=1400,height=900,left=140,top=100,resizable,scrollbars=no");
          if (popup) {
              popup.focus();
          }
      };

      if (isDetached) {
        return (
          <div className="h-screen w-screen overflow-hidden bg-[#0d1117] p-3">
            <Card className="h-full w-full min-h-0 bg-[#161b22] border-[#30363d] overflow-hidden flex flex-col shadow-2xl">
              <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-auto">
                <div className="min-w-[720px] p-3">
                  <div className="grid gap-1" style={{ gridTemplateColumns: `80px repeat(${settings.teams.length}, minmax(140px, 1fr))` }}>
                    <div className="sticky left-0 top-0 z-30 flex h-16 items-center justify-center rounded-lg border border-[#30363d] bg-[#0f1419] px-2 text-center text-[12px] font-semibold uppercase tracking-[0.2em] text-[#8b949e] shadow-[0_1px_0_0_#30363d]">
                      Pos
                    </div>
                    {settings.teams.map((team, index) => (
                      <div
                        key={team.id || index}
                        className={cn(
                          "sticky top-0 z-20 flex h-16 items-center justify-center rounded-lg px-2 text-center text-[12px] font-semibold uppercase tracking-[0.2em] shadow-[0_1px_0_0_#30363d]",
                          getTeamColumnClasses(team, true)
                        )}
                        style={getTeamColumnStyle(team, true)}
                      >
                        <div className="flex flex-col items-center">
                          <span>{getPickArrowName(team)}</span>
                          <span className="mt-1 text-[10px] text-[#8b949e] leading-none font-bold">
                            {`${getProjectedStartingPpg(team.id).toFixed(1)} pts`}
                          </span>
                        </div>
                      </div>
                    ))}

                    {positionLabels.map((label, rowIndex) => (
                      <React.Fragment key={`${label}-${rowIndex}`}>
                        {rowIndex === 9 && (
                          <div className="col-span-full my-1 h-0 border-t-2 border-dashed border-[#8b949e]" />
                        )}
                        <div className="sticky left-0 z-10 flex h-16 items-center justify-center rounded-lg border border-[#30363d] bg-[#0f1419] px-2 text-center text-[12px] font-medium uppercase text-[#c9d1d9] shadow-[0_1px_0_0_#30363d]">
                          {label}
                        </div>
                        {settings.teams.map((team, teamIndex) => {
                          const rosterSlots = getRosterSlotsForTeam(team.id);
                          const slot = rosterSlots[rowIndex];

                          return (
                            <div
                              key={`${team.id || teamIndex}-row-${rowIndex}`}
                              className={cn(
                                "flex h-16 items-center justify-center rounded-lg px-2 text-center text-xs",
                                getTeamColumnClasses(team)
                              )}
                              style={getTeamColumnStyle(team)}
                            >
                              {slot?.player ? (
                                <div className="flex min-w-0 flex-col items-center justify-center">
                                  <div className="truncate text-[12px] font-bold text-white leading-snug">
                                    {slot.player.name}
                                  </div>
                                  <div className="mt-0.5 truncate text-[11px] font-mono uppercase text-[#8b949e]">
                                    <span className="font-bold">{slot.player.position} • {slot.player.teamInfo.teamAbbv}</span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[12px] font-mono uppercase tracking-wider text-[#8b949e]">--</span>
                              )}
                            </div>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        );
      }

      return (
        <div className="flex-1 min-h-0 overflow-hidden p-6 flex flex-col space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-display font-bold tracking-tight uppercase italic">
                    Current Rosters
                </h2>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="h-7 border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 hover:text-black"
                        onClick={openDetachedRoster}
                    >
                        <ExternalLink className="mr-2 h-3.5 w-3.5" />
                        Pop Out
                    </Button>
                </div>
            </div>

            <div className="flex flex-1 min-h-0 overflow-hidden">
                <Card className="flex-1 min-h-0 bg-[#161b22] border-[#30363d] overflow-hidden flex flex-col shadow-2xl">
                    <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-auto">
                        <div className="min-w-[720px] p-3">
                            <div className="grid gap-1" style={{ gridTemplateColumns: `80px repeat(${settings.teams.length}, minmax(140px, 1fr))` }}>
                                <div className="sticky left-0 top-0 z-30 flex h-16 items-center justify-center rounded-lg border border-[#30363d] bg-[#0f1419] px-2 text-center text-[12px] font-semibold uppercase tracking-[0.2em] text-[#8b949e] shadow-[0_1px_0_0_#30363d]">
                                    Pos
                                </div>
                                {settings.teams.map((team, index) => (
                                    <div
                                        key={team.id || index}
                                        className={cn(
                                            "sticky top-0 z-20 flex h-16 items-center justify-center rounded-lg px-2 text-center text-[12px] font-semibold uppercase tracking-[0.2em] shadow-[0_1px_0_0_#30363d]",
                                            getTeamColumnClasses(team, true)
                                        )}
                                        style={getTeamColumnStyle(team, true)}
                                    >
                                        <div className="flex flex-col items-center">
                                            <span>{getPickArrowName(team)}</span>
                                            <span className="mt-1 text-[10px] text-[#8b949e] leading-none font-bold">
                                                {`${getProjectedStartingPpg(team.id).toFixed(1)} pts`}
                                            </span>
                                        </div>
                                    </div>
                                ))}

                                {positionLabels.map((label, rowIndex) => (
                                    <React.Fragment key={`${label}-${rowIndex}`}>
                                        {rowIndex === 9 && (
                                            <div className="col-span-full my-1 h-0 border-t-2 border-dashed border-[#8b949e]" />
                                        )}
                                        <div className="sticky left-0 z-10 flex h-16 items-center justify-center rounded-lg border border-[#30363d] bg-[#0f1419] px-2 text-center text-[12px] font-medium uppercase text-[#c9d1d9] shadow-[0_1px_0_0_#30363d]">
                                            {label}
                                        </div>
                                        {settings.teams.map((team, teamIndex) => {
                                            const rosterSlots = getRosterSlotsForTeam(team.id);
                                            const slot = rosterSlots[rowIndex];

                                            return (
                                                <div
                                                    key={`${team.id || teamIndex}-row-${rowIndex}`}
                                                    className={cn(
                                                        "flex h-16 items-center justify-center rounded-lg px-2 text-center text-xs",
                                                        getTeamColumnClasses(team)
                                                    )}
                                                    style={getTeamColumnStyle(team)}
                                                >
                                                    {slot?.player ? (
                                                        <div className="flex min-w-0 flex-col items-center justify-center">
                                                            <div className="truncate text-[12px] font-bold text-white leading-snug">
                                                                {slot.player.name}
                                                            </div>
                                                            <div className="mt-0.5 truncate text-[11px] font-mono uppercase text-[#8b949e]">
                                                                <span className="font-bold">{slot.player.position} • {slot.player.teamInfo.teamAbbv}</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[12px] font-mono uppercase tracking-wider text-[#8b949e]">--</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
      )
}