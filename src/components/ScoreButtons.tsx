import React from 'react';
import { Button } from '@/components/ui/button';

interface ScoreButtonsProps {
  onScore: (runs: number, isExtra?: boolean, extraType?: string) => void;
  onWicket: () => void;
  disabled?: boolean;
}

const ScoreButtons: React.FC<ScoreButtonsProps> = ({ onScore, onWicket, disabled }) => {
  return (
    <div className="space-y-3">
      {/* Run buttons */}
      <div className="grid grid-cols-4 gap-2 md:gap-3">
        <Button
          variant="score"
          size="score"
          onClick={() => onScore(0)}
          disabled={disabled}
          className="score-button"
        >
          0
        </Button>
        <Button
          variant="scoreRun"
          size="score"
          onClick={() => onScore(1)}
          disabled={disabled}
          className="score-button"
        >
          1
        </Button>
        <Button
          variant="scoreRun"
          size="score"
          onClick={() => onScore(2)}
          disabled={disabled}
          className="score-button"
        >
          2
        </Button>
        <Button
          variant="scoreRun"
          size="score"
          onClick={() => onScore(3)}
          disabled={disabled}
          className="score-button"
        >
          3
        </Button>
      </div>

      {/* Boundary buttons */}
      <div className="grid grid-cols-2 gap-2 md:gap-3">
        <Button
          variant="scoreBoundary"
          size="score"
          onClick={() => onScore(4)}
          disabled={disabled}
          className="score-button"
        >
          4️⃣ FOUR
        </Button>
        <Button
          variant="scoreBoundary"
          size="score"
          onClick={() => onScore(6)}
          disabled={disabled}
          className="score-button"
        >
          6️⃣ SIX
        </Button>
      </div>

      {/* Extra buttons */}
      <div className="grid grid-cols-4 gap-2 md:gap-3">
        <Button
          variant="scoreExtra"
          size="score"
          onClick={() => onScore(1, true, 'wide')}
          disabled={disabled}
          className="score-button text-sm"
        >
          Wide
        </Button>
        <Button
          variant="scoreExtra"
          size="score"
          onClick={() => onScore(1, true, 'noball')}
          disabled={disabled}
          className="score-button text-sm"
        >
          No Ball
        </Button>
        <Button
          variant="scoreExtra"
          size="score"
          onClick={() => onScore(1, true, 'bye')}
          disabled={disabled}
          className="score-button text-sm"
        >
          Bye
        </Button>
        <Button
          variant="scoreExtra"
          size="score"
          onClick={() => onScore(1, true, 'legbye')}
          disabled={disabled}
          className="score-button text-sm"
        >
          Leg Bye
        </Button>
      </div>

      {/* Wicket button */}
      <Button
        variant="scoreWicket"
        size="score"
        onClick={onWicket}
        disabled={disabled}
        className="score-button w-full"
      >
        🎯 WICKET
      </Button>
    </div>
  );
};

export default ScoreButtons;
