import React from "react";
import { useDraftStore } from "@/lib/draftStore";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function TeamRoster() {
  const { players, myRoster } = useDraftStore();

  // Helper to find player details
  const getPlayer = (id: string) => players.find(p => p.id === id);
  const rosterPlayers = myRoster.map(getPlayer).filter(Boolean) as typeof players;

  // Group by position (simplified)
  const roster = {
    QB: rosterPlayers.filter(p => p.position === 'QB'),
    RB: rosterPlayers.filter(p => p.position === 'RB'),
    WR: rosterPlayers.filter(p => p.position === 'WR'),
    TE: rosterPlayers.filter(p => p.position === 'TE'),
    FLEX: [] as typeof players, // Simplified
    K: rosterPlayers.filter(p => p.position === 'K'),
    DST: rosterPlayers.filter(p => p.position === 'DST'),
    BENCH: [] as typeof players
  };

  const totalPoints = rosterPlayers.reduce((sum, p) => sum + p.projectedPoints, 0);

  return (
    <Card className="h-full border-none bg-black/20 backdrop-blur-sm flex flex-col">
      <div className="p-4 border-b border-white/5">
         <h2 className="text-lg font-display font-semibold tracking-wider text-primary mb-1">MY TEAM</h2>
         <div className="flex justify-between items-end">
            <div className="text-xs text-muted-foreground">Projected Season Points</div>
            <div className="text-xl font-mono font-bold text-foreground">{totalPoints}</div>
         </div>
      </div>
      
      <div className="flex-1 overflow-auto p-2 space-y-2">
         {Object.entries(roster).map(([pos, players]) => {
             if (players.length === 0 && pos !== 'FLEX' && pos !== 'BENCH') return null;
             if (pos === 'FLEX' || pos === 'BENCH') return null; // Skip for now

             return (
                 <div key={pos} className="space-y-1">
                     <div className="text-[10px] font-bold text-muted-foreground px-2">{pos}</div>
                     {players.map(player => (
                         <div key={player.id} className="bg-white/5 rounded p-2 flex justify-between items-center text-sm border border-white/5">
                            <div>
                                <div className="font-medium">{player.name}</div>
                                <div className="text-[10px] text-muted-foreground">{player.team} • Bye {player.byeWeek}</div>
                            </div>
                            <div className="text-right">
                                <div className="font-mono text-primary font-bold">{player.projectedPoints}</div>
                            </div>
                         </div>
                     ))}
                 </div>
             )
         })}
         
         {rosterPlayers.length === 0 && (
            <div className="text-center p-8 text-muted-foreground text-xs opacity-50">
               No players drafted yet.
            </div>
         )}
      </div>
    </Card>
  );
}
