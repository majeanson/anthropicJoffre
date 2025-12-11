/**
 * useScoreAnimation Hook
 *
 * Handles score change detection and animation states.
 * Triggers flash animations when scores change.
 */

import { useState, useRef, useEffect } from 'react';
import { useCountUp } from '../../hooks/useCountUp';

interface ScoreAnimationState {
  scoreChange: number | null;
  flash: 'green' | 'red' | null;
}

interface UseScoreAnimationReturn {
  team1: ScoreAnimationState;
  team2: ScoreAnimationState;
  animatedTeam1Score: number;
  animatedTeam2Score: number;
}

export function useScoreAnimation(
  team1Score: number,
  team2Score: number
): UseScoreAnimationReturn {
  // Track previous scores
  const prevTeam1ScoreRef = useRef(team1Score);
  const prevTeam2ScoreRef = useRef(team2Score);

  // Animation states
  const [team1ScoreChange, setTeam1ScoreChange] = useState<number | null>(null);
  const [team2ScoreChange, setTeam2ScoreChange] = useState<number | null>(null);
  const [team1Flash, setTeam1Flash] = useState<'green' | 'red' | null>(null);
  const [team2Flash, setTeam2Flash] = useState<'green' | 'red' | null>(null);

  // Animated score values
  const animatedTeam1Score = useCountUp(team1Score, 500);
  const animatedTeam2Score = useCountUp(team2Score, 500);

  // Detect score changes and trigger animations
  useEffect(() => {
    const timers: number[] = [];
    const team1Change = team1Score - prevTeam1ScoreRef.current;
    const team2Change = team2Score - prevTeam2ScoreRef.current;

    if (team1Change !== 0) {
      setTeam1ScoreChange(team1Change);
      setTeam1Flash(team1Change > 0 ? 'green' : 'red');
      timers.push(window.setTimeout(() => setTeam1Flash(null), 500));
      timers.push(window.setTimeout(() => setTeam1ScoreChange(null), 1500));
    }

    if (team2Change !== 0) {
      setTeam2ScoreChange(team2Change);
      setTeam2Flash(team2Change > 0 ? 'green' : 'red');
      timers.push(window.setTimeout(() => setTeam2Flash(null), 500));
      timers.push(window.setTimeout(() => setTeam2ScoreChange(null), 1500));
    }

    prevTeam1ScoreRef.current = team1Score;
    prevTeam2ScoreRef.current = team2Score;

    // Cleanup all timers on unmount or re-run
    return () => timers.forEach(clearTimeout);
  }, [team1Score, team2Score]);

  return {
    team1: { scoreChange: team1ScoreChange, flash: team1Flash },
    team2: { scoreChange: team2ScoreChange, flash: team2Flash },
    animatedTeam1Score,
    animatedTeam2Score,
  };
}
