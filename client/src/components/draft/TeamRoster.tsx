import React from "react";
import { useDraftStore } from "@/lib/draftStore";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp } from "lucide-react";

interface TeamRosterProps {
  showSuggested?: boolean;
}

export function TeamRoster({ showSuggested = false }: TeamRosterProps) {
  const { players, myRoster } = useDraftStore();

  const getPlayer = (id: string) => players.find(p => p.id === id);
  const rosterPlayers = myRoster.map(getPlayer).filter(Boolean) as typeof players;
  const avgPpg = rosterPlayers.length > 0 
    ? (rosterPlayers.reduce((sum, p) => sum + p.ppg, 0) / rosterPlayers.length).toFixed(1)
    : "0.0";

  return (
    <div className="flex flex-col h-full space-y-6 overflow-hidden">
      <Card className="bg-[#161b22] border-[#30363d] flex flex-col min-h-0 shadow-xl">
        <div className="p-6 border-b border-[#30363d]">
          <h2 className="text-sm font-display font-bold tracking-[0.2em] text-primary uppercase mb-2">MY ROSTER</h2>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#8b949e] uppercase font-mono">Projected PPG</span>
            <span className="text-2xl font-mono font-bold text-white">{avgPpg}</span>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-2">
          {rosterPlayers.map(player => (
            <div key={player.id} className="bg-[#0d1117] border border-[#30363d] rounded p-3 flex justify-between items-center group hover:border-primary/50 transition-colors">
              <div>
                <div className="text-sm font-bold">{player.name}</div>
                <div className="text-[10px] text-[#8b949e] uppercase font-mono mt-1">{player.position} • {player.team}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono font-bold text-primary">{player.ppg} PPG</div>
              </div>
            </div>
          ))}
          {rosterPlayers.length === 0 && (
            <div className="p-10 text-center text-[#6e7681] text-xs uppercase font-mono tracking-widest opacity-50 border-2 border-dashed border-[#30363d] rounded">
              Awaiting Selection
            </div>
          )}
        </div>
      </Card>

      {showSuggested && (
        <Card className="bg-[#1c2128] border-primary/20 border-2 p-6 shadow-[0_0_20px_rgba(46,160,67,0.1)]">
          <div className="flex items-center text-primary mb-4">
             <Sparkles className="h-4 w-4 mr-2" />
             <h3 className="text-xs font-bold uppercase tracking-[0.15em]">WarRoom Suggestions</h3>
          </div>
          <div className="space-y-4">
             <div className="p-3 bg-primary/10 rounded border border-primary/20">
                <div className="flex justify-between items-start mb-2">
                   <div className="text-[11px] font-bold text-primary">TARGET: Breece Hall (RB)</div>
                   <Badge className="bg-primary text-black text-[9px]">98% VAL</Badge>
                </div>
                <p className="text-[10px] text-[#adbac7] leading-relaxed">
                   Elite volume projected for Season 2026. Pairs optimally with your current QB1.
                </p>
             </div>
             <div className="flex items-center justify-between text-[10px] font-mono text-[#8b949e] border-t border-[#30363d] pt-4">
                <span>Team Need: RB2</span>
                <span className="flex items-center text-primary"><TrendingUp className="h-3 w-3 mr-1" /> +15.4 PPG Boost</span>
             </div>
          </div>
        </Card>
      )}
    </div>
  );
}
