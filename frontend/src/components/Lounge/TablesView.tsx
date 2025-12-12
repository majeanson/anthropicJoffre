/**
 * TablesView - Browse and create tables
 *
 * Shows available tables in the lounge.
 * Users can create new tables or join existing ones.
 * Visual polish with gradient headers and animated elements.
 */

import { LoungeTable } from '../../types/game';
import { Button } from '../ui/Button';
import { TableCard } from './TableCard';

interface TablesViewProps {
  tables: LoungeTable[];
  onCreateTable: () => void;
  onJoinTable: (tableId: string) => void;
  onViewTable: (tableId: string) => void;
  playerName: string;
}

export function TablesView({
  tables,
  onCreateTable,
  onJoinTable,
  onViewTable,
  playerName,
}: TablesViewProps) {
  // Filter tables by status
  const gatheringTables = tables.filter(t => t.status === 'gathering' || t.status === 'post_game');
  const activeTables = tables.filter(t => t.status === 'in_game' || t.status === 'ready');

  // Check if player is already at a table
  const playerTable = tables.find(t =>
    t.seats.some(s => s.playerName === playerName)
  );

  return (
    <div className="bg-skin-secondary rounded-xl border-2 border-skin-default overflow-hidden">
      {/* Header with gradient */}
      <div className="
        bg-gradient-to-r from-skin-accent/20 via-skin-accent/10 to-transparent
        border-b border-skin-default
        px-4 py-3
      ">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="text-2xl">🎴</span>
              {gatheringTables.length > 0 && (
                <span className="
                  absolute -top-1 -right-1
                  w-4 h-4 rounded-full
                  bg-green-500 text-white text-[10px] font-bold
                  flex items-center justify-center
                  animate-pulse
                ">
                  {gatheringTables.length}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-display text-skin-primary text-sm uppercase tracking-wider">
                Tables
              </h3>
              <p className="text-xs text-skin-muted">
                {tables.length} table{tables.length !== 1 ? 's' : ''} active
              </p>
            </div>
          </div>
          <Button
            variant="warning"
            size="sm"
            onClick={onCreateTable}
            disabled={!!playerTable}
            disabledReason={playerTable ? 'Already at a table' : undefined}
            leftIcon={<span>➕</span>}
          >
            Start a Table
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Your Current Table (if any) */}
        {playerTable && (
          <div className="mb-4">
            <h4 className="text-xs text-skin-accent uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-skin-accent animate-pulse" />
              Your Table
            </h4>
            <TableCard
              table={playerTable}
              onJoin={() => onJoinTable(playerTable.id)}
              onView={() => onViewTable(playerTable.id)}
              isJoinable={false}
              isCurrentTable={true}
              playerName={playerName}
            />
          </div>
        )}

        {/* Active/Ready Tables (show games in progress) */}
        {activeTables.length > 0 && !activeTables.includes(playerTable!) && (
          <div>
            <h4 className="text-xs text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              In Progress ({activeTables.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeTables
                .filter(t => t.id !== playerTable?.id)
                .map((table) => (
                  <TableCard
                    key={table.id}
                    table={table}
                    onJoin={() => onJoinTable(table.id)}
                    onView={() => onViewTable(table.id)}
                    isJoinable={false}
                    playerName={playerName}
                  />
                ))}
            </div>
          </div>
        )}

        {/* Gathering Tables (joinable) */}
        {gatheringTables.length > 0 ? (
          <div>
            <h4 className="text-xs text-green-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Looking for Players ({gatheringTables.filter(t => t.id !== playerTable?.id).length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {gatheringTables
                .filter(t => t.id !== playerTable?.id)
                .map((table) => {
                  const hasEmptySeat = table.seats.some(s => !s.playerName && !s.isBot);

                  return (
                    <TableCard
                      key={table.id}
                      table={table}
                      onJoin={() => onJoinTable(table.id)}
                      onView={() => onViewTable(table.id)}
                      isJoinable={!playerTable && hasEmptySeat}
                      playerName={playerName}
                    />
                  );
                })}
            </div>
          </div>
        ) : !playerTable && (
          <div className="text-center py-10">
            <div className="
              w-20 h-20 mx-auto mb-4 rounded-2xl
              bg-gradient-to-br from-skin-tertiary to-skin-primary
              flex items-center justify-center
              border-2 border-dashed border-skin-default
            ">
              <span className="text-4xl opacity-50">🪑</span>
            </div>
            <p className="text-sm text-skin-primary mb-1">No tables yet</p>
            <p className="text-xs text-skin-muted mb-4">Be the first to start one!</p>
            <Button
              variant="primary"
              size="md"
              onClick={onCreateTable}
              leftIcon={<span>🎴</span>}
            >
              Create a Table
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TablesView;
