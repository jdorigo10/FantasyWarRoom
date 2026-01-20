import React, { useState, useEffect } from "react";
import { useDraftStore } from "@/lib/draftStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { DraftControls } from "@/components/draft/DraftControls";
import { DraftBoard } from "@/components/draft/DraftBoard";
import { PlayerTable } from "@/components/draft/PlayerTable";
import { TeamRoster } from "@/components/draft/TeamRoster";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { Database, Globe, Cpu, CheckCircle2, ShieldAlert } from "lucide-react";

export default function Dashboard() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [loadingStep, setLoadingStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [location] = useLocation();

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
              <ShieldAlert className="h-8 w-8 text-primary" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-display font-bold text-white tracking-tight italic">Fantasy WarRoom</h1>
              <p className="text-muted-foreground text-sm">Syncing Deployment Data (2026-2027 Season)</p>
            </div>

            <div className="w-full space-y-4">
              <Progress value={progress} className="h-2 bg-black/40" />
              
              <div className="flex items-center justify-center space-x-3 text-sm text-primary font-medium">
                {React.createElement(steps[Math.min(loadingStep, steps.length - 1)].icon, { className: "h-4 w-4" })}
                <span>{steps[Math.min(loadingStep, steps.length - 1)].label}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Content switching based on location
  const renderContent = () => {
    switch (location) {
      case "/board":
        return (
          <div className="flex-1 overflow-hidden p-4 flex flex-col space-y-4">
            <div className="bg-[#252526] rounded-md border border-[#333333] flex-1 p-4 min-h-0 flex flex-col shadow-sm">
              <h2 className="text-sm font-display font-bold tracking-widest text-primary uppercase mb-4">Player Analysis Engine (Projections & Stats)</h2>
              <div className="flex-1 min-h-0">
                <PlayerTable />
              </div>
            </div>
          </div>
        );
      case "/team":
        return (
          <div className="flex-1 overflow-hidden p-4">
            <div className="h-full grid grid-cols-1 gap-4">
              <TeamRoster />
            </div>
          </div>
        );
      case "/settings":
        return (
          <div className="flex-1 overflow-hidden p-8">
            <Card className="bg-[#252526] border-[#333333] p-8 max-w-2xl mx-auto">
              <h2 className="text-xl font-display font-bold text-primary mb-6">WARROOM CONFIGURATION</h2>
              <div className="space-y-6">
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-muted-foreground uppercase">League Size</label>
                   <div className="flex gap-2">
                     {[8, 10, 12, 14].map(n => (
                       <Button key={n} variant={n === 12 ? "default" : "outline"} className="flex-1">{n} Teams</Button>
                     ))}
                   </div>
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-muted-foreground uppercase">Scoring Format</label>
                   <div className="flex gap-2">
                     {["Standard", "Half PPR", "PPR"].map(s => (
                       <Button key={s} variant={s === "PPR" ? "default" : "outline"} className="flex-1">{s}</Button>
                     ))}
                   </div>
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-muted-foreground uppercase">Draft Position</label>
                   <input type="range" min="1" max="12" defaultValue="1" className="w-full accent-primary" />
                   <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>PICK 1</span>
                      <span>PICK 12</span>
                   </div>
                 </div>
              </div>
            </Card>
          </div>
        );
      default:
        return (
          <div className="flex-1 overflow-hidden p-4 flex flex-col space-y-4">
            <div className="flex-shrink-0">
               <DraftBoard />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
               <div className="lg:col-span-8 h-full min-h-0 flex flex-col">
                  <div className="bg-[#252526] rounded-md border border-[#333333] flex-1 p-4 min-h-0 flex flex-col shadow-sm">
                     <h2 className="text-sm font-display font-bold tracking-widest text-primary uppercase mb-4">Command Center (Live Draft)</h2>
                     <div className="flex-1 min-h-0">
                        <PlayerTable />
                     </div>
                  </div>
               </div>
               <div className="lg:col-span-4 h-full min-h-0 flex flex-col space-y-4">
                  <TeamRoster />
               </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-[#1e1e1e] overflow-hidden text-[#d4d4d4]">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <DraftControls />
        {renderContent()}
      </main>
    </div>
  );
}
