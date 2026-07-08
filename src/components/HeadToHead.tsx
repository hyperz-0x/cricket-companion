import React, { useState, useMemo } from 'react';
import { Match, Series, BallEvent } from '@/types/cricket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Swords, Search } from 'lucide-react';
import logo from '@/assets/logo.png';

interface Props {
  matches: Match[];
  series: Series[];
  onClose: () => void;
}

interface H2H {
  balls: number;
  runs: number;
  dismissals: number;
  fours: number;
  sixes: number;
  innings: number;
}

const HeadToHead: React.FC<Props> = ({ matches, series, onClose }) => {
  const [batter, setBatter] = useState('');
  const [bowler, setBowler] = useState('');
  const [searchB, setSearchB] = useState('');
  const [searchBw, setSearchBw] = useState('');
  const [showB, setShowB] = useState(false);
  const [showBw, setShowBw] = useState(false);

  const allMatches = useMemo(
    () => [...matches, ...series.flatMap((s) => s.matches)],
    [matches, series]
  );

  const { batters, bowlers } = useMemo(() => {
    const b = new Set<string>();
    const bw = new Set<string>();
    allMatches.forEach((m) =>
      m.innings.forEach((inn) => {
        inn.batters.forEach((p) => b.add(p.name));
        inn.bowlers.forEach((p) => bw.add(p.name));
      })
    );
    return {
      batters: Array.from(b).sort(),
      bowlers: Array.from(bw).sort(),
    };
  }, [allMatches]);

  const stats: H2H | null = useMemo(() => {
    if (!batter || !bowler) return null;
    const acc: H2H = { balls: 0, runs: 0, dismissals: 0, fours: 0, sixes: 0, innings: 0 };
    let hasData = false;
    allMatches.forEach((m) =>
      m.innings.forEach((inn) => {
        const log: BallEvent[] | undefined = inn.ballLog;
        if (!log || log.length === 0) return;
        let inningContribution = false;
        log.forEach((ev) => {
          if (ev.batter !== batter || ev.bowler !== bowler) return;
          hasData = true;
          inningContribution = true;
          if (ev.batterBall) acc.balls += 1;
          acc.runs += ev.batterRuns;
          if (ev.isFour) acc.fours += 1;
          if (ev.isSix) acc.sixes += 1;
          if (ev.isWicket && ev.bowlerWicket) acc.dismissals += 1;
        });
        if (inningContribution) acc.innings += 1;
      })
    );
    return hasData ? acc : null;
  }, [batter, bowler, allMatches]);

  const sr = stats && stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(1) : '-';
  const avg = stats && stats.dismissals > 0 ? (stats.runs / stats.dismissals).toFixed(2) : stats ? '—' : '-';
  const boundaries = stats ? stats.fours + stats.sixes : 0;

  const fBatters = batters.filter((n) => n.toLowerCase().includes(searchB.toLowerCase()));
  const fBowlers = bowlers.filter((n) => n.toLowerCase().includes(searchBw.toLowerCase()));

  const Selector = ({
    value, search, setSearch, show, setShow, onSelect, filtered, label,
  }: {
    value: string; search: string; setSearch: (s: string) => void;
    show: boolean; setShow: (b: boolean) => void;
    onSelect: (n: string) => void; filtered: string[]; label: string;
  }) => (
    <div className="relative flex-1">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder={label}
          value={value || search}
          onChange={(e) => { setSearch(e.target.value); setShow(true); onSelect(''); }}
          onFocus={() => setShow(true)}
          className="pl-8 text-sm h-9"
        />
      </div>
      {show && (
        <div className="absolute z-10 mt-1 w-full bg-card border border-border rounded-md shadow-lg max-h-40 overflow-y-auto">
          {filtered.map((name) => (
            <button
              key={name}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted/50 transition-colors"
              onClick={() => { onSelect(name); setSearch(''); setShow(false); }}
            >
              {name}
            </button>
          ))}
          {filtered.length === 0 && <p className="p-2 text-xs text-muted-foreground">No players found</p>}
        </div>
      )}
    </div>
  );

  const StatBox = ({ label, value }: { label: string; value: string | number }) => (
    <div className="cricket-card p-3 text-center">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-xl font-bold font-mono text-primary mt-1">{value}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose}><ArrowLeft className="w-5 h-5" /></Button>
          <img src={logo} alt="HYP-CricScore" className="w-8 h-8 object-contain" />
          <h1 className="text-xl font-bold">Batter vs Bowler</h1>
        </div>

        <div className="flex gap-3 items-start">
          <Selector value={batter} search={searchB} setSearch={setSearchB}
            show={showB} setShow={setShowB} onSelect={setBatter}
            filtered={fBatters} label="Select Batter" />
          <Swords className="w-5 h-5 text-muted-foreground mt-2 shrink-0" />
          <Selector value={bowler} search={searchBw} setSearch={setSearchBw}
            show={showBw} setShow={setShowBw} onSelect={setBowler}
            filtered={fBowlers} label="Select Bowler" />
        </div>

        {batter && bowler ? (
          stats ? (
            <>
              <div className="cricket-card p-4 text-center">
                <p className="text-sm text-muted-foreground">Head-to-Head</p>
                <p className="text-lg font-semibold mt-1">
                  <span className="text-primary">{batter}</span>
                  <span className="text-muted-foreground mx-2">vs</span>
                  <span className="text-primary">{bowler}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">Across {stats.innings} innings</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <StatBox label="Runs" value={stats.runs} />
                <StatBox label="Balls" value={stats.balls} />
                <StatBox label="Dismissals" value={stats.dismissals} />
                <StatBox label="Strike Rate" value={sr} />
                <StatBox label="Average" value={avg} />
                <StatBox label="Boundaries" value={boundaries} />
                <StatBox label="4s" value={stats.fours} />
                <StatBox label="6s" value={stats.sixes} />
                <StatBox label="Dots" value={stats.balls - (stats.runs - stats.fours * 4 - stats.sixes * 6) - stats.fours - stats.sixes >= 0 ? stats.balls - (stats.runs > 0 ? 1 : 0) * 0 : 0} />
              </div>
            </>
          ) : (
            <div className="cricket-card p-8 text-center">
              <Swords className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No recorded deliveries between these players yet.</p>
              <p className="text-xs text-muted-foreground mt-2">Head-to-head data is captured from matches played after this feature was enabled.</p>
            </div>
          )
        ) : (
          <div className="cricket-card p-8 text-center">
            <Swords className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Select a batter and a bowler to view their head-to-head.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeadToHead;