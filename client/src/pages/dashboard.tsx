import React, { useState, useEffect, useRef } from "react";
import { useDraftStore } from "@/lib/draftStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { DraftControls } from "@/components/draft/DraftControls";
import { PlayerTable } from "@/components/draft/PlayerTable";
import { TeamRoster } from "@/components/draft/TeamRoster";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { Database, ShieldHalf, ClipboardClock, CalendarCheck , UserRoundSearch, Trophy, Sparkles, SquareUserRound, CircleCheck, ChevronDown, ExternalLink  } from "lucide-react";
import { LOADER_STEPS, loadBaseTeamInfo, loadSeasonTeamInfo, loadBasePlayerInfo, loadSeasonPlayerInfo, loadPastPlayerInfo, generateAiAnalysis } from "@/lib/dataLoader";
import { Player, PlayerTeam } from "@/lib/baseData";

const STEP_ICONS: Record<string, any> = {
  base_team_info: CalendarCheck,
  season_team_info: ShieldHalf,
  base_player_info: SquareUserRound,
  season_player_info: UserRoundSearch,
  past_player_info: ClipboardClock,
  ai_analysis: Sparkles,
  loading: CircleCheck
};

import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { StrategyView } from "@/components/draft/StrategyView";
import { RosterView } from "@/components/draft/RosterView";

export default function Dashboard() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [loadingStep, setLoadingStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [location] = useLocation();
  const { settings, updateSettings, resetDraft, setPlayers } = useDraftStore();
  const initRef = useRef(false);

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
    if (initRef.current) return;
    initRef.current = true;

    async function loadData() {
      let players: Player[] = [];
      let playerTeams: Record<string, PlayerTeam> = {};

      let index = 0;

      // Step 1: Load Team Base Info
      setLoadingStep(index);
      setProgress(((index) / (LOADER_STEPS.length-1)) * 100);
      playerTeams = await loadBaseTeamInfo(playerTeams);
      index++;

      // Step 2: Load Team Season Info
      setLoadingStep(index);
      setProgress(((index) / (LOADER_STEPS.length-1)) * 100);
      playerTeams = await loadSeasonTeamInfo(playerTeams);
      index++;

      // Step 3: Load Player Base Info 
      setLoadingStep(index);
      setProgress(((index) / (LOADER_STEPS.length-1)) * 100);
      players = await loadBasePlayerInfo(players);
      index++;

      // Step 4: Load Player Season Info 
      setLoadingStep(index);
      setProgress(((index) / (LOADER_STEPS.length-1)) * 100);
      players = await loadSeasonPlayerInfo(players, playerTeams);
      index++;

      // Step 5: Load Past Player Info
      setLoadingStep(index);
      setProgress(((index) / (LOADER_STEPS.length-1)) * 100);
      players = await loadPastPlayerInfo(players);
      index++;

      // Step 6: TODO Generate AI Analysis
      setLoadingStep(index);
      setProgress(((index) / (LOADER_STEPS.length-1)) * 100);
      await generateAiAnalysis();
      index++;
  
      setLoadingStep(index);
      setProgress(((index) / (LOADER_STEPS.length-1)) * 100);
      
      // Store the fully loaded players in the store
      setPlayers(players);
      
      // Small delay before showing UI
      setTimeout(() => setIsInitializing(false), 1000);
    }
    
    loadData();
  }, [setPlayers]);

  if (isInitializing) {
    const currentStepIndex = Math.min(loadingStep, LOADER_STEPS.length - 1);
    const currentStep = LOADER_STEPS[currentStepIndex];
    const Icon = STEP_ICONS[currentStep.key] || Database;

    return (
      <div className={cn("h-screen w-full flex items-center justify-center p-6 font-sans transition-colors duration-500", 
        settings.theme === 'dark' ? "bg-[#0d1117]" : "bg-gray-50")}>
        <Card className={cn("w-full max-w-lg p-10 shadow-2xl transition-colors duration-500", 
          settings.theme === 'dark' ? "bg-[#161b22] border-[#30363d]" : "bg-white border-gray-200")}>
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="h-16 w-16 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
              <Trophy className="h-8 w-8 text-primary" />
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
                  <span>Step {currentStepIndex + 1} / {LOADER_STEPS.length}</span>
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
      updateSettings({ teamCount: count, teams: newTeams, viewedTeamId: "team-1", position: 1 });
      resetDraft();
    }
  };

  const handleScoringChange = (scoring: "Standard" | "PPR" | "Half-PPR") => {
    if (confirm("Changing scoring format will reset the current draft. Continue?")) {
      updateSettings({ scoring });
      resetDraft();
    }
  };

  const handleYearChange = (year: string) => {
    alert("The app needs to reload in order to setup for the selected year: " + year);
    updateSettings({ draftYear: year });
    resetDraft();
    window.location.reload();
  };

  const updateTeamName = (id: string, name: string) => {
    const updatedTeams = settings.teams.map(t => t.id === id ? { ...t, name } : t);
    updateSettings({ teams: updatedTeams });
  };

  const openDetachedView = (view: "rankings" | "roster") => {
    const route = view === "rankings" ? "/rankings-popup" : "/roster-popup";
    const url = `${window.location.origin}${route}`;
    const popup = window.open(url, `${view}-popup`, "width=1400,height=900,left=120,top=80,resizable,scrollbars=no");
    if (popup) {
      popup.focus();
    }
  };

  const toggleUserTeam = (id: string) => {
    // Only allow one user team
    const updatedTeams = settings.teams.map(t => ({
      ...t,
      isUser: t.id === id
    }));
    const newPosition = updatedTeams.findIndex(t => t.id === id) + 1;
    updateSettings({ teams: updatedTeams, position: newPosition });
  };

  const renderContent = () => {
    if (location === "/rankings") {
      return (
        <div className="flex-1 overflow-hidden p-6">
          <Card className={cn("rounded-t h-full flex flex-col shadow-xl transition-colors duration-500",
            settings.theme === 'dark' ? "bg-[#161b22] border-[#30363d]" : "bg-white border-gray-200")}>
            <div className={cn("rounded-t p-6 border-b flex items-center justify-between transition-colors duration-500",
              settings.theme === 'dark' ? "bg-[#161b22] border-[#30363d]" : "bg-white border-gray-200")}>
               <div>
                  <h2 className={cn("text-xl font-display font-bold tracking-tight transition-colors duration-500",
                    settings.theme === 'dark' ? "text-white" : "text-gray-900")}>PLAYER RANKINGS</h2>
               </div>
               <Button
                  variant="outline"
                  className="h-8 border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 hover:text-black"
                  onClick={() => openDetachedView("rankings")}
               >
                  <ExternalLink className="mr-2 h-3.5 w-3.5" />
                  Pop Out
               </Button>
            </div>
            <div className="flex-1 min-h-0">
               <PlayerTable showExtendedStats />
            </div>
          </Card>
        </div>
      );
    }

    if (location === "/roster") {
      return <RosterView />;
    }

    if (location === "/strategy") {
      return <StrategyView />;
    }

    if (location === "/settings") {
      return (
        <div className="flex-1 overflow-hidden p-6">
          <h1 className={cn("p-4 text-3xl font-display font-bold uppercase tracking-tight italic transition-colors duration-500",
            settings.theme === 'dark' ? "text-white" : "text-gray-900")}>APP SETTINGS</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[calc(100%-5rem)]">
            <div className="space-y-8">
              <Card className={cn("p-8 space-y-6 transition-colors duration-500",
                settings.theme === 'dark' ? "bg-[#161b22] border-[#30363d]" : "bg-white border-gray-200")}>
                <div className="space-y-4">
                  <label className="text-xs font-bold text-[#8b949e] uppercase tracking-widest">Data Source</label>
                  <div className="space-y-2">
                    <label className="text-[11px] text-[#8b949e] uppercase font-mono">Draft Year</label>
                    <div className={cn("w-full rounded-lg p-3 text-sm transition-colors opacity-60 cursor-not-allowed flex items-center justify-between",
                        settings.theme === 'dark' ? "bg-[#0d1117] border border-[#30363d] text-white" : "bg-gray-50 border border-gray-200 text-gray-900")}>
                      <span>{settings.draftYear}</span>
                      <span className="text-[10px] uppercase font-bold text-primary/60 tracking-wider">Configured</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className={cn("p-8 space-y-8 transition-colors duration-500",
                settings.theme === 'dark' ? "bg-[#161b22] border-[#30363d]" : "bg-white border-gray-200")}>
                <div className="space-y-5">
                  <label className="text-xs font-bold text-[#8b949e] uppercase tracking-widest">Theme & Appearance</label>
                  <div className="flex space-x-4">
                    <Button 
                      variant={settings.theme === 'dark' ? 'default' : 'outline'}
                      className={cn("flex-1 h-12 text-xs transition-all", settings.theme === 'dark' ? "bg-primary text-white" : "bg-gray-100 text-gray-900")}
                      onClick={() => updateSettings({ theme: 'dark' })}
                    >
                      Dark Mode
                    </Button>
                    <Button 
                      variant={settings.theme === 'light' ? 'default' : 'outline'}
                      className={cn("flex-1 h-12 text-xs transition-all", settings.theme === 'light' ? "bg-primary text-white border-primary" : "bg-white text-gray-900")}
                      onClick={() => updateSettings({ theme: 'light' })}
                    >
                      Light Mode
                    </Button>
                  </div>
                </div>

                <div className="space-y-5">
                  <label className="text-xs font-bold text-[#8b949e] uppercase tracking-widest">Accent Color</label>
                  <div className="grid grid-cols-6 gap-3">
                    {[
                      { name: "Red", color: "#f85149" },
                      { name: "Orange", color: "#f0883e" },
                      { name: "Yellow", color: "#d29922" },
                      { name: "Green", color: "#2ea043" },
                      { name: "Purple", color: "#8957e5" },
                      { name: "Blue", color: "#388bfd" }
                    ].map(item => (
                      <div 
                        key={item.name} 
                        className={cn("flex flex-col items-center p-2 rounded-xl border-2 transition-all cursor-pointer group",
                          settings.accentColor === item.color ? "border-primary bg-primary/5" : "border-transparent hover:bg-black/5")}
                        onClick={() => updateSettings({ accentColor: item.color })}
                      >
                        <div 
                          className="h-7 w-7 rounded-full shadow-md group-hover:scale-110 transition-transform" 
                          style={{ backgroundColor: item.color }} 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-8 flex flex-col min-h-0">
              <Card className={cn("p-8 space-y-6 transition-colors duration-500 flex-shrink-0",
                settings.theme === 'dark' ? "bg-[#161b22] border-[#30363d]" : "bg-white border-gray-200")}>
                <div className="space-y-4">
                  <label className="text-xs font-bold text-[#8b949e] uppercase tracking-widest">League Configuration</label>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] text-[#8b949e] uppercase font-mono">Team Count</label>
                      <div className="relative min-w-[160px]">
                        <select
                          className={cn("appearance-none w-full rounded-lg p-2.5 text-sm transition-colors border",
                            settings.theme === 'dark' ? "bg-[#0d1117] border-[#30363d] text-white" : "bg-gray-50 border-gray-200 text-gray-900")}
                          value={settings.teamCount}
                          onChange={(e) => handleTeamCountChange(parseInt(e.target.value))}
                        >
                          {[8, 9, 10, 11, 12, 13, 14, 15, 16].map(num => <option key={num} value={num}>{num} Teams</option>)}
                        </select>
                        <ChevronDown 
                          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] text-[#8b949e] uppercase font-mono">Scoring</label>
                      <div className={cn("w-full rounded-lg p-3 text-sm transition-colors opacity-60 cursor-not-allowed flex items-center justify-between",
                          settings.theme === 'dark' ? "bg-[#0d1117] border border-[#30363d] text-white" : "bg-gray-50 border border-gray-200 text-gray-900")}>
                        <span>{settings.scoring}</span>
                        <span className="text-[10px] uppercase font-bold text-primary/60 tracking-wider">Configured</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className={cn("p-8 flex flex-col transition-colors duration-500 h-fit",
                settings.theme === 'dark' ? "bg-[#161b22] border-[#30363d]" : "bg-white border-gray-200")}>
                <div className="flex items-center justify-between mb-6 flex-shrink-0">
                  <label className="text-xs font-bold text-[#8b949e] uppercase tracking-widest">Teams & Order</label>
                </div>
                <div className="pr-2 scrollbar-hide">
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                    {settings.teams.map((team, idx) => (
                      <div key={team.id} className={cn("flex items-center space-x-2 p-1.5 rounded-lg border transition-all",
                        settings.theme === 'dark' ? "bg-[#0d1117] border-[#30363d]" : "bg-gray-50 border-gray-200")}>
                        <div className="flex-shrink-0 w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary font-mono">
                          {idx + 1}
                        </div>
                        <Input 
                          value={team.name}
                          onChange={(e) => updateTeamName(team.id, e.target.value)}
                          className={cn("h-6 bg-transparent border-none text-[10px] focus-visible:ring-0 px-0 truncate flex-1",
                            settings.theme === 'dark' ? "text-white" : "text-gray-900")}
                        />
                        <Checkbox 
                          checked={team.isUser} 
                          onCheckedChange={() => toggleUserTeam(team.id)}
                          className="border-primary data-[state=checked]:bg-primary h-3.5 w-3.5"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-display font-bold tracking-[0.2em] text-primary uppercase flex items-center">
                 <div className="h-2 w-2 rounded-full bg-primary animate-pulse mr-3" />
                 BIG BOARD
              </h2>
            </div>
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
