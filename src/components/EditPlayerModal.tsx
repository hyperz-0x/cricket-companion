import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit3 } from 'lucide-react';

interface EditPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newName: string) => void;
  currentName: string;
  playerType: 'batter' | 'bowler';
}

const EditPlayerModal: React.FC<EditPlayerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentName,
  playerType,
}) => {
  const [name, setName] = useState(currentName);

  useEffect(() => {
    setName(currentName);
  }, [currentName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && name.trim() !== currentName) {
      onSubmit(name.trim());
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Edit3 className="w-5 h-5 text-primary" />
            Edit {playerType === 'batter' ? 'Batter' : 'Bowler'} Name
          </DialogTitle>
          <DialogDescription>
            Update the name for this {playerType}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="playerName">Name</Label>
            <Input
              id="playerName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter player name"
              className="h-12 text-lg"
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={!name.trim()}>
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditPlayerModal;
