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
import { Database, ShieldAlert, Activity, BarChart, History, TrendingUp, Search, Layers, ShieldCheck } from "lucide-react";
import { INITIALIZATION_STEPS } from "@/lib/mockData";

const STEP_ICONS: Record<string, any> = {
  rankings: Search,
  ppg: BarChart,
  sos: Layers,
  offense: TrendingUp,
  defense: ShieldCheck,
  injury: Activity,
  history_adp: History,
  history_ppg: History,
  trends: Database
};

export default function Dashboard() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [loadingStep, setLoadingStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [location] = useLocation();

  useEffect(() => {
    if (isInitializing) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setIsInitializing(false), 800);
            return 100;
          }
          const next = prev + (Math.random() * 8 + 2);
          const currentProgress = Math.min(next, 100);
          setLoadingStep(Math.floor((currentProgress / 100) * INITIALIZATION_STEPS.length));
          return currentProgress;
        });
      }, 250);
      return () => clearInterval(interval);
    }
  }, [isInitializing]);

  if (isInitializing) {
    const currentStepIndex = Math.min(loadingStep, INITIALIZATION_STEPS.length - 1);
    const currentStep = INITIALIZATION_STEPS[currentStepIndex];
    const Icon = STEP_ICONS[currentStep.key] || Database;

    return (
      <div className="h-screen w-full bg-[#0d1117] flex items-center justify-center p-6 font-sans">
        <Card className="w-full max-w-lg bg-[#161b22] border-[#30363d] p-10 shadow-2xl">
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="h-16 w-16 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
              <ShieldAlert className="h-8 w-8 text-primary" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-display font-bold text-white tracking-tight uppercase italic">WarRoom Data Sync</h1>
              <p className="text-[#8b949e] text-[10px] uppercase tracking-[0.3em] font-mono">ESPN Global Feed / NFL Analytics</p>
            </div>

            <div className="w-full space-y-6">
              <Progress value={progress} className="h-1 bg-black/40" />
              <div className="flex flex-col items-center space-y-3">
                <div className="flex items-center space-x-3 text-sm text-primary font-mono h-6 transition-all duration-300">
                  <Icon className="h-4 w-4 animate-pulse" />
                  <span className="opacity-80">{currentStep.label}</span>
                </div>
                <div className="flex justify-between w-full text-[10px] text-[#6e7681] font-mono uppercase tracking-widest px-1">
                  <span>Step {currentStepIndex + 1} / {INITIALIZATION_STEPS.length}</span>
                  <span>{Math.floor(progress)}%</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const renderContent = () => {
    if (location === "/rankings") {
      return (
        <div className="flex-1 overflow-hidden p-6">
          <Card className="h-full bg-[#161b22] border-[#30363d] flex flex-col shadow-xl">
            <div className="p-6 border-b border-[#30363d] flex items-center justify-between bg-[#0d1117]/50">
               <div>
                  <h2 className="text-xl font-display font-bold text-white tracking-tight">PLAYER RANKINGS</h2>
                  <p className="text-xs text-[#8b949e] font-mono mt-1 uppercase tracking-wider">Master Data: ESPN + Historical Trends</p>
               </div>
            </div>
            <div className="flex-1 min-h-0">
               <PlayerTable showExtendedStats />
            </div>
          </Card>
        </div>
      );
    }

    if (location === "/strategy") {
      return (
        <div className="flex-1 overflow-hidden p-6">
          <Card className="h-full bg-[#161b22] border-[#30363d] flex flex-col p-8 space-y-6">
            <h2 className="text-xl font-display font-bold text-white tracking-tight">DRAFT STRATEGY</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-[#0d1117] border-[#30363d] p-6">
                <h3 className="text-primary font-mono text-sm mb-4">OPTIMAL VALUE TARGETS</h3>
                <p className="text-[#8b949e] text-sm">Based on Projected PPG vs ADP disparity across ESPN platforms.</p>
              </Card>
              <Card className="bg-[#0d1117] border-[#30363d] p-6">
                <h3 className="text-primary font-mono text-sm mb-4">SOS ANALYSIS</h3>
                <p className="text-[#8b949e] text-sm">Teams with the softest early-season schedules (Weeks 1-6).</p>
              </Card>
            </div>
          </Card>
        </div>
      );
    }

    if (location === "/settings") {
      return (
        <div className="p-10 max-w-2xl mx-auto space-y-8">
          <h1 className="text-2xl font-display font-bold text-white uppercase tracking-tight italic">WARROOM SETTINGS</h1>
          
          <div className="grid gap-6">
            <Card className="bg-[#161b22] border-[#30363d] p-8 space-y-6">
              <div className="space-y-4">
                <label className="text-xs font-bold text-[#8b949e] uppercase tracking-widest">Theme Mode</label>
                <div className="flex space-x-4">
                  <Button variant="outline" className="bg-[#21262d] border-[#30363d]">Dark Mode</Button>
                  <Button variant="outline" className="bg-white text-black hover:bg-gray-100">Light Mode</Button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold text-[#8b949e] uppercase tracking-widest">Accent Color</label>
                <div className="flex flex-wrap gap-4">
                  {[
                    { name: "Green", color: "#2ea043" },
                    { name: "Red", color: "#f85149" },
                    { name: "Orange", color: "#f0883e" },
                    { name: "Yellow", color: "#d29922" },
                    { name: "Purple", color: "#8957e5" },
                    { name: "Blue", color: "#388bfd" }
                  ].map(item => (
                    <div key={item.name} className="flex flex-col items-center space-y-2">
                      <div 
                        className="h-10 w-10 rounded-full border-2 border-transparent hover:border-white cursor-pointer transition-all" 
                        style={{ backgroundColor: item.color }} 
                      />
                      <span className="text-[10px] text-[#8b949e]">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="bg-[#161b22] border-[#30363d] p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#8b949e] uppercase tracking-widest">Team Count</label>
                  <select className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-sm text-white">
                    {[8, 10, 12, 14, 16].map(num => <option key={num} value={num}>{num} Teams</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#8b949e] uppercase tracking-widest">Draft Pick</label>
                  <select className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-sm text-white">
                    {Array.from({length: 12}).map((_, i) => <option key={i+1} value={i+1}>Pick {i+1}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#8b949e] uppercase tracking-widest">League Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {["PPR", "1/2 Point PPR", "No PPR"].map(type => (
                    <Button key={type} variant="outline" className="bg-[#21262d] border-[#30363d] text-xs">
                      {type}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      );
    }

    // Default to Draft Tool
    return (
      <div className="flex-1 overflow-hidden p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        <div className="lg:col-span-8 h-full flex flex-col space-y-6 min-h-0">
          <div className="bg-[#161b22] rounded-lg border border-[#30363d] p-6 flex flex-col min-h-0 shadow-xl">
            <h2 className="text-sm font-display font-bold tracking-[0.2em] text-primary uppercase mb-6 flex items-center">
               <div className="h-2 w-2 rounded-full bg-primary animate-pulse mr-3" />
               COMMAND CENTER: DRAFT TOOL
            </h2>
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
