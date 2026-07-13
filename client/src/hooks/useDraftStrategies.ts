import {Player} from '@/lib/baseData';
import {useDraftStore} from '@/lib/draftStore';
import {useMemo} from 'react';

export function useDraftStrategies() {
  const {players, settings, picks, pickedPlayers} = useDraftStore();

  const userActualPicks = useMemo(() => {
    const map: Record<number, Player> = {};
    picks.filter(p => p.pickedBy === 'User').forEach(p => {
      const player = players.find(pl => pl.id === p.playerId);
      if (player) map[p.round] = player;
    });
    return map;
  }, [picks, players]);

  const scenarios = useMemo(() => {
    // Generate all permutations
    const rounds = [1, 2, 3, 4, 5, 6, 7, 8];
    const generatedStrategies: any[] = [];

    // Helper to get combinations of k items from array
    const getCombinations = (arr: number[], k: number): number[][] => {
      if (k === 0) return [[]];
      if (arr.length === 0) return [];
      const [first, ...rest] = arr;
      const withFirst = getCombinations(rest, k - 1).map(c => [first, ...c]);
      const withoutFirst = getCombinations(rest, k);
      return [...withFirst, ...withoutFirst];
    };

    // 1. Pick 3 rounds for RBs
    const rbCombs = getCombinations(rounds, 3);

    for (const rbs of rbCombs) {
      const remainingAfterRb = rounds.filter(r => !rbs.includes(r));
      // 2. Pick 3 rounds for WRs
      const wrCombs = getCombinations(remainingAfterRb, 3);

      for (const wrs of wrCombs) {
        const remainingFinal = remainingAfterRb.filter(r => !wrs.includes(r));

        // Permutation 1: QB = remainingFinal[0], TE = remainingFinal[1]
        const p1 =
            {RB: rbs, WR: wrs, QB: remainingFinal[0], TE: remainingFinal[1]};
        // Permutation 2: QB = remainingFinal[1], TE = remainingFinal[0]
        const p2 =
            {RB: rbs, WR: wrs, QB: remainingFinal[1], TE: remainingFinal[0]};

        [p1, p2].forEach(p => {
          // Constraints: QB >= 2, TE >= 2
          if (p.QB < 2 || p.TE < 2) return;

          const draftOrder: Record<number, string> = {};
          p.RB.forEach(r => draftOrder[r] = 'RB');
          p.WR.forEach(r => draftOrder[r] = 'WR');
          draftOrder[p.QB] = 'QB';
          draftOrder[p.TE] = 'TE';

          // Fixed rounds
          draftOrder[12] = 'DST';
          draftOrder[14] = 'K';

          // FILTER: Check conflicts with actual user picks
          let conflict = false;
          for (const [roundStr, player] of Object.entries(userActualPicks)) {
            const round = parseInt(roundStr);
            if (draftOrder[round] !== player.position) {
              conflict = true;
              break;
            }
          }

          if (!conflict) {
            generatedStrategies.push({draftOrder});
          }
        });
      }
    }

    // Simulate all scenarios
    const results = generatedStrategies.map((strat, idx) => {
      const scenarioPlayers: Record<string, any> = {};
      const draftedIds = new Set<string>();
      const draftOrder = strat.draftOrder;

      // Simulation
      for (let round = 1; round <= 14; round++) {
        const pos = draftOrder[round];
        if (!pos) continue;  // Skip rounds 9, 10, 11, 13

        // Determine pick overall for user
        const userPickOverall = round % 2 === 1 ?
            (round - 1) * settings.teamCount + settings.position :
            round * settings.teamCount - settings.position + 1;

        // Check if user already made a pick in this round
        if (userActualPicks[round]) {
          const player = userActualPicks[round];

          // Generate key
          let key = pos;
          if (['DST', 'K', 'QB', 'TE'].includes(pos))
            key = `${pos}1`;
          else {
            let count = 1;
            while (scenarioPlayers[`${pos}${count}`]) count++;
            key = `${pos}${count}`;
          }

          scenarioPlayers[key] = {
            ...player,
            round,
            pickOverall:
                picks.find(p => p.round === round && p.pickedBy === 'User')
                    ?.pickOverall ||
                userPickOverall
          };
          draftedIds.add(player.id);
          continue;
        }

        // Otherwise simulate "Best Available"
        const bestAvailable =
            players.filter(p => p.position === pos)
                .filter(
                    p => !draftedIds.has(p.id))  // Not picked in this scenario
                .filter(
                    p => !pickedPlayers.includes(
                        p.id))  // Not picked in real draft (by anyone)
                .filter(p => p.adp > (userPickOverall - round))
                .sort((a, b) => b.ppg - a.ppg)[0] ||
            players.filter(
                p => p.position === pos && !draftedIds.has(p.id) &&
                    !pickedPlayers.includes(p.id))[0];

        if (bestAvailable) {
          draftedIds.add(bestAvailable.id);

          let key = pos;
          if (pos === 'DST')
            key = 'DST1';
          else if (pos === 'K')
            key = 'K1';
          else if (pos === 'QB')
            key = 'QB1';
          else if (pos === 'TE')
            key = 'TE1';
          else {
            // RB or WR
            let count = 1;
            while (scenarioPlayers[`${pos}${count}`]) {
              count++;
            }
            key = `${pos}${count}`;
          }

          scenarioPlayers[key] = {
            ...bestAvailable,
            round,
            pickOverall: userPickOverall
          };
        }
      }

      // Determine FLEX and BENCH
      const rb3 = scenarioPlayers['RB3'];
      const wr3 = scenarioPlayers['WR3'];

      if (rb3 && wr3) {
        if (rb3.ppg >= wr3.ppg) {
          scenarioPlayers['FLEX'] = rb3;
          scenarioPlayers['BENCH'] = wr3;
        } else {
          scenarioPlayers['FLEX'] = wr3;
          scenarioPlayers['BENCH'] = rb3;
        }
      } else if (rb3) {
        scenarioPlayers['FLEX'] = rb3;
        scenarioPlayers['BENCH'] =
            scenarioPlayers['WR3'] || scenarioPlayers['RB4'] || null;
      } else if (wr3) {
        scenarioPlayers['FLEX'] = wr3;
        scenarioPlayers['BENCH'] =
            scenarioPlayers['RB3'] || scenarioPlayers['WR4'] || null;
      }

      // Ensure all positions have a player
      const starterKeys =
          ['QB1', 'RB1', 'RB2', 'WR1', 'WR2', 'TE1', 'FLEX', 'DST1', 'K1'];
      starterKeys.forEach(k => {
        if (!scenarioPlayers[k]) {
          const pos = k.replace(/[0-9]/g, '');
          const fallback = players.find(
              p => p.position === (pos === 'FLEX' ? 'RB' : pos) &&
                  !draftedIds.has(p.id) && !pickedPlayers.includes(p.id));
          if (fallback) scenarioPlayers[k] = fallback;
        }
      });
      if (!scenarioPlayers['BENCH']) {
        const fallback = players.find(
            p => !draftedIds.has(p.id) && !pickedPlayers.includes(p.id));
        if (fallback) scenarioPlayers['BENCH'] = fallback;
      }

      // Calculate Total PPG for starters
      let total = 0;
      starterKeys.forEach(k => {
        if (scenarioPlayers[k]) total += scenarioPlayers[k].ppg;
      });

      return {
        name: `Scenario ${idx + 1}`,
        players: scenarioPlayers,
        totalPPG: parseFloat(total.toFixed(1))
      };
    });

    return results.sort((a, b) => b.totalPPG - a.totalPPG).slice(0, 25);
  }, [players, settings, picks, pickedPlayers, userActualPicks]);

  return {scenarios, userActualPicks};
}
