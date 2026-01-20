import { z } from "zod";

// --- Types ---

export type Position = "QB" | "RB" | "WR" | "TE" | "K" | "DST";

export interface Player {
  id: string;
  name: string;
  position: Position;
  team: string;
  byeWeek: number;
  adp: number; // Average Draft Position
  auctionValue: number;
  projectedPoints: number; // For the upcoming season
  lastSeasonPoints: number;
  risk: "Low" | "Medium" | "High";
  trend: "Up" | "Down" | "Stable";
  age: number;
  notes: string;
  stats: {
    passingYds?: number;
    passingTDs?: number;
    rushingYds?: number;
    rushingTDs?: number;
    receivingYds?: number;
    receivingTDs?: number;
    receptions?: number;
  };
}

export interface DraftSettings {
  teamCount: number;
  position: number; // User's draft position (1-based)
  scoring: "Standard" | "PPR" | "Half-PPR";
  rounds: number;
}

export interface DraftPick {
  round: number;
  pickOverall: number;
  playerId: string | null; // Null if not yet picked
  pickedBy: "User" | "CPU";
}

// --- Mock Data Generators ---

const TEAMS = ["ARI", "ATL", "BAL", "BUF", "CAR", "CHI", "CIN", "CLE", "DAL", "DEN", "DET", "GB", "HOU", "IND", "JAX", "KC", "LV", "LAC", "LAR", "MIA", "MIN", "NE", "NO", "NYG", "NYJ", "PHI", "PIT", "SEA", "SF", "TB", "TEN", "WAS"];
const NAMES = {
  QB: ["Patrick Mahomes", "Josh Allen", "Jalen Hurts", "Lamar Jackson", "Joe Burrow", "C.J. Stroud", "Jordan Love", "Anthony Richardson", "Dak Prescott", "Kyler Murray"],
  RB: ["Christian McCaffrey", "Breece Hall", "Bijan Robinson", "Jahmyr Gibbs", "Jonathan Taylor", "Saquon Barkley", "Kyren Williams", "De'Von Achane", "Travis Etienne", "Derrick Henry", "Isiah Pacheco", "James Cook"],
  WR: ["CeeDee Lamb", "Tyreek Hill", "Justin Jefferson", "Ja'Marr Chase", "Amon-Ra St. Brown", "A.J. Brown", "Puka Nacua", "Garrett Wilson", "Marvin Harrison Jr.", "Davante Adams", "Chris Olave", "Drake London"],
  TE: ["Sam LaPorta", "Travis Kelce", "Trey McBride", "Mark Andrews", "Dalton Kincaid", "George Kittle", "Kyle Pitts", "Evan Engram", "Jake Ferguson", "David Njoku"]
};

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePlayers(): Player[] {
  const players: Player[] = [];
  let idCounter = 1;

  // Generate top tier players with better stats
  (Object.keys(NAMES) as Position[]).forEach(pos => {
    if (pos === 'K' || pos === 'DST') return; 
    
    NAMES[pos].forEach((name, index) => {
      const isTopTier = index < 3;
      const baseProj = isTopTier ? 300 : 200;
      
      players.push({
        id: `p-${idCounter++}`,
        name: name,
        position: pos,
        team: TEAMS[randomInt(0, TEAMS.length - 1)],
        byeWeek: randomInt(5, 14),
        adp: (index + 1) * (pos === 'QB' ? 2 : 1) + (pos === 'RB' ? 0 : 5), // Rough logic
        auctionValue: Math.max(1, 60 - index * 3),
        projectedPoints: baseProj + randomInt(-20, 50),
        lastSeasonPoints: baseProj + randomInt(-40, 40),
        risk: Math.random() > 0.8 ? "High" : Math.random() > 0.5 ? "Medium" : "Low",
        trend: Math.random() > 0.7 ? "Up" : Math.random() > 0.3 ? "Stable" : "Down",
        age: randomInt(21, 32),
        notes: isTopTier ? "Elite option, high floor." : "Solid starter with upside.",
        stats: {
          passingYds: pos === 'QB' ? randomInt(3500, 4500) : 0,
          passingTDs: pos === 'QB' ? randomInt(25, 40) : 0,
          rushingYds: pos === 'RB' ? randomInt(800, 1400) : pos === 'QB' ? randomInt(200, 800) : 0,
          rushingTDs: pos === 'RB' ? randomInt(8, 15) : pos === 'QB' ? randomInt(2, 8) : 0,
          receivingYds: pos === 'WR' ? randomInt(1000, 1600) : pos === 'TE' ? randomInt(600, 1000) : pos === 'RB' ? randomInt(200, 600) : 0,
          receivingTDs: pos === 'WR' ? randomInt(8, 14) : pos === 'TE' ? randomInt(4, 10) : pos === 'RB' ? randomInt(2, 6) : 0,
          receptions: pos === 'WR' ? randomInt(80, 120) : pos === 'RB' ? randomInt(30, 70) : 0
        }
      });
    });
  });

  // Fill with generic players to reach ~100
  for (let i = 0; i < 50; i++) {
    const pos = ["QB", "RB", "WR", "TE"][randomInt(0, 3)] as Position;
    players.push({
      id: `p-${idCounter++}`,
      name: `${pos} Player ${i + 1}`,
      position: pos,
      team: TEAMS[randomInt(0, TEAMS.length - 1)],
      byeWeek: randomInt(5, 14),
      adp: randomInt(50, 200),
      auctionValue: randomInt(1, 15),
      projectedPoints: randomInt(100, 200),
      lastSeasonPoints: randomInt(80, 180),
      risk: "Medium",
      trend: "Stable",
      age: randomInt(22, 35),
      notes: "Depth piece / Flex option.",
      stats: {}
    });
  }

  return players.sort((a, b) => b.projectedPoints - a.projectedPoints);
}

export const MOCK_PLAYERS = generatePlayers();

export const INITIAL_SETTINGS: DraftSettings = {
  teamCount: 12,
  position: 1, // 1st pick
  scoring: "PPR",
  rounds: 15
};
