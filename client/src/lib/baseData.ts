import config from "../config.json";

export type Position = "All" | "QB" | "RB" | "WR" | "TE" | "FLEX" | "DST" | "K";
export const POSITION_LIST: Position[] = [ "QB", "RB", "WR", "TE", "FLEX", "DST", "K" ];

export type NFLTeamAbbv = "All" | "FA"  |
                          "ARI" | "ATL" | "BAL" | "BUF" | "CAR" | "CHI" | "CIN" | "CLE" | 
                          "DAL" | "DEN" | "DET" | "GB"  | "HOU" | "IND" | "JAX" | "KC"  | 
                          "LV"  | "LAC" | "LAR" | "MIA" | "MIN" | "NE"  | "NO"  | "NYG" | 
                          "NYJ" | "PHI" | "PIT" | "SEA" | "SF"  | "TB"  | "TEN" | "WAS";
export const NFL_ABBV_LIST: NFLTeamAbbv[] = [ "ARI", "ATL", "BAL", "BUF", "CAR", "CHI", "CIN", "CLE", 
                                              "DAL", "DEN", "DET", "GB" , "HOU", "IND", "JAX", "KC" , 
                                              "LV" , "LAC", "LAR", "MIA", "MIN", "NE" , "NO" , "NYG", 
                                              "NYJ", "PHI", "PIT", "SEA", "SF" , "TB" , "TEN", "WAS" ];

export const NFL_TEAM_MAP: Record<NFLTeamAbbv, string> = {
    "All": "All Teams",
    "FA": "Free Agent",
    "ARI": "Arizona",
    "ATL": "Atlanta",
    "BAL": "Baltimore",
    "BUF": "Buffalo",
    "CAR": "Carolina",
    "CHI": "Chicago",
    "CIN": "Cincinnati",
    "CLE": "Cleveland",
    "DAL": "Dallas",
    "DEN": "Denver",
    "DET": "Detroit",
    "GB": "Green Bay",
    "HOU": "Houston",
    "IND": "Indianapolis",
    "JAX": "Jacksonville",
    "KC": "Kansas City",
    "LV": "Las Vegas",
    "LAC": "Los Angeles",
    "LAR": "Los Angeles",
    "MIA": "Miami",
    "MIN": "Minnesota",
    "NE": "New England",
    "NO": "New Orleans",
    "NYG": "New York",
    "NYJ": "New York",
    "PHI": "Philadelphia",
    "PIT": "Pittsburgh",
    "SEA": "Seattle",
    "SF": "San Francisco",
    "TB": "Tampa Bay",
    "TEN": "Tennessee",
    "WAS": "Washington"
}

export interface PastPlayerInfo {
    adp: number;
    pppg: number;
    fppg: number;
    totalGames: number;
    age: number;
    experience: number;
    injury: "HEALTHY" | "HURT" | "IR";
}

export interface Player {
  id: string;
  rank: number;
  name: string;
  position: Position;
  teamId: string;
  team: NFLTeamAbbv;
  byeWeek: number;
  schedule: string[];
  sos: number; // 1-32, 1 being easiest
  offensiveRank: number;
  defensiveRank: number;
  adp: number;
  ppg: number;
  age: number;
  experience: number;
  newTeam: boolean;
  status: "CLEAR" | "SUSPENDED";
  injury: "HEALTHY" | "HURT" | "IR";
  pastInfo: PastPlayerInfo;
  trend: "UP" | "NORMAL" | "DOWN";
  notes: string;
}

export interface PlayerTeam {
  teamId: string;
  teamAbbv: NFLTeamAbbv;
  byeWeek: number;
  schedule: NFLTeamAbbv[];
  ppgOffense: number;
  ppgDefense: number;
  winPercentage: number;
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

export const API_YEAR = 2025;
