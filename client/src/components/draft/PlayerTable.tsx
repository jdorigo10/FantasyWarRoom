import React, { useState } from "react";
import { useDraftStore } from "@/lib/draftStore";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Info } from "lucide-react";

interface PlayerTableProps {
  showExtendedStats?: boolean;
}

export function PlayerTable({ showExtendedStats = false }: PlayerTableProps) {
  const { players, pickedPlayers, picks, makePick, currentPickIndex, settings } = useDraftStore();
  const [filter, setFilter] = useState("");
  const [posFilter, setPosFilter] = useState<string>("All");
  const [teamFilter, setTeamFilter] = useState<string>("All");
  const [showDrafted, setShowDrafted] = useState(false);

  const TEAMS_ALL = ["All", "ARI", "ATL", "BAL", "BUF", "CAR", "CHI", "CIN", "CLE", "DAL", "DEN", "DET", "GB", "HOU", "IND", "JAX", "KC", "LV", "LAC", "LAR", "MIA", "MIN", "NE", "NO", "NYG", "NYJ", "PHI", "PIT", "SEA", "SF", "TB", "TEN", "WAS"];
  const POSITIONS = ["All", "QB", "RB", "WR", "TE", "FLEX", "DST", "K"];
  
  const filteredPlayers = players.filter(p => {
    const isPicked = pickedPlayers.includes(p.id);
    if (!showDrafted && isPicked) return false;

    const matchesName = p.name.toLowerCase().includes(filter.toLowerCase());
    const matchesTeam = teamFilter === "All" || p.team === teamFilter;
    
    let matchesPos = true;
    if (posFilter !== "All") {
      if (posFilter === "FLEX") {
        matchesPos = ["RB", "WR", "TE"].includes(p.position);
      } else {
        matchesPos = p.position === posFilter;
      }
    }

    return matchesName && matchesTeam && matchesPos;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden relative">

      {!showExtendedStats && (
        <div className="p-3 border-b border-[#30363d] flex items-center gap-4 bg-[#161b22]/50">
          <div className="relative flex-1 max-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8b949e]" />
            <Input 
              placeholder="Search for Player" 
              className="h-9 pl-9 bg-[#0d1117] border-[#30363d] text-[11px] focus:ring-primary/20" 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          
          <select 
            className="h-9 bg-[#0d1117] border border-[#30363d] text-[11px] text-white rounded-lg px-3 focus:ring-primary/20 cursor-pointer min-w-[140px] transition-all hover:bg-[#1c2128]"
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
          >
            {TEAMS_ALL.map(team => <option key={team} value={team}>{team === "All" ? "All Teams" : team}</option>)}
          </select>

          <div className="flex bg-[#0d1117] rounded-lg border border-[#30363d] p-1">
             {POSITIONS.map(pos => (
                <button
                  key={pos}
                  onClick={() => setPosFilter(pos)}
                  className={cn(
                    "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
                    posFilter === pos ? "bg-primary text-black" : "text-[#8b949e] hover:text-white"
                  )}
                >
                  {pos}
                </button>
             ))}
          </div>

          <div className="flex items-center space-x-2 px-2 border-l border-[#30363d] ml-auto">
            <Checkbox 
              id="show-drafted" 
              checked={showDrafted} 
              onCheckedChange={(checked) => setShowDrafted(!!checked)}
              className="border-primary data-[state=checked]:bg-primary h-4 w-4"
            />
            <label htmlFor="show-drafted" className="text-[10px] font-mono text-[#8b949e] uppercase cursor-pointer select-none whitespace-nowrap">Show Drafted</label>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col">
        <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-[#161b22] text-[10px] font-bold text-[#8b949e] uppercase tracking-wider border-b border-[#30363d]">
          <div className="col-span-1">RK</div>
          <div className="col-span-1 flex items-center justify-center">
             <div className="h-4 w-[1px] bg-[#30363d]" />
          </div>
          <div className="col-span-5">PLAYER</div>
          <div className="col-span-1 text-center">BYE</div>
          <div className="col-span-1 text-right pr-2">ADP</div>
          <div className="col-span-1 text-right pr-4">PPG</div>
          <div className="col-span-1 flex items-center justify-center">
             <div className="h-4 w-[1px] bg-[#30363d]" />
          </div>
          <div className="col-span-1 text-center">ACTION</div>
        </div>
        <ScrollArea className="flex-1">
          {filteredPlayers.map((player) => {
            const isPicked = pickedPlayers.includes(player.id);
            const pickInfo = picks.find(p => p.playerId === player.id);
            
            return (
              <div 
                key={player.id} 
                className={cn(
                  "grid grid-cols-12 gap-2 px-4 py-3 items-center border-b border-[#30363d] hover:bg-white/[0.02] transition-colors group relative",
                  isPicked && "opacity-40 grayscale-[0.5]"
                )}
              >
                <div className="col-span-1 font-mono text-[11px] text-[#6e7681]">#{player.rank}</div>
                <div className="col-span-1 flex items-center justify-center">
                   <div className="h-8 w-[1px] bg-[#30363d]/50" />
                </div>
                <div className="col-span-5">
                  <div className="text-sm font-semibold text-[#c9d1d9] flex items-center gap-2">
                    {player.name}
                    {isPicked && pickInfo && (
                      <span className="text-[8px] font-mono text-primary border border-primary/30 px-1 rounded uppercase tracking-tighter">
                        RD {pickInfo.round}.{pickInfo.pickOverall % settings.teamCount || settings.teamCount}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-[#8b949e] flex items-center mt-0.5">
                     <Badge variant="outline" className="h-4 text-[9px] px-1 border-[#30363d] font-mono mr-2">{player.position}</Badge>
                     {player.team}
                  </div>
                </div>
                <div className="col-span-1 text-center text-[11px] font-mono">{player.byeWeek}</div>
                <div className="col-span-1 text-right font-mono text-[#8b949e] text-[11px] pr-2">{player.adp}</div>
                <div className="col-span-1 text-right font-mono text-primary font-bold text-[12px] pr-4">{player.ppg}</div>
                <div className="col-span-1 flex items-center justify-center">
                   <div className="h-8 w-[1px] bg-[#30363d]/50" />
                </div>
                <div className="col-span-1 flex justify-center">
                  {!isPicked ? (
                    <Button 
                      size="sm" 
                      className="h-7 bg-primary/10 text-primary hover:bg-primary hover:text-black font-bold text-[10px] uppercase px-3 border border-primary/30"
                      onClick={() => makePick(player.id)}
                    >
                      Draft
                    </Button>
                  ) : (
                    <div className="text-[10px] font-mono text-[#484f58] uppercase italic">Taken</div>
                  )}
                </div>
              </div>
            );
          })}
        </ScrollArea>
      </div>
    </div>
  );
}
