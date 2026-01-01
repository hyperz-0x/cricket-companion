import React from 'react';
import { Match } from '@/types/cricket';
import { Button } from '@/components/ui/button';
import { Trophy, Star, Download, ArrowRight } from 'lucide-react';
import { exportMatchToPDF } from '@/lib/pdfExport';
import { formatOvers } from '@/lib/matchUtils';
import StatsChart from './StatsChart';

interface MatchSummaryProps {
  match: Match;
  onNewMatch?: () => void;
  onNextSeriesMatch?: () => void;
  isSeriesMatch?: boolean;
}

const MatchSummary: React.FC<MatchSummaryProps> = ({
  match,
  onNewMatch,
  onNextSeriesMatch,
  isSeriesMatch,
}) => {
  const innings1 = match.innings[0];
  const innings2 = match.innings[1];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-6">
          <Trophy className="w-16 h-16 mx-auto text-cricket-gold mb-4" />
          <h1 className="text-3xl font-bold mb-2">Match Complete!</h1>
          <p className="text-muted-foreground">
            {match.team1} vs {match.team2}
          </p>
        </div>

        {/* Winner Card */}
        <div className="cricket-card p-6 text-center bg-gradient-to-br from-primary/20 to-accent/10">
          <p className="text-sm text-muted-foreground mb-2">Winner</p>
          <h2 className="text-2xl md:text-3xl font-bold text-primary">
            {match.winner || 'Match Tied'}
          </h2>
        </div>

        {/* Score Cards */}
        <div className="grid gap-4">
          {match.innings.map((innings, idx) => (
            <div key={idx} className="cricket-card p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {idx === 0 ? '1st' : '2nd'} Innings
                  </p>
                  <h3 className="text-lg font-semibold">{innings.battingTeam}</h3>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold font-mono text-primary">
                    {innings.totalRuns}/{innings.totalWickets}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ({formatOvers(innings.totalOvers, innings.totalBalls)} overs)
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Man of the Match */}
        {match.manOfMatch && (
          <div className="cricket-card p-6 text-center bg-gradient-to-br from-cricket-gold/20 to-cricket-orange/10">
            <Star className="w-10 h-10 mx-auto text-cricket-gold mb-2" />
            <p className="text-sm text-muted-foreground mb-1">Man of the Match</p>
            <h3 className="text-xl font-bold">{match.manOfMatch}</h3>
          </div>
        )}

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-4">
          <StatsChart match={match} type="runs" />
          <StatsChart match={match} type="wickets" />
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={() => exportMatchToPDF(match)}
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Scorecard (PDF)
          </Button>

          {isSeriesMatch && onNextSeriesMatch && (
            <Button size="lg" onClick={onNextSeriesMatch} className="w-full">
              Next Match
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}

          {onNewMatch && (
            <Button
              variant="secondary"
              size="lg"
              onClick={onNewMatch}
              className="w-full"
            >
              New Match
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchSummary;
