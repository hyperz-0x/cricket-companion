import React, { useRef, useEffect, useState } from 'react';
import { Match, Series } from '@/types/cricket';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, GitCompareArrows, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import logo from '@/assets/logo.png';
import { formatOvers } from '@/lib/matchUtils';

interface PlayerStats {
  name: string;
  matches: number;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  wickets: number;
  oversBowled: number;
  ballsBowled: number;
  runsConceded: number;
  bestBatting: number;
  bestBowling: number;
  matchesWon: number;
  runsPerMatch: number[];
  wicketsPerMatch: number[];
}

interface PlayerComparisonProps {
  matches: Match[];
  series: Series[];
  onClose: () => void;
}

const PlayerComparison: React.FC<PlayerComparisonProps> = ({ matches, series, onClose }) => {
  const [player1, setPlayer1] = useState('');
  const [player2, setPlayer2] = useState('');
  const [search1, setSearch1] = useState('');
  const [search2, setSearch2] = useState('');
  const [showList1, setShowList1] = useState(false);
  const [showList2, setShowList2] = useState(false);
  const runsCanvasRef = useRef<HTMLCanvasElement>(null);
  const wicketsCanvasRef = useRef<HTMLCanvasElement>(null);

  const getAllPlayers = (): string[] => {
    const names = new Set<string>();
    const allMatches = [...matches, ...series.flatMap(s => s.matches)];
    allMatches.forEach(m => {
      m.innings.forEach(inn => {
        inn.batters.forEach(b => names.add(b.name));
        inn.bowlers.forEach(b => names.add(b.name));
      });
    });
    return Array.from(names).sort();
  };

  const getPlayerStats = (playerName: string): PlayerStats | null => {
    if (!playerName) return null;
    const allMatches = [...matches, ...series.flatMap(s => s.matches)];
    const stat: PlayerStats = {
      name: playerName, matches: 0, runs: 0, balls: 0, fours: 0, sixes: 0,
      wickets: 0, oversBowled: 0, ballsBowled: 0, runsConceded: 0,
      bestBatting: 0, bestBowling: 0, matchesWon: 0,
      runsPerMatch: [], wicketsPerMatch: [],
    };

    allMatches.forEach(match => {
      if (!match.isComplete) return;
      let found = false;
      let matchRuns = 0, matchWickets = 0;
      let team = '';

      match.innings.forEach(inn => {
        inn.batters.forEach(b => {
          if (b.name === playerName) {
            stat.runs += b.runs; stat.balls += b.balls;
            stat.fours += b.fours; stat.sixes += b.sixes;
            matchRuns += b.runs;
            if (b.runs > stat.bestBatting) stat.bestBatting = b.runs;
            found = true;
            team = inn.battingTeam;
          }
        });
        inn.bowlers.forEach(b => {
          if (b.name === playerName) {
            stat.wickets += b.wickets; stat.oversBowled += b.overs;
            stat.ballsBowled += b.balls; stat.runsConceded += b.runs;
            matchWickets += b.wickets;
            if (b.wickets > stat.bestBowling) stat.bestBowling = b.wickets;
            found = true;
            if (!team) team = inn.bowlingTeam;
          }
        });
      });

      if (found) {
        stat.matches += 1;
        stat.runsPerMatch.push(matchRuns);
        stat.wicketsPerMatch.push(matchWickets);
        if (match.winner === team) stat.matchesWon += 1;
      }
    });

    return stat.matches > 0 ? stat : null;
  };

  const allPlayers = getAllPlayers();
  const stats1 = getPlayerStats(player1);
  const stats2 = getPlayerStats(player2);

  const getSR = (s: PlayerStats) => s.balls > 0 ? ((s.runs / s.balls) * 100).toFixed(1) : '-';
  const getEco = (s: PlayerStats) => {
    const ov = s.oversBowled + s.ballsBowled / 6;
    return ov > 0 ? (s.runsConceded / ov).toFixed(2) : '-';
  };
  const getWinPct = (s: PlayerStats) => s.matches > 0 ? ((s.matchesWon / s.matches) * 100).toFixed(0) + '%' : '-';

  const drawComparisonGraph = (
    canvas: HTMLCanvasElement | null,
    data1: number[], data2: number[],
    label: string, color1: string, color2: string,
    name1: string, name2: string
  ) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width, h = rect.height;
    const pad = { top: 35, right: 20, bottom: 40, left: 40 };
    const cw = w - pad.left - pad.right;
    const ch = h - pad.top - pad.bottom;

    ctx.clearRect(0, 0, w, h);

    const maxLen = Math.max(data1.length, data2.length, 1);
    const maxVal = Math.max(...data1, ...data2, 1);

    // Grid
    ctx.strokeStyle = 'hsl(var(--border))';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([4, 4]);
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + ch - (i / 4) * ch;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
      ctx.fillStyle = '#9ca3af'; ctx.font = '9px monospace'; ctx.textAlign = 'right';
      ctx.fillText(Math.round((maxVal * i) / 4).toString(), pad.left - 6, y + 3);
    }
    ctx.setLineDash([]);

    const drawLine = (data: number[], color: string) => {
      if (data.length === 0) return;
      const step = data.length > 1 ? cw / (data.length - 1) : cw / 2;
      const points = data.map((v, i) => ({
        x: pad.left + (data.length > 1 ? i * step : cw / 2),
        y: pad.top + ch - (v / maxVal) * ch,
      }));

      // Line
      ctx.beginPath();
      points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.stroke();

      // Dots
      points.forEach((p, i) => {
        ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = color; ctx.fill();
        ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
        ctx.fillText(data[i].toString(), p.x, p.y - 10);
      });
    };

    drawLine(data1, color1);
    drawLine(data2, color2);

    // X labels
    for (let i = 0; i < maxLen; i++) {
      const step = maxLen > 1 ? cw / (maxLen - 1) : cw / 2;
      const x = pad.left + (maxLen > 1 ? i * step : cw / 2);
      ctx.fillStyle = '#9ca3af'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`M${i + 1}`, x, h - pad.bottom + 14);
    }

    // Title
    ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(label, w / 2, 16);

    // Legend
    const legendY = h - 8;
    ctx.fillStyle = color1; ctx.fillRect(w / 2 - 80, legendY - 6, 8, 8);
    ctx.fillStyle = '#ccc'; ctx.font = '9px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(name1, w / 2 - 68, legendY + 1);
    ctx.fillStyle = color2; ctx.fillRect(w / 2 + 10, legendY - 6, 8, 8);
    ctx.fillStyle = '#ccc';
    ctx.fillText(name2, w / 2 + 22, legendY + 1);
  };

  useEffect(() => {
    if (stats1 && stats2) {
      drawComparisonGraph(runsCanvasRef.current, stats1.runsPerMatch, stats2.runsPerMatch,
        'Runs Comparison', '#22c55e', '#3b82f6', player1, player2);
      drawComparisonGraph(wicketsCanvasRef.current, stats1.wicketsPerMatch, stats2.wicketsPerMatch,
        'Wickets Comparison', '#ef4444', '#f59e0b', player1, player2);
    }
  }, [stats1, stats2]);

  const filtered1 = allPlayers.filter(p => p !== player2 && p.toLowerCase().includes(search1.toLowerCase()));
  const filtered2 = allPlayers.filter(p => p !== player1 && p.toLowerCase().includes(search2.toLowerCase()));

  const StatRow = ({ label, val1, val2, highlight }: { label: string; val1: string | number; val2: string | number; highlight?: 'higher' | 'lower' }) => {
    const n1 = typeof val1 === 'number' ? val1 : parseFloat(val1);
    const n2 = typeof val2 === 'number' ? val2 : parseFloat(val2);
    const better1 = highlight === 'lower' ? n1 < n2 : n1 > n2;
    const better2 = highlight === 'lower' ? n2 < n1 : n2 > n1;
    return (
      <div className="grid grid-cols-3 text-sm py-1.5 border-b border-border/30">
        <span className={`text-right font-mono pr-3 ${better1 && !isNaN(n1) && !isNaN(n2) ? 'text-primary font-bold' : ''}`}>{val1}</span>
        <span className="text-center text-muted-foreground text-xs">{label}</span>
        <span className={`text-left font-mono pl-3 ${better2 && !isNaN(n1) && !isNaN(n2) ? 'text-primary font-bold' : ''}`}>{val2}</span>
      </div>
    );
  };

  const PlayerSelector = ({ value, search, setSearch, showList, setShowList, onSelect, filtered, label }: {
    value: string; search: string; setSearch: (s: string) => void;
    showList: boolean; setShowList: (b: boolean) => void;
    onSelect: (n: string) => void; filtered: string[]; label: string;
  }) => (
    <div className="relative flex-1">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder={label}
          value={value || search}
          onChange={(e) => { setSearch(e.target.value); setShowList(true); onSelect(''); }}
          onFocus={() => setShowList(true)}
          className="pl-8 text-sm h-9"
        />
      </div>
      {showList && (
        <div className="absolute z-10 mt-1 w-full bg-card border border-border rounded-md shadow-lg max-h-40 overflow-y-auto">
          {filtered.map(name => (
            <button key={name} className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted/50 transition-colors"
              onClick={() => { onSelect(name); setSearch(''); setShowList(false); }}>
              {name}
            </button>
          ))}
          {filtered.length === 0 && <p className="p-2 text-xs text-muted-foreground">No players found</p>}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose}><ArrowLeft className="w-5 h-5" /></Button>
          <img src={logo} alt="HYP-CricScore" className="w-8 h-8 object-contain" />
          <h1 className="text-xl font-bold">Player Comparison</h1>
        </div>

        {/* Player Selectors */}
        <div className="flex gap-3 items-start">
          <PlayerSelector value={player1} search={search1} setSearch={setSearch1}
            showList={showList1} setShowList={setShowList1} onSelect={setPlayer1}
            filtered={filtered1} label="Select Player 1" />
          <GitCompareArrows className="w-5 h-5 text-muted-foreground mt-2 shrink-0" />
          <PlayerSelector value={player2} search={search2} setSearch={setSearch2}
            showList={showList2} setShowList={setShowList2} onSelect={setPlayer2}
            filtered={filtered2} label="Select Player 2" />
        </div>

        {stats1 && stats2 ? (
          <>
            {/* Side-by-side stats */}
            <div className="cricket-card p-4">
              <div className="grid grid-cols-3 mb-3">
                <h3 className="text-right text-sm font-semibold text-primary pr-3 truncate">{player1}</h3>
                <h3 className="text-center text-xs text-muted-foreground">vs</h3>
                <h3 className="text-left text-sm font-semibold text-primary pl-3 truncate">{player2}</h3>
              </div>

              <p className="text-xs text-muted-foreground text-center mb-2 font-semibold uppercase tracking-wider">Batting</p>
              <StatRow label="Matches" val1={stats1.matches} val2={stats2.matches} />
              <StatRow label="Runs" val1={stats1.runs} val2={stats2.runs} />
              <StatRow label="Balls" val1={stats1.balls} val2={stats2.balls} />
              <StatRow label="4s" val1={stats1.fours} val2={stats2.fours} />
              <StatRow label="6s" val1={stats1.sixes} val2={stats2.sixes} />
              <StatRow label="SR" val1={getSR(stats1)} val2={getSR(stats2)} />
              <StatRow label="Best" val1={stats1.bestBatting} val2={stats2.bestBatting} />

              <p className="text-xs text-muted-foreground text-center mb-2 mt-4 font-semibold uppercase tracking-wider">Bowling</p>
              <StatRow label="Wickets" val1={stats1.wickets} val2={stats2.wickets} />
              <StatRow label="Overs" val1={formatOvers(stats1.oversBowled, stats1.ballsBowled)} val2={formatOvers(stats2.oversBowled, stats2.ballsBowled)} />
              <StatRow label="Runs Given" val1={stats1.runsConceded} val2={stats2.runsConceded} highlight="lower" />
              <StatRow label="ECO" val1={getEco(stats1)} val2={getEco(stats2)} highlight="lower" />
              <StatRow label="Best" val1={`${stats1.bestBowling}W`} val2={`${stats2.bestBowling}W`} />

              <p className="text-xs text-muted-foreground text-center mb-2 mt-4 font-semibold uppercase tracking-wider">Overall</p>
              <StatRow label="Win %" val1={getWinPct(stats1)} val2={getWinPct(stats2)} />
            </div>

            {/* Comparison Graphs */}
            <div className="cricket-card p-4">
              <canvas ref={runsCanvasRef} className="w-full" style={{ width: '100%', height: '220px' }} />
            </div>
            <div className="cricket-card p-4">
              <canvas ref={wicketsCanvasRef} className="w-full" style={{ width: '100%', height: '220px' }} />
            </div>
          </>
        ) : (
          <div className="cricket-card p-8 text-center">
            <GitCompareArrows className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Select two players to compare their stats</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerComparison;
