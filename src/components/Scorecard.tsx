import React from 'react';
import { Innings, Player, Bowler } from '@/types/cricket';
import { calculateStrikeRate, calculateEconomy, formatOvers } from '@/lib/matchUtils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ScorecardProps {
  innings: Innings;
  currentBatterIndex: number;
  nonStrikerIndex: number;
  currentBowlerIndex: number;
}

const Scorecard: React.FC<ScorecardProps> = ({
  innings,
  currentBatterIndex,
  nonStrikerIndex,
  currentBowlerIndex,
}) => {
  const striker = innings.batters[currentBatterIndex];
  const nonStriker = innings.batters[nonStrikerIndex];
  const currentBowler = innings.bowlers[currentBowlerIndex];

  return (
    <div className="space-y-4">
      {/* Batting Card */}
      <div className="cricket-card p-4">
        <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-primary rounded-full"></span>
          Batting
        </h3>
        <ScrollArea className="max-h-48">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs">
                <th className="text-left pb-2">Batter</th>
                <th className="text-center pb-2">R(B)</th>
                <th className="text-center pb-2">4s</th>
                <th className="text-center pb-2">6s</th>
                <th className="text-center pb-2">SR</th>
              </tr>
            </thead>
            <tbody>
              {innings.batters.map((batter, idx) => (
                <tr
                  key={batter.id}
                  className={`border-t border-border/50 ${
                    idx === currentBatterIndex
                      ? 'bg-primary/10 text-primary font-semibold'
                      : idx === nonStrikerIndex
                      ? 'bg-secondary/50'
                      : batter.isOut
                      ? 'text-muted-foreground'
                      : ''
                  }`}
                >
                  <td className="py-2 text-left flex items-center gap-2">
                    {idx === currentBatterIndex && (
                      <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></span>
                    )}
                    <span className={batter.isOut ? 'line-through' : ''}>
                      {batter.name}
                    </span>
                    {batter.isOut && (
                      <span className="text-xs text-destructive">out</span>
                    )}
                  </td>
                  <td className="py-2 text-center font-mono">
                    {batter.runs}({batter.balls})
                  </td>
                  <td className="py-2 text-center font-mono text-cricket-blue">
                    {batter.fours}
                  </td>
                  <td className="py-2 text-center font-mono text-cricket-gold">
                    {batter.sixes}
                  </td>
                  <td className="py-2 text-center font-mono text-xs">
                    {calculateStrikeRate(batter.runs, batter.balls)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
        
        <div className="mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
          Extras: {innings.extras.wides}wd, {innings.extras.noBalls}nb,{' '}
          {innings.extras.byes}b, {innings.extras.legByes}lb ={' '}
          <span className="font-semibold text-foreground">
            {innings.extras.wides + innings.extras.noBalls + innings.extras.byes + innings.extras.legByes}
          </span>
        </div>
      </div>

      {/* Bowling Card */}
      <div className="cricket-card p-4">
        <h3 className="text-sm font-semibold text-destructive mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-destructive rounded-full"></span>
          Bowling
        </h3>
        <ScrollArea className="max-h-36">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs">
                <th className="text-left pb-2">Bowler</th>
                <th className="text-center pb-2">O</th>
                <th className="text-center pb-2">M</th>
                <th className="text-center pb-2">R</th>
                <th className="text-center pb-2">W</th>
                <th className="text-center pb-2">ECO</th>
              </tr>
            </thead>
            <tbody>
              {innings.bowlers.map((bowler, idx) => (
                <tr
                  key={bowler.id}
                  className={`border-t border-border/50 ${
                    idx === currentBowlerIndex
                      ? 'bg-destructive/10 text-destructive font-semibold'
                      : ''
                  }`}
                >
                  <td className="py-2 text-left flex items-center gap-2">
                    {idx === currentBowlerIndex && (
                      <span className="w-1.5 h-1.5 bg-destructive rounded-full animate-pulse"></span>
                    )}
                    {bowler.name}
                  </td>
                  <td className="py-2 text-center font-mono">
                    {formatOvers(bowler.overs, bowler.balls)}
                  </td>
                  <td className="py-2 text-center font-mono">{bowler.maidens}</td>
                  <td className="py-2 text-center font-mono">{bowler.runs}</td>
                  <td className="py-2 text-center font-mono text-cricket-red font-bold">
                    {bowler.wickets}
                  </td>
                  <td className="py-2 text-center font-mono text-xs">
                    {calculateEconomy(bowler.runs, bowler.overs, bowler.balls)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      </div>
    </div>
  );
};

export default Scorecard;
