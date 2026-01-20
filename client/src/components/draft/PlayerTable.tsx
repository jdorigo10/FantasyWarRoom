import React, { useState } from "react";
import { useDraftStore } from "@/lib/draftStore";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Plus } from "lucide-react";

export function PlayerTable() {
  const { players, pickedPlayers, makePick, currentPickIndex, settings } = useDraftStore();
  const [filter, setFilter] = useState("");
  const [posFilter, setPosFilter] = useState<string | null>(null);

  const availablePlayers = players.filter(p => !pickedPlayers.includes(p.id));
  
  const filteredPlayers = availablePlayers.filter(p => {
    const matchesName = p.name.toLowerCase().includes(filter.toLowerCase());
    const matchesPos = posFilter ? p.position === posFilter : true;
    return matchesName && matchesPos;
  });

  const isUserTurn = () => {
     // Simplified check logic from store needs to be exposed or recalculated
     // Re-implementing simplified version for UI state
     const round = Math.floor(currentPickIndex / settings.teamCount);
     const positionInRound = currentPickIndex % settings.teamCount;
     if (round % 2 === 0) {
        return positionInRound === (settings.position - 1);
     } else {
        return positionInRound === (settings.teamCount - settings.position);
     }
  };

  const userCanPick = isUserTurn();

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search players..." 
            className="pl-8 bg-black/20 border-white/10 focus:ring-primary/50" 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="flex space-x-1">
          {["QB", "RB", "WR", "TE", "K", "DST"].map((pos) => (
             <Button 
                key={pos} 
                variant={posFilter === pos ? "default" : "outline"} 
                size="sm"
                onClick={() => setPosFilter(posFilter === pos ? null : pos)}
                className={cn(
                    "text-xs px-2 h-9",
                    posFilter === pos ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-transparent border-white/10 hover:bg-white/5"
                )}
             >
                {pos}
             </Button>
          ))}
        </div>
      </div>

      <div className="border border-white/10 rounded-md bg-black/20 flex-1 overflow-hidden flex flex-col">
         <div className="grid grid-cols-12 gap-2 p-3 bg-white/5 text-xs font-mono text-muted-foreground border-b border-white/10 font-medium">
             <div className="col-span-1">RK</div>
             <div className="col-span-4">PLAYER</div>
             <div className="col-span-1 text-center">POS</div>
             <div className="col-span-1 text-center">BYE</div>
             <div className="col-span-2 text-right">PROJ</div>
             <div className="col-span-2 text-right">ADP</div>
             <div className="col-span-1"></div>
         </div>
         <ScrollArea className="flex-1">
            <div className="flex flex-col">
               {filteredPlayers.slice(0, 100).map((player, idx) => (
                  <div 
                    key={player.id} 
                    className="grid grid-cols-12 gap-2 p-3 text-sm border-b border-white/5 items-center hover:bg-white/5 transition-colors group"
                  >
                     <div className="col-span-1 font-mono text-muted-foreground">{idx + 1}</div>
                     <div className="col-span-4">
                        <div className="font-medium text-foreground">{player.name}</div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                           {player.team} 
                           {player.risk === 'High' && <span className="text-destructive font-bold">⚠ RISK</span>}
                        </div>
                     </div>
                     <div className="col-span-1 text-center">
                        <Badge variant="outline" className="border-white/10 text-[10px] px-1 h-5">{player.position}</Badge>
                     </div>
                     <div className="col-span-1 text-center text-muted-foreground text-xs">{player.byeWeek}</div>
                     <div className="col-span-2 text-right font-mono text-primary font-bold">{player.projectedPoints}</div>
                     <div className="col-span-2 text-right font-mono text-muted-foreground">{player.adp}</div>
                     <div className="col-span-1 flex justify-end">
                        <Button 
                           size="icon" 
                           variant="ghost" 
                           className="h-6 w-6 hover:bg-primary hover:text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                           onClick={() => makePick(player.id)}
                           disabled={!userCanPick}
                        >
                           <Plus className="h-4 w-4" />
                        </Button>
                     </div>
                  </div>
               ))}
               {filteredPlayers.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">No players found</div>
               )}
            </div>
         </ScrollArea>
      </div>
    </div>
  );
}
