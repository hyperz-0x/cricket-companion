import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, UserPlus } from 'lucide-react';

interface PlayerInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  title: string;
  description: string;
  existingPlayers?: string[];
}

const PlayerInputModal: React.FC<PlayerInputModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  existingPlayers = [],
}) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
      setName('');
    }
  };

  const handleSelectExisting = (playerName: string) => {
    onSubmit(playerName);
    setName('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <User className="w-6 h-6 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="playerName">Player Name</Label>
            <Input
              id="playerName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter player name"
              className="h-12 text-lg"
              autoFocus
            />
          </div>

          {existingPlayers.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Or select from team:</Label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {existingPlayers.map((player) => (
                  <Button
                    key={player}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectExisting(player)}
                  >
                    {player}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <Button type="submit" className="w-full h-12" disabled={!name.trim()}>
            <UserPlus className="w-4 h-4 mr-2" />
            Confirm
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerInputModal;
