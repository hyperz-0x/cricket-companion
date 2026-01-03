import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Match, Series, MatchSetup } from '@/types/cricket';
import {
  generateId,
  createInnings,
  calculateManOfMatch,
  calculateManOfSeries,
  saveToLocalStorage,
  loadFromLocalStorage,
} from '@/lib/matchUtils';
import MatchSetupWizard from '@/components/MatchSetupWizard';
import LiveMatch from '@/components/LiveMatch';
import MatchSummary from '@/components/MatchSummary';
import SeriesSummary from '@/components/SeriesSummary';
import MatchHistory from '@/components/MatchHistory';
import { History, Play, Trophy } from 'lucide-react';
import { toast } from 'sonner';

type AppState = 'home' | 'setup' | 'match' | 'matchSummary' | 'seriesSummary' | 'history';

const Index: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('home');
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [currentSeries, setCurrentSeries] = useState<Series | null>(null);
  const [matchHistory, setMatchHistory] = useState<Match[]>([]);
  const [seriesHistory, setSeriesHistory] = useState<Series[]>([]);

  // Load history from localStorage
  useEffect(() => {
    setMatchHistory(loadFromLocalStorage<Match[]>('cricketMatchHistory', []));
    setSeriesHistory(loadFromLocalStorage<Series[]>('cricketSeriesHistory', []));
  }, []);

  // Save history to localStorage
  useEffect(() => {
    if (matchHistory.length > 0) {
      saveToLocalStorage('cricketMatchHistory', matchHistory);
    }
  }, [matchHistory]);

  useEffect(() => {
    if (seriesHistory.length > 0) {
      saveToLocalStorage('cricketSeriesHistory', seriesHistory);
    }
  }, [seriesHistory]);

  const handleSetupComplete = (setup: MatchSetup) => {
    const battingTeam =
      setup.tossWinner === setup.team1
        ? setup.tossDecision === 'bat'
          ? setup.team1
          : setup.team2
        : setup.tossDecision === 'bat'
        ? setup.team2
        : setup.team1;
    const bowlingTeam = battingTeam === setup.team1 ? setup.team2 : setup.team1;

    const newMatch: Match = {
      id: generateId(),
      date: new Date().toISOString(),
      team1: setup.team1,
      team2: setup.team2,
      playersPerTeam: setup.playersPerTeam,
      oversPerInnings: setup.oversPerInnings,
      innings: [createInnings(battingTeam, bowlingTeam)],
      currentInnings: 0,
      isComplete: false,
      toss: {
        winner: setup.tossWinner!,
        decision: setup.tossDecision!,
      },
    };

    if (setup.matchType === 'series' && setup.seriesLength) {
      const newSeries: Series = {
        id: generateId(),
        name: `${setup.team1} vs ${setup.team2} - ${setup.seriesLength} Match Series`,
        team1: setup.team1,
        team2: setup.team2,
        totalMatches: setup.seriesLength,
        matches: [newMatch],
        isComplete: false,
        team1Wins: 0,
        team2Wins: 0,
      };
      setCurrentSeries(newSeries);
    } else {
      setCurrentSeries(null);
    }

    setCurrentMatch(newMatch);
    setAppState('match');
    toast.success('Match started! Good luck!');
  };

  const handleMatchUpdate = (match: Match) => {
    setCurrentMatch(match);
    if (currentSeries) {
      const updatedSeries = { ...currentSeries };
      const matchIdx = updatedSeries.matches.findIndex((m) => m.id === match.id);
      if (matchIdx >= 0) {
        updatedSeries.matches[matchIdx] = match;
      }
      setCurrentSeries(updatedSeries);
    }
  };

  const handleMatchComplete = (match: Match) => {
    setCurrentMatch(match);

    if (currentSeries) {
      const updatedSeries = { ...currentSeries };
      const matchIdx = updatedSeries.matches.findIndex((m) => m.id === match.id);
      if (matchIdx >= 0) {
        updatedSeries.matches[matchIdx] = match;
      }

      // Update series wins
      if (match.winner === currentSeries.team1) {
        updatedSeries.team1Wins += 1;
      } else if (match.winner === currentSeries.team2) {
        updatedSeries.team2Wins += 1;
      }

      // Check if series complete
      // For 2-match series: always play both matches (can result in draw if 1-1)
      // For 3 or 5 match series: complete when one team wins majority
      const isEvenSeries = updatedSeries.totalMatches === 2;
      const winsNeeded = Math.ceil(updatedSeries.totalMatches / 2);
      const allMatchesPlayed = updatedSeries.matches.length >= updatedSeries.totalMatches;
      
      // Series is complete if:
      // - All matches have been played (for 2-match series, must play both)
      // - OR one team has won the majority (for 3/5 match series)
      const seriesDecided = isEvenSeries 
        ? allMatchesPlayed 
        : (updatedSeries.team1Wins > winsNeeded || updatedSeries.team2Wins > winsNeeded || allMatchesPlayed);
      
      if (seriesDecided) {
        updatedSeries.isComplete = true;
        updatedSeries.manOfSeries = calculateManOfSeries(updatedSeries);
        setSeriesHistory((prev) => [updatedSeries, ...prev]);
        setCurrentSeries(updatedSeries);
        setAppState('seriesSummary');
        
        // Check if series is drawn
        if (updatedSeries.team1Wins === updatedSeries.team2Wins) {
          toast.success('Series drawn!');
        } else {
          toast.success('Series complete!');
        }
      } else {
        setCurrentSeries(updatedSeries);
        setAppState('matchSummary');
        toast.success('Match complete!');
      }
    } else {
      setMatchHistory((prev) => [match, ...prev]);
      setAppState('matchSummary');
      toast.success('Match complete!');
    }
  };

  const handleNextSeriesMatch = (tossWinner: string, tossDecision: 'bat' | 'bowl') => {
    if (!currentSeries || !currentMatch) return;

    const battingTeam =
      tossWinner === currentSeries.team1
        ? tossDecision === 'bat'
          ? currentSeries.team1
          : currentSeries.team2
        : tossDecision === 'bat'
        ? currentSeries.team2
        : currentSeries.team1;
    const bowlingTeam = battingTeam === currentSeries.team1 ? currentSeries.team2 : currentSeries.team1;

    const newMatch: Match = {
      id: generateId(),
      date: new Date().toISOString(),
      team1: currentSeries.team1,
      team2: currentSeries.team2,
      playersPerTeam: currentMatch.playersPerTeam,
      oversPerInnings: currentMatch.oversPerInnings,
      innings: [createInnings(battingTeam, bowlingTeam)],
      currentInnings: 0,
      isComplete: false,
      toss: {
        winner: tossWinner,
        decision: tossDecision,
      },
    };

    const updatedSeries = { ...currentSeries };
    updatedSeries.matches.push(newMatch);
    setCurrentSeries(updatedSeries);
    setCurrentMatch(newMatch);
    setAppState('match');
    toast.success(`Match ${updatedSeries.matches.length} started!`);
  };

  const handleEndInnings = () => {
    toast.info('Innings complete! Second innings starting.');
  };

  const handleNewMatch = () => {
    setCurrentMatch(null);
    setCurrentSeries(null);
    setAppState('setup');
  };

  const handleDeleteMatch = (id: string) => {
    setMatchHistory((prev) => prev.filter((m) => m.id !== id));
    toast.success('Match deleted');
  };

  const handleDeleteSeries = (id: string) => {
    setSeriesHistory((prev) => prev.filter((s) => s.id !== id));
    toast.success('Series deleted');
  };

  const handleViewMatch = (match: Match) => {
    setCurrentMatch(match);
    setAppState('matchSummary');
  };

  const handleViewSeries = (series: Series) => {
    setCurrentSeries(series);
    setAppState('seriesSummary');
  };

  // Render based on app state
  if (appState === 'home') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="text-center mb-12">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Trophy className="w-12 h-12 text-primary-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Cricket Scorer
          </h1>
          <p className="text-lg text-muted-foreground">
            Track matches, series & player stats
          </p>
        </div>

        <div className="w-full max-w-sm space-y-4">
          <Button
            size="xl"
            className="w-full glow-primary"
            onClick={() => setAppState('setup')}
          >
            <Play className="w-5 h-5 mr-2" />
            New Match
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => setAppState('history')}
          >
            <History className="w-5 h-5 mr-2" />
            Match History
            {(matchHistory.length > 0 || seriesHistory.length > 0) && (
              <span className="ml-2 px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">
                {matchHistory.length + seriesHistory.length}
              </span>
            )}
          </Button>
        </div>

        <p className="mt-12 text-xs text-muted-foreground text-center">
          Supports single matches & 2/3/5 match series
        </p>
      </div>
    );
  }

  if (appState === 'setup') {
    return <MatchSetupWizard onComplete={handleSetupComplete} />;
  }

  if (appState === 'match' && currentMatch) {
    return (
      <LiveMatch
        match={currentMatch}
        series={currentSeries}
        onMatchUpdate={handleMatchUpdate}
        onMatchComplete={handleMatchComplete}
        onEndInnings={handleEndInnings}
      />
    );
  }

  if (appState === 'matchSummary' && currentMatch) {
    return (
      <MatchSummary
        match={currentMatch}
        series={currentSeries}
        onGoHome={() => setAppState('home')}
        onNextSeriesMatch={
          currentSeries && !currentSeries.isComplete ? handleNextSeriesMatch : undefined
        }
        isSeriesMatch={!!currentSeries && !currentSeries.isComplete}
      />
    );
  }

  if (appState === 'seriesSummary' && currentSeries) {
    return <SeriesSummary series={currentSeries} onNewSeries={handleNewMatch} />;
  }

  if (appState === 'history') {
    return (
      <MatchHistory
        matches={matchHistory}
        series={seriesHistory}
        onDeleteMatch={handleDeleteMatch}
        onDeleteSeries={handleDeleteSeries}
        onViewMatch={handleViewMatch}
        onViewSeries={handleViewSeries}
        onClose={() => setAppState('home')}
      />
    );
  }

  return null;
};

export default Index;
