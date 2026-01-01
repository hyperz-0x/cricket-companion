export interface Player {
  id: string;
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  dismissalType?: string;
  bowler?: string;
}

export interface Bowler {
  id: string;
  name: string;
  overs: number;
  balls: number;
  maidens: number;
  runs: number;
  wickets: number;
  wides: number;
  noBalls: number;
}

export interface Innings {
  battingTeam: string;
  bowlingTeam: string;
  batters: Player[];
  bowlers: Bowler[];
  totalRuns: number;
  totalWickets: number;
  totalOvers: number;
  totalBalls: number;
  extras: {
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
  };
  currentBatterIndex: number;
  nonStrikerIndex: number;
  currentBowlerIndex: number;
  overHistory: string[][];
  isComplete: boolean;
}

export interface Match {
  id: string;
  date: string;
  team1: string;
  team2: string;
  playersPerTeam: number;
  oversPerInnings: number;
  innings: Innings[];
  currentInnings: number;
  isComplete: boolean;
  winner?: string;
  manOfMatch?: string;
  toss?: {
    winner: string;
    decision: 'bat' | 'bowl';
  };
}

export interface Series {
  id: string;
  name: string;
  team1: string;
  team2: string;
  totalMatches: number;
  matches: Match[];
  isComplete: boolean;
  team1Wins: number;
  team2Wins: number;
  manOfSeries?: string;
}

export interface PlayerSeriesStats {
  name: string;
  team: string;
  matches: number;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  wickets: number;
  overs: number;
  runsConceded: number;
  strikeRate: number;
  economy: number;
}

export type MatchType = 'single' | 'series';
export type SeriesLength = 2 | 3 | 5;

export interface MatchSetup {
  matchType: MatchType;
  seriesLength?: SeriesLength;
  team1: string;
  team2: string;
  playersPerTeam: number;
  oversPerInnings: number;
  tossWinner?: string;
  tossDecision?: 'bat' | 'bowl';
}
