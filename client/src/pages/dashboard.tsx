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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { Database, Globe, Cpu, CheckCircle2, ShieldAlert, BarChart3, Search, LayoutDashboard } from "lucide-react";

export default function Dashboard() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [loadingStep, setLoadingStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [location] = useLocation();
  const { settings } = useDraftStore();

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
            setTimeout(() => setIsInitializing(false), 800);
            return 100;
          }
          const next = prev + (Math.random() * 12);
          setLoadingStep(Math.floor((next / 100) * steps.length));
          return Math.min(next, 100);
        });
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isInitializing]);

  if (isInitializing) {
    return (
      <div className="h-screen w-full bg-[#0f1115] flex items-center justify-center p-6 font-sans">
        <Card className="w-full max-w-md bg-[#161b22] border-[#30363d] p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="h-16 w-16 bg-primary/20 rounded-xl flex items-center justify-center animate-pulse">
              <ShieldAlert className="h-8 w-8 text-primary" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-display font-bold text-white tracking-tight italic">Fantasy WarRoom</h1>
              <p className="text-muted-foreground text-xs uppercase tracking-widest">ESPN Data Synchronization Engine</p>
            </div>

            <div className="w-full space-y-4">
              <Progress value={progress} className="h-2 bg-black/40" />
              
              <div className="flex items-center justify-center space-x-3 text-sm text-primary font-medium h-6">
                {React.createElement(steps[Math.min(loadingStep, steps.length - 1)].icon, { className: "h-4 w-4" })}
                <span className="animate-in fade-in slide-in-from-bottom-1">{steps[Math.min(loadingStep, steps.length - 1)].label}</span>
              </div>
            </div>

            <div className="pt-4 w-full border-t border-[#30363d] text-[10px] font-mono text-[#6e7681] text-left overflow-hidden">
               <div className="opacity-50">&gt; ESTABLISHING ESPN HANDSHAKE... OK</div>
               <div className="opacity-70">&gt; LOCATING TARGET: fantasy.espn.com... FOUND</div>
               <div className="animate-pulse">&gt; SCRAPING LIVE DRAFT ADP DATA... {Math.floor(progress)}%</div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0f1115] overflow-hidden text-[#adbac7]">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <DraftControls />
        
        <div className="flex-1 overflow-hidden p-4 flex flex-col space-y-4">
          <Tabs defaultValue="draft" className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
               <TabsList className="bg-[#161b22] border border-[#30363d]">
                  <TabsTrigger value="draft" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <LayoutDashboard className="h-4 w-4 mr-2" /> DRAFT ENGINE
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <BarChart3 className="h-4 w-4 mr-2" /> ADVANCED ANALYTICS
                  </TabsTrigger>
               </TabsList>
               <div className="flex items-center space-x-2 text-[10px] font-mono text-muted-foreground bg-[#161b22] px-3 py-1 rounded border border-[#30363d]">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span>SOURCE: ESPN LIVE ADP</span>
               </div>
            </div>

            <TabsContent value="draft" className="flex-1 min-h-0 mt-0">
              <div className="h-full flex flex-col space-y-4">
                 <div className="flex-shrink-0">
                    <DraftBoard />
                 </div>
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
                    <div className="lg:col-span-8 h-full min-h-0 flex flex-col">
                       <div className="bg-[#1c2128] rounded-md border border-[#30363d] flex-1 p-4 min-h-0 flex flex-col">
                          <h2 className="text-sm font-display font-bold tracking-widest text-primary uppercase mb-4">Command Center (ESPN Integrated)</h2>
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
            </TabsContent>

            <TabsContent value="analytics" className="flex-1 min-h-0 mt-0">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full overflow-auto">
                  <Card className="bg-[#1c2128] border-[#30363d] p-6">
                    <h2 className="text-lg font-display font-bold text-primary mb-6">PREDICTIVE VALUE ANALYSIS</h2>
                    <div className="space-y-6">
                       {[
                         { label: "Positional Scarcity (RB)", val: "CRITICAL", color: "text-red-500", p: 85 },
                         { label: "Value Over Replacement (WR)", val: "OPTIMAL", color: "text-primary", p: 40 },
                         { label: "Draft Position Leverage", val: "NOMINAL", color: "text-blue-400", p: 65 }
                       ].map((m, i) => (
                         <div key={i} className="space-y-2">
                           <div className="flex justify-between text-xs font-bold uppercase">
                             <span className="text-muted-foreground">{m.label}</span>
                             <span className={m.color}>{m.val}</span>
                           </div>
                           <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                             <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${m.p}%` }} />
                           </div>
                         </div>
                       ))}
                    </div>
                  </Card>
                  
                  <Card className="bg-[#1c2128] border-[#30363d] p-6">
                    <h2 className="text-lg font-display font-bold text-primary mb-4">ESPN TREND REPORT</h2>
                    <div className="space-y-4">
                       <div className="p-3 bg-primary/5 border border-primary/20 rounded-md">
                          <p className="text-sm text-[#adbac7] leading-relaxed">
                            <span className="font-bold text-primary">STRATEGY:</span> Current ESPN ADP shows a heavy run on WRs in the mid-2nd round. Pivoting to a top-tier RB here provides a +12.4% VOR advantage.
                          </p>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-black/20 rounded-md border border-[#30363d]">
                             <div className="text-[10px] text-muted-foreground uppercase font-bold">Draft Projection</div>
                             <div className="text-2xl font-bold text-white">#3/12</div>
                          </div>
                          <div className="p-4 bg-black/20 rounded-md border border-[#30363d]">
                             <div className="text-[10px] text-muted-foreground uppercase font-bold">Strength of Schedule</div>
                             <div className="text-2xl font-bold text-primary">A-</div>
                          </div>
                       </div>
                    </div>
                  </Card>
               </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
