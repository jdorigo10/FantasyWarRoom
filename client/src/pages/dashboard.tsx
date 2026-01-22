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
import { Database, ShieldAlert, Activity, BarChart, History, TrendingUp, Search, Layers, ShieldCheck, Shield } from "lucide-react";
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

import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [loadingStep, setLoadingStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [location] = useLocation();
  const { settings, updateSettings, resetDraft } = useDraftStore();

  useEffect(() => {
    // Apply theme and accent color
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
    document.documentElement.classList.toggle('light', settings.theme === 'light');
    
    // Set the primary color for Tailwind to pick up
    // We update the CSS variable that the primary color maps to
    const root = document.documentElement;
    if (root) {
      root.style.setProperty('--primary', settings.accentColor);
      root.style.setProperty('--ring', settings.accentColor);
    }
  }, [settings.theme, settings.accentColor]);

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
      <div className={cn("h-screen w-full flex items-center justify-center p-6 font-sans transition-colors duration-500", 
        settings.theme === 'dark' ? "bg-[#0d1117]" : "bg-gray-50")}>
        <Card className={cn("w-full max-w-lg p-10 shadow-2xl transition-colors duration-500", 
          settings.theme === 'dark' ? "bg-[#161b22] border-[#30363d]" : "bg-white border-gray-200")}>
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="h-16 w-16 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
              <Shield className="h-8 w-8 text-primary" fill="currentColor" />
            </div>
            
            <div className="space-y-2">
              <h1 className={cn("text-2xl font-display font-bold tracking-tight uppercase italic transition-colors duration-500",
                settings.theme === 'dark' ? "text-white" : "text-gray-900")}>FANTASY WARROOM</h1>
              <p className="text-[#8b949e] text-[10px] uppercase tracking-[0.3em] font-mono">Draft Analysis Tool</p>
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

  const handleTeamCountChange = (count: number) => {
    if (confirm("Changing team count will reset the current draft. Continue?")) {
      const newTeams = Array.from({ length: count }, (_, i) => ({
        id: `team-${i + 1}`,
        name: `Team ${i + 1}`,
        isUser: i === 0
      }));
      updateSettings({ teamCount: count, teams: newTeams, viewedTeamId: "team-1" });
      resetDraft();
    }
  };

  const handleScoringChange = (scoring: "Standard" | "PPR" | "Half-PPR") => {
    if (confirm("Changing scoring format will reset the current draft. Continue?")) {
      updateSettings({ scoring });
      resetDraft();
    }
  };

  const updateTeamName = (id: string, name: string) => {
    const updatedTeams = settings.teams.map(t => t.id === id ? { ...t, name } : t);
    updateSettings({ teams: updatedTeams });
  };

  const toggleUserTeam = (id: string) => {
    // Only allow one user team
    const updatedTeams = settings.teams.map(t => ({
      ...t,
      isUser: t.id === id
    }));
    updateSettings({ teams: updatedTeams });
  };

  const renderContent = () => {
    if (location === "/rankings") {
      return (
        <div className="flex-1 overflow-hidden p-6">
          <Card className={cn("h-full flex flex-col shadow-xl transition-colors duration-500",
            settings.theme === 'dark' ? "bg-[#161b22] border-[#30363d]" : "bg-white border-gray-200")}>
            <div className={cn("p-6 border-b flex items-center justify-between transition-colors duration-500",
              settings.theme === 'dark' ? "border-[#30363d] bg-[#0d1117]/50" : "border-gray-200 bg-gray-50/50")}>
               <div>
                  <h2 className={cn("text-xl font-display font-bold tracking-tight transition-colors duration-500",
                    settings.theme === 'dark' ? "text-white" : "text-gray-900")}>PLAYER RANKINGS</h2>
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
          <Card className={cn("h-full flex flex-col p-8 space-y-6 transition-colors duration-500",
            settings.theme === 'dark' ? "bg-[#161b22] border-[#30363d]" : "bg-white border-gray-200")}>
            <h2 className={cn("text-xl font-display font-bold tracking-tight transition-colors duration-500",
              settings.theme === 'dark' ? "text-white" : "text-gray-900")}>DRAFT STRATEGY</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className={cn("p-6 transition-colors duration-500",
                settings.theme === 'dark' ? "bg-[#0d1117] border-[#30363d]" : "bg-gray-50 border-gray-200")}>
                <h3 className="text-primary font-mono text-sm mb-4">OPTIMAL VALUE TARGETS</h3>
                <p className="text-[#8b949e] text-sm">Based on Projected PPG vs ADP disparity across ESPN platforms.</p>
              </Card>
              <Card className={cn("p-6 transition-colors duration-500",
                settings.theme === 'dark' ? "bg-[#0d1117] border-[#30363d]" : "bg-gray-50 border-gray-200")}>
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
        <div className="p-10 max-w-4xl mx-auto space-y-8 overflow-y-auto max-h-full scrollbar-hide">
          <h1 className={cn("text-2xl font-display font-bold uppercase tracking-tight italic transition-colors duration-500",
            settings.theme === 'dark' ? "text-white" : "text-gray-900")}>APP SETTINGS</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Card className={cn("p-8 space-y-6 transition-colors duration-500",
                settings.theme === 'dark' ? "bg-[#161b22] border-[#30363d]" : "bg-white border-gray-200")}>
                <div className="space-y-4">
                  <label className="text-xs font-bold text-[#8b949e] uppercase tracking-widest">Theme Mode</label>
                  <div className="flex space-x-4">
                    <Button 
                      variant={settings.theme === 'dark' ? 'default' : 'outline'}
                      className={cn("flex-1 transition-all", settings.theme === 'dark' ? "bg-primary text-white" : "bg-gray-100 text-gray-900")}
                      onClick={() => updateSettings({ theme: 'dark' })}
                    >
                      Dark Mode
                    </Button>
                    <Button 
                      variant={settings.theme === 'light' ? 'default' : 'outline'}
                      className={cn("flex-1 transition-all", settings.theme === 'light' ? "bg-primary text-white border-primary" : "bg-white text-gray-900")}
                      onClick={() => updateSettings({ theme: 'light' })}
                    >
                      Light Mode
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-[#8b949e] uppercase tracking-widest">Accent Color</label>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { name: "Green", color: "#2ea043" },
                      { name: "Red", color: "#f85149" },
                      { name: "Orange", color: "#f0883e" },
                      { name: "Yellow", color: "#d29922" },
                      { name: "Purple", color: "#8957e5" },
                      { name: "Blue", color: "#388bfd" }
                    ].map(item => (
                      <div 
                        key={item.name} 
                        className={cn("flex flex-col items-center space-y-2 p-2 rounded-xl border-2 transition-all cursor-pointer group",
                          settings.accentColor === item.color ? "border-primary bg-primary/5" : "border-transparent hover:bg-black/5")}
                        onClick={() => updateSettings({ accentColor: item.color })}
                      >
                        <div 
                          className="h-8 w-8 rounded-full shadow-lg group-hover:scale-110 transition-transform" 
                          style={{ backgroundColor: item.color }} 
                        />
                        <span className="text-[10px] font-bold text-[#8b949e] uppercase tracking-tighter">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <Card className={cn("p-8 space-y-6 transition-colors duration-500",
                settings.theme === 'dark' ? "bg-[#161b22] border-[#30363d]" : "bg-white border-gray-200")}>
                <div className="space-y-4">
                  <label className="text-xs font-bold text-[#8b949e] uppercase tracking-widest">League Configuration</label>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] text-[#8b949e] uppercase font-mono">Team Count</label>
                      <select 
                        className={cn("w-full rounded p-2 text-sm transition-colors",
                          settings.theme === 'dark' ? "bg-[#0d1117] border-[#30363d] text-white" : "bg-gray-50 border-gray-200 text-gray-900")}
                        value={settings.teamCount}
                        onChange={(e) => handleTeamCountChange(parseInt(e.target.value))}
                      >
                        {[8, 10, 12, 14, 16].map(num => <option key={num} value={num}>{num} Teams</option>)}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] text-[#8b949e] uppercase font-mono">Scoring Format</label>
                      <div className="flex gap-2">
                        {["PPR", "Half-PPR", "Standard"].map(type => (
                          <Button 
                            key={type} 
                            variant={settings.scoring === type ? 'default' : 'outline'}
                            className={cn("flex-1 text-[10px] h-8", 
                              settings.scoring === type ? "bg-primary text-white" : "")}
                            onClick={() => handleScoringChange(type as any)}
                          >
                            {type}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <Card className={cn("p-8 flex flex-col transition-colors duration-500",
              settings.theme === 'dark' ? "bg-[#161b22] border-[#30363d]" : "bg-white border-gray-200")}>
              <div className="flex items-center justify-between mb-6">
                <label className="text-xs font-bold text-[#8b949e] uppercase tracking-widest">Teams & Draft Order</label>
                <span className="text-[10px] font-mono text-[#8b949e]">{settings.teamCount} Teams Registered</span>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
                <div className="grid grid-cols-2 gap-3">
                  {settings.teams.map((team, idx) => (
                    <div key={team.id} className={cn("flex items-center space-x-3 p-3 rounded-lg border transition-all",
                      settings.theme === 'dark' ? "bg-[#0d1117] border-[#30363d]" : "bg-gray-50 border-gray-200")}>
                      <div className="flex-shrink-0 w-6 h-6 rounded bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary font-mono">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Input 
                          value={team.name}
                          onChange={(e) => updateTeamName(team.id, e.target.value)}
                          className={cn("h-7 bg-transparent border-none text-[11px] focus-visible:ring-0 px-0 truncate",
                            settings.theme === 'dark' ? "text-white" : "text-gray-900")}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          checked={team.isUser} 
                          onCheckedChange={() => toggleUserTeam(team.id)}
                          className="border-primary data-[state=checked]:bg-primary h-4 w-4"
                        />
                      </div>
                    </div>
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
          <div className={cn("rounded-lg border p-6 flex flex-col min-h-0 shadow-xl transition-colors duration-500",
            settings.theme === 'dark' ? "bg-[#161b22] border-[#30363d]" : "bg-white border-gray-200")}>
            <h2 className="text-sm font-display font-bold tracking-[0.2em] text-primary uppercase mb-6 flex items-center">
               <div className="h-2 w-2 rounded-full bg-primary animate-pulse mr-3" />
               COMMAND CENTER: DRAFT TOOL
            </h2>
            <div className={cn("flex-1 min-h-0 rounded border transition-colors duration-500",
              settings.theme === 'dark' ? "bg-[#0d1117] border-[#30363d]" : "bg-gray-50 border-gray-200")}>
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
    <div className={cn("flex h-screen overflow-hidden font-sans transition-colors duration-500",
      settings.theme === 'dark' ? "bg-[#0d1117] text-[#c9d1d9]" : "bg-gray-50 text-gray-900")}>
      <Sidebar />
      <main className={cn("flex-1 flex flex-col min-w-0 transition-colors duration-500",
        settings.theme === 'dark' ? "bg-gradient-to-br from-[#0d1117] to-[#161b22]" : "bg-white")}>
        <DraftControls />
        {renderContent()}
      </main>
    </div>
  );
}
