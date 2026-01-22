import React, { useMemo, useState } from "react";
import { useDraftStore } from "@/lib/draftStore";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, ArrowUpDown } from "lucide-react";

interface StrategyScenario {
  name: string;
  order: string[]; 
  players: Record<string, any>;
  totalPPG: number;
}

export function StrategyView() {
  const { players, settings } = useDraftStore();
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const scenarios = useMemo(() => {
    const strategies = [
      { name: "RB Heavy", priority: ["RB", "RB", "RB", "WR", "WR", "WR", "TE", "QB"] },
      { name: "Zero RB", priority: ["WR", "WR", "WR", "WR", "TE", "QB", "RB", "RB"] },
      { name: "Balanced", priority: ["RB", "WR", "RB", "WR", "QB", "TE", "RB", "WR"] },
      { name: "Early QB", priority: ["QB", "RB", "WR", "RB", "WR", "TE", "RB", "WR"] },
      { name: "Hero RB", priority: ["RB", "WR", "WR", "WR", "WR", "WR", "TE", "QB"] },
    ];

    return strategies.map(strat => {
      const scenarioPlayers: Record<string, any> = {};
      const draftedIds = new Set<string>();
      
      const draftOrder: Record<number, string> = {};
      draftOrder[12] = "DST";
      draftOrder[14] = "K";
      
      let priorityIdx = 0;
      for (let rd = 1; rd <= 14; rd++) {
        if (draftOrder[rd]) continue;
        if (priorityIdx < strat.priority.length) {
          draftOrder[rd] = strat.priority[priorityIdx++];
        } else {
          // Fill remaining slots with best available value (simplified)
          draftOrder[rd] = "WR"; 
        }
      }

      // Simulation
      for (let round = 1; round <= 14; round++) {
        const pos = draftOrder[round];
        const userPickOverall = (round - 1) * settings.teamCount + settings.position;

        const bestAvailable = players
          .filter(p => p.position === pos)
          .filter(p => !draftedIds.has(p.id))
          .filter(p => p.adp > (userPickOverall - round))
          .sort((a, b) => b.ppg - a.ppg)[0] || players.filter(p => p.position === pos && !draftedIds.has(p.id))[0];

        if (bestAvailable) {
          draftedIds.add(bestAvailable.id);
          
          let key = pos;
          if (pos === "DST") key = "DST1";
          else if (pos === "K") key = "K1";
          else if (pos === "QB") key = "QB1";
          else if (pos === "TE") key = "TE1";
          else {
            // RB or WR
            let count = 1;
            while (scenarioPlayers[`${pos}${count}`]) {
              count++;
            }
            key = `${pos}${count}`;
          }

          scenarioPlayers[key] = {
            ...bestAvailable,
            round,
            pickOverall: userPickOverall
          };
        }
      }

      // Determine FLEX and BENCH
      // Required: RB1, RB2, WR1, WR2
      // Candidates for FLEX: RB3 or WR3
      const rb3 = scenarioPlayers["RB3"];
      const wr3 = scenarioPlayers["WR3"];
      
      if (rb3 && wr3) {
        if (rb3.ppg >= wr3.ppg) {
          scenarioPlayers["FLEX"] = rb3;
          scenarioPlayers["BENCH"] = wr3;
        } else {
          scenarioPlayers["FLEX"] = wr3;
          scenarioPlayers["BENCH"] = rb3;
        }
      } else if (rb3) {
        scenarioPlayers["FLEX"] = rb3;
        scenarioPlayers["BENCH"] = scenarioPlayers["WR3"] || scenarioPlayers["RB4"] || null;
      } else if (wr3) {
        scenarioPlayers["FLEX"] = wr3;
        scenarioPlayers["BENCH"] = scenarioPlayers["RB3"] || scenarioPlayers["WR4"] || null;
      }

      // Ensure all positions have a player (even if mock)
      const starterKeys = ["QB1", "RB1", "RB2", "WR1", "WR2", "TE1", "FLEX", "DST1", "K1"];
      starterKeys.forEach(k => {
        if (!scenarioPlayers[k]) {
          const pos = k.replace(/[0-9]/g, '');
          const fallback = players.find(p => p.position === (pos === "FLEX" ? "RB" : pos) && !draftedIds.has(p.id));
          if (fallback) scenarioPlayers[k] = fallback;
        }
      });
      if (!scenarioPlayers["BENCH"]) {
        const fallback = players.find(p => !draftedIds.has(p.id));
        if (fallback) scenarioPlayers["BENCH"] = fallback;
      }

      // Calculate Total PPG for starters
      const starters = ["QB1", "RB1", "RB2", "WR1", "WR2", "TE1", "FLEX", "DST1", "K1"];
      let total = 0;
      starters.forEach(k => {
        if (scenarioPlayers[k]) total += scenarioPlayers[k].ppg;
      });

      return {
        name: strat.name,
        players: scenarioPlayers,
        totalPPG: parseFloat(total.toFixed(1))
      };
    }).sort((a, b) => sortDir === 'desc' ? b.totalPPG - a.totalPPG : a.totalPPG - b.totalPPG);
  }, [players, settings, sortDir]);

  const columns = [
    { id: "QB1", label: "QB" },
    { id: "RB1", label: "RB1" },
    { id: "RB2", label: "RB2" },
    { id: "WR1", label: "WR1" },
    { id: "WR2", label: "WR2" },
    { id: "FLEX", label: "FLEX" },
    { id: "TE1", label: "TE" },
    { id: "DST1", label: "DST" },
    { id: "K1", label: "K" },
    { id: "BENCH", label: "BENCH" },
  ];

  return (
    <div className="flex-1 overflow-hidden p-6 flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-bold tracking-tight text-white uppercase italic">
          Draft Scenarios & Strategies
        </h2>
        <div className="flex items-center space-x-2 text-[10px] text-[#8b949e] font-mono uppercase tracking-widest">
          <Info className="h-3 w-3 text-primary" />
          <span>Projected best picks per round</span>
        </div>
      </div>

      <Card className="flex-1 min-h-0 bg-[#161b22] border-[#30363d] overflow-hidden flex flex-col shadow-2xl">
        <ScrollArea className="flex-1">
          <div className="min-w-[1200px]">
            <div className="grid grid-cols-[repeat(10,minmax(115px,1fr))_120px] gap-0 border-b border-[#30363d] bg-[#0d1117] text-[10px] font-bold text-[#8b949e] uppercase tracking-tighter sticky top-0 z-20">
              {columns.map(col => (
                <div key={col.id} className="p-4 border-r border-[#30363d] text-center bg-[#0d1117]">
                  {col.label}
                </div>
              ))}
              <div 
                className="p-4 flex items-center justify-center space-x-2 cursor-pointer hover:bg-white/5 transition-colors text-primary bg-[#0d1117]"
                onClick={() => setSortDir(prev => prev === 'desc' ? 'asc' : 'desc')}
              >
                <span>TOTAL PPG</span>
                <ArrowUpDown className="h-3 w-3" />
              </div>
            </div>

            <div className="flex flex-col">
              {scenarios.map((scenario, idx) => (
                <div 
                  key={idx} 
                  className="grid grid-cols-[repeat(10,minmax(115px,1fr))_120px] gap-0 border-b border-[#30363d]/50 hover:bg-white/[0.02] transition-colors group"
                >
                  {columns.map(col => {
                    const player = scenario.players[col.id];
                    return (
                      <div key={col.id} className="p-3 border-r border-[#30363d]/50 flex flex-col justify-center items-center text-center">
                        {player ? (
                          <>
                            <div className="text-[8px] font-mono text-primary mb-1 uppercase tracking-tighter font-bold">
                              RD {player.round} - {player.pickOverall}
                            </div>
                            <span className="text-[11px] font-semibold text-[#c9d1d9] truncate w-full">{player.name}</span>
                            <div className="flex items-center space-x-1 mt-0.5">
                              <span className="text-[9px] font-bold text-[#484f58] uppercase">{player.team}</span>
                              <span className="text-[9px] text-[#8b949e] font-mono">{player.ppg}</span>
                            </div>
                          </>
                        ) : (
                          <span className="text-[9px] text-[#484f58] italic">--</span>
                        )}
                      </div>
                    );
                  })}

                  <div className="p-4 flex flex-col items-center justify-center bg-primary/5">
                    <span className="text-lg font-display font-black text-primary italic leading-none">{scenario.totalPPG}</span>
                    <span className="text-[8px] text-primary/60 font-mono mt-1 uppercase tracking-tighter">PPG</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}
