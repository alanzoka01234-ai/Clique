
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fwsxbobkieopulurhywj.supabase.co';
const supabaseAnonKey = 'sb_publishable_2PAaXnO-smeWg7TMIeJiHw_AihIaGSJ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const BUCKET_NAME = 'videos';

// Helper to get public URL for a file in the videos bucket
export const getFileUrl = (path: string) => {
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
  return data.publicUrl;
};
