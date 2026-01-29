
-- 1. ATUALIZAR TABELA DE VÍDEOS
alter table public.videos 
add column if not exists is_public boolean default false,
add column if not exists likes_count bigint default 0,
add column if not exists views bigint default 0;

-- 2. CRIAR TABELA DE LIKES
create table if not exists public.video_likes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  video_id uuid references public.videos(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, video_id)
);

-- 3. ATIVAR RLS NA TABELA DE LIKES
alter table public.video_likes enable row level security;

-- 4. POLÍTICAS DE SEGURANÇA ATUALIZADAS (VIDEOS)
drop policy if exists "Visible videos access" on public.videos;
create policy "Visible videos access" 
on public.videos for select 
using (is_public = true or auth.uid() = user_id);

create policy "Users can insert own videos" on public.videos for insert with check (auth.uid() = user_id);
create policy "Users can update own videos" on public.videos for update using (auth.uid() = user_id);
create policy "Users can delete own videos" on public.videos for delete using (auth.uid() = user_id);

-- 5. POLÍTICAS DE SEGURANÇA (LIKES)
create policy "Users can see all likes" on public.video_likes for select using (true);
create policy "Users can toggle own likes" on public.video_likes for insert with check (auth.uid() = user_id);
create policy "Users can delete own likes" on public.video_likes for delete using (auth.uid() = user_id);

-- 6. FUNÇÃO RPC PARA TOGGLE LIKE
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

-- 7. FUNÇÃO RPC PARA INCREMENTAR VIEWS
create or replace function increment_video_views(video_id uuid)
returns void as $$
begin
  update public.videos
  set views = views + 1
  where id = video_id;
end;
$$ language plpgsql security definer;

-- 8. STORAGE POLICIES
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
