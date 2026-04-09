import React, { useState } from 'react';
import { Match, Series } from '@/types/cricket';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Download, Eye, Calendar, Trophy, PlayCircle, BarChart3 } from 'lucide-react';
import logo from '@/assets/logo.png';
import { exportMatchToPDF, exportSeriesToPDF } from '@/lib/pdfExport';
import { formatOvers, calculateStrikeRate, calculateEconomy } from '@/lib/matchUtils';

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
}) => {
  const [showStats, setShowStats] = useState(false);

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
              All-Time Player Stats
            </h2>
            <ScrollArea className="h-96">
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-2 sticky left-0 bg-background">Player</th>
                      <th className="text-center p-1">M</th>
                      <th className="text-center p-1">Runs</th>
                      <th className="text-center p-1">4s</th>
                      <th className="text-center p-1">6s</th>
                      <th className="text-center p-1">SR</th>
                      <th className="text-center p-1">Best</th>
                      <th className="text-center p-1">Wkts</th>
                      <th className="text-center p-1">ECO</th>
                      <th className="text-center p-1">BstW</th>
                      <th className="text-center p-1">Win%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allTimeStats.map((player, idx) => (
                      <tr key={idx} className="border-b border-border/50 hover:bg-muted/50">
                        <td className="p-2 font-medium sticky left-0 bg-background">{player.name}</td>
                        <td className="text-center p-1">{player.matches}</td>
                        <td className="text-center p-1 font-semibold text-primary">{player.runs}</td>
                        <td className="text-center p-1">{player.fours}</td>
                        <td className="text-center p-1">{player.sixes}</td>
                        <td className="text-center p-1">{getSR(player)}</td>
                        <td className="text-center p-1 text-accent font-semibold">{player.bestBatting}</td>
                        <td className="text-center p-1 font-semibold text-destructive">{player.wickets}</td>
                        <td className="text-center p-1">{getEconomy(player)}</td>
                        <td className="text-center p-1 text-destructive font-semibold">{player.bestBowling}</td>
                        <td className="text-center p-1">{getWinPct(player)}</td>
                      </tr>
                    ))}
                    {allTimeStats.length === 0 && (
                      <tr><td colSpan={11} className="p-4 text-center text-muted-foreground">No completed matches yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </ScrollArea>
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
    </div>
  );
};

export default MatchHistory;