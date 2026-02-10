import { API_YEAR, Player, PlayerTeam, Position, NFLTeamAbbv, PastPlayerInfo } from './baseData';

// Helper to create a base player object with minimal data
function createBasePlayer(item: { playerId: string, name: string }): Player {
  return {
    id: item.playerId,          // STEP 1
    rank: 999,                  // STEP 1
    name: item.name,            // STEP 1
    position: "All",            // STEP 1
    teamId: "0",                // STEP 1
    team: "FA",                 // STEP 3
    byeWeek: 0,                 // STEP 3
    schedule: [],               // STEP 3
    sos: 0,                     // STEP 5 - TODO
    offensiveRank: 33,          // STEP 5 - TODO
    defensiveRank: 33,          // STEP 5 - TODO
    adp: 170,                   // STEP 1
    ppg: 0,                     // STEP 1
    age: -1,                    // STEP 6
    experience: -1,             // STEP 6
    newTeam: false,             // STEP 6
    status: "CLEAR",            // STEP 1
    injury: "HEALTHY",          // STEP 1
    pastInfo: null as any,      // STEP 7
    trend: "NORMAL",            // STEP 8 - TODO
    notes: "No Player Insight"  // STEP 8 - TODO
  };
}

// Helper to create a base player team object with minimal data
function createBasePlayerTeam(item: { teamId: string, teamAbbv: NFLTeamAbbv }): PlayerTeam {
  return {
    teamId: item.teamId,        // STEP 2
    teamAbbv: item.teamAbbv,    // STEP 2
    byeWeek: -1,                // STEP 2
    schedule: [],               // STEP 2
    ppgOffense: -1,             // STEP 4 - TODO
    ppgDefense: -1,             // STEP 4 - TODO
    winPercentage: -1           // STEP 4 - TODO
  };
}

// ============================================================================
// DATA LOADER FUNCTIONS
// Each function takes players and enriches them with specific data
// ============================================================================

/**
 * Step 1: Load ESPN Player Info from API used for the following: 
 *         "https://fantasy.espn.com/football/livedraftresults"
 *         "https://fantasy.espn.com/football/players/projections"
 * 
 * Gets the info and creates the base players objects with the following info:
 * - Player ID
 * - Player Name
 * 
 * - Rank
 * - Position
 * - Team ID
 * - Average Draft Position (ADP)
 * - Projected Points Per Game (PPG)
 * - Player Status (e.g. Suspended, Clear)
 * - Player Injury Status (e.g. Healthy, Hurt, IR)
 */
export async function loadPlayerInfo(pos: string, players: Player[]): Promise<Player[]> {
  const res = await fetch(`http://localhost:8000/api/players?year=${API_YEAR}&position=${pos}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch ESPN Player Information for ${pos}s`);
  }

  const data = await res.json() as { players: any[] };

  for (const p of data.players) {
    const playerId = p.id;
    const name =p.name;

    let newPlayer = createBasePlayer({playerId, name});

    newPlayer.rank = Number(p.rank.toFixed(0));
    newPlayer.position = p.position as Position;
    newPlayer.teamId = p.teamId;
    newPlayer.adp = Number(p.adp.toFixed(1));
    newPlayer.ppg = Number(p.ppg.toFixed(2));
    newPlayer.status = p.status as "CLEAR" | "SUSPENDED";
    newPlayer.injury = p.injury as "HEALTHY" | "HURT" | "IR";

    players.push(newPlayer);
  }

  return players;
}

/**
 * Step 2: Load ESPN Team Info from API used for the following: 
 *         "https://www.espn.com/nfl/team/_/name/det/detroit-lions"
 * 
 * Gets the info and creates the base player teams objects with the following info:
 * - Team ID
 * - Team Abbreviation
 * 
 * - Bye Week
 * - Team Schedule
 */
export async function loadTeamInfo(playerTeams: Record<string, PlayerTeam>): Promise<Record<string, PlayerTeam>> {
  const res = await fetch(`http://localhost:8000/api/teams?year=${API_YEAR}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch ESPN Team Information`);
  }

  const data = await res.json() as { teams: any[] };

  for (const t of data.teams) {
    const teamId = t.teamId;
    const teamAbbv = t.teamAbbv as NFLTeamAbbv;

    let newPlayerTeam = createBasePlayerTeam({teamId, teamAbbv});

    newPlayerTeam.byeWeek = t.byeWeek;
    newPlayerTeam.schedule = t.schedule;

    playerTeams[teamId] = newPlayerTeam;
  }

  return playerTeams;
}

/**
 * Step 3: Assign Player Team Info to each Player
 * 
 * Will asign to each player along with:
 * - Team Abbreviation
 * - Bye Week
 * - Team Schedule
 */
export async function assignTeamsToPlayers(players: Player[], playerTeams: Record<string, PlayerTeam>): Promise<Player[]> {
  await new Promise(resolve => setTimeout(resolve, 500));

  return players.map(player => {
    const teamInfo = playerTeams[player.teamId];
    return {
      ...player,
      team: teamInfo ? teamInfo.teamAbbv : "FA",
      byeWeek: teamInfo ? teamInfo.byeWeek : 0,
      schedule: teamInfo ? teamInfo.schedule : []
    };
  });
}

/**
 * Step 4: Load Odds for Each Team from: ""
 * 
 * Gets the following for each team:
 * - Projected Win Percentages for each team
 * 
 * - Projected Offensive PPG for each Team
 * - Projected Defensive PPG for each Team
 */
export async function loadTeamOdds(playerTeams: Record<string, PlayerTeam>): Promise<Record<string, PlayerTeam>> {
  await new Promise(resolve => setTimeout(resolve, 500));

  // TODO

  return playerTeams;
}

/**
 * Step 5: Determine the Team Offensive & Defensive Rankings for each Player
 * 
 * Calculate the Strength of Schedule for each team based on their opponents win percentages:
 * - Team Strength of Schedule
 * 
 * Calculate the Offensive & Defensive Rankings for each player based on their teams projected points for & allowed:
 * - Player Offensive Rank
 * - Player Defensive Rank
 * 
 * Will asign to each player
 */
export async function determineTeamRankings(players: Player[], playerTeams: Record<string, PlayerTeam>): Promise<Player[]> {
  await new Promise(resolve => setTimeout(resolve, 500));

  // TODO

  return players;
}

/**
 * Step 6: Load ESPN Player Specifics from API used for the following: 
 *         "https://www.espn.com/nfl/player/_/id/3918298/josh-allen"
 * 
 * Gets the following for player:
 * - Player Age
 * - Player Experience
 * - If Player is on New Team
 */
export async function loadPlayerSpecifics(pos: string, players: Player[]): Promise<Player[]> {
  let playerIds = players.filter(p => p.position === pos).map(p => p.id);

  const res = await fetch(`http://localhost:8000/api/playerSpecifics?year=${API_YEAR}&playerIds=${playerIds.join(",")}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch ESPN Player Specifics for ${pos}s`);
  }

  const data = await res.json() as any;

  for (let i = 0; i < players.length; i++) {
    const playerId = players[i].id;
    const playerInfo = data.players[playerId];
    if (playerInfo) {
      players[i].age = playerInfo.age;
      players[i].experience = playerInfo.experience;
      players[i].newTeam = playerInfo.newTeam;
    }
  }

  return players;
}

/**
 * Step 7: Load Past years of ESPN Player Info from API
 * 
 * Gets the following for player:
 * - Player ADP from last year
 * - Player pre PPG from last year
 * - Player end PPG from last year
 * - Number of Games Played last year
 * - Player Age last year
 * - Player Experience last year
 * - Player Injury Status last year
 * 
 * Will asign to each player in a new "pastInfo" field
 */
export async function loadPastPlayerInfo(pos: string, players: Player[]): Promise<Player[]> {
  const res = await fetch(`http://localhost:8000/api/pastPlayers?year=${API_YEAR-1}&position=${pos}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch ESPN Previous Player Information for ${pos}s`);
  }

  const data = await res.json() as { players: Record<string, PastPlayerInfo> };
  const playerMap = new Map(Object.entries(data.players).map(([id, p]) => [id, p]));

  for (let i = 0; i < players.length; i++) {
    const playerId = players[i].id;
    const pastInfo = playerMap.get(playerId);
    if (pastInfo) {
      pastInfo.age = players[i].age - 1;
      pastInfo.experience = players[i].experience - 1;
      players[i].pastInfo = pastInfo;
    }
  }

  return players;
}

/**
 * Step 8: Generate AI Analysis for each Player -> ""
 * 
 * - Will Take into account all our player info and run through LLM to give us 
 *   a small insight on the Player for this upcoming season as well as how they are trending
 */
export async function generateAIAnalysis(players: Player[]): Promise<Player[]> {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // TODO

  return players;
}

// ============================================================================
// MAIN LOADER ORCHESTRATOR
// ============================================================================

export interface LoaderStep {
  key: string;
  label: string;
}

export const LOADER_STEPS: LoaderStep[] = [
  { key: "qb_info", label: "Retrieving QB Info from ESPN APIs" },
  { key: "rb_info", label: "Retrieving RB Info from ESPN APIs" },
  { key: "wr_info", label: "Retrieving WR Info from ESPN APIs" },
  { key: "te_info", label: "Retrieving TE Info from ESPN APIs" },
  { key: "dst_info", label: "Retrieving DST Info from ESPN APIs" },
  { key: "k_info", label: "Retrieving K Info from ESPN APIs" },
  { key: "team_info", label: "Retrieving Team Info from ESPN APIs" },
  { key: "player_teams", label: "Assigning Team Info to Players" },
  { key: "team_scoring", label: "Retrieving Team Odds for the Year" },
  { key: "team_ranks", label: "Projecting SOS & Offensive/Defensive Rankings" },
  { key: "qb_specifics", label: "Retrieving Individual QB Insights" },
  { key: "rb_specifics", label: "Retrieving Individual RB Insights" },
  { key: "wr_specifics", label: "Retrieving Individual WR Insights" },
  { key: "te_specifics", label: "Retrieving Individual TE Insights" },
  { key: "k_specifics", label: "Retrieving Individual K Insights" },
  { key: "past_qb_info", label: "Retrieving Past Years QB Info" },
  { key: "past_rb_info", label: "Retrieving Past Years RB Info" },
  { key: "past_wr_info", label: "Retrieving Past Years WR Info" },
  { key: "past_te_info", label: "Retrieving Past Years TE Info" },
  { key: "past_dst_info", label: "Retrieving Past Years DST Info" },
  { key: "past_k_info", label: "Retrieving Past Years K Info" },
  { key: "ai_analysis", label: "Generating AI Analysis for each Player" }
];
