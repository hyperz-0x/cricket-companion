import React from 'react';
import { Series } from '@/types/cricket';
import { Button } from '@/components/ui/button';
import { Trophy, Star, Download, Home } from 'lucide-react';
import logo from '@/assets/logo.png';
import { exportSeriesToPDF } from '@/lib/pdfExport';
import { getSeriesStats } from '@/lib/matchUtils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SeriesSummaryProps {
  series: Series;
  onNewSeries: () => void;
}

const SeriesSummary: React.FC<SeriesSummaryProps> = ({ series, onNewSeries }) => {
  const stats = getSeriesStats(series);
  const sortedByRuns = [...stats].sort((a, b) => b.runs - a.runs).slice(0, 5);
  const sortedByWickets = [...stats].sort((a, b) => b.wickets - a.wickets).slice(0, 5);

  const seriesWinner =
    series.team1Wins > series.team2Wins
      ? series.team1
      : series.team2Wins > series.team1Wins
      ? series.team2
      : 'Series Drawn';

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-6">
          <Trophy className="w-20 h-20 mx-auto text-cricket-gold mb-4" />
          <h1 className="text-3xl font-bold mb-2">Series Complete!</h1>
          <p className="text-lg text-muted-foreground">{series.name}</p>
        </div>

        {/* Series Score */}
        <div className="cricket-card p-6 text-center">
          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">{series.team1}</p>
              <p className="text-4xl font-bold font-mono text-primary">
                {series.team1Wins}
              </p>
            </div>
            <span className="text-2xl text-muted-foreground">-</span>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">{series.team2}</p>
              <p className="text-4xl font-bold font-mono text-cricket-blue">
                {series.team2Wins}
              </p>
            </div>
          </div>
        </div>

        {/* Series Winner */}
        <div className="cricket-card p-6 text-center bg-gradient-to-br from-primary/20 to-accent/10">
          <p className="text-sm text-muted-foreground mb-2">Series Winner</p>
          <h2 className="text-2xl md:text-3xl font-bold text-primary">
            {seriesWinner}
          </h2>
        </div>

        {/* Man of the Series */}
        {series.manOfSeries && (
          <div className="cricket-card p-6 text-center bg-gradient-to-br from-cricket-gold/20 to-cricket-orange/10">
            <Star className="w-12 h-12 mx-auto text-cricket-gold mb-2" />
            <p className="text-sm text-muted-foreground mb-1">Man of the Series</p>
            <h3 className="text-2xl font-bold">{series.manOfSeries}</h3>
          </div>
        )}

        {/* Top Performers */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Top Run Scorers */}
          <div className="cricket-card p-4">
            <h3 className="text-sm font-semibold text-primary mb-3">Top Run Scorers</h3>
            <ScrollArea className="h-40">
              <div className="space-y-2">
                {sortedByRuns.map((player, idx) => (
                  <div
                    key={player.name}
                    className="flex items-center justify-between py-2 border-b border-border/50"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          idx === 0
                            ? 'bg-cricket-gold text-accent-foreground'
                            : 'bg-secondary text-secondary-foreground'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-sm">{player.name}</span>
                    </div>
                    <span className="font-mono font-bold">{player.runs}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Top Wicket Takers */}
          <div className="cricket-card p-4">
            <h3 className="text-sm font-semibold text-destructive mb-3">
              Top Wicket Takers
            </h3>
            <ScrollArea className="h-40">
              <div className="space-y-2">
                {sortedByWickets.map((player, idx) => (
                  <div
                    key={player.name}
                    className="flex items-center justify-between py-2 border-b border-border/50"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          idx === 0
                            ? 'bg-destructive text-destructive-foreground'
                            : 'bg-secondary text-secondary-foreground'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-sm">{player.name}</span>
                    </div>
                    <span className="font-mono font-bold">{player.wickets}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Match Results */}
        <div className="cricket-card p-4">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
            Match Results
          </h3>
          <div className="space-y-2">
            {series.matches.map((match, idx) => (
              <div
                key={match.id}
                className="flex items-center justify-between py-2 border-b border-border/50"
              >
                <span className="text-sm">Match {idx + 1}</span>
                <span className="text-sm font-semibold text-primary">
                  {match.winner || 'Tied'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={() => exportSeriesToPDF(series)}
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Series Report (PDF)
          </Button>

          <Button size="lg" onClick={onNewSeries} className="w-full">
            <Home className="w-4 h-4 mr-2" />
            New Series / Match
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SeriesSummary;
