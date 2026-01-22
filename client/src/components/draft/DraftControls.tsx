import React from "react";
import { useDraftStore } from "@/lib/draftStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw, MonitorPlay, AlertTriangle, ArrowRight, Clock } from "lucide-react";

export function DraftControls() {
  const { currentPickIndex, simulatePick, resetDraft, undoLastPick, settings, picks, players } = useDraftStore();

  const handleReset = () => {
    if (confirm("This will clear all current picks. Are you sure?")) {
      resetDraft();
    }
  };

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

  const currentPick = getPickDetails(currentPickIndex);
  
  // Calculate picks until user
  let picksUntilUp = -1;
  // search forward for next user pick
  for (let i = currentPickIndex; i < settings.rounds * settings.teamCount; i++) {
      const details = getPickDetails(i);
      if (details?.team?.isUser) {
          picksUntilUp = i - currentPickIndex;
          break;
      }
  }

  // Previous 3 picks
  const prevPicks = Array.from({length: 3}, (_, i) => currentPickIndex - 3 + i)
    .filter(idx => idx >= 0);

  // Next 3 picks (excluding current)
  const nextPicks = Array.from({length: 3}, (_, i) => currentPickIndex + 1 + i)
    .filter(idx => idx < settings.rounds * settings.teamCount);

  const renderMiniPick = (idx: number, isFuture: boolean) => {
      const details = getPickDetails(idx);
      if (!details) return null;
      
      const pickData = picks.find(p => p.pickOverall === idx + 1); // pickOverall is 1-based
      const player = pickData ? players.find(p => p.id === pickData.playerId) : null;
      
      return (
          <div key={idx} className={cn(
              "flex flex-col justify-center min-w-[110px] h-[54px] px-3 py-1.5 rounded border transition-all duration-300",
              isFuture 
                ? "bg-card/50 border-border/50 opacity-40 grayscale-[0.5]" 
                : "bg-muted/50 border-border/50 opacity-70 grayscale-[0.2]"
          )}>
              <div className="flex items-center justify-between text-[8px] uppercase tracking-wider text-muted-foreground font-bold mb-1">
                  <span className={cn(details.team.isUser && "text-primary")}>
                      {details.team.isUser ? "YOU" : `TM ${details.team.id.split('-')[1]}`}
                  </span>
                  <span className="font-mono opacity-50">{details.round}.{details.pick}</span>
              </div>
              
              {player ? (
                  <div className="text-[10px] font-bold leading-tight truncate max-w-[100px]">
                      {player.name}
                      <div className="text-[8px] font-normal text-muted-foreground flex gap-1 mt-0.5">
                         <span>{player.position}</span>
                         <span>•</span>
                         <span>{player.team}</span>
                      </div>
                  </div>
              ) : (
                  <div className="text-[10px] font-bold text-muted-foreground/40 italic mt-1">
                      {isFuture && details.team.isUser ? "Your Pick" : "On Deck"}
                  </div>
              )}
          </div>
      );
  };

  return (
    <div className="bg-card border-b border-border p-3 flex items-center justify-between gap-4 overflow-hidden h-[80px]">
      
      {/* Ticker Section */}
      <div className="flex-1 flex items-center justify-center xl:justify-start gap-4 overflow-hidden">
         {/* Previous Picks (Desktop) */}
         <div className="hidden xl:flex items-center gap-2">
             {prevPicks.map(idx => renderMiniPick(idx, false))}
         </div>
         
         {/* Current Pick - Hero */}
         <div className={cn(
             "flex-shrink-0 flex items-center gap-6 px-6 py-2 rounded-lg border-2 shadow-sm transition-all duration-500 min-w-[300px] justify-center",
             currentPick?.team?.isUser 
                ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(46,160,67,0.15)]" 
                : "bg-card border-border"
         )}>
             <div className="flex flex-col items-center">
                 <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">
                    {currentPick?.team?.isUser ? "Your Turn" : "On The Clock"}
                 </div>
                 <div className={cn(
                     "text-xl font-display font-bold whitespace-nowrap",
                     currentPick?.team?.isUser ? "text-primary animate-pulse" : "text-foreground"
                 )}>
                    {currentPick?.team?.name}
                 </div>
                 <div className="text-[10px] font-mono text-muted-foreground font-bold bg-muted/50 px-2 py-0.5 rounded mt-1">
                    RD {currentPick?.round} • PICK {currentPick?.pick} <span className="opacity-50 mx-1">|</span> #{currentPick?.overall}
                 </div>
                 
                 {/* Picks Until Up Counter */}
                 {picksUntilUp > 0 && (
                     <div className="mt-1.5 text-[9px] font-bold text-primary flex items-center gap-1 opacity-80">
                        <Clock className="w-3 h-3" />
                        {picksUntilUp} Pick{picksUntilUp !== 1 && 's'} Until You
                     </div>
                 )}
                 {picksUntilUp === 0 && (
                     <div className="mt-1.5 text-[9px] font-bold text-primary animate-bounce">
                        MAKE YOUR SELECTION
                     </div>
                 )}
             </div>
         </div>

         {/* Next Picks (Desktop) */}
         <div className="hidden xl:flex items-center gap-2">
             {nextPicks.map(idx => renderMiniPick(idx, true))}
         </div>
      </div>

      {/* Controls */}
      <div className="flex items-center space-x-2 border-l pl-4 border-border/50">
        <Button variant="outline" size="sm" onClick={undoLastPick} className="h-8 text-xs border-white/10 hover:bg-white/5">
           <RotateCcw className="mr-2 h-3.5 w-3.5" /> Undo
        </Button>
        <Button variant="secondary" size="sm" onClick={simulatePick} className="h-8 text-xs bg-secondary/20 text-secondary-foreground hover:bg-secondary/30">
           <MonitorPlay className="mr-2 h-3.5 w-3.5" /> Sim Pick
        </Button>
        <Button variant="destructive" size="sm" onClick={handleReset} className="h-8 text-xs">
           <AlertTriangle className="mr-2 h-3.5 w-3.5" /> Reset
        </Button>
      </div>
    </div>
  );
}