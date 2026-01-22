import React, { useState } from "react";
import { useDraftStore } from "@/lib/draftStore";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Info, AlertTriangle, Thermometer, UserMinus, Clock, Baby, TrendingUp as TrendingUpIcon, TrendingDown, RefreshCcw, PlusSquare, Bandage, Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PlayerTableProps {
  showExtendedStats?: boolean;
}

export function PlayerTable({ showExtendedStats = false }: PlayerTableProps) {
  const { players, pickedPlayers, picks, makePick, settings, filters, updateFilters, rankingsFilters, updateRankingsFilters } = useDraftStore();

  const currentFilters = showExtendedStats ? rankingsFilters : filters;
  const currentUpdateFilters = showExtendedStats ? updateRankingsFilters : updateFilters;

  // Calculate position-specific max PPG for relative scaling
  const posStats = React.useMemo(() => {
    const map: Record<string, { maxPPG: number; ppgSorted: string[]; adpSorted: string[] }> = {};
    
    // Initialize
    const posList = ["QB", "RB", "WR", "TE", "DST", "K", "FLEX"];
    posList.forEach(p => {
      map[p] = { maxPPG: 0, ppgSorted: [], adpSorted: [] };
    });

    players.forEach(p => {
      if (p.ppg > map[p.position].maxPPG) {
        map[p.position].maxPPG = p.ppg;
      }
    });

    // Sort players by PPG and ADP within each position
    posList.forEach(pos => {
      const posPlayers = players.filter(p => p.position === pos);
      map[pos].ppgSorted = [...posPlayers].sort((a, b) => b.ppg - a.ppg).map(p => p.id);
      map[pos].adpSorted = [...posPlayers].sort((a, b) => a.adp - b.adp).map(p => p.id);
    });

    return map;
  }, [players]);

  const getRankColor = (rank: number, invert = false) => {
    // 1-32 range relative scale
    // If invert is true: 1 is best (green), 32 is worst (red)
    // If invert is false (SOS): 1 is best (green), 32 is worst (red) 
    // Wait, user said SOS: high value is greenish, low is redish? 
    // "Team stength of schedule (1-32, color scale where high value is greenish, low is redish)"
    // "Team projected offensive ranking (1-32, color scale where low value is greenish, high is redish)"
    
    const value = invert ? 33 - rank : rank;
    if (value >= 25) return "text-[#2ea043]"; // Best
    if (value >= 17) return "text-[#d29922]"; // Good
    if (value >= 9) return "text-[#f0883e]";  // Average
    return "text-[#f85149]"; // Poor
  };

  const getPPGColor = (ppg: number, position: string) => {
    const max = posStats[position]?.maxPPG || 20;
    const ratio = ppg / max;

    if (ratio > 0.85) return "text-[#2ea043]"; // Top tier for pos
    if (ratio > 0.7) return "text-[#d29922]";  // Good tier
    if (ratio > 0.5) return "text-[#f0883e]";  // Average
    return "text-[#f85149]"; // Below average
  };

  const getDraftValue = (player: any) => {
    const stats = posStats[player.position];
    if (!stats) return 0;
    
    const adpRank = stats.adpSorted.indexOf(player.id) + 1;
    const ppgRank = stats.ppgSorted.indexOf(player.id) + 1;
    
    return adpRank - ppgRank;
  };

  const getValueColor = (value: number) => {
    if (value > 5) return "text-[#2ea043]"; // High value
    if (value > 0) return "text-[#d29922]"; // Slight value
    if (value === 0) return "text-[#8b949e]"; // Neutral
    if (value > -5) return "text-[#f0883e]"; // Slight reach
    return "text-[#f85149]"; // High reach
  };

  const getTagIcons = (player: any) => {
    const icons = [];
    
    // Status (Mutually Exclusive: Injured vs Injury Risk)
    if (player.id === "p-5" || player.id === "p-12") { // Mock injured players
      icons.push({ icon: PlusSquare, label: "Injured", color: "text-red-500" });
    } else if (player.injuryHistory === "Significant") {
      icons.push({ icon: Bandage, label: "Injury Risk", color: "text-orange-400" });
    }

    // Age/Experience (Mutually Exclusive: Rookie vs Old vs New Team)
    if (player.rank % 7 === 0) {
      icons.push({ icon: Baby, label: "Rookie", color: "text-blue-400" });
    } else if (player.rank % 9 === 0) {
      icons.push({ icon: Clock, label: "Old", color: "text-gray-500" });
    } else if (player.rank % 11 === 0) {
      icons.push({ icon: RefreshCcw, label: "New Team", color: "text-purple-400" });
    }

    // Trends (Mutually Exclusive: Up vs Down)
    if (player.rank < 15) {
      icons.push({ icon: TrendingUpIcon, label: "Trending Up", color: "text-green-500" });
    } else if (player.rank > 120) {
      icons.push({ icon: TrendingDown, label: "Trending Down", color: "text-red-400" });
    }

    // Suspension
    if (player.byeWeek === 14) {
      icons.push({ icon: Lock, label: "Suspended", color: "text-yellow-500" });
    }

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
        <div className="grid grid-cols-12 gap-0 px-2 py-2 bg-[#161b22] text-[10px] font-bold text-[#8b949e] uppercase tracking-tighter border-b border-[#30363d]">
          <div className="col-span-1 text-center pr-0.5">RK</div>
          <div className={showExtendedStats ? "col-span-3" : "col-span-6"}>PLAYER</div>
          <div className="col-span-1 text-center">ADP</div>
          {showExtendedStats && <div className="col-span-1 text-center leading-none flex flex-col justify-center text-[7px]"><span>DRAFT</span><span>VAL</span></div>}
          <div className="col-span-1 text-center">PPG</div>
          {showExtendedStats && (
            <>
              <div className="col-span-1 text-center">SOS</div>
              <div className="col-span-1 text-center leading-none flex flex-col justify-center text-[7px]"><span>OFF</span><span>RK</span></div>
              <div className="col-span-1 text-center leading-none flex flex-col justify-center text-[7px]"><span>DEF</span><span>RK</span></div>
              <div className="col-span-2 text-center">TAGS</div>
            </>
          )}
          {!showExtendedStats && (
            <>
              <div className="col-span-3 text-center">ACTION</div>
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
                  "grid grid-cols-12 gap-0 px-2 py-2.5 items-center border-b border-[#30363d] hover:bg-white/[0.02] transition-colors group relative",
                  isPicked && "opacity-40 grayscale-[0.5]"
                )}
              >
                <div className="col-span-1 font-mono text-[11px] text-[#6e7681] text-center pr-0.5">#{player.rank}</div>
                <div className={showExtendedStats ? "col-span-3" : "col-span-6"}>
                  <div className="text-[13px] font-semibold text-[#c9d1d9] flex items-center gap-1 truncate">
                    {player.name}
                    {isPicked && pickInfo && (
                      <span className="text-[8px] font-mono text-primary border border-primary/20 px-0.5 rounded uppercase whitespace-nowrap">
                        {pickInfo.round}.{pickInfo.pickOverall % settings.teamCount || settings.teamCount}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-[#8b949e] flex items-center mt-0.5 gap-1 truncate opacity-80">
                     <span className="font-bold text-[#c9d1d9]">{player.position}</span>
                     <span className="text-[#484f58]">•</span>
                     <span className="uppercase">{player.team}</span>
                     <span className="text-[#484f58]">•</span>
                     <span className="text-[#6e7681] uppercase">Bye {player.byeWeek}</span>
                  </div>
                </div>
                <div className="col-span-1 text-center font-mono text-[#8b949e] text-[11px]">
                  {player.adp}
                  <div className="text-[8px] text-primary opacity-60">
                    (RD{Math.ceil(player.adp / settings.teamCount)})
                  </div>
                </div>
                {showExtendedStats && (
                  <div className={cn("col-span-1 text-center font-mono font-bold text-[11px]", getValueColor(getDraftValue(player)))}>
                    {getDraftValue(player) > 0 ? `+${getDraftValue(player)}` : getDraftValue(player)}
                  </div>
                )}
                <div className={cn("col-span-1 text-center font-mono font-bold text-[12px]", showExtendedStats ? getPPGColor(player.ppg, player.position) : "text-primary")}>
                  {player.ppg}
                </div>
                
                {showExtendedStats && (
                  <>
                    <div className={cn("col-span-1 text-center font-mono font-bold text-[11px]", getRankColor(player.sos, false))}>
                      {player.sos}
                    </div>
                    <div className={cn("col-span-1 text-center font-mono font-bold text-[11px]", getRankColor(player.offensiveRank, true))}>
                      {player.offensiveRank}
                    </div>
                    <div className={cn("col-span-1 text-center font-mono font-bold text-[11px]", getRankColor(player.defensiveRank, true))}>
                      {player.defensiveRank}
                    </div>
                  </>
                )}

                {showExtendedStats ? (
                  <div className="col-span-2 flex justify-center items-center">
                    <TooltipProvider>
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <div className="flex justify-center gap-0.5 cursor-help hover:bg-white/5 rounded transition-colors w-full h-full min-h-[20px] items-center">
                            {tags.slice(0, 3).map((tag, i) => (
                              <tag.icon key={i} className={cn("h-3.5 w-3.5", tag.color)} />
                            ))}
                            {tags.length > 3 && <span className="text-[9px] text-[#484f58] font-bold">+{tags.length - 3}</span>}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="bg-[#161b22] border-[#30363d] p-3 shadow-2xl min-w-[200px] z-50">
                          <div className="space-y-2.5">
                            {tags.map((tag, i) => (
                              <div key={i} className="flex items-start gap-3">
                                <tag.icon className={cn("h-4 w-4 shrink-0 mt-0.5", tag.color)} />
                                <span className="text-[11px] text-[#c9d1d9] leading-relaxed">{tag.label}</span>
                              </div>
                            ))}
                            {tags.length === 0 && (
                              <p className="text-[11px] text-[#8b949e] italic text-center py-1">No Tags</p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                ) : (
                  <div className="col-span-3 flex justify-center items-center px-2">
                    {!isPicked ? (
                      <Button 
                        size="sm" 
                        className="h-7 w-full max-w-[80px] bg-primary/10 text-primary hover:bg-primary hover:text-black font-bold text-[10px] uppercase border border-primary/30 shadow-[0_0_10px_rgba(46,160,67,0.05)]"
                        onClick={() => makePick(player.id)}
                      >
                        Draft
                      </Button>
                    ) : (
                      <div className="text-[10px] font-mono text-[#484f58] uppercase italic flex items-center justify-center gap-1.5 w-full">
                        <div className="h-1 w-1 rounded-full bg-[#484f58]" />
                        Taken
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </ScrollArea>
      </div>
    </div>
  );
}
