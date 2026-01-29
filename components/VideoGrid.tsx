
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { VideoMetadata } from '../types';
import { 
  Eye, 
  Calendar, 
  Ghost,
  Play,
  Globe,
  Lock,
  ThumbsUp,
  ChevronDown
} from 'lucide-react';

interface VideoGridProps {
  userId?: string;
  mode: 'public' | 'personal' | 'profile';
  searchQuery: string;
  refreshTrigger: number;
  onSelectVideo: (id: string) => void;
}

type SortOption = 'recent' | 'views' | 'likes';

const VideoGrid: React.FC<VideoGridProps> = ({ userId, mode, searchQuery, refreshTrigger, onSelectVideo }) => {
  const [videos, setVideos] = useState<VideoMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  useEffect(() => {
    fetchVideos();
  }, [userId, mode, searchQuery, refreshTrigger, sortBy]);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('videos')
        .select('*');

      if (mode === 'personal' && userId) {
        query = query.eq('user_id', userId);
      } else if (mode === 'public') {
        query = query.eq('is_public', true);
      } else if (mode === 'profile' && userId) {
        query = query.eq('user_id', userId).eq('is_public', true);
      }

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      const orderCol = sortBy === 'recent' ? 'created_at' : (sortBy === 'views' ? 'views' : 'likes_count');
      query = query.order(orderCol, { ascending: false });

      const { data, error } = await query;
      if (!error && data) {
        setVideos(data);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-black">
          {mode === 'public' ? 'Explorar' : (mode === 'personal' ? 'Meus Vídeos' : 'Vídeos Públicos')}
        </h2>
        
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Ordenar por:</span>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-transparent text-sm font-bold text-zinc-200 outline-none cursor-pointer"
          >
            <option value="recent">Mais Recentes</option>
            <option value="views">Mais Vistos</option>
            <option value="likes">Mais Curtidos</option>
          </select>
          <ChevronDown className="w-4 h-4 text-zinc-500" />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse bg-zinc-900/40 rounded-3xl h-64 border border-zinc-800/50"></div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-zinc-900/20 border border-zinc-800/50 border-dashed rounded-[3rem] text-center">
          <div className="bg-zinc-800/50 p-6 rounded-full mb-6">
            <Ghost className="w-12 h-12 text-zinc-600" />
          </div>
          <h3 className="text-xl font-bold text-zinc-300">Nenhum vídeo encontrado</h3>
          <p className="text-zinc-500 mt-2 max-w-sm">
            {mode === 'personal' 
              ? "Você ainda não fez nenhum upload. Comece clicando em 'Upload'!" 
              : "Tente buscar por outro título ou explore os vídeos públicos."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map((video) => (
            <div 
              key={video.id}
              onClick={() => onSelectVideo(video.id)}
              className="group cursor-pointer bg-zinc-900/40 border border-zinc-800/50 rounded-3xl overflow-hidden hover:border-indigo-500/50 hover:bg-zinc-900/60 transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="aspect-video relative overflow-hidden bg-zinc-800">
                {video.thumbnail_url ? (
                  <img 
                    src={video.thumbnail_url} 
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-indigo-500/5">
                    <Play className="w-12 h-12 text-indigo-500/20" />
                  </div>
                )}
                
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                  <div className="bg-white/10 backdrop-blur-md p-4 rounded-full scale-75 group-hover:scale-100 transition-transform">
                    <Play className="w-8 h-8 text-white fill-white" />
                  </div>
                </div>

                <div className="absolute top-3 right-3 flex gap-2">
                  {video.is_public ? (
                    <div className="p-1.5 bg-emerald-500/80 backdrop-blur-md text-white rounded-lg shadow-lg" title="Público">
                      <Globe className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="p-1.5 bg-zinc-800/80 backdrop-blur-md text-zinc-400 rounded-lg shadow-lg" title="Privado">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5">
                <h3 className="font-bold text-zinc-100 line-clamp-1 group-hover:text-indigo-400 transition-colors text-lg">
                  {video.title}
                </h3>
                
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <div className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{video.views}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{video.likes_count}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider">
                    {new Date(video.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoGrid;
