
export interface VideoMetadata {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  file_path: string;
  thumbnail_url: string | null;
  created_at: string;
  views: number;
  likes_count: number;
  is_favorite: boolean;
  is_public: boolean;
  user_email?: string; // Opcional, para exibir autor
}

export interface AuthState {
  user: any | null;
  session: any | null;
  loading: boolean;
}

export type AppView = 'explore' | 'my-library' | 'player' | 'profile';
