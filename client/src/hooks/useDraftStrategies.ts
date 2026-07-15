import {Player} from '@/lib/baseData';
import {useDraftStore} from '@/lib/draftStore';
import {useMemo} from 'react';

export function useDraftStrategies() {
  const {players, settings, picks, pickedPlayers, currentPickIndex} =
      useDraftStore();

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

          // Only validate the first 8 rounds when building the strategy.
          // DST and K are handled flexibly in rounds 9-14 during simulation.
          let conflict = false;
          for (const [roundStr, player] of Object.entries(userActualPicks)) {
            const round = parseInt(roundStr);
            if (round > 8) continue;

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

    const getScenarioKey =
        (position: string, scenarioPlayers: Record<string, any>) => {
          if (['DST', 'K', 'QB', 'TE'].includes(position)) {
            return `${position}1`;
          }

          let count = 1;
          while (scenarioPlayers[`${position}${count}`]) count++;
          return `${position}${count}`;
        };

    const getBestAvailable =
        (position: string, round: number, userPickOverall: number,
         draftedIds: Set<string>) => {
          const eligible = players.filter(p => p.position === position)
                               .filter(p => !draftedIds.has(p.id))
                               .filter(p => !pickedPlayers.includes(p.id));

          if (round > 8 && (position === 'DST' || position === 'K')) {
            return eligible.sort((a, b) => b.ppg - a.ppg)[0] ||
                players.find(
                    p => p.position === position && !draftedIds.has(p.id) &&
                        !pickedPlayers.includes(p.id)) ||
                null;
          }

          const currentPickOverall = currentPickIndex + 1;
          const isWithinThreePicks =
              Math.abs(userPickOverall - currentPickOverall) <= 3;

          if (isWithinThreePicks) {
            return eligible.sort((a, b) => b.ppg - a.ppg)[0] ||
                players.find(
                    p => p.position === position && !draftedIds.has(p.id) &&
                        !pickedPlayers.includes(p.id)) ||
                null;
          }

          const byDraftPosition =
              eligible.filter(p => p.adp > (userPickOverall - round));

          if (byDraftPosition.length > 0) {
            return byDraftPosition.sort((a, b) => b.ppg - a.ppg)[0];
          }

          return eligible.sort((a, b) => b.ppg - a.ppg)[0] ||
              players.find(
                  p => p.position === position && !draftedIds.has(p.id) &&
                      !pickedPlayers.includes(p.id)) ||
              null;
        };

    // Simulate all scenarios
    const results = generatedStrategies.map((strat, idx) => {
      const scenarioPlayers: Record<string, any> = {};
      const draftedIds = new Set<string>();
      const draftedPositions = new Set<string>();
      const draftOrder = strat.draftOrder;

      for (let round = 1; round <= 16; round++) {
        const userPickOverall = round % 2 === 1 ?
            (round - 1) * settings.teamCount + settings.position :
            round * settings.teamCount - settings.position + 1;

        if (userActualPicks[round]) {
          const player = userActualPicks[round];
          const key = getScenarioKey(player.position, scenarioPlayers);

          scenarioPlayers[key] = {
            ...player,
            round,
            pickOverall:
                picks.find(p => p.round === round && p.pickedBy === 'User')
                    ?.pickOverall ||
                userPickOverall
          };

          draftedIds.add(player.id);
          draftedPositions.add(player.position);
          continue;
        }

        if (round <= 8) {
          const pos = draftOrder[round];
          if (!pos) continue;

          const bestAvailable =
              getBestAvailable(pos, round, userPickOverall, draftedIds);

          if (bestAvailable) {
            draftedIds.add(bestAvailable.id);

            const key = getScenarioKey(pos, scenarioPlayers);
            scenarioPlayers[key] = {
              ...bestAvailable,
              round,
              pickOverall: userPickOverall
            };
          }
          continue;
        }

        const hasDST = draftedPositions.has('DST');
        const hasK = draftedPositions.has('K');

        if (hasDST && hasK) continue;

        const candidatePositions =
            [!hasDST ? 'DST' : null, !hasK ? 'K' : null].filter(Boolean) as
            string[];

        if (candidatePositions.length === 0) continue;

        const candidates =
            candidatePositions
                .map(position => {
                  const player = getBestAvailable(
                      position, round, userPickOverall, draftedIds);
                  return player ? {position, player} : null;
                })
                .filter(Boolean) as Array<{position: string; player: Player}>;

        if (candidates.length === 0) continue;

        const selected = candidates[0];

        draftedIds.add(selected.player.id);
        draftedPositions.add(selected.position);

        const key = getScenarioKey(selected.position, scenarioPlayers);
        scenarioPlayers[key] = {
          ...selected.player,
          round,
          pickOverall: userPickOverall
        };
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
