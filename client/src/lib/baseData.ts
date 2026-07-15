import config from '../config.json';

export type Position = 'All'|'QB'|'RB'|'WR'|'TE'|'FLEX'|'DST'|'K';
export const POSITION_LIST: Position[] =
    ['QB', 'RB', 'WR', 'TE', 'FLEX', 'DST', 'K'];

export type NFLTeamAbbv = 'All'|'FA'|'ARI'|'ATL'|'BAL'|'BUF'|'CAR'|'CHI'|'CIN'|
    'CLE'|'DAL'|'DEN'|'DET'|'GB'|'HOU'|'IND'|'JAX'|'KC'|'LV'|'LAC'|'LAR'|'MIA'|
    'MIN'|'NE'|'NO'|'NYG'|'NYJ'|'PHI'|'PIT'|'SEA'|'SF'|'TB'|'TEN'|'WAS';
export const NFL_ABBV_LIST: NFLTeamAbbv[] = [
  'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE', 'DAL', 'DEN', 'DET',
  'GB',  'HOU', 'IND', 'JAX', 'KC',  'LV',  'LAC', 'LAR', 'MIA', 'MIN', 'NE',
  'NO',  'NYG', 'NYJ', 'PHI', 'PIT', 'SEA', 'SF',  'TB',  'TEN', 'WAS'
];

export const NFL_TEAM_MAP: Record<NFLTeamAbbv, string> = {
  'All': 'All Teams',
  'FA': 'Free Agent',
  'ARI': 'Arizona',
  'ATL': 'Atlanta',
  'BAL': 'Baltimore',
  'BUF': 'Buffalo',
  'CAR': 'Carolina',
  'CHI': 'Chicago',
  'CIN': 'Cincinnati',
  'CLE': 'Cleveland',
  'DAL': 'Dallas',
  'DEN': 'Denver',
  'DET': 'Detroit',
  'GB': 'Green Bay',
  'HOU': 'Houston',
  'IND': 'Indianapolis',
  'JAX': 'Jacksonville',
  'KC': 'Kansas City',
  'LV': 'Las Vegas',
  'LAC': 'Los Angeles',
  'LAR': 'Los Angeles',
  'MIA': 'Miami',
  'MIN': 'Minnesota',
  'NE': 'New England',
  'NO': 'New Orleans',
  'NYG': 'New York',
  'NYJ': 'New York',
  'PHI': 'Philadelphia',
  'PIT': 'Pittsburgh',
  'SEA': 'Seattle',
  'SF': 'San Francisco',
  'TB': 'Tampa Bay',
  'TEN': 'Tennessee',
  'WAS': 'Washington'
}

export type AI_Stock = 'DIAMOND' |  // Elite draft value and a must-target
                                    // player at their current ADP.
    'BREAKOUT' |  // Strong signs of a major jump in fantasy production this
                  // season.
    'STAR' |      // Proven elite fantasy asset with consistently high-level
                  // production.
    'STARTER' |   // Reliable fantasy starter offering solid production and fair
                  // value.
    'SLEEPER' |   // Under-the-radar player with significant upside at their
                  // current draft position.
    'AVERAGE' |   // Projected and ranked near expectations with reasonable flex
                  // or bench value.
    'OVERVALUED' |  // Being drafted earlier than their projected production or
                    // outlook justifies.
    'RISKY' |  // High uncertainty or volatility due to injury, role, situation,
               // or inconsistent production.
    'FADE' |  // Player to avoid at their current ADP because the expected value
              // does not justify the draft cost.
    'BUST' |  // High risk of significantly underperforming expectations due to
              // the player's current circumstances.
    'WILDCARD'  // Wide range of possible outcomes with significant upside and
                // downside.
    ;

export interface PastPlayerInfo {
  ppg: number;
  totalGames: number;
  weeks: number[];
}

export interface Player {
  id: string;
  name: string;
  position: Position;
  teamInfo: PlayerTeam;
  age: number;
  experience: number;
  rank: number;
  adp: number;
  ppg: number;
  projectedGames: number;
  newTeam: boolean;
  rookie: boolean;
  status: 'NA'|'UNKNOWN'|'CLEAR'|'SUSPENDED';
  injury: 'NA'|'UNKNOWN'|'HEALTHY'|'HURT'|'IR';
  trend: 'UP'|'NORMAL'|'DOWN';
  pastInfo: PastPlayerInfo;
  stock: AI_Stock;
  notes: string;
}

export interface PlayerTeam {
  teamId: string;
  teamAbbv: NFLTeamAbbv;
  byeWeek: number;
  sos: number;
  ppgOffense: number;
  ppgDefense: number;
}

export interface Team {
  id: string;
  name: string;
  isUser: boolean;
}

export interface DraftSettings {
  teamCount: number;
  position: number;
  scoring: 'Standard'|'PPR'|'Half-PPR';
  rounds: number;
  theme: 'light'|'dark';
  accentColor: string;
  teams: Team[];
  viewedTeamId:
      string;  // ID of the team currently being viewed in the roster panel
  draftYear: string;
}

export const INITIAL_SETTINGS: DraftSettings = {
  teamCount: 10,
  position: 1,
  scoring: config.scoring as 'Standard' | 'PPR' | 'Half-PPR',
  rounds: 16,
  theme: 'dark',
  accentColor: '#2ea043',
  teams: Array.from({length: 10}, (_, i) => ({
                                    id: `team-${i + 1}`,
                                    name: `Team ${i + 1}`,
                                    isUser: i === 0,
                                  })),
  viewedTeamId: 'team-1',
  draftYear: config.draftYear,
};

export const API_YEAR = 2026;
