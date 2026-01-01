import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertTriangle, User } from 'lucide-react';

interface WicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dismissalType: string, newBatterName: string) => void;
  batterName: string;
  bowlerName: string;
  isAllOut: boolean;
}

const dismissalTypes = [
  { value: 'bowled', label: 'Bowled' },
  { value: 'caught', label: 'Caught' },
  { value: 'lbw', label: 'LBW' },
  { value: 'runout', label: 'Run Out' },
  { value: 'stumped', label: 'Stumped' },
  { value: 'hitwicket', label: 'Hit Wicket' },
];

const WicketModal: React.FC<WicketModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  batterName,
  bowlerName,
  isAllOut,
}) => {
  const [dismissalType, setDismissalType] = useState('bowled');
  const [newBatterName, setNewBatterName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAllOut || newBatterName.trim()) {
      onSubmit(dismissalType, newBatterName.trim());
      setDismissalType('bowled');
      setNewBatterName('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-destructive">
            <AlertTriangle className="w-6 h-6" />
            Wicket!
          </DialogTitle>
          <DialogDescription>
            {batterName} is out! b {bowlerName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Label>How Out?</Label>
            <RadioGroup
              value={dismissalType}
              onValueChange={setDismissalType}
              className="grid grid-cols-2 gap-2"
            >
              {dismissalTypes.map((type) => (
                <label
                  key={type.value}
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                    dismissalType === type.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value={type.value} id={type.value} />
                  <span className="text-sm">{type.label}</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          {!isAllOut && (
            <div className="space-y-2">
              <Label htmlFor="newBatter" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                New Batter
              </Label>
              <Input
                id="newBatter"
                value={newBatterName}
                onChange={(e) => setNewBatterName(e.target.value)}
                placeholder="Enter new batter's name"
                className="h-12 text-lg"
                autoFocus
              />
            </div>
          )}

          {isAllOut && (
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-center">
              <p className="text-destructive font-semibold">All Out!</p>
              <p className="text-sm text-muted-foreground">Innings Complete</p>
            </div>
          )}

          <Button
            type="submit"
            variant="destructive"
            className="w-full h-12"
            disabled={!isAllOut && !newBatterName.trim()}
          >
            Confirm Wicket
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WicketModal;
