/**
 * CreateTableModal - Create a new table in the lounge
 *
 * Simple modal for creating a table with a name and optional settings.
 */

import { useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { sounds } from '../../utils/sounds';

interface CreateTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  socket: Socket | null;
  playerName: string;
}

export function CreateTableModal({
  isOpen,
  onClose,
  socket,
  playerName,
}: CreateTableModalProps) {
  const [tableName, setTableName] = useState(`${playerName}'s Table`);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = useCallback(() => {
    if (!socket || !tableName.trim()) return;

    setIsCreating(true);
    socket.emit('create_table', {
      name: tableName.trim(),
      settings: {
        isPrivate,
        allowSpectators: true,
        autoStart: false,
      },
    });

    sounds.buttonClick();

    // Close modal after a short delay (the table_created event will update the UI)
    setTimeout(() => {
      setIsCreating(false);
      onClose();
    }, 500);
  }, [socket, tableName, isPrivate, onClose]);

  const handleClose = useCallback(() => {
    if (!isCreating) {
      onClose();
    }
  }, [isCreating, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create a Table"
      size="sm"
    >
      <div className="space-y-4">
        {/* Table Name */}
        <div>
          <label className="block text-sm font-medium text-skin-primary mb-2">
            Table Name
          </label>
          <input
            type="text"
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            placeholder="Enter table name..."
            maxLength={30}
            className="
              w-full px-4 py-3
              bg-skin-tertiary border-2 border-skin-default rounded-xl
              text-skin-primary text-lg
              focus:outline-none focus:border-skin-accent
              transition-colors
            "
            autoFocus
          />
          <p className="text-xs text-skin-muted mt-1">
            {tableName.length}/30 characters
          </p>
        </div>

        {/* Private Toggle */}
        <div className="flex items-center justify-between p-3 bg-skin-tertiary rounded-xl">
          <div>
            <p className="text-sm font-medium text-skin-primary">Private Table</p>
            <p className="text-xs text-skin-muted">Only visible to friends</p>
          </div>
          <button
            onClick={() => {
              setIsPrivate(!isPrivate);
              sounds.buttonClick();
            }}
            className={`
              w-12 h-6 rounded-full transition-colors relative
              ${isPrivate ? 'bg-skin-accent' : 'bg-skin-muted'}
            `}
          >
            <span className={`
              absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
              ${isPrivate ? 'left-7' : 'left-1'}
            `} />
          </button>
        </div>

        {/* Info */}
        <div className="p-3 bg-skin-info/10 border border-skin-info/30 rounded-xl">
          <p className="text-xs text-skin-info">
            Create a table to gather friends before starting a game.
            You can add bots to fill empty seats, or wait for others to join.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="ghost"
            size="lg"
            onClick={handleClose}
            disabled={isCreating}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={handleCreate}
            disabled={!tableName.trim() || isCreating}
            loading={isCreating}
            fullWidth
            leftIcon={<span>🎴</span>}
          >
            Create Table
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default CreateTableModal;
