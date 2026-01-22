import React from "react";
import { useDraftStore } from "@/lib/draftStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw, MonitorPlay, AlertTriangle } from "lucide-react";

export function DraftControls() {
  const { currentPickIndex, simulatePick, resetDraft, undoLastPick, settings } = useDraftStore();

  const handleReset = () => {
    if (confirm("This will clear all current picks. Are you sure?")) {
      resetDraft();
    }
  };

  const round = Math.floor(currentPickIndex / settings.teamCount) + 1;
  const pick = (currentPickIndex % settings.teamCount) + 1;
  
  // Calculate whose turn it is
  const roundIsEven = (round - 1) % 2 === 0; // Round 1 is index 0 (even)
  
  let currentTeamIndex: number;
  if (roundIsEven) {
      currentTeamIndex = pick - 1;
  } else {
      currentTeamIndex = settings.teamCount - pick;
  }
  
  const currentTeam = settings.teams[currentTeamIndex];
  const isUser = currentTeam?.isUser;

  return (
    <div className="bg-card border-b border-border p-4 flex items-center justify-between">
      <div className="flex items-center space-x-6">
         <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Current Pick</div>
            <div className="text-2xl font-display font-bold text-foreground">
               <span className="text-muted-foreground">RD</span> {round} <span className="text-muted-foreground">/</span> <span className="text-primary">#{pick}</span>
            </div>
         </div>
         
         <div className="h-8 w-px bg-border" />
         
         <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">On The Clock</div>
            <div className={cn("text-lg font-bold flex items-center gap-2", isUser ? "text-primary animate-pulse" : "text-foreground")}>
               {currentTeam?.name || `Team ${currentTeamIndex + 1}`} {isUser && "(YOU)"}
            </div>
         </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={undoLastPick} className="border-white/10 hover:bg-white/5">
           <RotateCcw className="mr-2 h-4 w-4" /> Undo
        </Button>
        <Button variant="secondary" size="sm" onClick={simulatePick} className="bg-secondary/20 text-secondary-foreground hover:bg-secondary/30">
           <MonitorPlay className="mr-2 h-4 w-4" /> Sim Pick
        </Button>
        <Button variant="destructive" size="sm" onClick={handleReset}>
           <AlertTriangle className="mr-2 h-4 w-4" /> Reset
        </Button>
      </div>
    </div>
  );
}
