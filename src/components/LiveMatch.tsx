import React, { useState, useEffect } from 'react';
import { Match, Innings, Player, Bowler } from '@/types/cricket';
import { Button } from '@/components/ui/button';
import {
  generateId,
  createPlayer,
  createBowler,
  createInnings,
  getCurrentRunRate,
  getRequiredRunRate,
  formatOvers,
  calculateManOfMatch,
} from '@/lib/matchUtils';
import ScoreButtons from './ScoreButtons';
import Scorecard from './Scorecard';
import OverHistory from './OverHistory';
import PlayerInputModal from './PlayerInputModal';
import WicketModal from './WicketModal';
import { Menu, RotateCcw, Flag } from 'lucide-react';

interface LiveMatchProps {
  match: Match;
  onMatchUpdate: (match: Match) => void;
  onMatchComplete: (match: Match) => void;
  onEndInnings: () => void;
}

type ModalType = 'striker' | 'nonStriker' | 'bowler' | 'newBowler' | 'wicket' | null;

const LiveMatch: React.FC<LiveMatchProps> = ({
  match,
  onMatchUpdate,
  onMatchComplete,
  onEndInnings,
}) => {
  const [modalType, setModalType] = useState<ModalType>(null);
  const [pendingWicket, setPendingWicket] = useState(false);

  const currentInnings = match.innings[match.currentInnings];
  const isSecondInnings = match.currentInnings === 1;
  const target = isSecondInnings ? match.innings[0].totalRuns + 1 : null;

  // Check if we need to initialize batters/bowler
  useEffect(() => {
    if (!currentInnings) return;

    if (currentInnings.batters.length === 0) {
      setModalType('striker');
    } else if (currentInnings.batters.length === 1) {
      setModalType('nonStriker');
    } else if (currentInnings.bowlers.length === 0) {
      setModalType('bowler');
    }
  }, [currentInnings?.batters.length, currentInnings?.bowlers.length]);

  const handleAddPlayer = (name: string) => {
    const updatedMatch = { ...match };
    const innings = updatedMatch.innings[match.currentInnings];

    if (modalType === 'striker') {
      innings.batters.push(createPlayer(name));
      innings.currentBatterIndex = 0;
    } else if (modalType === 'nonStriker') {
      innings.batters.push(createPlayer(name));
      innings.nonStrikerIndex = 1;
    } else if (modalType === 'bowler' || modalType === 'newBowler') {
      const existingBowlerIdx = innings.bowlers.findIndex((b) => b.name === name);
      if (existingBowlerIdx >= 0) {
        innings.currentBowlerIndex = existingBowlerIdx;
      } else {
        innings.bowlers.push(createBowler(name));
        innings.currentBowlerIndex = innings.bowlers.length - 1;
      }
    }

    setModalType(null);
    onMatchUpdate(updatedMatch);
  };

  const handleScore = (runs: number, isExtra = false, extraType?: string) => {
    const updatedMatch = { ...match };
    const innings = updatedMatch.innings[match.currentInnings];
    const striker = innings.batters[innings.currentBatterIndex];
    const bowler = innings.bowlers[innings.currentBowlerIndex];
    const currentOverIdx = innings.overHistory.length - 1;

    let ballLabel = runs.toString();
    let isLegalDelivery = true;

    if (isExtra) {
      switch (extraType) {
        case 'wide':
          innings.extras.wides += runs;
          innings.totalRuns += runs;
          bowler.runs += runs;
          bowler.wides += 1;
          ballLabel = `${runs}wd`;
          isLegalDelivery = false;
          break;
        case 'noball':
          innings.extras.noBalls += 1;
          innings.totalRuns += runs;
          striker.runs += runs - 1;
          if (runs - 1 > 0) striker.balls += 1;
          bowler.runs += runs;
          bowler.noBalls += 1;
          ballLabel = `${runs}nb`;
          isLegalDelivery = false;
          break;
        case 'bye':
          innings.extras.byes += runs;
          innings.totalRuns += runs;
          striker.balls += 1;
          ballLabel = `${runs}b`;
          break;
        case 'legbye':
          innings.extras.legByes += runs;
          innings.totalRuns += runs;
          striker.balls += 1;
          ballLabel = `${runs}lb`;
          break;
      }
    } else {
      striker.runs += runs;
      striker.balls += 1;
      innings.totalRuns += runs;
      bowler.runs += runs;

      if (runs === 4) striker.fours += 1;
      if (runs === 6) striker.sixes += 1;
      if (runs === 0) ballLabel = '0';
    }

    // Add to over history
    innings.overHistory[currentOverIdx].push(ballLabel);

    if (isLegalDelivery) {
      innings.totalBalls += 1;
      bowler.balls += 1;

      // Check for over completion
      if (bowler.balls === 6) {
        bowler.overs += 1;
        bowler.balls = 0;
        innings.totalOvers += 1;

        // Check maiden
        const currentOver = innings.overHistory[currentOverIdx];
        const overRuns = currentOver.reduce((sum, ball) => {
          const num = parseInt(ball);
          return sum + (isNaN(num) ? 0 : num);
        }, 0);
        if (overRuns === 0) bowler.maidens += 1;

        // Start new over
        innings.overHistory.push([]);

        // Rotate strike
        [innings.currentBatterIndex, innings.nonStrikerIndex] = [
          innings.nonStrikerIndex,
          innings.currentBatterIndex,
        ];

        // Check if innings complete (overs finished)
        if (innings.totalOvers >= match.oversPerInnings) {
          completeInnings(updatedMatch);
          return;
        }

        // Ask for new bowler
        setModalType('newBowler');
      }
    }

    // Rotate strike on odd runs (except on extras that don't count)
    if (!isExtra || extraType === 'bye' || extraType === 'legbye') {
      if (runs % 2 === 1) {
        [innings.currentBatterIndex, innings.nonStrikerIndex] = [
          innings.nonStrikerIndex,
          innings.currentBatterIndex,
        ];
      }
    }

    // Check if target achieved (second innings)
    if (isSecondInnings && target && innings.totalRuns >= target) {
      updatedMatch.isComplete = true;
      updatedMatch.winner = innings.battingTeam;
      updatedMatch.manOfMatch = calculateManOfMatch(updatedMatch);
      onMatchComplete(updatedMatch);
      return;
    }

    onMatchUpdate(updatedMatch);
  };

  const handleWicket = () => {
    setPendingWicket(true);
    setModalType('wicket');
  };

  const handleWicketConfirm = (dismissalType: string, newBatterName: string) => {
    const updatedMatch = { ...match };
    const innings = updatedMatch.innings[match.currentInnings];
    const striker = innings.batters[innings.currentBatterIndex];
    const bowler = innings.bowlers[innings.currentBowlerIndex];
    const currentOverIdx = innings.overHistory.length - 1;

    // Mark batter as out
    striker.isOut = true;
    striker.dismissalType = dismissalType;
    striker.bowler = bowler.name;
    striker.balls += 1;

    // Update bowler stats (run outs don't count as bowler's wicket)
    if (dismissalType !== 'runout') {
      bowler.wickets += 1;
    }

    // Update innings
    innings.totalWickets += 1;
    innings.totalBalls += 1;
    bowler.balls += 1;

    // Add to over history
    innings.overHistory[currentOverIdx].push('W');

    // Check if all out
    const maxWickets = match.playersPerTeam - 1;
    if (innings.totalWickets >= maxWickets) {
      completeInnings(updatedMatch);
      setPendingWicket(false);
      setModalType(null);
      return;
    }

    // Check for over completion
    if (bowler.balls === 6) {
      bowler.overs += 1;
      bowler.balls = 0;
      innings.totalOvers += 1;
      innings.overHistory.push([]);

      if (innings.totalOvers >= match.oversPerInnings) {
        completeInnings(updatedMatch);
        setPendingWicket(false);
        setModalType(null);
        return;
      }
    }

    // Add new batter
    if (newBatterName) {
      innings.batters.push(createPlayer(newBatterName));
      innings.currentBatterIndex = innings.batters.length - 1;
    }

    setPendingWicket(false);
    setModalType(null);
    onMatchUpdate(updatedMatch);

    // If over just completed, ask for new bowler
    if (bowler.balls === 0 && innings.totalOvers < match.oversPerInnings) {
      setModalType('newBowler');
    }
  };

  const completeInnings = (updatedMatch: Match) => {
    const innings = updatedMatch.innings[updatedMatch.currentInnings];
    innings.isComplete = true;

    if (updatedMatch.currentInnings === 0) {
      // First innings complete, start second
      const battingTeam =
        updatedMatch.toss?.winner === updatedMatch.team1 &&
        updatedMatch.toss?.decision === 'bat'
          ? updatedMatch.team2
          : updatedMatch.team1;
      const bowlingTeam =
        battingTeam === updatedMatch.team1 ? updatedMatch.team2 : updatedMatch.team1;

      updatedMatch.innings.push(createInnings(battingTeam, bowlingTeam));
      updatedMatch.currentInnings = 1;
      onMatchUpdate(updatedMatch);
      onEndInnings();
    } else {
      // Second innings complete
      updatedMatch.isComplete = true;

      const firstInningsRuns = updatedMatch.innings[0].totalRuns;
      const secondInningsRuns = innings.totalRuns;

      if (secondInningsRuns > firstInningsRuns) {
        updatedMatch.winner = innings.battingTeam;
      } else if (firstInningsRuns > secondInningsRuns) {
        updatedMatch.winner = updatedMatch.innings[0].battingTeam;
      } else {
        updatedMatch.winner = undefined; // Tie
      }

      updatedMatch.manOfMatch = calculateManOfMatch(updatedMatch);
      onMatchComplete(updatedMatch);
    }
  };

  if (!currentInnings) {
    return <div>Loading...</div>;
  }

  const striker = currentInnings.batters[currentInnings.currentBatterIndex];
  const nonStriker = currentInnings.batters[currentInnings.nonStrikerIndex];
  const currentBowler = currentInnings.bowlers[currentInnings.currentBowlerIndex];
  const currentOver = currentInnings.overHistory[currentInnings.overHistory.length - 1] || [];
  const isAllOut = currentInnings.totalWickets >= match.playersPerTeam - 1;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-lg font-bold">
                {currentInnings.battingTeam} vs {currentInnings.bowlingTeam}
              </h1>
              <p className="text-xs text-muted-foreground">
                {isSecondInnings ? '2nd' : '1st'} Innings
              </p>
            </div>
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </div>

          {/* Live Score */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-3xl md:text-4xl font-bold font-mono text-primary animate-pulse-glow inline-block">
                {currentInnings.totalRuns}/{currentInnings.totalWickets}
              </span>
              <span className="text-muted-foreground ml-2">
                ({formatOvers(currentInnings.totalOvers, currentInnings.bowlers[currentInnings.currentBowlerIndex]?.balls || 0)})
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                CRR:{' '}
                <span className="font-mono text-foreground">
                  {getCurrentRunRate(
                    currentInnings.totalRuns,
                    currentInnings.totalOvers,
                    currentInnings.bowlers[currentInnings.currentBowlerIndex]?.balls || 0
                  )}
                </span>
              </p>
              {isSecondInnings && target && (
                <p className="text-sm text-muted-foreground">
                  Need{' '}
                  <span className="font-mono text-primary font-bold">
                    {target - currentInnings.totalRuns}
                  </span>{' '}
                  from{' '}
                  <span className="font-mono">
                    {(match.oversPerInnings - currentInnings.totalOvers) * 6 -
                      (currentInnings.bowlers[currentInnings.currentBowlerIndex]?.balls || 0)}
                  </span>{' '}
                  balls
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Current Players */}
        {striker && nonStriker && currentBowler && (
          <div className="grid grid-cols-2 gap-3">
            <div className="cricket-card p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 bg-accent rounded-full animate-pulse"></span>
                <span className="text-xs text-muted-foreground">On Strike</span>
              </div>
              <p className="font-semibold truncate">{striker.name}</p>
              <p className="font-mono text-lg">
                {striker.runs}
                <span className="text-xs text-muted-foreground">({striker.balls})</span>
              </p>
            </div>
            <div className="cricket-card p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-muted-foreground">Non-Striker</span>
              </div>
              <p className="font-semibold truncate">{nonStriker.name}</p>
              <p className="font-mono text-lg">
                {nonStriker.runs}
                <span className="text-xs text-muted-foreground">({nonStriker.balls})</span>
              </p>
            </div>
          </div>
        )}

        {/* Bowler */}
        {currentBowler && (
          <div className="cricket-card p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Bowling</p>
                <p className="font-semibold">{currentBowler.name}</p>
              </div>
              <div className="text-right font-mono">
                <p>
                  {currentBowler.wickets}/{currentBowler.runs}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatOvers(currentBowler.overs, currentBowler.balls)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Over History */}
        <OverHistory
          overHistory={currentInnings.overHistory.slice(0, -1)}
          currentOver={currentOver}
        />

        {/* Score Buttons */}
        <ScoreButtons
          onScore={handleScore}
          onWicket={handleWicket}
          disabled={modalType !== null}
        />

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              [currentInnings.currentBatterIndex, currentInnings.nonStrikerIndex] = [
                currentInnings.nonStrikerIndex,
                currentInnings.currentBatterIndex,
              ];
              onMatchUpdate({ ...match });
            }}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Rotate Strike
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={() => {
              if (confirm('End this innings?')) {
                completeInnings({ ...match });
              }
            }}
          >
            <Flag className="w-4 h-4 mr-2" />
            End Innings
          </Button>
        </div>

        {/* Full Scorecard */}
        <Scorecard
          innings={currentInnings}
          currentBatterIndex={currentInnings.currentBatterIndex}
          nonStrikerIndex={currentInnings.nonStrikerIndex}
          currentBowlerIndex={currentInnings.currentBowlerIndex}
        />
      </main>

      {/* Modals */}
      <PlayerInputModal
        isOpen={modalType === 'striker'}
        onClose={() => {}}
        onSubmit={handleAddPlayer}
        title="Opening Batter (Striker)"
        description="Enter the name of the first batter"
      />

      <PlayerInputModal
        isOpen={modalType === 'nonStriker'}
        onClose={() => {}}
        onSubmit={handleAddPlayer}
        title="Opening Batter (Non-Striker)"
        description="Enter the name of the second batter"
      />

      <PlayerInputModal
        isOpen={modalType === 'bowler' || modalType === 'newBowler'}
        onClose={() => {}}
        onSubmit={handleAddPlayer}
        title={modalType === 'bowler' ? 'Opening Bowler' : 'New Over - Select Bowler'}
        description="Enter bowler's name"
        existingPlayers={currentInnings.bowlers.map((b) => b.name)}
      />

      <WicketModal
        isOpen={modalType === 'wicket'}
        onClose={() => {
          setModalType(null);
          setPendingWicket(false);
        }}
        onSubmit={handleWicketConfirm}
        batterName={striker?.name || ''}
        bowlerName={currentBowler?.name || ''}
        isAllOut={isAllOut}
      />
    </div>
  );
};

export default LiveMatch;
