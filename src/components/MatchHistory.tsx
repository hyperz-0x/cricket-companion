import React, { useState } from 'react';
import { Match, Series } from '@/types/cricket';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Download, Eye, Calendar, Trophy, PlayCircle, BarChart3 } from 'lucide-react';
import logo from '@/assets/logo.png';
import { exportMatchToPDF, exportSeriesToPDF } from '@/lib/pdfExport';
import { formatOvers } from '@/lib/matchUtils';

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

  // Calculate all-time player stats
  const getAllTimeStats = () => {
    const stats: Record<string, { name: string; matches: number; runs: number; balls: number; fours: number; sixes: number; wickets: number; overs: number; runsConceded: number }> = {};

    const processMatch = (match: Match) => {
      if (!match.isComplete) return;
      match.innings.forEach(innings => {
        innings.batters.forEach(batter => {
          if (!stats[batter.name]) {
            stats[batter.name] = { name: batter.name, matches: 0, runs: 0, balls: 0, fours: 0, sixes: 0, wickets: 0, overs: 0, runsConceded: 0 };
          }
          stats[batter.name].runs += batter.runs;
          stats[batter.name].balls += batter.balls;
          stats[batter.name].fours += batter.fours;
          stats[batter.name].sixes += batter.sixes;
        });
        innings.bowlers.forEach(bowler => {
          if (!stats[bowler.name]) {
            stats[bowler.name] = { name: bowler.name, matches: 0, runs: 0, balls: 0, fours: 0, sixes: 0, wickets: 0, overs: 0, runsConceded: 0 };
          }
          stats[bowler.name].wickets += bowler.wickets;
          stats[bowler.name].overs += bowler.overs;
          stats[bowler.name].runsConceded += bowler.runs;
        });
      });
    };

    matches.forEach(processMatch);
    series.forEach(s => s.matches.forEach(processMatch));

    // Count unique matches per player
    const countMatches = (allMatches: Match[]) => {
      allMatches.forEach(match => {
        if (!match.isComplete) return;
        const playersInMatch = new Set<string>();
        match.innings.forEach(innings => {
          innings.batters.forEach(b => playersInMatch.add(b.name));
          innings.bowlers.forEach(b => playersInMatch.add(b.name));
        });
        playersInMatch.forEach(name => {
          if (stats[name]) stats[name].matches += 1;
        });
      });
    };

    const allMatches = [...matches, ...series.flatMap(s => s.matches)];
    countMatches(allMatches);

    return Object.values(stats).sort((a, b) => b.runs - a.runs);
  };
  const allTimeStats = showStats ? getAllTimeStats() : [];

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
            <ScrollArea className="h-80">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-2">Player</th>
                      <th className="text-center p-2">M</th>
                      <th className="text-center p-2">Runs</th>
                      <th className="text-center p-2">Balls</th>
                      <th className="text-center p-2">4s</th>
                      <th className="text-center p-2">6s</th>
                      <th className="text-center p-2">Wkts</th>
                      <th className="text-center p-2">SR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allTimeStats.map((player, idx) => (
                      <tr key={idx} className="border-b border-border/50 hover:bg-muted/50">
                        <td className="p-2 font-medium">{player.name}</td>
                        <td className="text-center p-2">{player.matches}</td>
                        <td className="text-center p-2 font-semibold text-primary">{player.runs}</td>
                        <td className="text-center p-2">{player.balls}</td>
                        <td className="text-center p-2">{player.fours}</td>
                        <td className="text-center p-2">{player.sixes}</td>
                        <td className="text-center p-2">{player.wickets}</td>
                        <td className="text-center p-2">{player.balls > 0 ? ((player.runs / player.balls) * 100).toFixed(1) : '0'}</td>
                      </tr>
                    ))}
                    {allTimeStats.length === 0 && (
                      <tr><td colSpan={8} className="p-4 text-center text-muted-foreground">No completed matches yet</td></tr>
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
                  <div
                    key={s.id}
                    className="cricket-card p-4 flex items-center justify-between"
                  >
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
                  <div
                    key={match.id}
                    className="cricket-card p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold">
                        {match.team1} vs {match.team2}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(match.date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-primary">
                        Winner: {match.winner || 'Tied'}
                      </p>
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
