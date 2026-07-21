import React, { useState } from "react";
import { useDraftStore } from "@/lib/draftStore";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Clock, Baby, TrendingUp, RefreshCcw, PlusSquare, Bandage, Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Heart, Crosshair, ChevronDown } from "lucide-react";
import { Gem, Rocket, Star, CircleCheck, Eye, Minus, TrendingDown, TriangleAlert, ThumbsDown, Bomb, Dices } from "lucide-react";
import { Position, POSITION_LIST, NFLTeamAbbv, NFL_ABBV_LIST, NFL_TEAM_MAP } from "@/lib/baseData";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface PlayerTableProps {
  showExtendedStats?: boolean;
}

export function PlayerTable({ showExtendedStats = false }: PlayerTableProps) {
  const { players, pickedPlayers, picks, makePick, settings, filters, updateFilters, rankingsFilters, updateRankingsFilters, playerTags, togglePlayerTag, currentPickIndex } = useDraftStore();
  
  // Check if draft is completed
  const isDraftComplete = (currentPickIndex+1) > (16 * settings.teams.length);

  const userFuturePicks = React.useMemo(() => {
    const p = [];
    for (let r = 1; r <= settings.rounds; r++) {
      let pickOverall;
      if (r % 2 !== 0) {
         pickOverall = (r - 1) * settings.teamCount + settings.position;
      } else {
         pickOverall = (r - 1) * settings.teamCount + (settings.teamCount - settings.position + 1);
      }
      if (pickOverall > currentPickIndex) {
         p.push({ round: r, pickOverall });
      }
    }
    return p;
  }, [settings, currentPickIndex]);

  const playerOverallIndex = new Map(
      [...players]
          .sort((a, b) => Number(a.rank) - Number(b.rank))
          .map((player, index) => [
              player.id,
              index + 1
          ])
  );

  function getDraftedPlayersAfterPick(pickOverall: number) {
    return picks.filter(
        pick => (playerOverallIndex.get(pick.playerId) ?? 0) > pickOverall
    ).length;
  }

  const pickDividers = React.useMemo(() => {
    const map = new Map<Number, any>();
    userFuturePicks.forEach(p => {
      map.set(p.pickOverall, p);
    });
    return map;
  }, [userFuturePicks, currentPickIndex]);

  // Helper for pick info
  const getPickDetails = (index: number) => {
    if (index < 0) return null;
    const round = Math.floor(index / settings.teamCount) + 1;
    const pickInRound = (index % settings.teamCount) + 1;
    const isEvenRound = (round - 1) % 2 === 0;
    
    let teamIndex;
    if (isEvenRound) {
        teamIndex = pickInRound - 1;
    } else {
        teamIndex = settings.teamCount - pickInRound;
    }
    
    // Safety check
    if (teamIndex < 0 || teamIndex >= settings.teams.length) return null;
    
    return {
        round,
        pick: pickInRound,
        overall: index + 1,
        team: settings.teams[teamIndex]
    };
  };
  // Calculate picks until user
  let nextUserPickIndex = -1;
  // search forward for next user pick
  for (let i = currentPickIndex; i < settings.rounds * settings.teamCount; i++) {
      const details = getPickDetails(i);
      if (details?.team?.isUser) {
          nextUserPickIndex = i
          break;
      }
  }

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'rank', direction: 'asc' });
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);

  const currentFilters = showExtendedStats ? rankingsFilters : filters;
  const currentUpdateFilters = showExtendedStats ? updateRankingsFilters : updateFilters;

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

  // Calculate position-specific max PPG for relative scaling
  const posStats = React.useMemo(() => {
    const map: Record<string, { maxPPG: number; ppgSorted: string[]; adpSorted: string[] }> = {};
    
    // Initialize
    const posList = POSITION_LIST;
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

  const getSosColor = (sos: number) => {
    // 0-1 range relative scale
    // 1 is hardest, 0 is easiest
    
    if (sos <= 0.47) return "text-[#2ea043]"; // Best
    if (sos <= 0.49) return "text-[#84A02E]"; // Good
    if (sos <= 0.51) return "text-[#d29922]"; // Average
    if (sos <= 0.53) return "text-[#f0883e]";  // Below Average
    return "text-[#f85149]"; // Poor
  };

  const getOffPpgColor = (ppg: number) => {
    if (ppg >= 27) return "text-[#2ea043]"; // Best
    if (ppg >= 23) return "text-[#84A02E]"; // Good
    if (ppg >= 21) return "text-[#d29922]"; // Average
    if (ppg >= 19) return "text-[#f0883e]";  // Below Average
    return "text-[#f85149]"; // Poor
  };

  const getDefPpgColor = (ppg: number) => {
    if (ppg <= 19) return "text-[#2ea043]"; // Best
    if (ppg <= 21) return "text-[#84A02E]"; // Good
    if (ppg <= 23) return "text-[#d29922]"; // Average
    if (ppg <= 25) return "text-[#f0883e]";  // Below Average
    return "text-[#f85149]"; // Poor
  };

  const getPPGColor = (ppg: number, position: string) => {
    let topTier = false;
    let goodTier = false;
    let avgTier = false;
    let badTier = false;

    if (position === "QB") {
      if (ppg > 12) badTier = true; 
      if (ppg > 14) avgTier = true;
      if (ppg > 16) goodTier = true;
      if (ppg > 18) topTier = true;
    }
    else if (position === "RB") {
      if (ppg > 10) badTier = true; 
      if (ppg > 13) avgTier = true;
      if (ppg > 16) goodTier = true;
      if (ppg > 18) topTier = true;
    }
    else if (position === "WR") {
      if (ppg > 10) badTier = true; 
      if (ppg > 12) avgTier = true;
      if (ppg > 14) goodTier = true;
      if (ppg > 18) topTier = true;
    }
    else if (position === "TE") {
      if (ppg > 8) badTier = true; 
      if (ppg > 9) avgTier = true;
      if (ppg > 10) goodTier = true;
      if (ppg > 13) topTier = true;
    }
    else if (position === "DST") {
      if (ppg > 5) badTier = true; 
      if (ppg > 5.75) avgTier = true;
      if (ppg > 6.25) goodTier = true;
      if (ppg > 7) topTier = true;
    }
    else if (position === "K") {
      if (ppg > 7.5) badTier = true; 
      if (ppg > 8) avgTier = true;
      if (ppg > 8.5) goodTier = true;
      if (ppg > 10) topTier = true;
    }


    if (topTier) return "text-[#2ea043]"; // Top tier for pos
    if (goodTier) return "text-[#84A02E]";  // Good tier
    if (avgTier) return "text-[#d29922]";  // Average
    if (badTier) return "text-[#f0883e]";  // Below average
    return "text-[#f85149]"; // Very bad
  };

  const getDraftValue = (player: any) => {
    const stats = posStats[player.position];
    if (!stats) return 0;
    if (player.adp >= 169) return 0;
    
    const adpRank = stats.adpSorted.indexOf(player.id) + 1;
    const ppgRank = stats.ppgSorted.indexOf(player.id) + 1;
    
    return adpRank - ppgRank;
  };

  const getValueColor = (value: number) => {
    if (value > 5) return "text-[#2ea043]"; // High value
    if (value > 0) return "text-[#84A02E]"; // Slight value
    if (value === 0) return "text-[#8b949e]"; // Neutral
    if (value > -5) return "text-[#f0883e]"; // Slight reach
    return "text-[#f85149]"; // High reach
  };

  const getTagIcons = (player: any) => {
    const icons = [];

    if (player.position === "DST") {
      return [];
    }
    
    // 1. Injured
    const isInjured = player.injury === "IR";
    if (isInjured) {
      icons.push({ icon: PlusSquare, label: "Injured", color: "text-red-500" });
    }

    // 2. Suspended
    if (player.status === "SUSPENDED") {
      icons.push({ icon: Lock, label: "Suspended", color: "text-yellow-500" });
    }

    // 3. Injury Risk (Cannot have both Injured and Injury Risk)
    if (!isInjured && player.injury === "HURT") {
      icons.push({ icon: Bandage, label: "Injury Risk", color: "text-orange-400" });
    }

    // 4. Rookie
    const isRookie = player.rookie;
    if (isRookie) {
      icons.push({ icon: Baby, label: "Rookie", color: "text-blue-400" });
    }

    // 5. Old
    if (player.age > 30) {
      icons.push({ icon: Clock, label: "Old", color: "text-gray-500" });
    }

    // 6. New Team (Cannot have both Rookie and New Team)
    if (!isRookie && player.newTeam) {
      icons.push({ icon: RefreshCcw, label: "New Team", color: "text-purple-400" });
    }

    // 7. Trending Up
    const isTrendingUp = player.trend === "UP";
    if (isTrendingUp) {
      icons.push({ icon: TrendingUp, label: "Trending Up", color: "text-green-500" });
    }

    // 8. Trending Down (Cannot have both Trending Up and Trending Down)
    if (!isTrendingUp && player.trend === "DOWN") {
      icons.push({ icon: TrendingDown, label: "Trending Down", color: "text-red-400" });
    }

    return icons;
  };

  const TEAM_NAMES = NFL_TEAM_MAP;
  const TEAMS_ALL = ["All"].concat(NFL_ABBV_LIST);
  const POSITIONS = ["All"].concat(POSITION_LIST);
  
  const sortedPlayers = React.useMemo(() => {
    let sortablePlayers = [...players];
    
    // Apply sorting first
    if (sortConfig !== null) {
      sortablePlayers.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortConfig.key) {
          case 'rank':
            aValue = a.rank;
            bValue = b.rank;
            break;
          case 'adp':
            aValue = a.adp;
            bValue = b.adp;
            break;
          case 'ppg':
            aValue = a.ppg;
            bValue = b.ppg;
            break;
          case 'sos':
            aValue = a.teamInfo.sos;
            bValue = b.teamInfo.sos;
            break;
          case 'off':
            aValue = a.teamInfo.ppgOffense;
            bValue = b.teamInfo.ppgOffense;
            break;
          case 'def':
            aValue = a.teamInfo.ppgDefense;
            bValue = b.teamInfo.ppgDefense;
            break;
          case 'val':
            aValue = getDraftValue(a);
            bValue = getDraftValue(b);
            break;
          default:
            return 0;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return sortablePlayers.filter(p => {
      const isPicked = pickedPlayers.includes(p.id);
      if (!currentFilters.showDrafted && isPicked) return false;

      const matchesName = p.name.toLowerCase().includes(currentFilters.search.toLowerCase());
      const matchesTeam = currentFilters.team === "All" || p.teamInfo.teamAbbv === currentFilters.team;
      
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
  }, [players, pickedPlayers, currentFilters, sortConfig, posStats]);

  return (
    <div className="flex flex-col h-full overflow-hidden relative">

      <div className="p-3 border-b border-[#30363d] flex items-center gap-4 bg-[#161b22]/50">
        <div className="relative flex-1 max-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8b949e]" />
          <Input 
            placeholder="Search..." 
            className="h-9 pl-9 bg-[#0d1117] border-[#30363d] text-[12px] focus:ring-primary/20" 
            value={currentFilters.search}
            onChange={(e) => currentUpdateFilters({ search: e.target.value })}
          />
        </div>

        <Select
            value={currentFilters.team}
            onValueChange={(value) =>
                currentUpdateFilters({ 
                  team: value as NFLTeamAbbv 
                })
            }
        >
            <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Team" />
            </SelectTrigger>
            <SelectContent className="max-h-150 overflow-y-auto">
                {TEAMS_ALL.map(team => (
                    <SelectItem
                        key={team}
                        value={team}
                        className="
                            cursor-pointer
                            focus:bg-primary
                            focus:text-primary-foreground
                            data-[highlighted]:bg-primary
                            data-[highlighted]:text-primary-foreground
                        "
                    >
                        {TEAM_NAMES[team as NFLTeamAbbv] || team}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>

        <div className="flex bg-[#0d1117] rounded-lg border border-[#30363d] p-1">
           {POSITIONS.map(pos => (
              <button
                key={pos}
                onClick={() => currentUpdateFilters({ pos: pos as Position })}
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
          <label htmlFor="show-drafted" className="text-[10px] font-mono uppercase cursor-pointer select-none whitespace-nowrap">Show Drafted</label>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        <div className="grid grid-cols-12 gap-0 px-2 py-2.5 bg-[#161b22] text-[12px] font-bold text-[#8b949e] uppercase tracking-tighter border-b border-[#30363d] min-h-[40px] items-center select-none">
          <div className="col-span-1 text-center pr-0.5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('rank')}>
            RK{getSortIcon('rank')}
          </div>
          <div className={showExtendedStats ? "col-span-3" : "col-span-6"}>PLAYER</div>
          
          <TooltipProvider>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <div className={cn("text-center cursor-pointer hover:text-white transition-colors", showExtendedStats ? "col-span-1 ml-2.5" : "col-span-1")} onClick={() => handleSort('adp')}>
                  ADP{getSortIcon('adp')}
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-[#161b22] border-[#30363d] text-[11px] p-2 leading-relaxed">
                <p className="font-bold text-primary mb-1">ADP</p>
                <p className="text-[#c9d1d9]">Average Draft Position<br/>(ESPN)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {showExtendedStats && (
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                                  <TooltipTrigger asChild>
                    <div
                      className="flex items-center cursor-pointer hover:text-white transition-colors ml-11"
                      onClick={() => handleSort('val')}
                    >
                      <div className="leading-none flex flex-col justify-center text-[11px] text-center">
                        <span>DRAFT</span>
                        <span>VAL</span>
                      </div>

                      <span className="ml-1">
                        {getSortIcon('val')}
                      </span>
                    </div>
                  </TooltipTrigger>
                <TooltipContent className="bg-[#161b22] border-[#30363d] text-[11px] p-2 leading-relaxed">
                  <p className="font-bold text-primary mb-1">Draft Value</p>
                  <p className="text-[#c9d1d9]">ADP (rank) subtracted by PPG (rank)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <TooltipProvider>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <div className={cn("text-center cursor-pointer hover:text-white transition-colors", showExtendedStats ? "col-span-1 -ml-5" : "col-span-1")} onClick={() => handleSort('ppg')}>
                  PPG{getSortIcon('ppg')}
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-[#161b22] border-[#30363d] text-[11px] p-2 leading-relaxed">
                <p className="font-bold text-primary mb-1">PPG</p>
                <p className="text-[#c9d1d9]">Projected Fantasy Points Per Game<br/>(ESPN)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {showExtendedStats && (
            <>
              <TooltipProvider>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <div className="col-span-1 text-center ml-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('sos')}>
                      SOS{getSortIcon('sos')}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-[#161b22] border-[#30363d] text-[11px] p-2 leading-relaxed">
                    <p className="font-bold text-primary mb-1">SOS</p>
                    <p className="text-[#c9d1d9]">Strength of Schedule - based on last seasons records<br/>(Easiest = 0, Hardest = 1)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <div
                      className="flex items-center cursor-pointer hover:text-white transition-colors ml-11"
                      onClick={() => handleSort('off')}
                    >
                      <div className="leading-none flex flex-col justify-center text-[11px] text-center">
                        <span>OFF</span>
                        <span>PPG</span>
                      </div>

                      <span className="ml-1">
                        {getSortIcon('off')}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-[#161b22] border-[#30363d] text-[11px] p-2 leading-relaxed">
                    <p className="font-bold text-primary mb-1">OFF RK</p>
                    <p className="text-[#c9d1d9]">Teams Offensive PPG scored last season</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <div
                      className="flex items-center cursor-pointer hover:text-white transition-colors ml-11"
                      onClick={() => handleSort('def')}
                    >
                      <div className="leading-none flex flex-col justify-center text-[11px] text-center">
                        <span>DEF</span>
                        <span>PPG</span>
                      </div>

                      <span className="ml-1">
                        {getSortIcon('def')}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-[#161b22] border-[#30363d] text-[11px] p-2 leading-relaxed">
                    <p className="font-bold text-primary mb-1">DEF RK</p>
                    <p className="text-[#c9d1d9]">Teams Defensive PPG allowed last season</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="col-span-2 text-center ml-4">TAGS</div>
            </>
          )}
          {!showExtendedStats && (
            <>
              <div className="col-span-3 text-center">ACTION</div>
            </>
          )}
        </div>
        <ScrollArea className="flex-1">
          {(currentPickIndex == nextUserPickIndex) && (
             <div className="bg-primary/20 border-b border-primary/30 py-2 px-2 text-center flex items-center justify-center gap-4 sticky top-0 z-20 backdrop-blur-md shadow-lg">
               <span className="text-[12px] font-mono text-primary font-bold tracking-widest uppercase animate-pulse">
                 ⚡ Your Turn: RD {pickDividers.values().next().value.round} - Pick {pickDividers.values().next().value.pickOverall} ⚡
               </span>
             </div>
          )}
          {sortedPlayers.map((player, idx) => {
            const isPicked = pickedPlayers.includes(player.id);
            const pickInfo = picks.find(p => p.playerId === player.id);
            const tags = getTagIcons(player);

            const currentIndex = playerOverallIndex.get(player.id) ?? 0;
            let numPlayers = getDraftedPlayersAfterPick(currentIndex);

            let dividers = []
            if (idx == 0) {
              dividers = [...pickDividers.entries()].filter(([pickOverall]) => Number(pickOverall) <= Number(currentIndex)+numPlayers);
            }
            else {
              const prevIndex = playerOverallIndex.get(sortedPlayers[idx-1].id) ?? 0;
              dividers = [...pickDividers.entries()].filter(([pickOverall]) => Number(prevIndex)+numPlayers < Number(pickOverall) && Number(pickOverall) <= Number(currentIndex)+numPlayers);
            }
            dividers = dividers.filter(([pickOverall]) => Number(pickOverall) != currentPickIndex+1);
            
            return (
              <React.Fragment key={player.id}>
              {dividers.map(([pickOverall, divider]) => (
                 <div className="bg-primary/5 border-y border-primary/20 py-1.5 px-2 text-center flex items-center justify-center gap-4 my-0.5">
                   <div className="h-px bg-primary/20 flex-1" />
                   <span className="text-[12px] font-mono text-primary font-bold tracking-widest uppercase">
                     RD {divider.round} - Pick {divider.pickOverall}
                   </span>
                   <div className="h-px bg-primary/20 flex-1" />
                 </div>
              ))}

              <div 
                onClick={() =>
                  setExpandedPlayerId(
                    expandedPlayerId === player.id ? null : player.id
                  )
                }
                className={cn(
                  "grid grid-cols-12 gap-0 px-2 py-2.5 items-center transition-colors group relative cursor-pointer bg-[#0d1117]", expandedPlayerId === player.id ? "bg-white/[0.02]" : "border-b border-[#30363d] hover:border-white hover:border" ,
                  isPicked && "opacity-40 grayscale-[0.5]"
                )}
              >
                <div className="col-span-1 font-mono text-[11px] text-[#6e7681] text-center pr-0.5">#{player.rank}</div>
                <div className={showExtendedStats ? "col-span-3" : "col-span-6"}>
                  <div className="text-[14px] font-semibold text-[#c9d1d9] flex items-center gap-1 truncate">
                    {player.name}
                    {/* User Tags Display - uses player.id as key */}
                    {playerTags[player.id]?.includes('favorite') && (
                      <Heart className="h-3 w-3 text-red-500 fill-red-500" />
                    )}
                    {playerTags[player.id]?.includes('target') && (
                      <Crosshair className="h-3 w-3 text-yellow-500" />
                    )}
                    
                    {/* Tag Management */}
                    {showExtendedStats && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 hover:bg-white/10 rounded p-0.5 outline-none"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <Plus className="h-3 w-3 text-[#8b949e]" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-40 p-2 bg-[#161b22] border-[#30363d] shadow-xl" align="start">
                          <div className="space-y-1">
                             <button 
                               className={cn(
                                 "w-full flex items-center gap-2 px-2 py-1.5 rounded text-[11px] font-bold transition-colors",
                                 playerTags[player.id]?.includes('favorite') ? "bg-red-500/10 text-red-500" : "text-[#c9d1d9] hover:bg-white/5"
                               )}
                               onClick={(e) => {
                                e.stopPropagation();
                                togglePlayerTag(player.id, 'favorite');
                               }}
                             >
                               <Heart className={cn("h-3 w-3", playerTags[player.id]?.includes('favorite') && "fill-current")} />
                               Favorite
                             </button>
                             <button 
                               className={cn(
                                 "w-full flex items-center gap-2 px-2 py-1.5 rounded text-[11px] font-bold transition-colors",
                                 playerTags[player.id]?.includes('target') ? "bg-yellow-500/10 text-yellow-500" : "text-[#c9d1d9] hover:bg-white/5"
                               )}
                               onClick={(e) => {
                                e.stopPropagation();
                                togglePlayerTag(player.id, 'target');
                               }}
                             >
                               <Crosshair className="h-3 w-3" />
                               Target
                             </button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}

                    {isPicked && pickInfo && (
                      <span className="text-[10px] font-mono text-primary border border-primary/20 px-0.5 rounded uppercase whitespace-nowrap ml-1">
                        {pickInfo.round}.{pickInfo.pickOverall % settings.teamCount || settings.teamCount}
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-[#8b949e] flex items-center mt-0.5 gap-1 truncate opacity-80">
                     <span className="font-bold text-[#c9d1d9]">{player.position}</span>
                     <span className="text-[#484f58]">•</span>
                     <span className="uppercase">{player.teamInfo.teamAbbv}</span>
                     <span className="text-[#484f58]">•</span>
                     <span className="text-[#6e7681] uppercase">Bye {player.teamInfo.byeWeek}</span>
                  </div>
                </div>
                <div className={cn("col-span-1 text-center font-mono text-[#8b949e] text-[12px]", showExtendedStats && "ml-2.5")}>
                  {player.adp}
                  <div className="text-[10px] text-primary opacity-60">
                    (RD{Math.ceil(player.adp / settings.teamCount)})
                  </div>
                </div>
                {showExtendedStats && (
                  <div className={cn("col-span-1 text-center font-mono font-bold text-[12px] -ml-2.5", getValueColor(getDraftValue(player)))}>
                    {getDraftValue(player) > 0 ? `+${getDraftValue(player)}` : getDraftValue(player)}
                  </div>
                )}
                <div className={cn("col-span-1 text-center font-mono font-bold text-[14px]", showExtendedStats ? "-ml-5" : "", getPPGColor(player.ppg, player.position))}>
                  <div className="relative inline-block">
                    {player.ppg}

                    {player.projectedGames < 17 && (
                      <span className="absolute -top-1 -right-4 text-[9px] leading-none text-gray-500">
                        {player.projectedGames}g
                      </span>
                    )}
                  </div>
                </div>
                
                {showExtendedStats && (
                  <>
                    <div className={cn("col-span-1 text-center font-mono font-bold text-[12px] ml-4", getSosColor(player.teamInfo.sos))}>
                      {player.teamInfo.sos}
                    </div>
                    <div className={cn("col-span-1 text-center font-mono font-bold text-[12px] -ml-4", getOffPpgColor(player.teamInfo.ppgOffense))}>
                      {player.teamInfo.ppgOffense}
                    </div>
                    <div className={cn("col-span-1 text-center font-mono font-bold text-[12px] -ml-4", getDefPpgColor(player.teamInfo.ppgDefense))}>
                      {player.teamInfo.ppgDefense}
                    </div>
                  </>
                )}

                {showExtendedStats ? (
                  <div className="col-span-2 flex justify-center items-center ml-4">
                    <TooltipProvider>
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <div className="flex justify-center gap-0.5 cursor-help hover:bg-white/5 rounded transition-colors w-full h-full min-h-[20px] items-center">
                            {tags.slice(0, 5).map((tag, i) => (
                              <tag.icon key={i} className={cn("h-5 w-5", tag.color)} />
                            ))}
                            {tags.length > 5 && <span className="text-[10px] text-[#484f58] font-bold">+{tags.length - 5}</span>}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="bg-[#161b22] border-[#30363d] p-3 shadow-2xl min-w-[200px] z-50">
                          <div className="space-y-2.5">
                            {tags.map((tag, i) => (
                              <div key={i} className="flex items-start gap-3">
                                <tag.icon className={cn("h-5 w-5 shrink-0 mt-0", tag.color)} />
                                <span className="text-[12px] text-[#c9d1d9] leading-relaxed">{tag.label}</span>
                              </div>
                            ))}
                            {tags.length === 0 && (
                              <p className="text-[12px] text-[#8b949e] italic text-center py-1">No Tags</p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                ) : (
                  <div className="col-span-3 flex justify-center items-center px-2" >
                    {!isPicked ? (
                      <Button 
                        size="sm"
                        className="h-7 w-full max-w-[80px] bg-primary/10 text-primary hover:bg-primary hover:text-black font-bold text-[10px] uppercase border border-primary/30 shadow-[0_0_10px_rgba(46,160,67,0.05)]"
                        onClick={(e) => {
                          e.stopPropagation();
                          makePick(player.id);
                        }}
                        disabled={isDraftComplete}
                      >
                        Draft
                      </Button>
                    ) : (
                      <div className="text-[10px] font-mono text-[#484f58] uppercase italic flex items-center justify-center gap-1.5 w-full">
                        {pickInfo && pickInfo.pickedBy === "User" ? "Drafted" : `Taken`}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {expandedPlayerId === player.id && (
                <div className={cn("px-3 py-3 border-b border-[#30363d] bg-white/[0.02]")}>
                  <div className="px-4 py-4 bg-[#161b22] border border-[#30363d] rounded-md">

                    {/* Player AI Stock / AI Insight */}
                    <div className="flex items-start gap-3 mb-5">
                      <div
                        className={cn(
                          "flex flex-col items-center justify-center h-12 w-15 rounded-md shrink-0 gap-0.5 bg-gray-400/10",
                        )}
                      >
                        {player.stock === "DIAMOND" && (
                          <>
                            <Gem className="h-4 w-4 text-cyan-400" />
                            <span className="text-[8px] font-bold text-cyan-400">
                              DIAMOND
                            </span>
                          </>
                        )}
                        {player.stock === "BREAKOUT" && (
                          <>
                            <Rocket className="h-4 w-4 text-emerald-400" />
                            <span className="text-[8px] font-bold text-emerald-400">BREAKOUT</span>
                          </>
                        )}
                        {player.stock === "STAR" && (
                          <>
                            <Star className="h-4 w-4 text-yellow-400" />
                            <span className="text-[8px] font-bold text-yellow-400">STAR</span>
                          </>
                        )}
                        {player.stock === "STARTER" && (
                          <>
                            <CircleCheck className="h-4 w-4 text-green-400" />
                            <span className="text-[8px] font-bold text-green-400">STARTER</span>
                          </>
                        )}
                        {player.stock === "SLEEPER" && (
                          <>
                            <Eye className="h-4 w-4 text-purple-400" />
                            <span className="text-[8px] font-bold text-purple-400">SLEEPER</span>
                          </>
                        )}
                        {player.stock === "AVERAGE" && (
                          <>
                            <Minus className="h-4 w-4 text-gray-400" />
                          </>
                        )}
                        {player.stock === "OVERVALUED" && (
                          <>
                            <TrendingDown className="h-4 w-4 text-orange-400" />
                            <span className="text-[8px] font-bold text-orange-400">OVERVALUED</span>
                          </>
                        )}
                        {player.stock === "RISKY" && (
                          <>
                            <TriangleAlert className="h-4 w-4 text-amber-400" />
                            <span className="text-[8px] font-bold text-amber-400">RISKY</span>
                          </>
                        )}
                        {player.stock === "FADE" && (
                          <>
                            <ThumbsDown className="h-4 w-4 text-orange-600" />
                            <span className="text-[8px] font-bold text-orange-600">FADE</span>
                          </>
                        )}
                        {player.stock === "BUST" && (
                          <>
                            <Bomb className="h-4 w-4 text-red-500" />
                            <span className="text-[8px] font-bold text-red-500">BUST</span>
                          </>
                        )}
                        {player.stock === "WILDCARD" && (
                          <>
                            <Dices className="h-4 w-4 text-pink-400" />
                            <span className="text-[8px] font-bold text-pink-400">WILDCARD</span>
                          </>
                        )}
                      </div>

                      <div>
                        <p className="text-[12px] text-[#8b949e] leading-relaxed max-w-2xl">
                          {player.notes}
                        </p>
                      </div>
                    </div>

                    {/* Previous Season */}
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[12px] font-bold text-[#8b949e] uppercase tracking-wider">
                          Previous Season
                        </span>

                        {!player.rookie && player.pastInfo.totalGames > 0 && (
                          <span className="text-[12px] font-bold text-[#c9d1d9]/90">
                            PPG = {player.pastInfo.ppg}&nbsp;&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;&nbsp;Games Played = {player.pastInfo.totalGames}
                          </span>
                        )}
                      </div>

                      {player.rookie || player.pastInfo.totalGames === 0 ? (
                        <div className="h-[65px] border border-[#30363d] rounded-md flex items-center justify-center bg-[#0d1117]">
                          <span className="text-[12px] text-[#6e7681] italic">
                            Did not play last season
                          </span>
                        </div>
                      ) : (
                        <div className="border border-[#30363d] rounded-md overflow-hidden">

                          {/* Week Headers */}
                          <div className="grid grid-cols-[repeat(18,minmax(0,1fr))] bg-[#0d1117]">
                            {Array.from({ length: 18 }).map((_, index) => (
                              <div
                                key={index}
                                className="py-1.5 text-center text-[10px] font-mono text-[#6e7681] border-r border-[#30363d] last:border-r-0"
                              >
                                W{index + 1}
                              </div>
                            ))}
                          </div>

                          {/* Weekly Points */}
                          <div className="grid grid-cols-[repeat(18,minmax(0,1fr))]">
                            {player.pastInfo.weeks.map((points, index) => (
                              <div
                                key={index}
                                className={`py-2 text-center text-[11px] font-mono font-bold border-r border-t border-[#30363d] last:border-r-0 ${
                                  points === -99 ? "text-[#6e7681]" : "text-[#c9d1d9]"
                                }`}
                              >
                                {points === -99 ? "--" : points}
                              </div>
                            ))}
                          </div>

                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}
              </React.Fragment>
            );
          })}
        </ScrollArea>
      </div>
    </div>
  );
}
