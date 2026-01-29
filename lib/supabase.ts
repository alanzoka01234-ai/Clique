
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nkxuqxazhotlnbisnkcm.supabase.co';
const supabaseAnonKey = 'sb_publishable_DnSQ9i13QAVwLvgC6SMZiA_brVBQ_W2';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const BUCKET_NAME = 'videos';

// Helper to get public URL for a file in the videos bucket
export const getFileUrl = (path: string) => {
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
  return data.publicUrl;
};
