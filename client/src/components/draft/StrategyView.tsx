import React, { useMemo, useState } from "react";
import { useDraftStore } from "@/lib/draftStore";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, ArrowUpDown } from "lucide-react";

interface StrategyScenario {
  name: string;
  order: string[]; // e.g. ["RB", "RB", "WR", "WR", "QB", "TE", "WR", "DST", "K", "RB"]
  players: Record<string, any>;
  totalPPG: number;
}

export function StrategyView() {
  const { players, settings } = useDraftStore();
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const scenarios = useMemo(() => {
    const strategies = [
      { name: "RB Heavy", order: ["RB", "RB", "WR", "WR", "TE", "QB", "WR", "RB", "DST", "K"] },
      { name: "Zero RB", order: ["WR", "WR", "WR", "TE", "QB", "RB", "RB", "RB", "DST", "K"] },
      { name: "Balanced", order: ["RB", "WR", "RB", "WR", "QB", "TE", "WR", "RB", "DST", "K"] },
      { name: "Early QB", order: ["QB", "RB", "WR", "RB", "WR", "TE", "WR", "RB", "DST", "K"] },
      { name: "Hero RB", order: ["RB", "WR", "WR", "WR", "WR", "QB", "TE", "RB", "DST", "K"] },
    ];

    return strategies.map(strat => {
      const scenarioPlayers: Record<string, any> = {};
      const draftedIds = new Set<string>();
      
      // Simulation for each round
      strat.order.forEach((pos, roundIdx) => {
        const round = roundIdx + 1;
        // User's pick overall in this round (assuming position settings.position)
        // Simple approximation: (round-1) * teamCount + position
        const userPickOverall = (round - 1) * settings.teamCount + settings.position;

        // Find best available player for this position
        // "Available" means their ADP is >= userPickOverall (or slightly lower to be realistic)
        const bestAvailable = players
          .filter(p => p.position === (pos.startsWith("RB") ? "RB" : pos.startsWith("WR") ? "WR" : pos.startsWith("QB") ? "QB" : pos.startsWith("TE") ? "TE" : pos.startsWith("DST") ? "DST" : pos.startsWith("K") ? "K" : pos))
          .filter(p => !draftedIds.has(p.id))
          .filter(p => p.adp >= userPickOverall - 2) // buffer
          .sort((a, b) => b.ppg - a.ppg)[0] || players.filter(p => !draftedIds.has(p.id))[0];

        if (bestAvailable) {
          draftedIds.add(bestAvailable.id);
          // Map to display keys: RB1, RB2, etc.
          let key = pos;
          let count = 1;
          while (scenarioPlayers[`${key}${count > 1 ? count : ""}`]) {
            count++;
          }
          const finalKey = count > 1 ? `${key}${count}` : `${key}1`;
          // Special handling for labels requested by user
          scenarioPlayers[finalKey] = bestAvailable;
        }
      });

      // Calculate Total PPG for starters
      // Header asks for: QB, RB1, RB2, WR1, WR2, TE, FLEX, DST, K
      // FLEX is usually the next best RB/WR/TE
      const starters = ["QB1", "RB1", "RB2", "WR1", "WR2", "TE1", "DST1", "K1"];
      let total = 0;
      starters.forEach(k => {
        if (scenarioPlayers[k]) total += scenarioPlayers[k].ppg;
      });
      
      // Find FLEX and BENCH
      const remaining = Object.entries(scenarioPlayers)
        .filter(([k]) => !starters.includes(k));
      
      const flexCandidate = remaining.sort((a, b) => b[1].ppg - a[1].ppg)[0];
      if (flexCandidate) {
        scenarioPlayers["FLEX"] = flexCandidate[1];
        total += flexCandidate[1].ppg;
      }

      const benchCandidate = Object.entries(scenarioPlayers)
        .filter(([k]) => !starters.includes(k) && k !== "FLEX")
        .sort((a, b) => b[1].ppg - a[1].ppg)[0];
      
      if (benchCandidate) {
        scenarioPlayers["BENCH"] = benchCandidate[1];
      }

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
    { id: "TE1", label: "TE" },
    { id: "FLEX", label: "FLEX" },
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
          <div className="min-w-[1400px]">
            <div className="grid grid-cols-[150px_repeat(10,minmax(115px,1fr))_120px] gap-0 border-b border-[#30363d] bg-[#0d1117] text-[10px] font-bold text-[#8b949e] uppercase tracking-tighter sticky top-0 z-20">
              <div className="p-4 border-r border-[#30363d] bg-[#0d1117]">STRATEGY</div>
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
                  className="grid grid-cols-[150px_repeat(10,minmax(110px,1fr))_120px] gap-0 border-b border-[#30363d]/50 hover:bg-white/[0.02] transition-colors group"
                >
                  <div className="p-4 border-r border-[#30363d]/50 flex flex-col justify-center">
                    <span className="text-white font-bold text-xs">{scenario.name}</span>
                    <span className="text-[9px] text-[#8b949e] font-mono mt-1 uppercase">Scenario {idx + 1}</span>
                  </div>
                  
                  {columns.map(col => {
                    const player = scenario.players[col.id];
                    return (
                      <div key={col.id} className="p-3 border-r border-[#30363d]/50 flex flex-col justify-center items-center text-center">
                        {player ? (
                          <>
                            <span className="text-[11px] font-semibold text-[#c9d1d9] truncate w-full">{player.name}</span>
                            <div className="flex items-center space-x-1 mt-0.5">
                              <span className="text-[9px] font-bold text-primary">{player.team}</span>
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
                    <span className="text-[8px] text-primary/60 font-mono mt-1">TOTAL</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] flex flex-col space-y-2">
          <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center">
            <div className="h-1.5 w-1.5 rounded-full bg-primary mr-2" />
            Simulation Logic
          </h4>
          <p className="text-[11px] text-[#8b949e] leading-relaxed">
            These scenarios assume drafting the highest projected player available for each position required by the strategy, while respecting current ADP trends.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] flex flex-col space-y-2">
          <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center">
            <div className="h-1.5 w-1.5 rounded-full bg-primary mr-2" />
            Total PPG
          </h4>
          <p className="text-[11px] text-[#8b949e] leading-relaxed">
            Sum of projected points for your starting lineup (QB, 2 RB, 2 WR, TE, FLEX, DST, K). Bench players do not count toward this total.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] flex flex-col space-y-2">
          <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center">
            <div className="h-1.5 w-1.5 rounded-full bg-primary mr-2" />
            Flex Strategy
          </h4>
          <p className="text-[11px] text-[#8b949e] leading-relaxed">
            The Flex position is automatically assigned to the highest remaining PPG player from your RB, WR, or TE pool after filling primary slots.
          </p>
        </div>
      </div>
    </div>
  );
}
