import React from "react";
import { useDraftStore } from "@/lib/draftStore";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp } from "lucide-react";

interface TeamRosterProps {
  showSuggested?: boolean;
}

export function TeamRoster({ showSuggested = false }: TeamRosterProps) {
  const { players, picks, settings, updateSettings } = useDraftStore();

  const viewedTeam = settings.teams.find(t => t.id === settings.viewedTeamId) || settings.teams[0];
  
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
          .filter(p => slot.pos.includes(p.position) || (slot.slot === "FLEX" && ["RB", "WR"].includes(p.position)))
          .sort((a, b) => b.ppg - a.ppg)[0];
        
        if (bestAvailable) {
          slot.placeholder = bestAvailable;
          assignedPlaceholderIds.add(bestAvailable.id);
        }
      }
    }
  });

  // Re-evaluate bench placeholders
  const benchSuggestedPositions = new Set<Position>();

  filledRoster.forEach((slot) => {
    if (slot.slot === "BENCH" && !slot.player) {
      const starterSlots = rosterSlots.filter(s => s.slot !== "BENCH");
      
      const fullPositions = (["QB", "RB", "WR", "TE", "DST", "K"] as const).filter(pos => {
        if (benchSuggestedPositions.has(pos as any)) return false;

        const canFitInStarters = filledRoster.some(s => s.slot !== "BENCH" && !s.player && (s.pos.includes(pos) || (s.slot === "FLEX" && ["RB", "WR"].includes(pos))));
        
        if (!canFitInStarters) {
          const startersOfPos = filledRoster.filter(s => s.slot !== "BENCH" && s.player?.position === pos).length;
          const totalOfPos = rosterPlayers.filter(p => p.position === pos).length;
          const backupsOfPos = totalOfPos - startersOfPos;

          // Special logic for K: No backups suggested
          if (pos === "K") return false;

          // Special logic for QB/TE/DST: Suggest exactly 1 backup
          if (["QB", "TE", "DST"].includes(pos)) {
            return backupsOfPos === 0;
          }

          // For RB/WR: Suggest 1 backup once starters/flex are full
          return backupsOfPos === 0;
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
      <Card className="bg-[#161b22] border-[#30363d] flex flex-col flex-1 min-h-0 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-[#30363d] flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-display font-bold tracking-[0.2em] text-primary uppercase truncate mr-4">{viewedTeam.name}'s Roster</h2>
            <select 
              className="bg-[#0d1117] border border-[#30363d] text-xs text-white rounded-lg px-3 py-1.5 focus:ring-primary/20 cursor-pointer min-w-[100px] transition-all hover:bg-[#1c2128]"
              value={settings.viewedTeamId}
              onChange={(e) => updateSettings({ viewedTeamId: e.target.value })}
            >
              {settings.teams.map((t, idx) => (
                <option key={t.id} value={t.id} className="bg-[#0d1117]">
                  {idx + 1}. {t.name}{t.isUser ? " (user)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#8b949e] uppercase font-mono font-bold tracking-wider">Projected PPG</span>
            <span className="text-2xl font-mono font-bold text-white tracking-tight">{startersPpg.toFixed(1)}</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-hide">
          {filledRoster.map((slot, idx) => {
            const isBenchDivider = slot.slot === "BENCH" && filledRoster[idx-1]?.slot !== "BENCH";
            return (
              <React.Fragment key={idx}>
                {isBenchDivider && (
                  <div className="py-3 flex items-center gap-3">
                    <div className="h-px flex-1 bg-[#30363d]" />
                    <span className="text-[10px] font-mono text-[#8b949e] uppercase tracking-[0.2em] font-bold">Bench</span>
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
                          <span className="font-bold">{slot.player.position} • {slot.player.team}</span>
                          <span className="text-[#6e7681] opacity-80">BYE {slot.player.byeWeek}</span>
                        </div>
                      </div>
                    ) : slot.placeholder ? (
                      <div className="truncate opacity-50">
                        <div className="text-[13px] font-bold text-primary/80 truncate leading-snug flex items-center gap-2">
                          <TrendingUp className="h-3 w-3" />
                          {slot.placeholder.name}
                        </div>
                        <div className="text-[10px] text-[#8b949e] uppercase font-mono mt-1 truncate flex items-center gap-3">
                          <span className="font-bold">{slot.placeholder.position} • {slot.placeholder.team}</span>
                          <span className="opacity-80">BYE {slot.placeholder.byeWeek}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] font-mono text-[#484f58] uppercase italic tracking-widest">Empty</div>
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

      {showSuggested && (
        <Card className="bg-[#1c2128] border-primary/20 border-2 p-4 shadow-[0_0_20px_rgba(46,160,67,0.1)] flex-shrink-0">
          <div className="flex items-center text-primary mb-3">
             <Sparkles className="h-3 w-3 mr-2" />
             <h3 className="text-[10px] font-bold uppercase tracking-[0.15em]">WarRoom Suggestions</h3>
          </div>
          <div className="p-2.5 bg-primary/10 rounded border border-primary/20">
            <div className="flex justify-between items-start mb-1.5">
               <div className="text-[10px] font-bold text-primary truncate">TARGET: Breece Hall (RB)</div>
               <Badge className="bg-primary text-black text-[8px] h-4 px-1 flex-shrink-0">98% VAL</Badge>
            </div>
            <p className="text-[9px] text-[#adbac7] leading-tight line-clamp-2">
               Elite volume projected for Season 2026. Pairs optimally with your current QB1.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
