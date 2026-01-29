
-- 1. CRIAR A TABELA DE VÍDEOS
create table if not exists public.videos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  file_path text not null,
  thumbnail_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  views bigint default 0,
  is_favorite boolean default false
);

-- 2. ATIVAR RLS (Row Level Security)
alter table public.videos enable row level security;

-- 3. POLÍTICAS DE SEGURANÇA PARA A TABELA
-- Usuários podem ver apenas seus próprios vídeos
create policy "Users can view own videos" 
on public.videos for select 
using (auth.uid() = user_id);

-- Usuários podem inserir seus próprios vídeos
create policy "Users can insert own videos" 
on public.videos for insert 
with check (auth.uid() = user_id);

-- Usuários podem atualizar seus próprios vídeos
create policy "Users can update own videos" 
on public.videos for update 
using (auth.uid() = user_id);

-- Usuários podem deletar seus próprios vídeos
create policy "Users can delete own videos" 
on public.videos for delete 
using (auth.uid() = user_id);

-- 4. FUNÇÃO PARA INCREMENTAR VISUALIZAÇÕES (RPC)
create or replace function increment_video_views(video_id uuid)
returns void as $$
begin
  update public.videos
  set views = views + 1
  where id = video_id;
end;
$$ language plpgsql security definer;

-- 5. POLÍTICAS DE STORAGE (BUCKET "videos")
-- Nota: O bucket deve ser criado manualmente ou via dashboard como público.

-- Permitir upload apenas para usuários autenticados
create policy "Authenticated users can upload videos"
on storage.objects for insert
with check (
  bucket_id = 'videos' AND 
  auth.role() = 'authenticated'
);

-- Permitir que usuários vejam seus próprios arquivos
create policy "Users can view own video files"
on storage.objects for select
using (
  bucket_id = 'videos' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir que usuários deletem seus próprios arquivos
create policy "Users can delete own video files"
on storage.objects for delete
using (
  bucket_id = 'videos' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);
