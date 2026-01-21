import React, { useState } from "react";
import { useDraftStore } from "@/lib/draftStore";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Info } from "lucide-react";

interface PlayerTableProps {
  showExtendedStats?: boolean;
}

export function PlayerTable({ showExtendedStats = false }: PlayerTableProps) {
  const { players, pickedPlayers, makePick, currentPickIndex, settings } = useDraftStore();
  const [filter, setFilter] = useState("");
  const [posFilter, setPosFilter] = useState<string | null>(null);

  const availablePlayers = players.filter(p => !pickedPlayers.includes(p.id));
  
  const filteredPlayers = availablePlayers.filter(p => {
    const matchesName = p.name.toLowerCase().includes(filter.toLowerCase());
    const matchesPos = posFilter === "FLEX" 
      ? (p.position === "RB" || p.position === "WR")
      : posFilter ? p.position === posFilter : true;
    return matchesName && matchesPos;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {!showExtendedStats && (
        <div className="p-4 border-b border-[#30363d] flex space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8b949e]" />
            <Input 
              placeholder="Filter ESPN pool..." 
              className="h-9 pl-9 bg-[#0d1117] border-[#30363d] text-xs focus:ring-primary/20" 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <div className="flex bg-[#0d1117] rounded border border-[#30363d] p-0.5">
             {["QB", "RB", "WR", "TE", "DST", "K", "FLEX"].map(pos => (
                <button
                  key={pos}
                  onClick={() => setPosFilter(posFilter === pos ? null : pos)}
                  className={cn(
                    "px-2.5 py-1 text-[10px] font-bold rounded transition-all",
                    posFilter === pos ? "bg-primary text-black" : "text-[#8b949e] hover:text-white"
                  )}
                >
                  {pos}
                </button>
             ))}
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col">
        <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-[#161b22] text-[10px] font-bold text-[#8b949e] uppercase tracking-wider border-b border-[#30363d]">
          <div className="col-span-1">RK</div>
          <div className="col-span-4">PLAYER</div>
          <div className="col-span-1 text-center">POS</div>
          <div className="col-span-1 text-center">TEAM</div>
          <div className="col-span-1 text-center">BYE</div>
          <div className="col-span-2 text-right">PPG</div>
          <div className="col-span-2 text-right">ADP</div>
        </div>
        <ScrollArea className="flex-1">
          {filteredPlayers.map((player) => (
            <div 
              key={player.id} 
              className="grid grid-cols-12 gap-2 px-4 py-3 items-center border-b border-[#30363d] hover:bg-white/[0.02] transition-colors group"
            >
              <div className="col-span-1 font-mono text-[11px] text-[#6e7681]">#{player.rank}</div>
              <div className="col-span-4">
                <div className="text-sm font-semibold text-[#c9d1d9]">{player.name}</div>
                <div className="text-[10px] text-[#8b949e] flex items-center mt-0.5">
                   <Badge variant="outline" className="h-4 text-[9px] px-1 border-[#30363d] font-mono mr-2">{player.position}</Badge>
                   {player.team}
                </div>
              </div>
              <div className="col-span-1 text-center text-[11px] font-bold">{player.position}</div>
              <div className="col-span-1 text-center text-[11px] text-[#8b949e]">{player.team}</div>
              <div className="col-span-1 text-center text-[11px] font-mono">{player.byeWeek}</div>
              <div className="col-span-2 text-right font-mono text-primary font-bold">{player.ppg}</div>
              <div className="col-span-2 text-right font-mono text-[#8b949e]">{player.adp}</div>
            </div>
          ))}
        </ScrollArea>
      </div>
    </div>
  );
}
