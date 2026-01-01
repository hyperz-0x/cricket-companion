import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ArrowRight, Trophy } from 'lucide-react';

interface NextMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartMatch: (tossWinner: string, tossDecision: 'bat' | 'bowl') => void;
  team1: string;
  team2: string;
  matchNumber: number;
  totalMatches: number;
  team1Wins: number;
  team2Wins: number;
}

const NextMatchModal: React.FC<NextMatchModalProps> = ({
  isOpen,
  onClose,
  onStartMatch,
  team1,
  team2,
  matchNumber,
  totalMatches,
  team1Wins,
  team2Wins,
}) => {
  const [tossWinner, setTossWinner] = useState<string>('');
  const [tossDecision, setTossDecision] = useState<'bat' | 'bowl' | ''>('');

  const handleStartMatch = () => {
    if (tossWinner && tossDecision) {
      onStartMatch(tossWinner, tossDecision);
      setTossWinner('');
      setTossDecision('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Match {matchNumber} of {totalMatches}
          </DialogTitle>
          <DialogDescription>
            {team1} vs {team2}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Series Score */}
          <div className="flex justify-center items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">{team1}</p>
              <p className="text-2xl font-bold text-primary">{team1Wins}</p>
            </div>
            <span className="text-muted-foreground">-</span>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">{team2}</p>
              <p className="text-2xl font-bold text-primary">{team2Wins}</p>
            </div>
          </div>

          {/* Toss Winner */}
          <div className="space-y-3">
            <Label>Who won the toss?</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={tossWinner === team1 ? 'default' : 'outline'}
                onClick={() => setTossWinner(team1)}
                className="w-full"
              >
                {team1}
              </Button>
              <Button
                type="button"
                variant={tossWinner === team2 ? 'default' : 'outline'}
                onClick={() => setTossWinner(team2)}
                className="w-full"
              >
                {team2}
              </Button>
            </div>
          </div>

          {/* Toss Decision */}
          {tossWinner && (
            <div className="space-y-3">
              <Label>{tossWinner} elected to?</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={tossDecision === 'bat' ? 'default' : 'outline'}
                  onClick={() => setTossDecision('bat')}
                  className="w-full"
                >
                  Bat First
                </Button>
                <Button
                  type="button"
                  variant={tossDecision === 'bowl' ? 'default' : 'outline'}
                  onClick={() => setTossDecision('bowl')}
                  className="w-full"
                >
                  Bowl First
                </Button>
              </div>
            </div>
          )}

          {/* Start Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleStartMatch}
            disabled={!tossWinner || !tossDecision}
          >
            Start Match {matchNumber}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NextMatchModal;
