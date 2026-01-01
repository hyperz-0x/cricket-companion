import { Match, Innings, Player, Bowler, PlayerSeriesStats, Series } from '@/types/cricket';

export const generateId = () => Math.random().toString(36).substring(2, 15);

export const createPlayer = (name: string): Player => ({
  id: generateId(),
  name,
  runs: 0,
  balls: 0,
  fours: 0,
  sixes: 0,
  isOut: false,
});

export const createBowler = (name: string): Bowler => ({
  id: generateId(),
  name,
  overs: 0,
  balls: 0,
  maidens: 0,
  runs: 0,
  wickets: 0,
  wides: 0,
  noBalls: 0,
});

export const createInnings = (battingTeam: string, bowlingTeam: string): Innings => ({
  battingTeam,
  bowlingTeam,
  batters: [],
  bowlers: [],
  totalRuns: 0,
  totalWickets: 0,
  totalOvers: 0,
  totalBalls: 0,
  extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
  currentBatterIndex: 0,
  nonStrikerIndex: 1,
  currentBowlerIndex: 0,
  overHistory: [[]],
  isComplete: false,
});

export const calculateStrikeRate = (runs: number, balls: number): number => {
  if (balls === 0) return 0;
  return Number(((runs / balls) * 100).toFixed(2));
};

export const calculateEconomy = (runs: number, overs: number, balls: number): number => {
  const totalOvers = overs + balls / 6;
  if (totalOvers === 0) return 0;
  return Number((runs / totalOvers).toFixed(2));
};

export const formatOvers = (overs: number, balls: number): string => {
  return `${overs}.${balls}`;
};

export const getCurrentRunRate = (runs: number, overs: number, balls: number): number => {
  const totalOvers = overs + balls / 6;
  if (totalOvers === 0) return 0;
  return Number((runs / totalOvers).toFixed(2));
};

export const getRequiredRunRate = (target: number, currentRuns: number, remainingOvers: number, remainingBalls: number): number => {
  const remaining = remainingOvers + remainingBalls / 6;
  if (remaining === 0) return 0;
  return Number(((target - currentRuns) / remaining).toFixed(2));
};

export const calculateManOfMatch = (match: Match): string => {
  const playerStats: Record<string, { runs: number; wickets: number; team: string }> = {};

  match.innings.forEach(innings => {
    innings.batters.forEach(batter => {
      if (!playerStats[batter.name]) {
        playerStats[batter.name] = { runs: 0, wickets: 0, team: innings.battingTeam };
      }
      playerStats[batter.name].runs += batter.runs;
    });

    innings.bowlers.forEach(bowler => {
      if (!playerStats[bowler.name]) {
        playerStats[bowler.name] = { runs: 0, wickets: 0, team: innings.bowlingTeam };
      }
      playerStats[bowler.name].wickets += bowler.wickets;
    });
  });

  let bestPlayer = '';
  let bestScore = -1;

  Object.entries(playerStats).forEach(([name, stats]) => {
    const score = stats.runs + stats.wickets * 25;
    if (score > bestScore) {
      bestScore = score;
      bestPlayer = name;
    }
  });

  return bestPlayer;
};

export const calculateManOfSeries = (series: Series): string => {
  const playerStats: Record<string, PlayerSeriesStats> = {};

  series.matches.forEach(match => {
    if (!match.isComplete) return;

    match.innings.forEach(innings => {
      innings.batters.forEach(batter => {
        if (!playerStats[batter.name]) {
          playerStats[batter.name] = {
            name: batter.name,
            team: innings.battingTeam,
            matches: 0,
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            wickets: 0,
            overs: 0,
            runsConceded: 0,
            strikeRate: 0,
            economy: 0,
          };
        }
        playerStats[batter.name].runs += batter.runs;
        playerStats[batter.name].balls += batter.balls;
        playerStats[batter.name].fours += batter.fours;
        playerStats[batter.name].sixes += batter.sixes;
      });

      innings.bowlers.forEach(bowler => {
        if (!playerStats[bowler.name]) {
          playerStats[bowler.name] = {
            name: bowler.name,
            team: innings.bowlingTeam,
            matches: 0,
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            wickets: 0,
            overs: 0,
            runsConceded: 0,
            strikeRate: 0,
            economy: 0,
          };
        }
        playerStats[bowler.name].wickets += bowler.wickets;
        playerStats[bowler.name].overs += bowler.overs;
        playerStats[bowler.name].runsConceded += bowler.runs;
      });
    });
  });

  let bestPlayer = '';
  let bestScore = -1;

  Object.entries(playerStats).forEach(([name, stats]) => {
    const score = stats.runs + stats.wickets * 25;
    if (score > bestScore) {
      bestScore = score;
      bestPlayer = name;
    }
  });

  return bestPlayer;
};

export const getSeriesStats = (series: Series): PlayerSeriesStats[] => {
  const playerStats: Record<string, PlayerSeriesStats> = {};

  series.matches.forEach(match => {
    if (!match.isComplete) return;

    match.innings.forEach(innings => {
      innings.batters.forEach(batter => {
        if (!playerStats[batter.name]) {
          playerStats[batter.name] = {
            name: batter.name,
            team: innings.battingTeam,
            matches: 0,
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            wickets: 0,
            overs: 0,
            runsConceded: 0,
            strikeRate: 0,
            economy: 0,
          };
        }
        playerStats[batter.name].runs += batter.runs;
        playerStats[batter.name].balls += batter.balls;
        playerStats[batter.name].fours += batter.fours;
        playerStats[batter.name].sixes += batter.sixes;
      });

      innings.bowlers.forEach(bowler => {
        if (!playerStats[bowler.name]) {
          playerStats[bowler.name] = {
            name: bowler.name,
            team: innings.bowlingTeam,
            matches: 0,
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            wickets: 0,
            overs: 0,
            runsConceded: 0,
            strikeRate: 0,
            economy: 0,
          };
        }
        playerStats[bowler.name].wickets += bowler.wickets;
        playerStats[bowler.name].overs += bowler.overs;
        playerStats[bowler.name].runsConceded += bowler.runs;
      });
    });
  });

  return Object.values(playerStats).map(stats => ({
    ...stats,
    strikeRate: calculateStrikeRate(stats.runs, stats.balls),
    economy: calculateEconomy(stats.runsConceded, Math.floor(stats.overs), stats.overs % 1 * 10),
  }));
};

export const saveToLocalStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return defaultValue;
  }
};
