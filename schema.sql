
-- ======================================================================================
-- SUPATUBE - CONFIGURAÇÃO COMPLETA DO BANCO DE DADOS
-- Copie e cole este script no seu SQL Editor do Supabase e clique em "Run".
-- ======================================================================================

-- 1. EXTENSÕES NECESSÁRIAS
create extension if not exists "uuid-ossp";

-- 2. TABELA DE VÍDEOS
-- Armazena metadados, caminhos de arquivo e estatísticas.
create table if not exists public.videos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  file_path text not null,
  thumbnail_url text,
  is_public boolean default false,
  likes_count bigint default 0,
  views bigint default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. TABELA DE CURTIDAS (VIDEO_LIKES)
-- Gerencia a relação única entre usuários e vídeos para curtidas.
create table if not exists public.video_likes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  video_id uuid references public.videos(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, video_id)
);

-- 4. SEGURANÇA (ROW LEVEL SECURITY)
alter table public.videos enable row level security;
alter table public.video_likes enable row level security;

-- POLÍTICAS PARA A TABELA 'VIDEOS'
drop policy if exists "Visible videos access" on public.videos;
drop policy if exists "Users can insert own videos" on public.videos;
drop policy if exists "Users can update own videos" on public.videos;
drop policy if exists "Users can delete own videos" on public.videos;

-- Visualização: Qualquer um vê vídeos públicos; dono vê vídeos privados.
create policy "Visible videos access" 
on public.videos for select 
using (is_public = true or auth.uid() = user_id);

-- Inserção: Apenas usuários logados podem criar seus próprios registros.
create policy "Users can insert own videos" on public.videos for insert with check (auth.uid() = user_id);

-- Edição/Exclusão: Apenas o criador do vídeo tem permissão.
create policy "Users can update own videos" on public.videos for update using (auth.uid() = user_id);
create policy "Users can delete own videos" on public.videos for delete using (auth.uid() = user_id);

-- POLÍTICAS PARA A TABELA 'VIDEO_LIKES'
drop policy if exists "Users can see all likes" on public.video_likes;
drop policy if exists "Users can toggle own likes" on public.video_likes;

create policy "Users can see all likes" on public.video_likes for select using (true);
create policy "Users can toggle own likes" on public.video_likes for insert with check (auth.uid() = user_id);
create policy "Users can delete own likes" on public.video_likes for delete using (auth.uid() = user_id);

-- 5. FUNÇÕES RPC (LÓGICA DO LADO DO SERVIDOR)

-- Função: toggle_video_like
-- Adiciona/remove curtida e atualiza o contador na tabela 'videos' atomicamente.
create or replace function toggle_video_like(target_video_id uuid, target_user_id uuid)
returns json as $$
declare
  is_liked boolean;
begin
  if exists (select 1 from public.video_likes where video_id = target_video_id and user_id = target_user_id) then
    delete from public.video_likes where video_id = target_video_id and user_id = target_user_id;
    update public.videos set likes_count = likes_count - 1 where id = target_video_id;
    is_liked := false;
  else
    insert into public.video_likes (video_id, user_id) values (target_video_id, target_user_id);
    update public.videos set likes_count = likes_count + 1 where id = target_video_id;
    is_liked := true;
  end if;
  
  return json_build_object('liked', is_liked);
end;
$$ language plpgsql security definer;

-- Função: increment_video_views
-- Incrementa o contador de visualizações de forma segura.
create or replace function increment_video_views(video_id uuid)
returns void as $$
begin
  update public.videos
  set views = views + 1
  where id = video_id;
end;
$$ language plpgsql security definer;

-- 6. POLÍTICAS DO STORAGE (BUCKET 'videos')
-- ATENÇÃO: Você deve criar o bucket chamado 'videos' no menu Storage antes de aplicar estas políticas.

drop policy if exists "Public access to public video files" on storage.objects;
drop policy if exists "Users can upload video files" on storage.objects;
drop policy if exists "Users can delete own files" on storage.objects;

-- Permite baixar/ver o arquivo se o vídeo for público ou se for o dono.
create policy "Public access to public video files"
on storage.objects for select
using (
  bucket_id = 'videos' AND (
    exists (
      select 1 from public.videos 
      where file_path = storage.objects.name 
      and is_public = true
    )
    OR (storage.foldername(name))[1] = auth.uid()::text
  )
);

-- Permite upload para a pasta própria (nomeada com o UID do usuário).
create policy "Users can upload video files"
on storage.objects for insert
with check (
  bucket_id = 'videos' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Permite excluir seus próprios arquivos.
create policy "Users can delete own files"
on storage.objects for delete
using (
  bucket_id = 'videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
