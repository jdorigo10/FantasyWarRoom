import React from "react";
import { useDraftStore } from "@/lib/draftStore";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export function DraftBoard() {
  const { settings, picks, currentPickIndex } = useDraftStore();
  
  // Create grid: Rows = Rounds, Cols = Teams
  const rounds = Array.from({ length: settings.rounds }, (_, i) => i + 1);
  const teams = Array.from({ length: settings.teamCount }, (_, i) => i + 1);

  return (
    <Card className="p-4 border-none bg-black/20 backdrop-blur-sm">
      <h2 className="mb-4 text-lg font-display font-semibold tracking-wider text-primary">DRAFT BOARD</h2>
      <ScrollArea className="h-[400px] w-full rounded-md border border-white/5 bg-black/40">
        <div className="flex w-max flex-col">
          {/* Header Row */}
          <div className="flex border-b border-white/10 sticky top-0 bg-black/80 z-10">
            <div className="w-12 p-2 text-xs font-mono text-muted-foreground flex-shrink-0 bg-black/80 sticky left-0 z-20">RD</div>
            {teams.map((team) => (
              <div key={team} className="w-32 p-2 text-xs font-mono text-center text-muted-foreground border-r border-white/5 last:border-0">
                Team {team} {team === settings.position && <span className="text-primary">(YOU)</span>}
              </div>
            ))}
          </div>

          {/* Grid */}
          {rounds.map((round) => (
            <div key={round} className="flex border-b border-white/5 last:border-0">
              <div className="w-12 p-2 text-xs font-mono text-muted-foreground flex items-center justify-center border-r border-white/5 bg-black/40 sticky left-0 z-10">
                {round}
              </div>
              {teams.map((team) => {
                // Calculate pick number for this cell
                // Snake draft logic logic visual mapping is tricky, but let's just map picks to slots
                // Actually, standard visual is usually linear per round, but snake order
                // Let's just find the pick that happened at this slot
                
                // Snake logic for grid placement:
                // Odd rounds (1, 3, 5): Left to Right (1 -> 12)
                // Even rounds (2, 4, 6): Right to Left (12 -> 1)
                
                // But the visual grid is usually static teams column. 
                // So Round 1, Team 1 is Pick 1. Round 2, Team 1 is Pick 24 (in 12 teamer).
                
                let pickOverall: number;
                if (round % 2 !== 0) {
                  // Odd round: Pick = (Round - 1) * Teams + Team
                  pickOverall = (round - 1) * settings.teamCount + team;
                } else {
                  // Even round: Pick = (Round - 1) * Teams + (Teams - Team + 1)
                  pickOverall = (round - 1) * settings.teamCount + (settings.teamCount - team + 1);
                }

                const pickData = picks.find(p => p.pickOverall === pickOverall);
                const isCurrent = currentPickIndex + 1 === pickOverall;
                const isUserTeam = team === settings.position;

                return (
                  <div 
                    key={`${round}-${team}`} 
                    className={cn(
                      "w-32 h-16 p-2 text-xs border-r border-white/5 last:border-0 relative group transition-colors",
                      isCurrent && "bg-primary/20 animate-pulse",
                      pickData ? "bg-secondary/20" : "bg-transparent",
                      isUserTeam && !pickData && "bg-primary/5"
                    )}
                  >
                     <div className="absolute top-1 right-1 text-[10px] text-muted-foreground font-mono opacity-50">
                        {pickOverall}
                     </div>
                     
                     {pickData ? (
                        <div className="flex flex-col h-full justify-center">
                           <span className="font-semibold truncate text-foreground">{pickData.playerId}</span>
                           <span className="text-[10px] text-primary">{pickData.pickedBy}</span>
                        </div>
                     ) : (
                        <div className="flex h-full items-center justify-center opacity-0 group-hover:opacity-20 text-[10px]">
                           Empty
                        </div>
                     )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </Card>
  );
}
