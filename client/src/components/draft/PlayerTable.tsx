import React, { useState } from "react";
import { useDraftStore } from "@/lib/draftStore";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Info, AlertTriangle, Thermometer, UserMinus, Clock, Baby, TrendingUp as TrendingUpIcon, TrendingDown, RefreshCcw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PlayerTableProps {
  showExtendedStats?: boolean;
}

export function PlayerTable({ showExtendedStats = false }: PlayerTableProps) {
  const { players, pickedPlayers, picks, makePick, settings, filters, updateFilters, rankingsFilters, updateRankingsFilters } = useDraftStore();

  const currentFilters = showExtendedStats ? rankingsFilters : filters;
  const currentUpdateFilters = showExtendedStats ? updateRankingsFilters : updateFilters;

  const getRankColor = (rank: number, invert = false) => {
    // 1-32 range
    const val = invert ? rank : 33 - rank;
    if (val > 24) return "text-[#2ea043]"; // Greenish
    if (val > 16) return "text-[#d29922]"; // Yellowish
    if (val > 8) return "text-[#f0883e]"; // Orangish
    return "text-[#f85149]"; // Redish
  };

  const getPPGColor = (ppg: number, position: string) => {
    // Basic position-based relative PPG scaling
    let threshold = 15;
    if (position === "QB") threshold = 20;
    if (position === "TE") threshold = 12;
    if (position === "K" || position === "DST") threshold = 8;

    if (ppg > threshold + 3) return "text-[#2ea043]"; // Elite for pos
    if (ppg > threshold) return "text-[#d29922]"; // Good for pos
    if (ppg > threshold - 3) return "text-[#f0883e]"; // Average
    return "text-[#f85149]"; // Poor for pos
  };

  const getTagIcons = (player: any) => {
    const icons = [];
    if (player.risk === "High") icons.push({ icon: AlertTriangle, label: "High Risk", color: "text-red-500" });
    if (player.injuryHistory === "Significant") icons.push({ icon: Thermometer, label: "Injury Risk", color: "text-orange-500" });
    if (player.rank < 10) icons.push({ icon: TrendingUpIcon, label: "Trending Up", color: "text-green-500" });
    if (player.rank > 100) icons.push({ icon: TrendingDown, label: "Trending Down", color: "text-red-400" });
    if (player.byeWeek === 14) icons.push({ icon: UserMinus, label: "Suspension Risk", color: "text-yellow-600" });
    if (player.rank % 7 === 0) icons.push({ icon: Baby, label: "Rookie", color: "text-blue-400" });
    if (player.rank % 9 === 0) icons.push({ icon: Clock, label: "Veteran/Old", color: "text-gray-500" });
    if (player.rank % 11 === 0) icons.push({ icon: RefreshCcw, label: "New Team", color: "text-purple-400" });
    return icons;
  };

  const TEAM_NAMES: Record<string, string> = {
    "All": "All Teams",
    "ARI": "Arizona",
    "ATL": "Atlanta",
    "BAL": "Baltimore",
    "BUF": "Buffalo",
    "CAR": "Carolina",
    "CHI": "Chicago",
    "CIN": "Cincinnati",
    "CLE": "Cleveland",
    "DAL": "Dallas",
    "DEN": "Denver",
    "DET": "Detroit",
    "GB": "Green Bay",
    "HOU": "Houston",
    "IND": "Indianapolis",
    "JAX": "Jacksonville",
    "KC": "Kansas City",
    "LV": "Las Vegas",
    "LAC": "Los Angeles",
    "LAR": "Los Angeles",
    "MIA": "Miami",
    "MIN": "Minnesota",
    "NE": "New England",
    "NO": "New Orleans",
    "NYG": "New York",
    "NYJ": "New York",
    "PHI": "Philadelphia",
    "PIT": "Pittsburgh",
    "SEA": "Seattle",
    "SF": "San Francisco",
    "TB": "Tampa Bay",
    "TEN": "Tennessee",
    "WAS": "Washington"
  };

  const TEAMS_ALL = ["All", "ARI", "ATL", "BAL", "BUF", "CAR", "CHI", "CIN", "CLE", "DAL", "DEN", "DET", "GB", "HOU", "IND", "JAX", "KC", "LV", "LAC", "LAR", "MIA", "MIN", "NE", "NO", "NYG", "NYJ", "PHI", "PIT", "SEA", "SF", "TB", "TEN", "WAS"];
  const POSITIONS = ["All", "QB", "RB", "WR", "TE", "FLEX", "DST", "K"];
  
  const filteredPlayers = players.filter(p => {
    const isPicked = pickedPlayers.includes(p.id);
    if (!currentFilters.showDrafted && isPicked) return false;

    const matchesName = p.name.toLowerCase().includes(currentFilters.search.toLowerCase());
    const matchesTeam = currentFilters.team === "All" || p.team === currentFilters.team;
    
    let matchesPos = true;
    if (currentFilters.pos !== "All") {
      if (currentFilters.pos === "FLEX") {
        matchesPos = ["RB", "WR", "TE"].includes(p.position);
      } else {
        matchesPos = p.position === currentFilters.pos;
      }
    }

    return matchesName && matchesTeam && matchesPos;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden relative">

      <div className="p-3 border-b border-[#30363d] flex items-center gap-4 bg-[#161b22]/50">
        <div className="relative flex-1 max-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8b949e]" />
          <Input 
            placeholder="Search for Player" 
            className="h-9 pl-9 bg-[#0d1117] border-[#30363d] text-[11px] focus:ring-primary/20" 
            value={currentFilters.search}
            onChange={(e) => currentUpdateFilters({ search: e.target.value })}
          />
        </div>
        
        <select 
          className="h-9 bg-[#0d1117] border border-[#30363d] text-[11px] text-white rounded-lg px-3 focus:ring-primary/20 cursor-pointer min-w-[140px] transition-all hover:bg-[#1c2128]"
          value={currentFilters.team}
          onChange={(e) => currentUpdateFilters({ team: e.target.value })}
        >
          {TEAMS_ALL.map(team => (
            <option key={team} value={team}>
              {TEAM_NAMES[team] || team}
            </option>
          ))}
        </select>

        <div className="flex bg-[#0d1117] rounded-lg border border-[#30363d] p-1">
           {POSITIONS.map(pos => (
              <button
                key={pos}
                onClick={() => currentUpdateFilters({ pos })}
                className={cn(
                  "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
                  currentFilters.pos === pos ? "bg-primary text-black" : "text-[#8b949e] hover:text-white"
                )}
              >
                {pos}
              </button>
           ))}
        </div>

        <div className="flex items-center space-x-2 px-4 border-l border-[#30363d]">
          <Checkbox 
            id="show-drafted" 
            checked={currentFilters.showDrafted} 
            onCheckedChange={(checked) => currentUpdateFilters({ showDrafted: !!checked })}
            className="border-primary data-[state=checked]:bg-primary h-4 w-4"
          />
          <label htmlFor="show-drafted" className="text-[10px] font-mono text-[#8b949e] uppercase cursor-pointer select-none whitespace-nowrap">Show Drafted</label>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        <div className="grid grid-cols-12 gap-1 px-4 py-2.5 bg-[#161b22] text-[10px] font-bold text-[#8b949e] uppercase tracking-wider border-b border-[#30363d]">
          <div className="col-span-1">RK</div>
          <div className={showExtendedStats ? "col-span-2" : "col-span-6"}>PLAYER</div>
          <div className="col-span-1 text-center">ADP</div>
          <div className="col-span-1 text-center">PPG</div>
          {showExtendedStats && (
            <>
              <div className="col-span-1 flex items-center justify-center">
                <div className="h-4 w-[1px] bg-[#30363d]" />
              </div>
              <div className="col-span-1 text-center">SOS</div>
              <div className="col-span-1 text-center text-[8px] leading-tight">OFF RANK</div>
              <div className="col-span-1 text-center text-[8px] leading-tight">DEF RANK</div>
              <div className="col-span-1 flex items-center justify-center">
                 <div className="h-4 w-[1px] bg-[#30363d]" />
              </div>
              <div className="col-span-2 text-center">TAGS</div>
            </>
          )}
          {!showExtendedStats && (
            <>
              <div className="col-span-1 flex items-center justify-center">
                 <div className="h-4 w-[1px] bg-[#30363d]" />
              </div>
              <div className="col-span-2 text-center">ACTION</div>
            </>
          )}
        </div>
        <ScrollArea className="flex-1">
          {filteredPlayers.map((player) => {
            const isPicked = pickedPlayers.includes(player.id);
            const pickInfo = picks.find(p => p.playerId === player.id);
            const tags = getTagIcons(player);
            
            return (
              <div 
                key={player.id} 
                className={cn(
                  "grid grid-cols-12 gap-1 px-4 py-3 items-center border-b border-[#30363d] hover:bg-white/[0.02] transition-colors group relative",
                  isPicked && "opacity-40 grayscale-[0.5]"
                )}
              >
                <div className="col-span-1 font-mono text-[11px] text-[#6e7681]">#{player.rank}</div>
                <div className={showExtendedStats ? "col-span-2" : "col-span-6"}>
                  <div className="text-sm font-semibold text-[#c9d1d9] flex items-center gap-1.5 truncate">
                    {player.name}
                    {isPicked && pickInfo && (
                      <span className="text-[8px] font-mono text-primary border border-primary/30 px-1 rounded uppercase tracking-tighter whitespace-nowrap">
                        RD {pickInfo.round}.{pickInfo.pickOverall % settings.teamCount || settings.teamCount}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-[#8b949e] flex items-center mt-1 gap-2 truncate">
                     <Badge variant="outline" className="h-4 text-[9px] px-1 border-[#30363d] font-mono whitespace-nowrap">{player.position} • {player.team}</Badge>
                     <span className="text-[#6e7681] font-mono uppercase text-[9px]">BYE {player.byeWeek}</span>
                  </div>
                </div>
                <div className="col-span-1 text-center font-mono text-[#8b949e] text-[11px]">
                  {player.adp}
                </div>
                <div className={cn("col-span-1 text-center font-mono font-bold text-[12px]", showExtendedStats ? getPPGColor(player.ppg, player.position) : "text-primary")}>
                  {player.ppg}
                </div>
                
                {showExtendedStats && (
                  <>
                    <div className="col-span-1 flex items-center justify-center">
                      <div className="h-8 w-[1px] bg-[#30363d]/50" />
                    </div>
                    <div className={cn("col-span-1 text-center font-mono font-bold text-[11px]", getRankColor(player.sos))}>
                      {player.sos}
                    </div>
                    <div className={cn("col-span-1 text-center font-mono font-bold text-[11px]", getRankColor(player.offensiveRank, true))}>
                      {player.offensiveRank}
                    </div>
                    <div className={cn("col-span-1 text-center font-mono font-bold text-[11px]", getRankColor(player.defensiveRank, true))}>
                      {player.defensiveRank}
                    </div>
                    <div className="col-span-1 flex items-center justify-center">
                       <div className="h-8 w-[1px] bg-[#30363d]/50" />
                    </div>
                    <div className="col-span-2 flex justify-center gap-1 px-1">
                      <TooltipProvider>
                        {tags.map((tag, i) => (
                          <Tooltip key={i}>
                            <TooltipTrigger>
                              <tag.icon className={cn("h-3.5 w-3.5", tag.color)} />
                            </TooltipTrigger>
                            <TooltipContent className="bg-[#161b22] border-[#30363d] text-[10px] text-white p-2">
                              {tag.label}
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </TooltipProvider>
                    </div>
                  </>
                )}

                {!showExtendedStats && (
                  <>
                    <div className="col-span-1 flex items-center justify-center">
                       <div className="h-8 w-[1px] bg-[#30363d]/50" />
                    </div>
                    <div className="col-span-2 flex justify-center px-2">
                      {!isPicked ? (
                        <Button 
                          size="sm" 
                          className="h-7 w-full bg-primary/10 text-primary hover:bg-primary hover:text-black font-bold text-[10px] uppercase border border-primary/30 shadow-[0_0_10px_rgba(46,160,67,0.05)]"
                          onClick={() => makePick(player.id)}
                        >
                          Draft
                        </Button>
                      ) : (
                        <div className="text-[10px] font-mono text-[#484f58] uppercase italic flex items-center gap-1.5">
                          <div className="h-1 w-1 rounded-full bg-[#484f58]" />
                          Taken
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </ScrollArea>
      </div>
    </div>
  );
}
