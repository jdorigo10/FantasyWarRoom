import {API_YEAR, NFLTeamAbbv, PastPlayerInfo, Player, PlayerTeam, Position} from './baseData';

// Helper to create a base player object with minimal data
function createBasePlayer(item: {playerId: string, name: string}): Player {
  return {
    id: item.playerId,      // STEP 3
    name: item.name,        // STEP 3
    position: 'All',        // STEP 3
    teamInfo: null as any,  // STEP 4
    age: -1,                // STEP 4
    experience: -1,         // STEP 4
    rank: 999,              // STEP 4
    adp: 170,               // STEP 4
    ppg: 0,                 // STEP 4
    projectedGames: 0,      // STEP 4
    newTeam: false,         // STEP 4
    rookie: false,          // STEP 4
    status: 'NA',           // STEP 4
    injury: 'NA',           // STEP 4
    pastInfo: null as any,  // STEP 5 - Get past player info from DB
    trend: 'NORMAL',        // STEP 6 - TODO - AI Analyze? past info to predict
    notes: 'NONE'           // STEP 6 - TODO - AI Analyze? past info to predict
  };
}

// Helper to create a base player team object with minimal data
function createBasePlayerTeam(item: {teamId: string, teamAbbv: NFLTeamAbbv}):
    PlayerTeam {
  return {
    teamId: item.teamId,      // STEP 1
    teamAbbv: item.teamAbbv,  // STEP 1
    byeWeek: 0,               // STEP 2
    sos: 1,                   // STEP 2
    ppgOffense: 0,            // STEP 2
    ppgDefense: 99,           // STEP 2
  };
}

// ============================================================================
// DATA LOADER FUNCTIONS
// Each function takes players and enriches them with specific data
// ============================================================================

/**
 * Step 1: Load Base Team Info from Database
 */
export async function loadBaseTeamInfo(playerTeams: Record<string, PlayerTeam>):
    Promise<Record<string, PlayerTeam>> {
  const res = await fetch(`http://localhost:8000/api/teams`);
  if (!res.ok) {
    throw new Error(`Failed to fetch Base Team Information`);
  }

  const data = await res.json() as {teams: any[]};

  for (const t of data.teams) {
    const teamId = t.teamId;
    const teamAbbv = t.teamAbbv as NFLTeamAbbv;

    playerTeams[teamId] = createBasePlayerTeam({teamId, teamAbbv});
  }

  await new Promise(resolve => setTimeout(resolve, 500));
  return playerTeams;
}

/**
 * Step 2: Load Specific Team Info from Database (current season_year)
 */
export async function loadSeasonTeamInfo(
    playerTeams: Record<string, PlayerTeam>):
    Promise<Record<string, PlayerTeam>> {
  const res =
      await fetch(`http://localhost:8000/api/teamSpecifics?year=${API_YEAR}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch Season Team Information`);
  }

  const data = await res.json() as {teams: any[]};

  for (const t of data.teams) {
    const teamId = t.teamId;

    playerTeams[teamId].byeWeek = Number(t.bye);

    playerTeams[teamId].sos = Number(parseFloat(t.sos).toFixed(3));

    playerTeams[teamId].ppgOffense = Number(parseFloat(t.offPpg).toFixed(2));
    playerTeams[teamId].ppgDefense = Number(parseFloat(t.defPpg).toFixed(2));
  }

  await new Promise(resolve => setTimeout(resolve, 500));
  return playerTeams;
}

/**
 * Step 3: Load Base Player Infro from Database (current season_year)
 */
export async function loadBasePlayerInfo(players: Player[]): Promise<Player[]> {
  const res = await fetch(`http://localhost:8000/api/players?year=${API_YEAR}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch Base Player Information`);
  }

  const data = await res.json() as {players: any[]};

  for (const p of data.players) {
    const playerId = p.id;
    const name = p.name;

    let newPlayer = createBasePlayer({playerId, name});
    newPlayer.position = p.position as Position;

    players.push(newPlayer);
  }

  await new Promise(resolve => setTimeout(resolve, 500));
  return players;
}

/**
 * Step 4: Load Specific Player Info from Database (current season_year)
 */
export async function loadSeasonPlayerInfo(
    players: Player[],
    playerTeams: Record<string, PlayerTeam>): Promise<Player[]> {
  const res =
      await fetch(`http://localhost:8000/api/playerSpecifics?year=${API_YEAR}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch Season Player Information`);
  }

  const data = await res.json() as {players: any[]};

  for (const p of data.players) {
    const playerId = p.id;
    const teamId = p.teamId;

    let player = players.find(player => player.id === playerId);
    if (!player) {
      throw new Error(`Failed finding existing Player`);
    }

    player.teamInfo = playerTeams[teamId];

    player.age = Number(p.age);
    player.experience = Number(p.exp);

    player.rank = Number(p.draftRank);
    player.adp = Number(parseFloat(p.adp).toFixed(1));
    player.ppg = Number(parseFloat(p.ppg).toFixed(2));
    player.projectedGames = Number(p.games);

    if (p.teamStatus == 'ROOKIE') {
      player.rookie = true;
    } else if (p.teamStatus == 'YES') {
      player.newTeam = true;
    }

    player.status =
        p.suspensionStatus as 'NA' | 'UNKNOWN' | 'CLEAR' | 'SUSPENDED';
    player.injury =
        p.injuryStatus as 'NA' | 'UNKNOWN' | 'HEALTHY' | 'HURT' | 'IR';
  }

  const filteredPlayers = players.filter(p => p.rank !== 999);


  await new Promise(resolve => setTimeout(resolve, 500));
  return filteredPlayers;
}

/**
 * Step 5: TODO Past Player Info
 */
export async function loadPastPlayerInfo(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 500));
  return;
}

/**
 * Step 6: TODO AI Analysis
 */
export async function generateAiAnalysis(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 500));
  return;
}


// ============================================================================
// MAIN LOADER ORCHESTRATOR
// ============================================================================

export interface LoaderStep {
  key: string;
  label: string;
}

export const LOADER_STEPS: LoaderStep[] = [
  {key: 'base_team_info', label: 'Retrieving Base Team Information'},
  {key: 'season_team_info', label: 'Retrieving Season Team Information'},
  {key: 'base_player_info', label: 'Retrieving Base Player Information'},
  {key: 'season_player_info', label: 'Retrieving Season Player Information'},
  {key: 'past_player_info', label: 'TODO: Retrieving Past Player Information'},
  {key: 'ai_analysis', label: 'TODO: Generating AI Analysis for each Player'},
  {key: 'loading', label: 'Finalizing Tool'}
];
