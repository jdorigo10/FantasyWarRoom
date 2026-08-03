import React from "react";
import { cn } from "@/lib/utils";
import { Sparkles, Sofa, Star, ThumbsUp, Eye, Minus, TrendingDown, ThumbsDown } from "lucide-react";
import { Search, Plus, Clock, Baby, TrendingUp, RefreshCcw, PlusSquare, Bandage, Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { API_YEAR } from "@/lib/baseData";
import { useDraftStore } from "@/lib/draftStore";

type ComparePlayersModalProps = {
  players: any[];
  isOpen: boolean;
  onClose: () => void;
};

export function ComparePlayersModal({
  players,
  isOpen,
  onClose,
}: ComparePlayersModalProps) {
  if (!isOpen) return null;

    const { pickedPlayers, picks, settings } = useDraftStore();

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
      <div className="relative w-[min(1800px,92vw)] max-h-[100vh] overflow-auto rounded-xl border border-[#30363d] bg-[#0d1117] p-5 shadow-2xl">
        <button
          type="button"
          aria-label="Close compare view"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-[#30363d] bg-[#161b22] text-[#c9d1d9] hover:bg-white/5"
        >
          ✕
        </button>

        <div className="mb-5 pr-10">
          <h3 className="text-lg font-bold uppercase tracking-wider text-primary">
            Comparing {players.length} Players
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {players.map((player) => {
            const isPicked = pickedPlayers.includes(player.id);
            const pickInfo = picks.find(p => p.playerId === player.id);

            return (
              <div
                key={player.id}
                className={cn("rounded-lg border border-[#30363d] bg-[#161b22] p-4", isPicked && "opacity-40 grayscale-[0.5]")}
              >
                <div className={cn("flex justify-between mb-2 border-b border-[#30363d] pb-2")}>
                  <div className="">
                      <div className="text-[18px] font-bold text-[#c9d1d9]">{player.name}</div>
                      <div className="flex items-center gap-2">
                        <div className="text-[14px] uppercase text-[#8b949e]">
                          {player.position} • {player.teamInfo.teamAbbv}
                        </div>
                        {isPicked && pickInfo && (
                          <span className="h-6 text-[10px] font-mono text-primary border border-primary/20 px-2 py-1 rounded uppercase whitespace-nowrap">
                            Drafted {pickInfo.round}.{pickInfo.pickOverall % settings.teamCount || settings.teamCount}
                          </span>
                        )}
                      </div>
                  </div>
                  <div className={cn("flex flex-col items-center justify-center h-14 w-20 rounded-md shrink-0 gap-1 bg-gray-400/10 mt-0")}>
                      {player.stock === "SUPERSTAR" && (
                          <>
                          <Sparkles className="h-5 w-5 text-red-400" />
                          <span className="text-[10px] font-bold text-red-400">
                              SUPERSTAR
                          </span>
                          </>
                      )}
                      {player.stock === "STAR" && (
                          <>
                          <Star className="h-5 w-5 text-yellow-400" />
                          <span className="text-[10px] font-bold text-yellow-400">STAR</span>
                          </>
                      )}
                      {player.stock === "STARTER" && (
                          <>
                          <ThumbsUp className="h-5 w-5 text-green-400" />
                          <span className="text-[10px] font-bold text-green-400">STARTER</span>
                          </>
                      )}
                      {player.stock === "AVERAGE" && (
                          <>
                          <Minus className="h-5 w-5 text-gray-400" />
                          <span className="text-[10px] font-bold text-gray-400">AVERAGE</span>
                          </>
                      )}
                      {player.stock === "BENCH" && (
                          <>
                          <Sofa className="h-5 w-5 text-amber-400" />
                          <span className="text-[10px] font-bold text-amber-400">BENCH</span>
                          </>
                      )}
                      {player.stock === "WAIVER" && (
                          <>
                          <Eye className="h-5 w-5 text-orange-600" />
                          <span className="text-[10px] font-bold text-orange-600">WAIVER</span>
                          </>
                      )}
                      {player.stock === "AVOID" && (
                          <>
                          <ThumbsDown className="h-5 w-5 text-red-500" />
                          <span className="text-[10px] font-bold text-red-500">AVOID</span>
                          </>
                      )}
                  </div>
                </div>

                <div className="space-y-1 text-[14px] text-[#c9d1d9] mb-2 border-b border-[#30363d] pb-2">
                  <div className="flex justify-center">
                      {player.position != 'DST' && (
                          <span className="text-[14px] font-bold text-[#c9d1d9]/90">
                              AGE = {player.age}&nbsp;&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;&nbsp;ADP = {player.adp} (#{player.rank})
                          </span>
                      )}
                  </div>
                </div>

                <div className="space-y-1 text-[14px] text-[#c9d1d9] mb-2 border-b border-[#30363d] pb-2">
                  <div>
                    <div className="flex justify-center">
                      <span className="text-[#8b949e]">Projected PPG&nbsp;=&nbsp;</span>
                      <span className={cn("font-bold", getPPGColor(player.ppg, player.position))}>
                        {player.ppg}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-center ml-5 mr-5">
                      <div>
                        <span className="text-[#8b949e]">{API_YEAR-1}=</span>
                        {(player.pastPPGs.length > 0) ? (
                          <span className={cn("font-semibold", getPPGColor(player.pastPPGs[0], player.position))}>
                            {player.pastPPGs[0]}
                          </span>
                        ) : (
                          <span className="font-semibold text-[#484f58]">N/A</span>
                        )}
                      </div>
                      <div>
                        <span className="text-[#8b949e]">{API_YEAR-2}=</span>
                        {(player.pastPPGs.length > 1) ? (
                          <span className={cn("font-semibold", getPPGColor(player.pastPPGs[1], player.position))}>
                            {player.pastPPGs[1]}
                          </span>
                        ) : (
                          <span className="font-semibold text-[#484f58]">N/A</span>
                        )}
                      </div>
                      <div>
                        <span className="text-[#8b949e]">{API_YEAR-3}=</span>
                        {(player.pastPPGs.length > 2) ? (
                          <span className={cn("font-semibold", getPPGColor(player.pastPPGs[2], player.position))}>
                            {player.pastPPGs[2]}
                          </span>
                        ) : (
                          <span className="font-semibold text-[#484f58]">N/A</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between space-y-2 text-[14px] text-[#c9d1d9] mb-2 border-b border-[#30363d] pb-0">
                  <div className="col-span-1 text-center ml-10">
                      <span className="text-[#8b949e]">SOS</span>
                      <div className={cn("col-span-1 text-center font-bold text-[14px]", getSosColor(player.teamInfo.sos))}>
                          {player.teamInfo.sos}
                      </div>
                  </div>
                  <div className="col-span-1 text-center">
                      <span className="text-[#8b949e]">OFF PPG</span>
                      <div className={cn("col-span-1 text-center font-bold text-[14px]", getOffPpgColor(player.teamInfo.ppgOffense))}>
                          {player.teamInfo.ppgOffense}
                      </div>
                  </div>
                  <div className="col-span-1 text-center mr-10">
                      <span className="text-[#8b949e]">DEF PPG</span>
                      <div className={cn("col-span-1 text-center font-bold text-[14px]", getDefPpgColor(player.teamInfo.ppgDefense))}>
                          {player.teamInfo.ppgDefense}
                      </div>
                  </div>
                </div>

                <div className="space-y-0 text-[14px] text-[#c9d1d9]">
                  <TooltipProvider>
                      <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                          <div className="flex justify-center gap-0.5 cursor-help hover:bg-white/5 rounded transition-colors w-full h-full min-h-[28px] items-center">
                          {getTagIcons(player).slice(0, 5).map((tag, i) => (
                              <tag.icon key={i} className={cn("h-6 w-6 mr-2 ml-2", tag.color)} />
                          ))}
                          {getTagIcons(player).length > 5 && <span className="text-[10px] text-[#484f58] font-bold">+{getTagIcons(player).length - 5}</span>}
                          </div>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="bg-[#161b22] border-[#30363d] p-3 shadow-2xl min-w-[200px] z-50">
                          <div className="space-y-2.5">
                          {getTagIcons(player).map((tag, i) => (
                              <div key={i} className="flex items-start gap-3">
                              <tag.icon className={cn("h-5 w-5 shrink-0 mt-0", tag.color)} />
                              <span className="text-[12px] text-[#c9d1d9] leading-relaxed">{tag.label}</span>
                              </div>
                          ))}
                          {getTagIcons(player).length === 0 && (
                              <p className="text-[12px] text-[#8b949e] italic text-center py-1">No Tags</p>
                          )}
                          </div>
                      </TooltipContent>
                      </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}