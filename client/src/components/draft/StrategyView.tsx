import React, { useMemo, useState } from "react";
import { useDraftStore } from "@/lib/draftStore";
import { useDraftStrategies } from "@/hooks/useDraftStrategies";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Info, ArrowUpDown } from "lucide-react";

export function StrategyView() {
  const { settings } = useDraftStore();
  const { scenarios, userActualPicks } = useDraftStrategies();
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sortedScenarios = useMemo(() => {
    return [...scenarios].sort((a, b) => sortDir === 'desc' ? b.totalPPG - a.totalPPG : a.totalPPG - b.totalPPG);
  }, [scenarios, sortDir]);

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
          Strategy - Pick {settings.position} {" ("} {settings.teamCount}{" Team Draft)"}
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
              {sortedScenarios.map((scenario, idx) => (
                <div 
                  key={idx} 
                  className="grid grid-cols-[repeat(10,minmax(115px,1fr))_120px] gap-0 border-b border-[#30363d]/50 hover:bg-white/[0.02] transition-colors group"
                >
                  {columns.map(col => {
                    const player = scenario.players[col.id];
                    const isDrafted = player && userActualPicks[player.round]?.id === player.id;
                    
                    return (
                      <div key={col.id} className={cn(
                        "p-3 border-r border-[#30363d]/50 flex flex-col justify-center items-center text-center transition-colors",
                        isDrafted ? "bg-primary/10" : ""
                      )}>
                        {player ? (
                          <>
                            <div className={cn(
                              "text-[8px] font-mono mb-1 uppercase tracking-tighter font-bold",
                              isDrafted ? "text-primary" : "text-primary"
                            )}>
                              {isDrafted && <span className="mr-1">✓</span>}
                              RD {player.round} - {player.pickOverall}
                            </div>
                            <span className={cn(
                              "text-[11px] font-semibold truncate w-full",
                              isDrafted ? "text-white" : "text-[#c9d1d9]"
                            )}>{player.name}</span>
                            <div className="flex items-center space-x-1 mt-0.5">
                              <span className="text-[9px] font-bold text-[#484f58] uppercase">{player.teamInfo.teamAbbv}</span>
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
