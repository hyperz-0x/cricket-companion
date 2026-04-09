import React, { useState } from 'react';
import { Match, Series } from '@/types/cricket';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy, Star, Download, ArrowRight, Home } from 'lucide-react';
import logo from '@/assets/logo.png';
import { exportMatchToPDF } from '@/lib/pdfExport';
import { formatOvers, calculateStrikeRate, calculateEconomy, getCurrentRunRate } from '@/lib/matchUtils';
import StatsChart from './StatsChart';
import NextMatchModal from './NextMatchModal';

interface MatchSummaryProps {
  match: Match;
  series?: Series | null;
  onNewMatch?: () => void;
  onNextSeriesMatch?: (tossWinner: string, tossDecision: 'bat' | 'bowl') => void;
  onGoHome?: () => void;
  isSeriesMatch?: boolean;
}

const MatchSummary: React.FC<MatchSummaryProps> = ({
  match,
  series,
  onNewMatch,
  onNextSeriesMatch,
  onGoHome,
  isSeriesMatch,
}) => {
  const [showNextMatchModal, setShowNextMatchModal] = useState(false);
  const [expandedInnings, setExpandedInnings] = useState<number | null>(null);

  const handleStartNextMatch = (tossWinner: string, tossDecision: 'bat' | 'bowl') => {
    setShowNextMatchModal(false);
    onNextSeriesMatch?.(tossWinner, tossDecision);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-6">
          <img src={logo} alt="HYP-CricScore" className="w-12 h-12 mx-auto mb-3 object-contain" />
          <Trophy className="w-16 h-16 mx-auto text-cricket-gold mb-4" />
          <h1 className="text-3xl font-bold mb-2">Match Complete!</h1>
          <p className="text-muted-foreground">
            {match.team1} vs {match.team2}
          </p>
          {series && (
            <p className="text-sm text-primary mt-2">
              Match {series.matches.filter(m => m.isComplete).length} of {series.totalMatches} • 
              Series: {series.team1Wins} - {series.team2Wins}
            </p>
          )}
        </div>

        {/* Winner Card */}
        <div className="cricket-card p-6 text-center bg-gradient-to-br from-primary/20 to-accent/10">
          <p className="text-sm text-muted-foreground mb-2">Winner</p>
          <h2 className="text-2xl md:text-3xl font-bold text-primary">
            {match.winner || 'Match Tied'}
          </h2>
        </div>

        {/* Detailed Score Cards with player stats */}
        <div className="grid gap-4">
          {match.innings.map((innings, idx) => {
            const isExpanded = expandedInnings === idx;
            const runRate = getCurrentRunRate(innings.totalRuns, innings.totalOvers, innings.totalBalls);
            
            return (
              <div key={idx} className="cricket-card overflow-hidden">
                {/* Score header */}
                <div
                  className="p-4 flex justify-between items-center cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedInnings(isExpanded ? null : idx)}
                >
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {idx === 0 ? '1st' : '2nd'} Innings
                    </p>
                    <h3 className="text-lg font-semibold">{innings.battingTeam}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      RR: {runRate} • Extras: {innings.extras.wides + innings.extras.noBalls + innings.extras.byes + innings.extras.legByes}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold font-mono text-primary">
                      {innings.totalRuns}/{innings.totalWickets}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ({formatOvers(innings.totalOvers, innings.totalBalls)} overs)
                    </p>
                    <p className="text-xs text-muted-foreground">{isExpanded ? '▲ Hide' : '▼ Details'}</p>
                  </div>
                </div>

                {/* Expanded player details */}
                {isExpanded && (
                  <div className="border-t border-border px-4 pb-4">
                    {/* Batting */}
                    <h4 className="text-xs font-semibold text-primary mt-3 mb-2">Batting</h4>
                    <ScrollArea className="max-h-48">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-muted-foreground">
                            <th className="text-left pb-1">Batter</th>
                            <th className="text-center pb-1">R</th>
                            <th className="text-center pb-1">B</th>
                            <th className="text-center pb-1">4s</th>
                            <th className="text-center pb-1">6s</th>
                            <th className="text-center pb-1">SR</th>
                          </tr>
                        </thead>
                        <tbody>
                          {innings.batters.map((batter) => (
                            <tr key={batter.id} className={`border-t border-border/30 ${batter.isOut ? 'text-muted-foreground' : ''}`}>
                              <td className="py-1 text-left">
                                {batter.name}
                                {batter.isOut && <span className="text-destructive ml-1 text-[10px]">({batter.dismissalType || 'out'})</span>}
                              </td>
                              <td className="text-center font-mono font-semibold">{batter.runs}</td>
                              <td className="text-center font-mono">{batter.balls}</td>
                              <td className="text-center font-mono">{batter.fours}</td>
                              <td className="text-center font-mono">{batter.sixes}</td>
                              <td className="text-center font-mono">{calculateStrikeRate(batter.runs, batter.balls)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </ScrollArea>

                    {/* Extras */}
                    <div className="mt-2 text-xs text-muted-foreground">
                      Extras: {innings.extras.wides}wd, {innings.extras.noBalls}nb, {innings.extras.byes}b, {innings.extras.legByes}lb
                    </div>

                    {/* Bowling */}
                    <h4 className="text-xs font-semibold text-destructive mt-3 mb-2">Bowling</h4>
                    <ScrollArea className="max-h-36">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-muted-foreground">
                            <th className="text-left pb-1">Bowler</th>
                            <th className="text-center pb-1">O</th>
                            <th className="text-center pb-1">M</th>
                            <th className="text-center pb-1">R</th>
                            <th className="text-center pb-1">W</th>
                            <th className="text-center pb-1">ECO</th>
                          </tr>
                        </thead>
                        <tbody>
                          {innings.bowlers.map((bowler) => (
                            <tr key={bowler.id} className="border-t border-border/30">
                              <td className="py-1 text-left">{bowler.name}</td>
                              <td className="text-center font-mono">{formatOvers(bowler.overs, bowler.balls)}</td>
                              <td className="text-center font-mono">{bowler.maidens}</td>
                              <td className="text-center font-mono">{bowler.runs}</td>
                              <td className="text-center font-mono font-bold text-destructive">{bowler.wickets}</td>
                              <td className="text-center font-mono">{calculateEconomy(bowler.runs, bowler.overs, bowler.balls)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </ScrollArea>
                  </div>
                )}
              </div>
            );
          })}
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
          <Button variant="outline" size="lg" onClick={() => exportMatchToPDF(match)} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Download Scorecard (PDF)
          </Button>

          {isSeriesMatch && onNextSeriesMatch && series && (
            <Button size="lg" onClick={() => setShowNextMatchModal(true)} className="w-full">
              Next Match (Match {series.matches.length + 1})
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}

          {onGoHome && (
            <Button variant="secondary" size="lg" onClick={onGoHome} className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          )}
        </div>
      </div>

      {/* Next Match Modal */}
      {series && (
        <NextMatchModal
          isOpen={showNextMatchModal}
          onClose={() => setShowNextMatchModal(false)}
          onStartMatch={handleStartNextMatch}
          team1={series.team1}
          team2={series.team2}
          matchNumber={series.matches.length + 1}
          totalMatches={series.totalMatches}
          team1Wins={series.team1Wins}
          team2Wins={series.team2Wins}
        />
      )}
    </div>
  );
};

export default MatchSummary;