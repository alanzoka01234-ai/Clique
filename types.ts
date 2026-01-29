export interface VideoMetadata {
  id: string;
  user_id: string;
  titulo: string;
  descricao: string | null;
  url_video: string;
  thumbnail_url: string | null;
  created_at: string;
  views: number;
  likes_count: number;
  publico: boolean;
}

export interface AuthState {
  user: any | null;
  session: any | null;
  loading: boolean;
}

export type AppView = 'explore' | 'my-library' | 'player' | 'profile';