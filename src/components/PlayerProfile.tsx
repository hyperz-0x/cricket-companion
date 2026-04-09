import React, { useRef, useEffect } from 'react';
import { Match, Series } from '@/types/cricket';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Trophy, Target, Swords, TrendingUp } from 'lucide-react';
import logo from '@/assets/logo.png';
import { formatOvers, calculateStrikeRate, calculateEconomy } from '@/lib/matchUtils';

interface MatchPerformance {
  matchId: string;
  date: string;
  opponent: string;
  team: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  dismissalType?: string;
  wickets: number;
  oversBowled: number;
  ballsBowled: number;
  runsConceded: number;
  won: boolean;
}

interface PlayerProfileProps {
  playerName: string;
  matches: Match[];
  series: Series[];
  onClose: () => void;
}

const PlayerProfile: React.FC<PlayerProfileProps> = ({ playerName, matches, series, onClose }) => {
  const runsCanvasRef = useRef<HTMLCanvasElement>(null);
  const wicketsCanvasRef = useRef<HTMLCanvasElement>(null);

  // Gather match-by-match data
  const getPerformances = (): MatchPerformance[] => {
    const perfs: MatchPerformance[] = [];
    const allMatches = [...matches, ...series.flatMap(s => s.matches)];

    allMatches.forEach(match => {
      if (!match.isComplete) return;

      let runs = 0, balls = 0, fours = 0, sixes = 0, isOut = false, dismissalType = '';
      let wickets = 0, oversBowled = 0, ballsBowled = 0, runsConceded = 0;
      let found = false;
      let team = '';
      let opponent = '';

      match.innings.forEach(inn => {
        inn.batters.forEach(b => {
          if (b.name === playerName) {
            runs += b.runs; balls += b.balls; fours += b.fours; sixes += b.sixes;
            if (b.isOut) { isOut = true; dismissalType = b.dismissalType || 'out'; }
            found = true;
            team = inn.battingTeam;
            opponent = inn.bowlingTeam;
          }
        });
        inn.bowlers.forEach(b => {
          if (b.name === playerName) {
            wickets += b.wickets; oversBowled += b.overs; ballsBowled += b.balls; runsConceded += b.runs;
            found = true;
            if (!team) { team = inn.bowlingTeam; opponent = inn.battingTeam; }
          }
        });
      });

      if (found) {
        const won = match.winner === team;
        perfs.push({
          matchId: match.id, date: match.date, opponent, team,
          runs, balls, fours, sixes, isOut, dismissalType,
          wickets, oversBowled, ballsBowled, runsConceded, won,
        });
      }
    });

    return perfs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const performances = getPerformances();

  // Aggregate stats
  const totalMatches = performances.length;
  const totalRuns = performances.reduce((s, p) => s + p.runs, 0);
  const totalBalls = performances.reduce((s, p) => s + p.balls, 0);
  const totalFours = performances.reduce((s, p) => s + p.fours, 0);
  const totalSixes = performances.reduce((s, p) => s + p.sixes, 0);
  const totalWickets = performances.reduce((s, p) => s + p.wickets, 0);
  const totalOversBowled = performances.reduce((s, p) => s + p.oversBowled, 0);
  const totalBallsBowled = performances.reduce((s, p) => s + p.ballsBowled, 0);
  const totalRunsConceded = performances.reduce((s, p) => s + p.runsConceded, 0);
  const matchesWon = performances.filter(p => p.won).length;
  const bestBatting = performances.length > 0 ? Math.max(...performances.map(p => p.runs)) : 0;
  const bestBowling = performances.length > 0 ? Math.max(...performances.map(p => p.wickets)) : 0;
  const sr = totalBalls > 0 ? ((totalRuns / totalBalls) * 100).toFixed(1) : '-';
  const bowlingOvers = totalOversBowled + totalBallsBowled / 6;
  const eco = bowlingOvers > 0 ? (totalRunsConceded / bowlingOvers).toFixed(2) : '-';
  const winPct = totalMatches > 0 ? ((matchesWon / totalMatches) * 100).toFixed(0) + '%' : '-';
  const avg = performances.filter(p => p.isOut).length > 0
    ? (totalRuns / performances.filter(p => p.isOut).length).toFixed(1) : totalRuns > 0 ? 'N/A*' : '-';

  // Draw performance graph
  const drawGraph = (canvas: HTMLCanvasElement | null, data: number[], label: string, color: string) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const pad = { top: 30, right: 20, bottom: 35, left: 40 };
    const cw = w - pad.left - pad.right;
    const ch = h - pad.top - pad.bottom;

    ctx.clearRect(0, 0, w, h);

    if (data.length === 0) {
      ctx.fillStyle = '#9ca3af';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No data', w / 2, h / 2);
      return;
    }

    const maxVal = Math.max(...data, 1);

    // Grid
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + ch - (i / 4) * ch;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
      ctx.stroke();
      ctx.fillStyle = '#9ca3af';
      ctx.font = '9px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round((maxVal * i) / 4).toString(), pad.left - 6, y + 3);
    }
    ctx.setLineDash([]);

    // Axes
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top);
    ctx.lineTo(pad.left, h - pad.bottom);
    ctx.lineTo(w - pad.right, h - pad.bottom);
    ctx.stroke();

    if (data.length === 1) {
      // Single bar
      const barW = Math.min(cw / 2, 60);
      const barH = (data[0] / maxVal) * ch;
      const x = pad.left + cw / 2 - barW / 2;
      const y = pad.top + ch - barH;
      const grad = ctx.createLinearGradient(x, y, x, h - pad.bottom);
      grad.addColorStop(0, color);
      grad.addColorStop(1, color + '40');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, [6, 6, 0, 0]);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(data[0].toString(), x + barW / 2, y - 6);
      ctx.fillStyle = '#9ca3af';
      ctx.font = '9px sans-serif';
      ctx.fillText('M1', x + barW / 2, h - pad.bottom + 14);
    } else {
      // Line + area chart
      const step = cw / (data.length - 1);
      const points = data.map((v, i) => ({
        x: pad.left + i * step,
        y: pad.top + ch - (v / maxVal) * ch,
      }));

      // Area
      ctx.beginPath();
      ctx.moveTo(points[0].x, h - pad.bottom);
      points.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(points[points.length - 1].x, h - pad.bottom);
      ctx.closePath();
      const areaGrad = ctx.createLinearGradient(0, pad.top, 0, h - pad.bottom);
      areaGrad.addColorStop(0, color + '40');
      areaGrad.addColorStop(1, color + '05');
      ctx.fillStyle = areaGrad;
      ctx.fill();

      // Line
      ctx.beginPath();
      points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Dots + labels
      points.forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(data[i].toString(), p.x, p.y - 10);

        ctx.fillStyle = '#9ca3af';
        ctx.font = '8px sans-serif';
        ctx.fillText(`M${i + 1}`, p.x, h - pad.bottom + 12);
      });
    }

    // Title
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, w / 2, 18);
  };

  useEffect(() => {
    drawGraph(runsCanvasRef.current, performances.map(p => p.runs), 'Runs per Match', '#22c55e');
    drawGraph(wicketsCanvasRef.current, performances.map(p => p.wickets), 'Wickets per Match', '#ef4444');
  }, [performances]);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <img src={logo} alt="HYP-CricScore" className="w-8 h-8 object-contain" />
          <h1 className="text-xl font-bold truncate">{playerName}</h1>
        </div>

        {/* Career Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Matches', value: totalMatches, icon: <Swords className="w-4 h-4" /> },
            { label: 'Runs', value: totalRuns, icon: <TrendingUp className="w-4 h-4" /> },
            { label: 'Wickets', value: totalWickets, icon: <Target className="w-4 h-4" /> },
            { label: 'Win %', value: winPct, icon: <Trophy className="w-4 h-4" /> },
          ].map((stat) => (
            <div key={stat.label} className="cricket-card p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                {stat.icon}
                <span className="text-[10px] uppercase tracking-wider">{stat.label}</span>
              </div>
              <p className="text-xl font-bold text-primary">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Batting */}
          <div className="cricket-card p-4">
            <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full"></span>
              Batting Stats
            </h3>
            <div className="space-y-2 text-sm">
              {[
                ['Total Runs', totalRuns],
                ['Balls Faced', totalBalls],
                ['Fours', totalFours],
                ['Sixes', totalSixes],
                ['Strike Rate', sr],
                ['Best Score', bestBatting],
                ['Average', avg],
              ].map(([k, v]) => (
                <div key={k as string} className="flex justify-between">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-mono font-semibold">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bowling */}
          <div className="cricket-card p-4">
            <h3 className="text-sm font-semibold text-destructive mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-destructive rounded-full"></span>
              Bowling Stats
            </h3>
            <div className="space-y-2 text-sm">
              {[
                ['Total Wickets', totalWickets],
                ['Overs Bowled', formatOvers(totalOversBowled, totalBallsBowled)],
                ['Runs Conceded', totalRunsConceded],
                ['Economy', eco],
                ['Best Bowling', `${bestBowling}W`],
              ].map(([k, v]) => (
                <div key={k as string} className="flex justify-between">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-mono font-semibold">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Graphs - Separate */}
        <div className="grid grid-cols-1 gap-4">
          <div className="cricket-card p-4">
            <canvas
              ref={runsCanvasRef}
              className="w-full"
              style={{ width: '100%', height: '200px' }}
            />
          </div>
          <div className="cricket-card p-4">
            <canvas
              ref={wicketsCanvasRef}
              className="w-full"
              style={{ width: '100%', height: '200px' }}
            />
          </div>
        </div>

        {/* Match-by-Match Breakdown */}
        <div className="cricket-card p-4">
          <h3 className="text-sm font-semibold mb-3">Match-by-Match</h3>
          <ScrollArea className="max-h-72">
            <div className="space-y-2">
              {performances.map((p, idx) => (
                <div
                  key={p.matchId}
                  className={`p-3 rounded-lg border text-sm ${
                    p.won ? 'border-primary/30 bg-primary/5' : 'border-border/50 bg-muted/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs">
                      M{idx + 1} vs {p.opponent}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      p.won ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {p.won ? 'WON' : 'LOST'}
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>
                      🏏 {p.runs}({p.balls}) • {p.fours}×4 {p.sixes}×6
                      {p.isOut && <span className="text-destructive ml-1">({p.dismissalType})</span>}
                    </span>
                  </div>
                  {(p.wickets > 0 || p.oversBowled > 0 || p.ballsBowled > 0) && (
                    <div className="text-xs text-muted-foreground mt-1">
                      🎳 {p.wickets}/{p.runsConceded} ({formatOvers(p.oversBowled, p.ballsBowled)} ov)
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(p.date).toLocaleDateString()}
                  </p>
                </div>
              ))}
              {performances.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-4">No completed matches</p>
              )}
            </div>
          </ScrollArea>
        </div>

        <Button variant="outline" className="w-full" onClick={onClose}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Stats
        </Button>
      </div>
    </div>
  );
};

export default PlayerProfile;