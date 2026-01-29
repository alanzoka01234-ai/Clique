-- ======================================================================================
-- SUPATUBE - CONFIGURAÇÃO DO BANCO DE DADOS (COPIAR E COLAR NO SQL EDITOR)
-- Este script configura: Extensões, Tabelas, Segurança (RLS), Funções e Storage.
-- ======================================================================================

-- 1. EXTENSÕES
create extension if not exists "uuid-ossp";

-- 2. TABELA DE VÍDEOS
-- Armazena metadados e controle de visibilidade.
create table if not exists public.videos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  titulo text not null,
  descricao text,
  url_video text not null, -- Caminho do arquivo no bucket (ex: user_id/video.mp4)
  thumbnail_url text,      -- URL da imagem de capa
  publico boolean default false,
  views bigint default 0,
  likes_count bigint default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. TABELA DE CURTIDAS (VIDEO_LIKES)
-- Registra quem curtiu o quê para evitar curtidas duplas.
create table if not exists public.video_likes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  video_id uuid references public.videos(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, video_id)
);

-- 4. HABILITAR SEGURANÇA (ROW LEVEL SECURITY)
alter table public.videos enable row level security;
alter table public.video_likes enable row level security;

-- 5. POLÍTICAS PARA A TABELA 'VIDEOS'
drop policy if exists "Ver vídeos" on public.videos;
create policy "Ver vídeos" 
on public.videos for select 
using (publico = true or auth.uid() = user_id);

drop policy if exists "Inserir vídeos" on public.videos;
create policy "Inserir vídeos" 
on public.videos for insert 
with check (auth.uid() = user_id);

drop policy if exists "Editar vídeos" on public.videos;
create policy "Editar vídeos" 
on public.videos for update 
using (auth.uid() = user_id);

drop policy if exists "Deletar vídeos" on public.videos;
create policy "Deletar vídeos" 
on public.videos for delete 
using (auth.uid() = user_id);

-- 6. POLÍTICAS PARA A TABELA 'VIDEO_LIKES'
drop policy if exists "Ver curtidas" on public.video_likes;
create policy "Ver curtidas" on public.video_likes for select using (true);

drop policy if exists "Gerenciar curtidas" on public.video_likes;
create policy "Gerenciar curtidas" 
on public.video_likes for insert 
with check (auth.uid() = user_id);

drop policy if exists "Remover curtida" on public.video_likes;
create policy "Remover curtida" 
on public.video_likes for delete 
using (auth.uid() = user_id);

-- 7. FUNÇÕES RPC (LÓGICA DO SERVIDOR)

-- Função: increment_video_views
-- Incrementa o contador de visualizações de forma atômica.
create or replace function increment_video_views(video_id uuid)
returns void as $$
begin
  update public.videos
  set views = views + 1
  where id = video_id;
end;
$$ language plpgsql security definer;

-- Função: toggle_video_like
-- Adiciona ou remove curtida e atualiza o contador na tabela de vídeos.
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

-- 8. POLÍTICAS DO STORAGE (BUCKET 'videos')
-- IMPORTANTE: Crie um bucket chamado 'videos' no menu Storage antes de rodar estas políticas.

drop policy if exists "Leitura pública de arquivos públicos" on storage.objects;
create policy "Leitura pública de arquivos públicos"
on storage.objects for select
using (
  bucket_id = 'videos' and (
    exists (
      select 1 from public.videos 
      where url_video = storage.objects.name 
      and publico = true
    )
    or (storage.foldername(name))[1] = auth.uid()::text
  )
);

drop policy if exists "Upload de arquivos próprios" on storage.objects;
create policy "Upload de arquivos próprios"
on storage.objects for insert
with check (
  bucket_id = 'videos' and 
  auth.role() = 'authenticated' and 
  (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Deletar arquivos próprios" on storage.objects;
create policy "Deletar arquivos próprios"
on storage.objects for delete
using (
  bucket_id = 'videos' and 
  (storage.foldername(name))[1] = auth.uid()::text
);