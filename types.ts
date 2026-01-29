
export interface VideoMetadata {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  file_path: string;
  thumbnail_url: string | null;
  created_at: string;
  views: number;
  is_favorite: boolean;
}

export interface AuthState {
  user: any | null;
  session: any | null;
  loading: boolean;
}
