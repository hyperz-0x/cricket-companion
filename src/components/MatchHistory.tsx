import React from 'react';
import { Match, Series } from '@/types/cricket';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Download, Eye, Calendar, Trophy } from 'lucide-react';
import { exportMatchToPDF, exportSeriesToPDF } from '@/lib/pdfExport';
import { formatOvers } from '@/lib/matchUtils';

interface MatchHistoryProps {
  matches: Match[];
  series: Series[];
  onDeleteMatch: (id: string) => void;
  onDeleteSeries: (id: string) => void;
  onViewMatch: (match: Match) => void;
  onViewSeries: (series: Series) => void;
  onClose: () => void;
}

const MatchHistory: React.FC<MatchHistoryProps> = ({
  matches,
  series,
  onDeleteMatch,
  onDeleteSeries,
  onViewMatch,
  onViewSeries,
  onClose,
}) => {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Match History</h1>
          <Button variant="outline" onClick={onClose}>
            Back
          </Button>
        </div>

        {/* Series */}
        {series.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Series ({series.length})
            </h2>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {series.map((s) => (
                  <div
                    key={s.id}
                    className="cricket-card p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold">{s.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {s.team1} {s.team1Wins} - {s.team2Wins} {s.team2}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {s.matches.length}/{s.totalMatches} matches played
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewSeries(s)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => exportSeriesToPDF(s)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteSeries(s.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Single Matches */}
        <div>
          <h2 className="text-lg font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Single Matches ({matches.length})
          </h2>
          {matches.length === 0 && series.length === 0 ? (
            <div className="cricket-card p-8 text-center">
              <p className="text-muted-foreground">No matches played yet</p>
            </div>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {matches.map((match) => (
                  <div
                    key={match.id}
                    className="cricket-card p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold">
                        {match.team1} vs {match.team2}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(match.date).toLocaleDateString()}
                      </p>
                      {match.isComplete && (
                        <p className="text-xs text-primary">
                          Winner: {match.winner || 'Tied'}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewMatch(match)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => exportMatchToPDF(match)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteMatch(match.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchHistory;
