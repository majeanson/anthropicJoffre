import { Checkbox } from '../ui/Checkbox';
import { Select } from '../ui/Select';
import { GameModeFilter, SortOption } from './types';

interface FilterBarProps {
  filterWithBots: boolean;
  setFilterWithBots: (value: boolean) => void;
  filterNeedsPlayers: boolean;
  setFilterNeedsPlayers: (value: boolean) => void;
  filterInProgress: boolean;
  setFilterInProgress: (value: boolean) => void;
  filterGameMode: GameModeFilter;
  setFilterGameMode: (value: GameModeFilter) => void;
  sortBy: SortOption;
  setSortBy: (value: SortOption) => void;
  totalGames: number;
  filteredCount: number;
}

export function FilterBar({
  filterWithBots,
  setFilterWithBots,
  filterNeedsPlayers,
  setFilterNeedsPlayers,
  filterInProgress,
  setFilterInProgress,
  filterGameMode,
  setFilterGameMode,
  sortBy,
  setSortBy,
  totalGames,
  filteredCount,
}: FilterBarProps) {
  const hasActiveFilters =
    filterWithBots || filterNeedsPlayers || filterInProgress || filterGameMode !== 'all';

  return (
    <div
      className="
        p-4
        rounded-[var(--radius-lg)]
        border border-[var(--color-border-default)]
        bg-[var(--color-bg-tertiary)]
      "
    >
      <div className="flex flex-wrap items-center gap-4">
        {/* Filter Checkboxes */}
        <div className="flex items-center gap-4 flex-wrap">
          <Checkbox
            checked={filterWithBots}
            onChange={(e) => setFilterWithBots(e.target.checked)}
            label="🤖 With Bots"
            size="sm"
          />
          <Checkbox
            checked={filterNeedsPlayers}
            onChange={(e) => setFilterNeedsPlayers(e.target.checked)}
            label="💺 Needs Players"
            size="sm"
          />
          <Checkbox
            checked={filterInProgress}
            onChange={(e) => setFilterInProgress(e.target.checked)}
            label="🎮 In Progress"
            size="sm"
          />
        </div>

        {/* Game Mode Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-text-muted)] font-body whitespace-nowrap">
            Mode:
          </span>
          <Select
            value={filterGameMode}
            onChange={(e) => setFilterGameMode(e.target.value as GameModeFilter)}
            options={[
              { value: 'all', label: 'All Games' },
              { value: 'ranked', label: 'Ranked' },
              { value: 'casual', label: 'Casual' },
            ]}
            size="sm"
          />
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-[var(--color-text-muted)] font-body whitespace-nowrap">
            Sort:
          </span>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            options={[
              { value: 'newest', label: 'Newest' },
              { value: 'players', label: 'Most Players' },
              { value: 'score', label: 'Highest Score' },
            ]}
            size="sm"
          />
        </div>
      </div>

      {/* Active filter count */}
      {hasActiveFilters && (
        <div className="mt-3 text-xs text-[var(--color-text-muted)] font-body">
          Showing {filteredCount} of {totalGames} games
        </div>
      )}
    </div>
  );
}
