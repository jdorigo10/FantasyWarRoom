import React, { useMemo, useState } from "react";
import { useDraftStore } from "@/lib/draftStore";
import { useLiveStrategies } from "@/hooks/useLiveStrategies";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Info, ArrowUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Player } from "@/lib/baseData";

export interface SavedStrategy {
    id: string;
    name: string;
    rank: number;          // order in the list
    createdAt: number;
    updatedAt: number;

    rounds: StrategyRound[];
}

export interface StrategyRound {
    round: number;

    // First player is the preferred choice
    players: Player[]; // length 0-5
}

export function SavedStrategyView() {
    const { settings } = useDraftStore();
    
    return (
        <div className="flex-1 min-h-0 overflow-hidden p-6 flex flex-col space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-display font-bold tracking-tight uppercase italic">
                Saved Strategies
                </h2>
                <div className="flex items-center gap-3">
                <Info className="h-3 w-3 text-primary" />
                <span className="text-l text-[#8b949e] font-semibold uppercase tracking-widest">Pick {settings.position} {" ("}{settings.teamCount}{" Team Draft)"}</span>
                </div>
            </div>

            {/* Content */}
            <div className="grid grid-cols-[320px_1fr] gap-6 flex-1 min-h-0 overflow-hidden">
                {/* LEFT */}
                <Card className="flex-1 min-h-0 bg-[#161b22] border-[#30363d] overflow-hidden flex flex-col shadow-2xl items-center">
                    <div className="w-full bg-[#0d1117] border-b border-[#30363d]">
                        <div className="relative flex items-center justify-center h-16 px-4">
                            <h2 className="text-m font-bold font-display tracking-[0.2em] text-primary uppercase">
                                Strategy
                            </h2>
                            <Button size="sm" className="absolute right-3 h-7 bg-primary/10 text-primary hover:bg-primary hover:text-black font-bold text-[10px] uppercase border border-primary/30 shadow-[0_0_10px_rgba(46,160,67,0.05)]">
                                <Plus className="mr-0 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <ScrollArea className="flex-1">
                    </ScrollArea>
                </Card>

                {/* RIGHT */}
                <Card className="flex-1 min-h-0 bg-[#161b22] border-[#30363d] overflow-hidden flex flex-col shadow-2xl items-center">
                    <div className="w-full bg-[#0d1117] border-b border-[#30363d]">
                        <div className="relative flex items-center justify-center h-16 px-4">
                            <h2 className="text-m font-bold font-display tracking-[0.2em] text-primary uppercase">
                                Details
                            </h2>
                        </div>
                    </div>
                    <ScrollArea className="flex-1">
                    </ScrollArea>
                </Card>
            </div>
    </div>
    );
}