import React, { useState } from 'react';
import { Match, Series } from '@/types/cricket';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Download, Eye, Calendar, Trophy, PlayCircle, BarChart3, GitCompareArrows, Swords } from 'lucide-react';
import logo from '@/assets/logo.png';
import { exportMatchToPDF, exportSeriesToPDF } from '@/lib/pdfExport';
import { formatOvers, calculateStrikeRate, calculateEconomy } from '@/lib/matchUtils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Crown } from 'lucide-react';

interface MatchHistoryProps {
  matches: Match[];
  series: Series[];
  onDeleteMatch: (id: string) => void;
  onDeleteSeries: (id: string) => void;
  onViewMatch: (match: Match) => void;
  onViewSeries: (series: Series) => void;
  onContinueMatch?: (match: Match) => void;
  onContinueSeries?: (series: Series) => void;
  onClose: () => void;
  onViewPlayer?: (playerName: string) => void;
  onCompare?: () => void;
  onHeadToHead?: () => void;
}

interface AllTimePlayerStats {
  name: string;
  matches: number;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  wickets: number;
  oversBowled: number;
  ballsBowled: number;
  runsConceded: number;
  bestBatting: number;
  bestBowling: number;
  matchesWon: number;
}

const MatchHistory: React.FC<MatchHistoryProps> = ({
  matches,
  series,
  onDeleteMatch,
  onDeleteSeries,
  onViewMatch,
  onViewSeries,
  onContinueMatch,
  onContinueSeries,
  onClose,
  onViewPlayer,
  onCompare,
  onHeadToHead,
}) => {
  const [showStats, setShowStats] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<AllTimePlayerStats | null>(null);

  interface CaptainStats {
    name: string;
    matches: number;
    wins: number;
    losses: number;
    ties: number;
  }

  const getCaptainStats = (): CaptainStats[] => {
    const stats: Record<string, CaptainStats> = {};
    const ensure = (n: string) => {
      if (!stats[n]) stats[n] = { name: n, matches: 0, wins: 0, losses: 0, ties: 0 };
    };
    const process = (m: Match) => {
      if (!m.isComplete) return;
      const entries: Array<[string | undefined, string]> = [
        [m.team1Captain, m.team1],
        [m.team2Captain, m.team2],
      ];
      entries.forEach(([captain, team]) => {
        if (!captain) return;
        ensure(captain);
        stats[captain].matches += 1;
        if (!m.winner) stats[captain].ties += 1;
        else if (m.winner === team) stats[captain].wins += 1;
        else stats[captain].losses += 1;
      });
    };
    matches.forEach(process);
    series.forEach(s => s.matches.forEach(process));
    return Object.values(stats).sort((a, b) => b.wins - a.wins || b.matches - a.matches);
  };

  const captainStats = showStats ? getCaptainStats() : [];

  const getAllTimeStats = (): AllTimePlayerStats[] => {
    const stats: Record<string, AllTimePlayerStats> = {};

    const ensurePlayer = (name: string) => {
      if (!stats[name]) {
        stats[name] = {
          name, matches: 0, runs: 0, balls: 0, fours: 0, sixes: 0,
          wickets: 0, oversBowled: 0, ballsBowled: 0, runsConceded: 0,
          bestBatting: 0, bestBowling: 0, matchesWon: 0,
        };
      }
    };

    const processMatch = (match: Match) => {
      if (!match.isComplete) return;
      const playersInMatch = new Set<string>();

      match.innings.forEach(innings => {
        innings.batters.forEach(batter => {
          ensurePlayer(batter.name);
          stats[batter.name].runs += batter.runs;
          stats[batter.name].balls += batter.balls;
          stats[batter.name].fours += batter.fours;
          stats[batter.name].sixes += batter.sixes;
          if (batter.runs > stats[batter.name].bestBatting) {
            stats[batter.name].bestBatting = batter.runs;
          }
          playersInMatch.add(batter.name);
        });
        innings.bowlers.forEach(bowler => {
          ensurePlayer(bowler.name);
          stats[bowler.name].wickets += bowler.wickets;
          stats[bowler.name].oversBowled += bowler.overs;
          stats[bowler.name].ballsBowled += bowler.balls;
          stats[bowler.name].runsConceded += bowler.runs;
          if (bowler.wickets > stats[bowler.name].bestBowling) {
            stats[bowler.name].bestBowling = bowler.wickets;
          }
          playersInMatch.add(bowler.name);
        });
      });

      playersInMatch.forEach(name => {
        stats[name].matches += 1;
        // Check if player was on winning team
        if (match.winner) {
          const wasOnWinningTeam = match.innings.some(inn =>
            (inn.battingTeam === match.winner && inn.batters.some(b => b.name === name)) ||
            (inn.bowlingTeam === match.winner && inn.bowlers.some(b => b.name === name))
          );
          if (wasOnWinningTeam) stats[name].matchesWon += 1;
        }
      });
    };

    matches.forEach(processMatch);
    series.forEach(s => s.matches.forEach(processMatch));

    return Object.values(stats).sort((a, b) => b.runs - a.runs);
  };

  const allTimeStats = showStats ? getAllTimeStats() : [];

  const getEconomy = (p: AllTimePlayerStats) => {
    const totalOvers = p.oversBowled + p.ballsBowled / 6;
    if (totalOvers === 0) return '-';
    return (p.runsConceded / totalOvers).toFixed(2);
  };

  const getSR = (p: AllTimePlayerStats) => {
    if (p.balls === 0) return '-';
    return ((p.runs / p.balls) * 100).toFixed(1);
  };

  const getWinPct = (p: AllTimePlayerStats) => {
    if (p.matches === 0) return '-';
    return ((p.matchesWon / p.matches) * 100).toFixed(0) + '%';
  };

  const economyNum = (p: AllTimePlayerStats) => {
    const totalOvers = p.oversBowled + p.ballsBowled / 6;
    return totalOvers === 0 ? Infinity : p.runsConceded / totalOvers;
  };
  const srNum = (p: AllTimePlayerStats) =>
    p.balls === 0 ? 0 : (p.runs / p.balls) * 100;

  type LeaderCfg = {
    key: string;
    label: string;
    accent: string;
    getValue: (p: AllTimePlayerStats) => string | number;
    sortBy: (p: AllTimePlayerStats) => number;
    ascending?: boolean;
    eligible?: (p: AllTimePlayerStats) => boolean;
  };

  const leaderboards: LeaderCfg[] = [
    { key: 'runs', label: 'Runs', accent: 'text-primary', getValue: p => p.runs, sortBy: p => p.runs },
    { key: 'wickets', label: 'Wickets', accent: 'text-destructive', getValue: p => p.wickets, sortBy: p => p.wickets },
    { key: 'matches', label: 'Matches', accent: 'text-accent', getValue: p => p.matches, sortBy: p => p.matches },
    { key: 'sr', label: 'Strike Rate', accent: 'text-primary', getValue: p => getSR(p), sortBy: srNum, eligible: p => p.balls >= 6 },
    { key: 'eco', label: 'Economy', accent: 'text-destructive', getValue: p => getEconomy(p), sortBy: economyNum, ascending: true, eligible: p => p.oversBowled + p.ballsBowled / 6 >= 1 },
    { key: 'fours', label: '4s', accent: 'text-primary', getValue: p => p.fours, sortBy: p => p.fours },
    { key: 'sixes', label: '6s', accent: 'text-primary', getValue: p => p.sixes, sortBy: p => p.sixes },
  ];

  const renderLeaderboard = (cfg: LeaderCfg) => {
    const rows = allTimeStats
      .filter(p => (cfg.eligible ? cfg.eligible(p) : true))
      .sort((a, b) => (cfg.ascending ? cfg.sortBy(a) - cfg.sortBy(b) : cfg.sortBy(b) - cfg.sortBy(a)));

    if (rows.length === 0) {
      return <div className="p-6 text-center text-muted-foreground text-sm">No data yet</div>;
    }

    return (
      <ScrollArea className="h-80">
        <div className="divide-y divide-border/50">
          {rows.map((p, idx) => (
            <div key={p.name} className="flex items-center justify-between px-3 py-2.5 hover:bg-muted/40">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 text-xs text-muted-foreground tabular-nums">#{idx + 1}</span>
                <button
                  className="text-sm font-medium truncate text-left hover:text-primary hover:underline"
                  onClick={() => setSelectedPlayer(p)}
                >
                  {p.name}
                </button>
              </div>
              <button
                onClick={() => setSelectedPlayer(p)}
                className={`text-base font-bold tabular-nums ${cfg.accent} hover:opacity-80`}
              >
                {cfg.getValue(p)}
              </button>
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img src={logo} alt="HYP-CricScore" className="w-8 h-8 object-contain" />
            <h1 className="text-2xl font-bold">Match History</h1>
          </div>
          <div className="flex gap-2">
            <Button variant={showStats ? "default" : "outline"} size="sm" onClick={() => setShowStats(!showStats)}>
              <BarChart3 className="w-4 h-4 mr-1" />
              Stats
            </Button>
            <Button variant="outline" size="sm" onClick={onCompare}>
              <GitCompareArrows className="w-4 h-4 mr-1" />
              Compare
            </Button>
            <Button variant="outline" size="sm" onClick={onHeadToHead}>
              <Swords className="w-4 h-4 mr-1" />
              H2H
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              Back
            </Button>
          </div>
        </div>

        {/* All-Time Player Stats */}
        {showStats && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              All-Time Leaderboards
            </h2>
            {allTimeStats.length === 0 ? (
              <div className="cricket-card p-6 text-center text-muted-foreground">
                No completed matches yet
              </div>
            ) : (
              <Tabs defaultValue="runs" className="w-full">
                <TabsList className="flex flex-wrap h-auto justify-start gap-1 bg-muted/40">
                  {leaderboards.map(cfg => (
                    <TabsTrigger key={cfg.key} value={cfg.key} className="text-xs sm:text-sm">
                      {cfg.label}
                    </TabsTrigger>
                  ))}
                  <TabsTrigger value="captains" className="text-xs sm:text-sm">
                    Captains
                  </TabsTrigger>
                </TabsList>
                {leaderboards.map(cfg => (
                  <TabsContent key={cfg.key} value={cfg.key} className="mt-3 cricket-card p-0 overflow-hidden">
                    {renderLeaderboard(cfg)}
                  </TabsContent>
                ))}
                <TabsContent value="captains" className="mt-3 cricket-card p-0 overflow-hidden">
                  {captainStats.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground text-sm">
                      No captain data yet. Add captain names when starting a match.
                    </div>
                  ) : (
                    <ScrollArea className="h-80">
                      <div className="divide-y divide-border/50">
                        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground bg-muted/30">
                          <span>Captain</span>
                          <span className="text-right w-10">M</span>
                          <span className="text-right w-10">W</span>
                          <span className="text-right w-10">L</span>
                          <span className="text-right w-14">Win %</span>
                        </div>
                        {captainStats.map((c) => {
                          const pct = c.matches === 0 ? '-' : ((c.wins / c.matches) * 100).toFixed(0) + '%';
                          return (
                            <div key={c.name} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 items-center px-3 py-2.5 hover:bg-muted/40">
                              <div className="flex items-center gap-2 min-w-0">
                                <Crown className="w-4 h-4 text-cricket-gold shrink-0" />
                                <span className="text-sm font-medium truncate">{c.name}</span>
                              </div>
                              <span className="text-right w-10 font-mono text-sm">{c.matches}</span>
                              <span className="text-right w-10 font-mono text-sm text-primary font-bold">{c.wins}</span>
                              <span className="text-right w-10 font-mono text-sm text-destructive">{c.losses}</span>
                              <span className="text-right w-14 font-mono text-sm font-bold">{pct}</span>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        )}

        {/* Incomplete Matches / Series - Continue */}
        {(matches.some(m => !m.isComplete) || series.some(s => !s.isComplete)) && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-accent mb-3 flex items-center gap-2">
              <PlayCircle className="w-5 h-5" />
              In Progress
            </h2>
            <div className="space-y-3">
              {series.filter(s => !s.isComplete).map(s => (
                <div key={s.id} className="cricket-card p-4 flex items-center justify-between border-l-4 border-l-accent">
                  <div>
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {s.team1} {s.team1Wins} - {s.team2Wins} {s.team2} • {s.matches.length}/{s.totalMatches} matches
                    </p>
                  </div>
                  <Button size="sm" onClick={() => onContinueSeries?.(s)}>
                    <PlayCircle className="w-4 h-4 mr-1" /> Continue
                  </Button>
                </div>
              ))}
              {matches.filter(m => !m.isComplete).map(m => (
                <div key={m.id} className="cricket-card p-4 flex items-center justify-between border-l-4 border-l-accent">
                  <div>
                    <p className="font-semibold">{m.team1} vs {m.team2}</p>
                    <p className="text-sm text-muted-foreground">
                      {m.innings[m.currentInnings]?.totalRuns}/{m.innings[m.currentInnings]?.totalWickets} ({m.currentInnings === 0 ? '1st' : '2nd'} Inn)
                    </p>
                  </div>
                  <Button size="sm" onClick={() => onContinueMatch?.(m)}>
                    <PlayCircle className="w-4 h-4 mr-1" /> Continue
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Series */}
        {series.filter(s => s.isComplete).length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Series ({series.filter(s => s.isComplete).length})
            </h2>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {series.filter(s => s.isComplete).map((s) => (
                  <div key={s.id} className="cricket-card p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{s.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {s.team1} {s.team1Wins} - {s.team2Wins} {s.team2}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {s.matches.length}/{s.totalMatches} matches played
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => onViewSeries(s)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => exportSeriesToPDF(s)}>
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onDeleteSeries(s.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Single Matches */}
        <div>
          <h2 className="text-lg font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Single Matches ({matches.filter(m => m.isComplete).length})
          </h2>
          {matches.filter(m => m.isComplete).length === 0 && series.filter(s => s.isComplete).length === 0 && !matches.some(m => !m.isComplete) && !series.some(s => !s.isComplete) ? (
            <div className="cricket-card p-8 text-center">
              <p className="text-muted-foreground">No matches played yet</p>
            </div>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {matches.filter(m => m.isComplete).map((match) => (
                  <div key={match.id} className="cricket-card p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{match.team1} vs {match.team2}</p>
                      <p className="text-sm text-muted-foreground">{new Date(match.date).toLocaleDateString()}</p>
                      <p className="text-xs text-primary">Winner: {match.winner || 'Tied'}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => onViewMatch(match)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => exportMatchToPDF(match)}>
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onDeleteMatch(match.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>

      {/* Player Stat Breakdown Modal */}
      <Dialog open={!!selectedPlayer} onOpenChange={(o) => !o && setSelectedPlayer(null)}>
        <DialogContent className="bg-card border-border max-w-md">
          {selectedPlayer && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedPlayer.name}</DialogTitle>
                <DialogDescription>Full career stat breakdown</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 py-2">
                {[
                  ['Matches', selectedPlayer.matches],
                  ['Runs', selectedPlayer.runs],
                  ['Balls', selectedPlayer.balls],
                  ['4s', selectedPlayer.fours],
                  ['6s', selectedPlayer.sixes],
                  ['Wickets', selectedPlayer.wickets],
                  ['Strike Rate', getSR(selectedPlayer)],
                  ['Economy', getEconomy(selectedPlayer)],
                  ['Overs Bowled', formatOvers(selectedPlayer.oversBowled, selectedPlayer.ballsBowled)],
                  ['Runs Conceded', selectedPlayer.runsConceded],
                  ['Best Score', selectedPlayer.bestBatting],
                  ['Best Bowling', `${selectedPlayer.bestBowling}W`],
                  ['Win %', getWinPct(selectedPlayer)],
                ].map(([k, v]) => (
                  <div key={k as string} className="rounded-lg border border-border/50 bg-muted/20 p-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</p>
                    <p className="text-lg font-bold font-mono text-primary">{v}</p>
                  </div>
                ))}
              </div>
              <DialogFooter className="gap-2 sm:gap-2">
                <Button variant="outline" onClick={() => setSelectedPlayer(null)}>Close</Button>
                {onViewPlayer && (
                  <Button
                    onClick={() => {
                      const name = selectedPlayer.name;
                      setSelectedPlayer(null);
                      onViewPlayer(name);
                    }}
                  >
                    View Full Profile
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MatchHistory;