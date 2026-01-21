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
import { useLocation } from "wouter";
import { Database, Globe, Cpu, CheckCircle2, ShieldAlert, BarChart3, Search } from "lucide-react";

export default function Dashboard() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [loadingStep, setLoadingStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [location] = useLocation();
  const { settings, players, pickedPlayers, makePick, myRoster } = useDraftStore();

  const steps = [
    { icon: Globe, label: "Connecting to ESPN Data Endpoints..." },
    { icon: Search, label: "Scraping Live Draft Results (ESPN ADP)..." },
    { icon: Database, label: "Retrieving ESPN Insider Projections..." },
    { icon: Cpu, label: "Analyzing 5-Year Trends & Strength of Schedule..." },
    { icon: CheckCircle2, label: "Synchronizing WarRoom Tactical Engine..." }
  ];

  useEffect(() => {
    if (isInitializing) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setIsInitializing(false), 1200);
            return 100;
          }
          const next = prev + (Math.random() * 15);
          setLoadingStep(Math.floor((next / 100) * steps.length));
          return Math.min(next, 100);
        });
      }, 400);
      return () => clearInterval(interval);
    }
  }, [isInitializing]);

  if (isInitializing) {
    return (
      <div className="h-screen w-full bg-[#0d1117] flex items-center justify-center p-6 font-sans">
        <Card className="w-full max-w-md bg-[#161b22] border-[#30363d] p-10 shadow-2xl">
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="h-20 w-20 bg-primary/20 rounded-2xl flex items-center justify-center animate-pulse border border-primary/30">
              <ShieldAlert className="h-10 w-10 text-primary" />
            </div>
            
            <div className="space-y-3">
              <h1 className="text-3xl font-display font-bold text-white tracking-tighter italic">WARROOM INITIALIZATION</h1>
              <p className="text-[#8b949e] text-xs uppercase tracking-[0.2em] font-mono">Syncing ESPN Data Feed</p>
            </div>

            <div className="w-full space-y-6">
              <Progress value={progress} className="h-1.5 bg-black/40" />
              <div className="flex flex-col items-center space-y-2">
                <div className="flex items-center space-x-3 text-sm text-primary font-mono h-6">
                  {React.createElement(steps[Math.min(loadingStep, steps.length - 1)].icon, { className: "h-4 w-4" })}
                  <span>{steps[Math.min(loadingStep, loadingStep)].label}</span>
                </div>
                <span className="text-[10px] text-[#6e7681] font-mono uppercase tracking-widest">{Math.floor(progress)}% COMPLETE</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const renderContent = () => {
    if (location === "/board") {
      return (
        <div className="flex-1 overflow-hidden p-6">
          <Card className="h-full bg-[#161b22] border-[#30363d] flex flex-col shadow-xl">
            <div className="p-6 border-b border-[#30363d] flex items-center justify-between bg-[#0d1117]/50">
               <div>
                  <h2 className="text-xl font-display font-bold text-white tracking-tight">DRAFT BOARD</h2>
                  <p className="text-xs text-[#8b949e] font-mono mt-1 uppercase tracking-wider">Live ESPN Rankings & Analytics</p>
               </div>
               <div className="flex space-x-2">
                  {["ALL", "QB", "RB", "WR", "TE", "DST", "K", "FLEX"].map(pos => (
                     <Button key={pos} variant="outline" size="sm" className="bg-[#21262d] border-[#30363d] text-xs h-8 hover:bg-[#30363d]">
                        {pos}
                     </Button>
                  ))}
               </div>
            </div>
            <div className="flex-1 min-h-0">
               <PlayerTable showExtendedStats />
            </div>
          </Card>
        </div>
      );
    }

    if (location === "/settings") {
       return (
         <div className="p-10 max-w-2xl mx-auto space-y-8">
            <h1 className="text-2xl font-display font-bold text-white">SYSTEM VISUALS</h1>
            <Card className="bg-[#161b22] border-[#30363d] p-8 space-y-6">
               <div className="space-y-4">
                  <label className="text-xs font-bold text-[#8b949e] uppercase tracking-widest">Interface Accent</label>
                  <div className="flex space-x-4">
                     {["#2ea043", "#388bfd", "#f85149", "#f0883e"].map(color => (
                        <div key={color} className="h-10 w-10 rounded-full border-2 border-transparent hover:border-white cursor-pointer transition-all" style={{ backgroundColor: color }} />
                     ))}
                  </div>
               </div>
            </Card>
         </div>
       );
    }

    return (
      <div className="flex-1 overflow-hidden p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        <div className="lg:col-span-8 h-full flex flex-col space-y-6 min-h-0">
          <div className="bg-[#161b22] rounded-lg border border-[#30363d] p-6 flex flex-col min-h-0 shadow-xl">
            <h2 className="text-sm font-display font-bold tracking-[0.2em] text-primary uppercase mb-6 flex items-center">
               <div className="h-2 w-2 rounded-full bg-primary animate-pulse mr-3" />
               COMMAND CENTER: MOCK DRAFT
            </h2>
            <div className="flex-shrink-0 mb-6">
               <DraftBoard />
            </div>
            <div className="flex-1 min-h-0 bg-[#0d1117] rounded border border-[#30363d]">
               <PlayerTable />
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 h-full flex flex-col space-y-6 min-h-0">
          <TeamRoster showSuggested />
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#0d1117] overflow-hidden text-[#c9d1d9] font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 bg-gradient-to-br from-[#0d1117] to-[#161b22]">
        <DraftControls />
        {renderContent()}
      </main>
    </div>
  );
}
