/**
 * Friends System Types
 * Sprint 2 Phase 2
 */

export interface Friendship {
  id: number;
  player1_name: string;
  player2_name: string;
  created_at: Date;
}

export interface FriendRequest {
  id: number;
  from_player: string;
  to_player: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: Date;
  responded_at?: Date;
}

export interface FriendWithStatus {
  player_name: string;
  is_online: boolean;
  status: 'in_lobby' | 'in_game' | 'in_team_selection' | 'offline';
  game_id?: string;
  friendship_date: Date;
}

export interface FriendRequestNotification {
  request_id: number;
  from_player: string;
  created_at: Date;
}
