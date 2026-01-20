import React, { useState, useEffect } from "react";
import { useDraftStore } from "@/lib/draftStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { DraftControls } from "@/components/draft/DraftControls";
import { DraftBoard } from "@/components/draft/DraftBoard";
import { PlayerTable } from "@/components/draft/PlayerTable";
import { TeamRoster } from "@/components/draft/TeamRoster";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Database, Globe, Cpu, CheckCircle2 } from "lucide-react";

export default function Dashboard() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [loadingStep, setLoadingStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const steps = [
    { icon: Globe, label: "Fetching ESPN Player Rankings & Projections..." },
    { icon: Database, label: "Retrieving 5-year Historical Performance Data..." },
    { icon: Cpu, label: "Analyzing Injury Trends & Age-related Falloffs..." },
    { icon: CheckCircle2, label: "Finalizing AI Draft Recommendations..." }
  ];

  useEffect(() => {
    if (isInitializing) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setIsInitializing(false), 800);
            return 100;
          }
          const next = prev + (Math.random() * 15);
          setLoadingStep(Math.floor((next / 100) * steps.length));
          return Math.min(next, 100);
        });
      }, 600);
      return () => clearInterval(interval);
    }
  }, [isInitializing]);

  if (isInitializing) {
    return (
      <div className="h-screen w-full bg-[#1a1a1a] flex items-center justify-center p-6 font-sans">
        <Card className="w-full max-w-md bg-[#2d2d2d] border-[#3d3d3d] p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="h-16 w-16 bg-primary/20 rounded-xl flex items-center justify-center animate-pulse">
              <Database className="h-8 w-8 text-primary" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-display font-bold text-white tracking-tight">DraftAlpha Initialization</h1>
              <p className="text-muted-foreground text-sm">Syncing with ESPN Data Sources (2026-2027 Season)</p>
            </div>

            <div className="w-full space-y-4">
              <Progress value={progress} className="h-2 bg-black/40" />
              
              <div className="flex items-center justify-center space-x-3 text-sm text-primary font-medium animate-in fade-in slide-in-from-bottom-2">
                {React.createElement(steps[Math.min(loadingStep, steps.length - 1)].icon, { className: "h-4 w-4" })}
                <span>{steps[Math.min(loadingStep, steps.length - 1)].label}</span>
              </div>
            </div>

            <div className="pt-4 grid grid-cols-2 gap-4 w-full opacity-50">
                <div className="text-[10px] uppercase font-bold text-muted-foreground text-left">Source: ESPN API</div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground text-right">Status: Processing</div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#1e1e1e] overflow-hidden text-[#d4d4d4] selection:bg-primary/30">
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-w-0">
        <DraftControls />
        
        <div className="flex-1 overflow-hidden p-4 flex flex-col space-y-4">
          {/* Top Section: Compact Draft Board for "App" feel */}
          <div className="flex-shrink-0">
             <DraftBoard />
          </div>
          
          {/* Bottom Section: Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
             {/* Main Table Area */}
             <div className="lg:col-span-8 h-full min-h-0 flex flex-col">
                <div className="bg-[#252526] rounded-md border border-[#333333] flex-1 p-4 min-h-0 flex flex-col shadow-sm">
                   <div className="flex items-center justify-between mb-4 flex-shrink-0">
                      <h2 className="text-sm font-display font-bold tracking-widest text-primary uppercase">Player Analysis Engine</h2>
                      <div className="flex items-center space-x-2">
                         <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                         <span className="text-[10px] font-mono text-muted-foreground">LIVE SYNC ACTIVE</span>
                      </div>
                   </div>
                   <div className="flex-1 min-h-0">
                      <PlayerTable />
                   </div>
                </div>
             </div>
             
             {/* Right Panel: My Team / Analytics */}
             <div className="lg:col-span-4 h-full min-h-0 flex flex-col space-y-4">
                <div className="flex-1 min-h-0">
                   <TeamRoster />
                </div>
                
                <Card className="bg-[#252526] border-[#333333] p-4 h-[200px] flex-shrink-0">
                   <h2 className="text-[10px] font-display font-bold tracking-widest text-muted-foreground mb-4 uppercase">Predictive Analytics</h2>
                   <div className="space-y-4">
                      <div className="space-y-1">
                         <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-muted-foreground">Draft Position Value (Pick #{useDraftStore.getState().settings.position})</span>
                            <span className="text-primary font-bold">+12.4% vs Avg</span>
                         </div>
                         <div className="h-1 w-full bg-black/40 rounded-full overflow-hidden">
                            <div className="h-full w-[72%] bg-primary" />
                         </div>
                      </div>
                      
                      <div className="p-3 bg-primary/5 border border-primary/10 rounded-sm">
                         <p className="text-[11px] text-[#cccccc] leading-relaxed">
                            <span className="font-bold text-primary">AI INSIGHT:</span> Based on ESPN projections and past 5-year trends, your current roster has a 68% chance of making the playoffs in a 12-team PPR league.
                         </p>
                      </div>
                   </div>
                </Card>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
