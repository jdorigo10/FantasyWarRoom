import { z } from "zod";

export type Position = "QB" | "RB" | "WR" | "TE" | "K" | "DST" | "FLEX";

export interface Player {
  id: string;
  rank: number;
  name: string;
  position: Position;
  team: string;
  byeWeek: number;
  ppg: number;
  adp: number;
  risk: "Low" | "Medium" | "High";
  notes: string;
}

const TEAMS = ["ARI", "ATL", "BAL", "BUF", "CAR", "CHI", "CIN", "CLE", "DAL", "DEN", "DET", "GB", "HOU", "IND", "JAX", "KC", "LV", "LAC", "LAR", "MIA", "MIN", "NE", "NO", "NYG", "NYJ", "PHI", "PIT", "SEA", "SF", "TB", "TEN", "WAS"];

const MOCK_NAMES: Record<string, string[]> = {
  QB: ["Josh Allen", "Jalen Hurts", "Patrick Mahomes", "Lamar Jackson", "Joe Burrow", "C.J. Stroud"],
  RB: ["Christian McCaffrey", "Breece Hall", "Bijan Robinson", "Saquon Barkley", "Jonathan Taylor"],
  WR: ["CeeDee Lamb", "Tyreek Hill", "Justin Jefferson", "Ja'Marr Chase", "Amon-Ra St. Brown"],
  TE: ["Sam LaPorta", "Travis Kelce", "Trey McBride", "Mark Andrews", "George Kittle"],
  K: ["Justin Tucker", "Brandon Aubrey", "Harrison Butker"],
  DST: ["Ravens", "Cowboys", "Jets", "49ers"]
};

function generatePlayers(): Player[] {
  const players: Player[] = [];
  let idCounter = 1;
  let rankCounter = 1;

  Object.entries(MOCK_NAMES).forEach(([pos, names]) => {
    names.forEach((name) => {
      players.push({
        id: `p-${idCounter++}`,
        rank: rankCounter++,
        name,
        position: pos as Position,
        team: TEAMS[Math.floor(Math.random() * TEAMS.length)],
        byeWeek: Math.floor(Math.random() * 10) + 5,
        ppg: Number((Math.random() * 10 + 15).toFixed(1)),
        adp: Number((rankCounter + Math.random() * 5).toFixed(1)),
        risk: Math.random() > 0.8 ? "High" : "Low",
        notes: "ESPN projected top tier."
      });
    });
  });

  return players.sort((a, b) => a.rank - b.rank);
}

export const MOCK_PLAYERS = generatePlayers();
