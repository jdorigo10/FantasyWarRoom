import React from "react";
import { DraftSettings, Player } from "@/lib/baseData";
import { useDraftStore, DraftPick } from "@/lib/draftStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw, MonitorPlay, Trash2, ArrowRight, Clock, Download } from "lucide-react";
import * as XLSX from "xlsx-js-style";

export async function exportDraft(
    picks: DraftPick[],
    players: Player[],
    settings: DraftSettings
) {
    //
    // Build rows
    //
    const rows: any[][] = [];

    // Row 1 - Pick Numbers
    const pickHeader = ["Pick"];
    for (let i = 0; i < settings.teams.length; i++) {
        pickHeader.push((i + 1).toString());
    }
    rows.push(pickHeader);

    // Row 2 - Team Names
    const teamHeader = ["Round"];
    for (const team of settings.teams) {
        teamHeader.push(team.name);
    }
    rows.push(teamHeader);

    // Draft rows
    for (let round = 1; round <= 16; round++) {
        const row: any[] = [round];

        for (const team of settings.teams) {

            const pick = picks.find(p =>
                p.round === round &&
                p.teamId === team.id
            );

            if (!pick) {
                row.push("");
                continue;
            }

            const player = players.find(p => p.id === pick.playerId);

            row.push(
                player
                    ? `${player.name} (${player.position})`
                    : ""
            );
        }

        rows.push(row);
    }

    //
    // Create worksheet
    //
    const worksheet = XLSX.utils.aoa_to_sheet(rows);

    //
    // Column widths
    //
    worksheet["!cols"] = rows[0].map((_, index) => ({
        wch: index === 0 ? 8 : 28
    }));

    //
    // Freeze first column + first 2 rows
    //
    worksheet["!freeze"] = {
        xSplit: 1,
        ySplit: 2
    };

    //
    // Styles
    //
    const headerStyle = {
        font: {
            bold: true
        },
        alignment: {
            horizontal: "center",
            vertical: "center"
        }
    };

    const roundStyle = {
        alignment: {
            horizontal: "center",
            vertical: "center"
        }
    };

    //
    // Style first two rows
    //
    const totalCols = settings.teams.length + 1;

    for (let c = 0; c < totalCols; c++) {

        const cell1 = XLSX.utils.encode_cell({ r: 0, c });
        const cell2 = XLSX.utils.encode_cell({ r: 1, c });

        if (worksheet[cell1]) worksheet[cell1].s = headerStyle;
        if (worksheet[cell2]) worksheet[cell2].s = headerStyle;
    }

    //
    // Style first column
    //
    for (let r = 2; r < rows.length; r++) {

        const cell = XLSX.utils.encode_cell({
            r,
            c: 0
        });

        if (worksheet[cell]) worksheet[cell].s = roundStyle;
    }

    //
    // Workbook
    //
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Draft");

    const buffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array"
    });

    //
    // Filename
    //
    const today = new Date();

    const fileName =
        `Draft_${String(today.getMonth() + 1).padStart(2, "0")}` +
        `${String(today.getDate()).padStart(2, "0")}` +
        `${today.getFullYear()}.xlsx`;

    //
    // Show Save As dialog
    //
    const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [
            {
                description: "Excel Workbook",
                accept: {
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
                        ".xlsx"
                    ]
                }
            }
        ]
    });

    const writable = await handle.createWritable();
    await writable.write(buffer);
    await writable.close();
}

export function DraftControls() {
  const { currentPickIndex, simulatePick, resetDraft, undoLastPick, settings, picks, players } = useDraftStore();

  const handleReset = () => {
    if (confirm("This will clear all current picks. Are you sure?")) {
      resetDraft();
    }
  };

  // Helper for pick info
  const getPickDetails = (index: number) => {
    if (index < 0) return null;
    const round = Math.floor(index / settings.teamCount) + 1;
    const pickInRound = (index % settings.teamCount) + 1;
    const isEvenRound = (round - 1) % 2 === 0;
    
    let teamIndex;
    if (isEvenRound) {
        teamIndex = pickInRound - 1;
    } else {
        teamIndex = settings.teamCount - pickInRound;
    }
    
    // Safety check
    if (teamIndex < 0 || teamIndex >= settings.teams.length) return null;
    
    return {
        round,
        pick: pickInRound,
        overall: index + 1,
        team: settings.teams[teamIndex]
    };
  };

  const currentPick = getPickDetails(currentPickIndex);
  
  // Calculate picks until user
  let picksUntilUp = -1;
  // search forward for next user pick
  for (let i = currentPickIndex; i < settings.rounds * settings.teamCount; i++) {
      const details = getPickDetails(i);
      if (details?.team?.isUser) {
          picksUntilUp = i - currentPickIndex;
          break;
      }
  }

  // Previous 3 picks
  const prevPicks = Array.from({length: 3}, (_, i) => currentPickIndex - 3 + i)
    .filter(idx => idx >= 0);

  // Next 3 picks (excluding current)
  const nextPicks = Array.from({length: 3}, (_, i) => currentPickIndex + 1 + i)
    .filter(idx => idx < settings.rounds * settings.teamCount);

  // Check if draft is completed
  const isDraftComplete = (currentPick?.overall ?? 0) > (16 * settings.teams.length);

  const renderMiniPick = (idx: number, isFuture: boolean) => {
      const details = getPickDetails(idx);
      if (!details) return null;
      
      const pickData = picks.find(p => p.pickOverall === idx + 1); // pickOverall is 1-based
      const player = pickData ? players.find(p => p.id === pickData.playerId) : null;
      
      return (
          <div key={idx} className={cn(
              "flex flex-col justify-center min-w-[110px] h-[54px] px-3 py-1.5 rounded border transition-all duration-300",
              isFuture 
                ? "bg-card/50 border-border/50 opacity-40 grayscale-[0.5]" 
                : "bg-muted/50 border-border/50 opacity-70 grayscale-[0.2]"
          )}>
              <div className="flex items-center justify-between text-[8px] uppercase tracking-wider text-muted-foreground font-bold mb-1">
                  <span className={cn(details.team.isUser && "text-primary", "truncate max-w-[80px]")}>
                      {details.team.isUser ? "YOU" : details.team.name}
                  </span>
                  <span className="font-mono opacity-50">{details.round}.{details.pick}</span>
              </div>
              
              {player ? (
                  <div className="text-[10px] font-bold leading-tight truncate max-w-[100px]">
                      {player.name}
                      <div className="text-[8px] font-normal text-muted-foreground flex gap-1 mt-0.5">
                         <span>{player.position}</span>
                         <span>•</span>
                         <span>{player.teamInfo.teamAbbv}</span>
                      </div>
                  </div>
              ) : (
                  <div className="text-[10px] font-bold text-muted-foreground/40 italic mt-1">
                      {isFuture && details.team.isUser ? "Your Pick" : "On Deck"}
                  </div>
              )}
          </div>
      );
  };

  return (
    <div className="bg-card border-b border-border p-2 flex items-center justify-between gap-4 overflow-hidden h-[80px]">
      
    {/* Ticker Section */}
    <div className="flex-1 flex items-center justify-center xl:justify-start gap-4 overflow-hidden">
        {/* Previous Picks (Desktop) */}
        <div className="hidden xl:flex items-center gap-2">
            {prevPicks.map(idx => renderMiniPick(idx, false))}
        </div>
         
         {/* Current Pick - Hero */}
        <div
        className={cn(
            "flex-shrink-0 flex items-center justify-center px-4 py-1.5 rounded-lg border-2 shadow-sm transition-all duration-500 min-w-[240px]",
            isDraftComplete
            ? "bg-muted/30 border-border"
            : currentPick?.team?.isUser
                ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(46,160,67,0.15)]"
                : "bg-card border-border"
        )}
        >
        {isDraftComplete ? (
            <div className="flex-1 flex items-center justify-center xl:justify-start gap-4 overflow-hidden">
                <div className="flex flex-col items-center">
                    <div className="text-xl font-display font-bold">
                        DRAFT COMPLETE
                    </div>

                    <div className="text-[9px] font-bold opacity-60 mt-0.5">
                        {16 * settings.teams.length} PICKS COMPLETED
                    </div>
                </div>

                <Button className="h-7 w-full max-w-[180px] text-primary hover:text-black font-bold text-[10px] uppercase border-primary/20 bg-primary/10 hover:bg-primary/20"
                    onClick={() => exportDraft(picks, players, settings)}
                >
                    <Download className="h-3 w-3" />
                    <span>Export Draft to CSV File</span>
                </Button>
            </div>
        ) : (
            <div className="flex flex-col items-center">
            {/* Top: Info */}
            <div className="text-[10px] font-mono text-muted-foreground font-bold bg-muted/50 px-2 py-0.5 rounded mb-0.5 border border-white/5">
                RD {currentPick?.round} • PICK {currentPick?.pick}
                <span className="opacity-30 mx-1">|</span>
                #{currentPick?.overall}
            </div>

            {/* Middle: Name */}
            <div
                className={cn(
                "text-xl font-display font-bold whitespace-nowrap mb-0.5",
                currentPick?.team?.isUser
                    ? "text-primary animate-pulse"
                    : "text-foreground animate-pulse"
                )}
            >
                {currentPick?.team?.name}
            </div>

            {/* Bottom: Counter */}
            {picksUntilUp > 0 && (
                <div className="text-[9px] font-bold text-primary flex items-center gap-1 opacity-90 bg-primary/10 px-2 py-0.5 rounded-full mt-0.5">
                <Clock className="w-3 h-3" />
                {picksUntilUp} Pick{picksUntilUp !== 1 && "s"} Until You
                </div>
            )}

            {picksUntilUp === 0 && (
                <div className="text-[9px] font-bold text-primary animate-bounce bg-primary/10 px-2 py-0.5 rounded-full mt-0.5">
                MAKE YOUR SELECTION
                </div>
            )}
            </div>
        )}
        </div>

        {/* Next Picks (Desktop) */}
        <div className="hidden xl:flex items-center gap-2">
            {nextPicks.map(idx => renderMiniPick(idx, true))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center space-x-2 border-l pl-4 border-border/50">
        <Button variant="outline" size="sm" disabled={currentPick?.overall == 1} onClick={undoLastPick} className="h-8 text-xs border-white/10 hover:bg-white/5 text-secondary-foreground">
           <RotateCcw className="mr-2 h-3.5 w-3.5" /> Undo
        </Button>
        <Button variant="secondary" size="sm" disabled={isDraftComplete} onClick={simulatePick} className="h-8 text-xs bg-secondary/20 text-secondary-foreground hover:bg-secondary/30">
           <MonitorPlay className="mr-2 h-3.5 w-3.5" /> Sim Pick
        </Button>
        <Button variant="destructive" size="sm" disabled={currentPick?.overall == 1} onClick={handleReset} className="h-8 text-xs">
           <Trash2 className="mr-2 h-3.5 w-3.5" /> Reset
        </Button>
      </div>
    </div>
  );
}