/**
 * Authentication Types (Frontend)
 * Sprint 3 Phase 1
 */

export interface User {
  user_id: number;
  username: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  created_at: string;
  last_login_at: string | null;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  display_name?: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface UserProfile {
  profile_id: number;
  user_id: number;
  bio: string | null;
  country: string | null;
  favorite_team: 1 | 2 | null;
  visibility: 'public' | 'friends_only' | 'private';
  show_online_status: boolean;
  allow_friend_requests: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  preference_id: number;
  user_id: number;
  theme: 'light' | 'dark' | 'auto';
  sound_enabled: boolean;
  sound_volume: number;
  notifications_enabled: boolean;
  email_notifications: boolean;
  language: string;
  autoplay_enabled: boolean;
  created_at: string;
}

export interface ProfileUpdateData {
  avatar_id?: string;
  bio?: string;
  country?: string;
  favorite_team?: 1 | 2 | null;
  visibility?: 'public' | 'friends_only' | 'private';
  show_online_status?: boolean;
  allow_friend_requests?: boolean;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<boolean>; // Sprint 18: Returns success status
  error: string | null;
  clearError: () => void;
  updateProfile: (data: ProfileUpdateData) => Promise<void>;
  getUserProfile: () => Promise<{ profile: UserProfile | null; preferences: UserPreferences | null } | null>;
  getAccessToken: () => string | null;
}
