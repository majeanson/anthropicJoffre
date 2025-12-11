/**
 * useTeamSelectionKeyboardNav Hook
 *
 * Handles keyboard navigation for the team selection phase.
 * Supports navigation between sections: header, teams, difficulty, actions, rules.
 */

import { useState, useEffect, useCallback } from 'react';
import { sounds } from '../../utils/sounds';

export type NavSection = 'header' | 'teams' | 'difficulty' | 'actions' | 'rules';

export interface UseTeamSelectionKeyboardNavOptions {
  /** Whether to show difficulty section */
  showDifficulty: boolean;
  /** Whether to show add bot button */
  showAddBot: boolean;
  /** Whether leave game is available */
  hasLeaveGame: boolean;
  /** Whether rules modal is open (disables navigation) */
  isRulesOpen: boolean;
  /** Callback when escape is pressed */
  onEscape?: () => void;
  /** Callback to focus an element based on current navigation state */
  onFocusElement: (section: NavSection, col: number, teamNavRow: number, teamNavTeam: 1 | 2) => void;
}

export interface UseTeamSelectionKeyboardNavReturn {
  navSection: NavSection;
  setNavSection: React.Dispatch<React.SetStateAction<NavSection>>;
  navCol: number;
  setNavCol: React.Dispatch<React.SetStateAction<number>>;
  teamNavRow: number;
  setTeamNavRow: React.Dispatch<React.SetStateAction<number>>;
  teamNavTeam: 1 | 2;
  setTeamNavTeam: React.Dispatch<React.SetStateAction<1 | 2>>;
}

export function useTeamSelectionKeyboardNav({
  showDifficulty,
  showAddBot,
  hasLeaveGame,
  isRulesOpen,
  onEscape,
  onFocusElement,
}: UseTeamSelectionKeyboardNavOptions): UseTeamSelectionKeyboardNavReturn {
  const [navSection, setNavSection] = useState<NavSection>('actions');
  const [navCol, setNavCol] = useState(0);
  const [teamNavRow, setTeamNavRow] = useState(0);
  const [teamNavTeam, setTeamNavTeam] = useState<1 | 2>(1);

  // Get sections in order based on what's visible
  const getSections = useCallback((): NavSection[] => {
    const sections: NavSection[] = ['header', 'teams'];
    if (showDifficulty) sections.push('difficulty');
    sections.push('actions', 'rules');
    return sections;
  }, [showDifficulty]);

  // Get max columns for a section
  const getMaxCols = useCallback(
    (section: NavSection): number => {
      switch (section) {
        case 'header':
          return hasLeaveGame ? 2 : 1;
        case 'teams':
          return 2;
        case 'difficulty':
          return 3;
        case 'actions':
          return showAddBot ? 2 : 1;
        case 'rules':
          return 1;
        default:
          return 1;
      }
    },
    [hasLeaveGame, showAddBot]
  );

  // Keyboard navigation handler
  useEffect(() => {
    if (isRulesOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const sections = getSections();
      const currentIndex = sections.indexOf(navSection);

      switch (e.key) {
        case 'Escape':
          if (onEscape) {
            e.preventDefault();
            sounds.buttonClick();
            onEscape();
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (navSection === 'teams') {
            setTeamNavRow((prev) => (prev > 0 ? prev - 1 : 1));
          } else {
            const newIndex = currentIndex > 0 ? currentIndex - 1 : sections.length - 1;
            setNavSection(sections[newIndex]);
            setNavCol(0);
          }
          sounds.buttonClick();
          break;

        case 'ArrowDown':
          e.preventDefault();
          if (navSection === 'teams') {
            setTeamNavRow((prev) => (prev < 1 ? prev + 1 : 0));
          } else {
            const newIndex = currentIndex < sections.length - 1 ? currentIndex + 1 : 0;
            setNavSection(sections[newIndex]);
            setNavCol(0);
          }
          sounds.buttonClick();
          break;

        case 'ArrowLeft':
          e.preventDefault();
          if (navSection === 'teams') {
            setTeamNavTeam((prev) => (prev === 1 ? 2 : 1));
          } else {
            const maxCols = getMaxCols(navSection);
            setNavCol((prev) => (prev > 0 ? prev - 1 : maxCols - 1));
          }
          sounds.buttonClick();
          break;

        case 'ArrowRight':
          e.preventDefault();
          if (navSection === 'teams') {
            setTeamNavTeam((prev) => (prev === 1 ? 2 : 1));
          } else {
            const maxCols = getMaxCols(navSection);
            setNavCol((prev) => (prev < maxCols - 1 ? prev + 1 : 0));
          }
          sounds.buttonClick();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navSection, navCol, isRulesOpen, onEscape, getSections, getMaxCols]);

  // Focus element when navigation changes
  useEffect(() => {
    if (!isRulesOpen) {
      onFocusElement(navSection, navCol, teamNavRow, teamNavTeam);
    }
  }, [navSection, navCol, teamNavRow, teamNavTeam, isRulesOpen, onFocusElement]);

  return {
    navSection,
    setNavSection,
    navCol,
    setNavCol,
    teamNavRow,
    setTeamNavRow,
    teamNavTeam,
    setTeamNavTeam,
  };
}
