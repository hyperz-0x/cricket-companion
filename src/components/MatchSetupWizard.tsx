import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MatchSetup, MatchType, SeriesLength } from '@/types/cricket';
import { Check, ChevronRight, ChevronLeft, Trophy, Users, Timer, Coins } from 'lucide-react';

interface MatchSetupWizardProps {
  onComplete: (setup: MatchSetup) => void;
}

type Step = 'type' | 'teams' | 'settings' | 'toss';

const MatchSetupWizard: React.FC<MatchSetupWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState<Step>('type');
  const [setup, setSetup] = useState<MatchSetup>({
    matchType: 'single',
    team1: '',
    team2: '',
    playersPerTeam: 11,
    oversPerInnings: 20,
  });

  const steps: Step[] = ['type', 'teams', 'settings', 'toss'];
  const currentStepIndex = steps.indexOf(step);

  const canProceed = () => {
    switch (step) {
      case 'type':
        return setup.matchType && (setup.matchType === 'single' || setup.seriesLength);
      case 'teams':
        return setup.team1.trim() && setup.team2.trim() && setup.team1 !== setup.team2;
      case 'settings':
        return setup.playersPerTeam >= 2 && setup.oversPerInnings >= 1;
      case 'toss':
        return setup.tossWinner && setup.tossDecision;
      default:
        return false;
    }
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex]);
    } else {
      onComplete(setup);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex]);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((s, idx) => (
        <React.Fragment key={s}>
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
              idx < currentStepIndex
                ? 'bg-primary text-primary-foreground'
                : idx === currentStepIndex
                ? 'bg-primary text-primary-foreground ring-4 ring-primary/30'
                : 'bg-secondary text-muted-foreground'
            }`}
          >
            {idx < currentStepIndex ? <Check className="w-5 h-5" /> : idx + 1}
          </div>
          {idx < steps.length - 1 && (
            <div
              className={`h-1 w-8 md:w-16 rounded transition-all duration-300 ${
                idx < currentStepIndex ? 'bg-primary' : 'bg-secondary'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderTypeStep = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <Trophy className="w-16 h-16 mx-auto text-primary mb-4" />
        <h2 className="text-2xl font-bold">Match Type</h2>
        <p className="text-muted-foreground">Choose how you want to play</p>
      </div>

      <RadioGroup
        value={setup.matchType}
        onValueChange={(value: MatchType) => setSetup({ ...setup, matchType: value, seriesLength: undefined })}
        className="grid gap-4"
      >
        <label
          className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
            setup.matchType === 'single'
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <RadioGroupItem value="single" id="single" />
          <div>
            <p className="font-semibold">Single Match</p>
            <p className="text-sm text-muted-foreground">Play one match</p>
          </div>
        </label>

        <label
          className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
            setup.matchType === 'series'
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <RadioGroupItem value="series" id="series" />
          <div>
            <p className="font-semibold">Series</p>
            <p className="text-sm text-muted-foreground">Play multiple matches</p>
          </div>
        </label>
      </RadioGroup>

      {setup.matchType === 'series' && (
        <div className="space-y-3 animate-fade-in">
          <Label className="text-sm font-medium">Series Length</Label>
          <div className="grid grid-cols-3 gap-3">
            {([2, 3, 5] as SeriesLength[]).map((length) => (
              <Button
                key={length}
                variant={setup.seriesLength === length ? 'default' : 'outline'}
                onClick={() => setSetup({ ...setup, seriesLength: length })}
                className="h-12"
              >
                {length} Matches
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderTeamsStep = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <Users className="w-16 h-16 mx-auto text-primary mb-4" />
        <h2 className="text-2xl font-bold">Team Names</h2>
        <p className="text-muted-foreground">Enter the competing teams</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="team1">Team 1</Label>
          <Input
            id="team1"
            value={setup.team1}
            onChange={(e) => setSetup({ ...setup, team1: e.target.value })}
            placeholder="Enter team name"
            className="h-12 text-lg"
          />
        </div>

        <div className="flex items-center justify-center">
          <span className="text-2xl font-bold text-muted-foreground">VS</span>
        </div>

        <div className="space-y-2">
          <Label htmlFor="team2">Team 2</Label>
          <Input
            id="team2"
            value={setup.team2}
            onChange={(e) => setSetup({ ...setup, team2: e.target.value })}
            placeholder="Enter team name"
            className="h-12 text-lg"
          />
        </div>
      </div>
    </div>
  );

  const renderSettingsStep = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <Timer className="w-16 h-16 mx-auto text-primary mb-4" />
        <h2 className="text-2xl font-bold">Match Settings</h2>
        <p className="text-muted-foreground">Configure the match format</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <Label>Players Per Team</Label>
          <div className="grid grid-cols-5 gap-2">
            {[4, 6, 8, 10, 11].map((num) => (
              <Button
                key={num}
                variant={setup.playersPerTeam === num ? 'default' : 'outline'}
                onClick={() => setSetup({ ...setup, playersPerTeam: num })}
                className="h-12"
              >
                {num}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            All out when {setup.playersPerTeam - 1} wickets fall
          </p>
        </div>

        <div className="space-y-3">
          <Label>Overs Per Innings</Label>
          <div className="grid grid-cols-5 gap-2">
            {[5, 10, 15, 20, 50].map((num) => (
              <Button
                key={num}
                variant={setup.oversPerInnings === num ? 'default' : 'outline'}
                onClick={() => setSetup({ ...setup, oversPerInnings: num })}
                className="h-12"
              >
                {num}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="customOvers">Or enter custom overs</Label>
          <Input
            id="customOvers"
            type="number"
            min={1}
            max={50}
            value={setup.oversPerInnings}
            onChange={(e) => setSetup({ ...setup, oversPerInnings: parseInt(e.target.value) || 1 })}
            className="h-12"
          />
        </div>
      </div>
    </div>
  );

  const renderTossStep = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <Coins className="w-16 h-16 mx-auto text-primary mb-4" />
        <h2 className="text-2xl font-bold">Toss</h2>
        <p className="text-muted-foreground">Who won the toss?</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <Label>Toss Winner</Label>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={setup.tossWinner === setup.team1 ? 'default' : 'outline'}
              onClick={() => setSetup({ ...setup, tossWinner: setup.team1 })}
              className="h-14 text-base"
            >
              {setup.team1}
            </Button>
            <Button
              variant={setup.tossWinner === setup.team2 ? 'default' : 'outline'}
              onClick={() => setSetup({ ...setup, tossWinner: setup.team2 })}
              className="h-14 text-base"
            >
              {setup.team2}
            </Button>
          </div>
        </div>

        {setup.tossWinner && (
          <div className="space-y-3 animate-fade-in">
            <Label>Elected to</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={setup.tossDecision === 'bat' ? 'default' : 'outline'}
                onClick={() => setSetup({ ...setup, tossDecision: 'bat' })}
                className="h-14 text-base"
              >
                🏏 Bat First
              </Button>
              <Button
                variant={setup.tossDecision === 'bowl' ? 'default' : 'outline'}
                onClick={() => setSetup({ ...setup, tossDecision: 'bowl' })}
                className="h-14 text-base"
              >
                🎯 Bowl First
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Cricket Scorer
          </h1>
          <p className="text-muted-foreground mt-2">Setup your match</p>
        </div>

        <div className="cricket-card p-6 md:p-8">
          {renderStepIndicator()}

          {step === 'type' && renderTypeStep()}
          {step === 'teams' && renderTeamsStep()}
          {step === 'settings' && renderSettingsStep()}
          {step === 'toss' && renderTossStep()}

          <div className="flex gap-3 mt-8">
            {currentStepIndex > 0 && (
              <Button variant="outline" onClick={handleBack} className="flex-1 h-12">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1 h-12"
            >
              {currentStepIndex === steps.length - 1 ? 'Start Match' : 'Next'}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchSetupWizard;
