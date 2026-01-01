import React from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface OverHistoryProps {
  overHistory: string[][];
  currentOver: string[];
}

const getBallStyle = (ball: string): string => {
  if (ball === 'W') return 'bg-destructive text-destructive-foreground';
  if (ball === '4') return 'bg-cricket-blue text-primary-foreground';
  if (ball === '6') return 'bg-cricket-gold text-accent-foreground';
  if (ball === '0' || ball === '.') return 'bg-muted text-muted-foreground';
  if (ball.includes('wd') || ball.includes('nb')) return 'bg-cricket-orange/30 text-cricket-orange';
  if (ball.includes('b') || ball.includes('lb')) return 'bg-secondary text-secondary-foreground';
  return 'bg-primary/20 text-primary';
};

const OverHistory: React.FC<OverHistoryProps> = ({ overHistory, currentOver }) => {
  return (
    <div className="cricket-card p-4">
      <h3 className="text-sm font-semibold text-muted-foreground mb-3">Recent Overs</h3>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-4">
          {overHistory.slice(-5).map((over, overIdx) => (
            <div key={overIdx} className="flex flex-col gap-1 min-w-max">
              <span className="text-xs text-muted-foreground">
                Over {overHistory.length - 5 + overIdx + 1}
              </span>
              <div className="flex gap-1">
                {over.map((ball, ballIdx) => (
                  <span
                    key={ballIdx}
                    className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${getBallStyle(ball)}`}
                  >
                    {ball === '0' ? '•' : ball}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {currentOver.length > 0 && (
            <div className="flex flex-col gap-1 min-w-max">
              <span className="text-xs text-primary font-semibold">Current</span>
              <div className="flex gap-1">
                {currentOver.map((ball, ballIdx) => (
                  <span
                    key={ballIdx}
                    className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold animate-fade-in ${getBallStyle(ball)}`}
                  >
                    {ball === '0' ? '•' : ball}
                  </span>
                ))}
                {[...Array(6 - currentOver.length)].map((_, idx) => (
                  <span
                    key={`empty-${idx}`}
                    className="w-7 h-7 flex items-center justify-center rounded-full text-xs border border-dashed border-border text-muted-foreground/30"
                  >
                    •
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default OverHistory;
