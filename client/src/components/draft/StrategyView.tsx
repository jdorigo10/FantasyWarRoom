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
    // Generate all permutations
    const rounds = [1, 2, 3, 4, 5, 6, 7, 8];
    const generatedStrategies: any[] = [];
    
    // Helper to get combinations of k items from array
    const getCombinations = (arr: number[], k: number): number[][] => {
        if (k === 0) return [[]];
        if (arr.length === 0) return [];
        const [first, ...rest] = arr;
        const withFirst = getCombinations(rest, k - 1).map(c => [first, ...c]);
        const withoutFirst = getCombinations(rest, k);
        return [...withFirst, ...withoutFirst];
    };

    // 1. Pick 3 rounds for RBs
    const rbCombs = getCombinations(rounds, 3);
    
    for (const rbs of rbCombs) {
        const remainingAfterRb = rounds.filter(r => !rbs.includes(r));
        // 2. Pick 3 rounds for WRs
        const wrCombs = getCombinations(remainingAfterRb, 3);
        
        for (const wrs of wrCombs) {
            const remainingFinal = remainingAfterRb.filter(r => !wrs.includes(r));
            // remainingFinal has 2 items for QB and TE
            
            // Permutation 1: QB = remainingFinal[0], TE = remainingFinal[1]
            const p1 = { RB: rbs, WR: wrs, QB: remainingFinal[0], TE: remainingFinal[1] };
            // Permutation 2: QB = remainingFinal[1], TE = remainingFinal[0]
            const p2 = { RB: rbs, WR: wrs, QB: remainingFinal[1], TE: remainingFinal[0] };
            
            [p1, p2].forEach(p => {
                // Constraints: QB >= 2, TE >= 2
                if (p.QB < 2 || p.TE < 2) return;
                
                const draftOrder: Record<number, string> = {};
                p.RB.forEach(r => draftOrder[r] = "RB");
                p.WR.forEach(r => draftOrder[r] = "WR");
                draftOrder[p.QB] = "QB";
                draftOrder[p.TE] = "TE";
                
                // Fixed rounds
                draftOrder[12] = "DST";
                draftOrder[14] = "K";
                
                generatedStrategies.push({ draftOrder });
            });
        }
    }

    // Simulate all scenarios
    const results = generatedStrategies.map((strat, idx) => {
      const scenarioPlayers: Record<string, any> = {};
      const draftedIds = new Set<string>();
      const draftOrder = strat.draftOrder;

      // Simulation
      for (let round = 1; round <= 14; round++) {
        const pos = draftOrder[round];
        if (!pos) continue; // Skip rounds 9, 10, 11, 13

        const userPickOverall = round % 2 === 1
          ? (round - 1) * settings.teamCount + settings.position
          : round * settings.teamCount - settings.position + 1;

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

      // Ensure all positions have a player
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
      let total = 0;
      starterKeys.forEach(k => {
        if (scenarioPlayers[k]) total += scenarioPlayers[k].ppg;
      });

      return {
        name: `Scenario ${idx + 1}`,
        players: scenarioPlayers,
        totalPPG: parseFloat(total.toFixed(1))
      };
    });

    return results.sort((a, b) => sortDir === 'desc' ? b.totalPPG - a.totalPPG : a.totalPPG - b.totalPPG).slice(0, 25);
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
          <span>Top 25 Projected Scenarios (Sorted by Total PPG)</span>
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
