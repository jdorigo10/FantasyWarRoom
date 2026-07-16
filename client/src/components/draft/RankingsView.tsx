import React, { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { PlayerTable } from "@/components/draft/PlayerTable";
import { useDraftStore } from "@/lib/draftStore";
import { cn } from "@/lib/utils";

export function RankingsView() {
  const { settings } = useDraftStore();

  useEffect(() => {
    const root = document.documentElement;
    if (!root) return;

    root.classList.toggle("dark", settings.theme === "dark");
    root.classList.toggle("light", settings.theme === "light");
    root.style.setProperty("--primary", settings.accentColor);
    root.style.setProperty("--ring", settings.accentColor);
    root.style.setProperty("color-scheme", settings.theme === "dark" ? "dark" : "light");
  }, [settings.theme, settings.accentColor]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0d1117] p-3">
      <Card className={cn(
        "h-full w-full min-h-0 overflow-hidden border shadow-2xl flex flex-col",
        settings.theme === "dark" ? "border-[#30363d] bg-[#161b22]" : "border-gray-200 bg-white"
      )}>
        <div className={cn(
          "flex items-center justify-between border-b px-4 py-3",
          settings.theme === "dark" ? "border-[#30363d] bg-[#161b22]/90" : "border-gray-200 bg-white"
        )}>
          <div>
            <h2 className={cn(
              "text-sm font-display font-bold uppercase tracking-[0.2em]",
              settings.theme === "dark" ? "text-white" : "text-gray-900"
            )}>
              PLAYER RANKINGS
            </h2>
            <p className={cn(
              "text-[10px] uppercase tracking-[0.3em]",
              settings.theme === "dark" ? "text-[#8b949e]" : "text-gray-500"
            )}>
              Draft board
            </p>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          <PlayerTable showExtendedStats />
        </div>
      </Card>
    </div>
  );
}
