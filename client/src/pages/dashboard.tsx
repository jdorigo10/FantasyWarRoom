import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { DraftControls } from "@/components/draft/DraftControls";
import { DraftBoard } from "@/components/draft/DraftBoard";
import { PlayerTable } from "@/components/draft/PlayerTable";
import { TeamRoster } from "@/components/draft/TeamRoster";

export default function Dashboard() {
  return (
    <div className="flex h-screen bg-background overflow-hidden text-foreground selection:bg-primary/30">
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-w-0">
        <DraftControls />
        
        <div className="flex-1 overflow-hidden p-4 grid grid-rows-[auto_1fr] gap-4">
          {/* Top Section: Draft Board (Visualizer) */}
          <div className="min-h-0 flex-shrink-0">
             <DraftBoard />
          </div>
          
          {/* Bottom Section: Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 h-full">
             {/* Main Table Area */}
             <div className="lg:col-span-8 h-full min-h-0 flex flex-col">
                <div className="bg-card rounded-lg border border-border flex-1 p-4 min-h-0 flex flex-col">
                   <h2 className="text-lg font-display font-semibold tracking-wider text-primary mb-4 flex-shrink-0">PLAYER POOL</h2>
                   <div className="flex-1 min-h-0">
                      <PlayerTable />
                   </div>
                </div>
             </div>
             
             {/* Right Panel: My Team / Analytics */}
             <div className="lg:col-span-4 h-full min-h-0 flex flex-col space-y-4">
                <TeamRoster />
                
                {/* Placeholder for Quick Analytics */}
                <div className="bg-card rounded-lg border border-border p-4 flex-1">
                   <h2 className="text-sm font-display font-semibold tracking-wider text-muted-foreground mb-4">DRAFT INSIGHTS</h2>
                   <div className="space-y-4">
                      <div className="space-y-1">
                         <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Positional Scarcity (RB)</span>
                            <span className="text-destructive font-bold">CRITICAL</span>
                         </div>
                         <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                            <div className="h-full w-[85%] bg-destructive" />
                         </div>
                      </div>
                      
                      <div className="space-y-1">
                         <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Value Board</span>
                            <span className="text-primary font-bold">ABUNDANT</span>
                         </div>
                         <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                            <div className="h-full w-[30%] bg-primary" />
                         </div>
                      </div>
                      
                      <div className="p-3 bg-primary/10 border border-primary/20 rounded-md mt-4">
                         <p className="text-xs text-primary-foreground/80 leading-relaxed">
                            <span className="font-bold text-primary">TIP:</span> RB depth is falling fast. Consider targeting a RB in the next 2 rounds before the tier drop-off.
                         </p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
