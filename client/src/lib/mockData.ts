import { z } from "zod";
import config from "../config.json";

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
  draftYear: string;
}

const TEAMS = [
  "ARI",
  "ATL",
  "BAL",
  "BUF",
  "CAR",
  "CHI",
  "CIN",
  "CLE",
  "DAL",
  "DEN",
  "DET",
  "GB",
  "HOU",
  "IND",
  "JAX",
  "KC",
  "LV",
  "LAC",
  "LAR",
  "MIA",
  "MIN",
  "NE",
  "NO",
  "NYG",
  "NYJ",
  "PHI",
  "PIT",
  "SEA",
  "SF",
  "TB",
  "TEN",
  "WAS",
];

const MOCK_NAMES: Record<string, string[]> = {
  QB: [
    "Josh Allen",
    "Jalen Hurts",
    "Patrick Mahomes",
    "Lamar Jackson",
    "Joe Burrow",
    "C.J. Stroud",
    "Anthony Richardson",
    "Dak Prescott",
    "Jordan Love",
    "Brock Purdy",
    "Kyler Murray",
    "Caleb Williams",
    "Tua Tagovailoa",
    "Jared Goff",
    "Justin Herbert",
    "Kirk Cousins",
    "Jayden Daniels",
    "Trevor Lawrence",
    "Aaron Rodgers",
    "Matthew Stafford",
  ],
  RB: [
    "Christian McCaffrey",
    "Breece Hall",
    "Bijan Robinson",
    "Saquon Barkley",
    "Jonathan Taylor",
    "Kyren Williams",
    "Jahmyr Gibbs",
    "Travis Etienne",
    "Derrick Henry",
    "Isiah Pacheco",
    "Rachaad White",
    "Joe Mixon",
    "Kenneth Walker III",
    "James Cook",
    "Josh Jacobs",
    "Alvin Kamara",
    "James Conner",
    "David Montgomery",
    "D'Andre Swift",
    "Aaron Jones",
    "Zamir White",
    "Raheem Mostert",
    "Najee Harris",
    "Jonathon Brooks",
    "Brian Robinson Jr.",
    "Javonte Williams",
    "Austin Ekeler",
    "Zack Moss",
    "Tony Pollard",
    "Nick Chubb",
    "Devin Singletary",
    "Jaylen Warren",
    "Ezekiel Elliott",
    "Gus Edwards",
    "Ty Chandler",
    "Jerome Ford",
    "Trey Benson",
    "Chuba Hubbard",
    "Blake Corum",
    "Chase Brown",
  ],
  WR: [
    "CeeDee Lamb",
    "Tyreek Hill",
    "Justin Jefferson",
    "Ja'Marr Chase",
    "Amon-Ra St. Brown",
    "A.J. Brown",
    "Garrett Wilson",
    "Puka Nacua",
    "Marvin Harrison Jr.",
    "Drake London",
    "Davante Adams",
    "Chris Olave",
    "Mike Evans",
    "Nico Collins",
    "Jaylen Waddle",
    "Michael Pittman Jr.",
    "DeVonta Smith",
    "D.K. Metcalf",
    "Stefon Diggs",
    "Cooper Kupp",
    "DJ Moore",
    "Malik Nabers",
    "Brandon Aiyuk",
    "George Pickens",
    "Deebo Samuel",
    "Zay Flowers",
    "Tee Higgins",
    "Amari Cooper",
    "Christian Kirk",
    "Tank Dell",
    "Terry McLaurin",
    "Rashee Rice",
    "Chris Godwin",
    "Keenan Allen",
    "Jayden Reed",
    "Hollywood Brown",
    "Jordan Addison",
    "Jaxon Smith-Njigba",
    "Ladd McConkey",
    "Courtland Sutton",
  ],
  TE: [
    "Sam LaPorta",
    "Travis Kelce",
    "Trey McBride",
    "Mark Andrews",
    "George Kittle",
    "Evan Engram",
    "Kyle Pitts",
    "Jake Ferguson",
    "Dalton Kincaid",
    "Brock Bowers",
    "David Njoku",
    "Dallas Goedert",
    "Cole Kmet",
    "T.J. Hockenson",
    "Pat Freiermuth",
    "Dalton Schultz",
    "Luke Musgrave",
    "Hunter Henry",
    "Cade Otton",
    "Isaiah Likely",
  ],
  K: [
    "Justin Tucker",
    "Brandon Aubrey",
    "Harrison Butker",
    "Jake Elliott",
    "Younghoe Koo",
    "Evan McPherson",
    "Cameron Dicker",
    "Matt Gay",
    "Jason Sanders",
    "Tyler Bass",
    "Dustin Hopkins",
    "Jake Moody",
    "Ka'imi Fairbairn",
    "Cairo Santos",
    "Chris Boswell",
    "Blake Grupe",
    "Greg Zuerlein",
    "Chase McLaughlin",
    "Nick Folk",
    "Greg Joseph",
  ],
  DST: [
    "Ravens",
    "Cowboys",
    "Jets",
    "49ers",
    "Browns",
    "Bills",
    "Steelers",
    "Dolphins",
    "Chiefs",
    "Eagles",
    "Saints",
    "Texans",
    "Bengals",
    "Lions",
    "Packers",
    "Bears",
    "Jaguars",
    "Vikings",
    "Broncos",
    "Raiders",
  ],
};

function generatePlayers(): Player[] {
  const players: Player[] = [];
  let idCounter = 1;

  const allNames = Object.entries(MOCK_NAMES).flatMap(([pos, names]) =>
    names.map((name) => ({ name, position: pos as Position })),
  );

  // Position-based PPG ranges
  const ppgRanges: Record<
    Position,
    { top: [number, number]; good: [number, number]; other: [number, number] }
  > = {
    QB: { top: [20, 25], good: [15, 20], other: [10, 15] },
    RB: { top: [20, 25], good: [15, 20], other: [8, 15] },
    WR: { top: [20, 25], good: [15, 20], other: [8, 15] },
    TE: { top: [13, 16], good: [10, 12], other: [5, 9] },
    DST: { top: [9, 12], good: [6, 8], other: [2, 5] },
    K: { top: [9, 12], good: [6, 8], other: [2, 5] },
    FLEX: { top: [20, 25], good: [15, 20], other: [8, 15] }, // Placeholder, logic uses RB/WR/TE
  };

  const posCounts: Record<string, number> = {};

  // Sort names to process by position and assign realistic PPG
  const sortedByPos = [...allNames].sort((a, b) =>
    a.position.localeCompare(b.position),
  );

  sortedByPos.forEach((item: any) => {
    const pos = item.position;
    posCounts[pos] = (posCounts[pos] || 0) + 1;
    const count = posCounts[pos];

    let ppgRange;
    if (pos === "QB") {
      if (count <= 4) ppgRange = ppgRanges.QB.top;
      else if (count <= 10) ppgRange = ppgRanges.QB.good;
      else ppgRange = ppgRanges.QB.other;
    } else if (pos === "RB") {
      if (count <= 6) ppgRange = ppgRanges.RB.top;
      else if (count <= 15) ppgRange = ppgRanges.RB.good;
      else ppgRange = ppgRanges.RB.other;
    } else if (pos === "WR") {
      if (count <= 6) ppgRange = ppgRanges.WR.top;
      else if (count <= 15) ppgRange = ppgRanges.WR.good;
      else ppgRange = ppgRanges.WR.other;
    } else if (pos === "TE") {
      if (count <= 3) ppgRange = ppgRanges.TE.top;
      else if (count <= 8) ppgRange = ppgRanges.TE.good;
      else ppgRange = ppgRanges.TE.other;
    } else if (pos === "K" || pos === "DST") {
      const kOrDst = pos as "K" | "DST";
      if (count <= 5) ppgRange = ppgRanges[kOrDst].top;
      else if (count <= 10) ppgRange = ppgRanges[kOrDst].good;
      else ppgRange = ppgRanges[kOrDst].other;
    } else {
      ppgRange = [5, 10];
    }

    const ppg = Number(
      (ppgRange[0] + Math.random() * (ppgRange[1] - ppgRange[0])).toFixed(1),
    );
    item.tempPpg = ppg;
  });

  // Now create the actual players and sort by PPG for rank
  const finalSorted = [...sortedByPos].sort(
    (a: any, b: any) => b.tempPpg - a.tempPpg,
  );

  finalSorted.forEach((item: any, index) => {
    const rank = index + 1;
    const adp = Number((rank + Math.random() * 5).toFixed(1));

    players.push({
      id: `p-${idCounter++}`,
      rank,
      name: item.name,
      position: item.position,
      team: TEAMS[Math.floor(Math.random() * TEAMS.length)],
      byeWeek: Math.floor(Math.random() * 10) + 5,
      ppg: (item as any).tempPpg,
      adp,
      risk: Math.random() > 0.8 ? "High" : "Low",
      injuryHistory: Math.random() > 0.7 ? "Significant" : "Clear",
      offensiveRank: Math.floor(Math.random() * 32) + 1,
      defensiveRank: Math.floor(Math.random() * 32) + 1,
      sos: Math.floor(Math.random() * 32) + 1,
      notes: "ESPN projected top tier.",
    });
  });

  return players;
}

export const MOCK_PLAYERS = generatePlayers();

export const INITIAL_SETTINGS: DraftSettings = {
  teamCount: 10,
  position: 1,
  scoring: config.scoring as "Standard" | "PPR" | "Half-PPR",
  rounds: 16,
  theme: "dark",
  accentColor: "#2ea043",
  teams: Array.from({ length: 10 }, (_, i) => ({
    id: `team-${i + 1}`,
    name: `Team ${i + 1}`,
    isUser: i === 0,
  })),
  viewedTeamId: "team-1",
  draftYear: config.draftYear,
};

export const INITIALIZATION_STEPS = [
  {
    label: "ESPN Player Draft Rankings & ADP",
    key: "rankings",
    link: config.dataSources.rankings,
  },
  {
    label: "ESPN Player Projected PPG",
    key: "ppg",
    link: config.dataSources.ppg,
  },
  {
    label: "NFL Strength of Schedules",
    key: "sos",
    link: config.dataSources.sos,
  },
  {
    label: "Projected Team Offensive PPG(F)",
    key: "offense",
    link: config.dataSources.offense,
  },
  {
    label: "Projected Team Defensive PPG(A)",
    key: "defense",
    link: config.dataSources.defense,
  },
  {
    label: "Player Info (Status, Age, Experience, Situation",
    key: "player_info",
    link: config.dataSources.player_info,
  },
  {
    label: "Past 3 years Fantasy Preseason ADP",
    key: "history_adp",
    link: config.dataSources.history_adp,
  },
  {
    label: "Past 3 years Fantasy Season PPG",
    key: "history_ppg",
    link: config.dataSources.history_ppg,
  },
  {
    label: "Generating AI Analysis for each Player",
    key: "ai_analysis",
    link: "",
  },
];
