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
  injuryHistory: "Clear" | "Minor" | "Significant";
  offensiveRank: number;
  defensiveRank: number;
  sos: number; // 1-32, 1 being easiest
  notes: string;
}

export interface Team {
  id: string;
  name: string;
  isUser: boolean;
}

export interface DraftSettings {
  teamCount: number;
  position: number;
  scoring: "Standard" | "PPR" | "Half-PPR";
  rounds: number;
  theme: "light" | "dark";
  accentColor: string;
  teams: Team[];
  viewedTeamId: string; // ID of the team currently being viewed in the roster panel
}

const TEAMS = ["ARI", "ATL", "BAL", "BUF", "CAR", "CHI", "CIN", "CLE", "DAL", "DEN", "DET", "GB", "HOU", "IND", "JAX", "KC", "LV", "LAC", "LAR", "MIA", "MIN", "NE", "NO", "NYG", "NYJ", "PHI", "PIT", "SEA", "SF", "TB", "TEN", "WAS"];

const MOCK_NAMES: Record<string, string[]> = {
  QB: [
    "Josh Allen", "Jalen Hurts", "Patrick Mahomes", "Lamar Jackson", "Joe Burrow", "C.J. Stroud",
    "Anthony Richardson", "Dak Prescott", "Jordan Love", "Brock Purdy", "Kyler Murray", "Caleb Williams",
    "Tua Tagovailoa", "Jared Goff", "Justin Herbert", "Kirk Cousins", "Jayden Daniels", "Trevor Lawrence",
    "Aaron Rodgers", "Matthew Stafford"
  ],
  RB: [
    "Christian McCaffrey", "Breece Hall", "Bijan Robinson", "Saquon Barkley", "Jonathan Taylor",
    "Kyren Williams", "Jahmyr Gibbs", "Travis Etienne", "Derrick Henry", "Isiah Pacheco",
    "Rachaad White", "Joe Mixon", "Kenneth Walker III", "James Cook", "Josh Jacobs",
    "Alvin Kamara", "James Conner", "David Montgomery", "D'Andre Swift", "Aaron Jones",
    "Zamir White", "Raheem Mostert", "Najee Harris", "Jonathon Brooks", "Brian Robinson Jr.",
    "Javonte Williams", "Austin Ekeler", "Zack Moss", "Tony Pollard", "Nick Chubb",
    "Devin Singletary", "Jaylen Warren", "Ezekiel Elliott", "Gus Edwards", "Ty Chandler",
    "Jerome Ford", "Trey Benson", "Chuba Hubbard", "Blake Corum", "Chase Brown"
  ],
  WR: [
    "CeeDee Lamb", "Tyreek Hill", "Justin Jefferson", "Ja'Marr Chase", "Amon-Ra St. Brown",
    "A.J. Brown", "Garrett Wilson", "Puka Nacua", "Marvin Harrison Jr.", "Drake London",
    "Davante Adams", "Chris Olave", "Mike Evans", "Nico Collins", "Jaylen Waddle",
    "Michael Pittman Jr.", "DeVonta Smith", "D.K. Metcalf", "Stefon Diggs", "Cooper Kupp",
    "DJ Moore", "Malik Nabers", "Brandon Aiyuk", "George Pickens", "Deebo Samuel",
    "Zay Flowers", "Tee Higgins", "Amari Cooper", "Christian Kirk", "Tank Dell",
    "Terry McLaurin", "Rashee Rice", "Chris Godwin", "Keenan Allen", "Jayden Reed",
    "Hollywood Brown", "Jordan Addison", "Jaxon Smith-Njigba", "Ladd McConkey", "Courtland Sutton"
  ],
  TE: [
    "Sam LaPorta", "Travis Kelce", "Trey McBride", "Mark Andrews", "George Kittle",
    "Evan Engram", "Kyle Pitts", "Jake Ferguson", "Dalton Kincaid", "Brock Bowers",
    "David Njoku", "Dallas Goedert", "Cole Kmet", "T.J. Hockenson", "Pat Freiermuth",
    "Dalton Schultz", "Luke Musgrave", "Hunter Henry", "Cade Otton", "Isaiah Likely"
  ],
  K: [
    "Justin Tucker", "Brandon Aubrey", "Harrison Butker", "Jake Elliott", "Younghoe Koo",
    "Evan McPherson", "Cameron Dicker", "Matt Gay", "Jason Sanders", "Tyler Bass",
    "Dustin Hopkins", "Jake Moody", "Ka'imi Fairbairn", "Cairo Santos", "Chris Boswell",
    "Blake Grupe", "Greg Zuerlein", "Chase McLaughlin", "Nick Folk", "Greg Joseph"
  ],
  DST: [
    "Ravens", "Cowboys", "Jets", "49ers", "Browns", "Bills", "Steelers", "Dolphins",
    "Chiefs", "Eagles", "Saints", "Texans", "Bengals", "Lions", "Packers", "Bears",
    "Jaguars", "Vikings", "Broncos", "Raiders"
  ]
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
        injuryHistory: Math.random() > 0.7 ? "Significant" : "Clear",
        offensiveRank: Math.floor(Math.random() * 32) + 1,
        defensiveRank: Math.floor(Math.random() * 32) + 1,
        sos: Math.floor(Math.random() * 32) + 1,
        notes: "ESPN projected top tier."
      });
    });
  });

  return players.sort((a, b) => a.rank - b.rank);
}

export const MOCK_PLAYERS = generatePlayers();

export const INITIAL_SETTINGS: DraftSettings = {
  teamCount: 10,
  position: 1,
  scoring: "PPR",
  rounds: 16,
  theme: "dark",
  accentColor: "#2ea043",
  teams: Array.from({ length: 10 }, (_, i) => ({
    id: `team-${i + 1}`,
    name: `Team ${i + 1}`,
    isUser: i === 0
  })),
  viewedTeamId: "team-1"
};

export const INITIALIZATION_STEPS = [
  { label: "ESPN Player Draft Rankings", key: "rankings" },
  { label: "ESPN Player Projected PPG", key: "ppg" },
  { label: "NFL Strength of Schedules", key: "sos" },
  { label: "Projected Offensive Ranking (1-32)", key: "offense" },
  { label: "Projected Defensive Ranking (1-32)", key: "defense" },
  { label: "Player Injury History", key: "injury" },
  { label: "Past 5 years Fantasy Preseason ADP", key: "history_adp" },
  { label: "Past 5 years Fantasy Season PPG", key: "history_ppg" },
  { label: "NFL Trends (Age, Experience, Situation)", key: "trends" }
];
