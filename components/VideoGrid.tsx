
import React, { useState, useEffect } from 'react';
import { supabase, getFileUrl } from '../lib/supabase';
import { VideoMetadata } from '../types';
import { 
  Search, 
  SortAsc, 
  Eye, 
  Calendar, 
  MoreVertical, 
  Heart,
  Ghost,
  // Fix: Added Play icon to imports
  Play
} from 'lucide-react';

interface VideoGridProps {
  userId: string;
  refreshTrigger: number;
  onSelectVideo: (id: string) => void;
}

const VideoGrid: React.FC<VideoGridProps> = ({ userId, refreshTrigger, onSelectVideo }) => {
  const [videos, setVideos] = useState<VideoMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'views'>('created_at');

  useEffect(() => {
    fetchVideos();
  }, [userId, refreshTrigger, sortBy]);

  const fetchVideos = async () => {
    setLoading(true);
    let query = supabase
      .from('videos')
      .select('*')
      .eq('user_id', userId)
      .order(sortBy, { ascending: false });

    const { data, error } = await query;
    if (!error && data) {
      setVideos(data);
    }
    setLoading(false);
  };

  const filteredVideos = videos.filter(v => 
    v.title.toLowerCase().includes(search.toLowerCase()) ||
    (v.description && v.description.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-video bg-zinc-900 rounded-xl mb-3"></div>
            <div className="h-5 bg-zinc-900 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-zinc-900 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Your Library</h2>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text"
              placeholder="Search videos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-sm focus:outline-none"
          >
            <option value="created_at">Latest</option>
            <option value="views">Most Views</option>
          </select>
        </div>
      </div>

      {filteredVideos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/30 border border-zinc-800 border-dashed rounded-3xl">
          <Ghost className="w-16 h-16 text-zinc-700 mb-4" />
          <p className="text-zinc-500 font-medium">No videos found</p>
          <p className="text-zinc-600 text-sm mt-1">Upload your first video to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVideos.map((video) => (
            <div 
              key={video.id}
              onClick={() => onSelectVideo(video.id)}
              className="group cursor-pointer bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all duration-300 transform hover:-translate-y-1 shadow-lg"
            >
              <div className="aspect-video relative overflow-hidden bg-zinc-800">
                {video.thumbnail_url ? (
                  <img 
                    src={video.thumbnail_url} 
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-indigo-500/5">
                    <Play className="w-10 h-10 text-indigo-500 opacity-20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play className="w-12 h-12 text-white fill-white/20" />
                </div>
                {video.is_favorite && (
                  <div className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full">
                    <Heart className="w-3 h-3 fill-current" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-zinc-100 line-clamp-1 group-hover:text-indigo-400 transition-colors">
                  {video.title}
                </h3>
                <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>{video.views} views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(video.created_at).toLocaleDateString()}</span>
                  </div>
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
