
import React, { useState, useEffect } from 'react';
import { supabase, getFileUrl, BUCKET_NAME } from '../lib/supabase';
import { VideoMetadata } from '../types';
import { 
  ArrowLeft, 
  Trash2, 
  Edit3, 
  Eye, 
  Calendar, 
  Save, 
  X,
  Heart,
  Share2,
  Check
} from 'lucide-react';

interface VideoPlayerViewProps {
  videoId: string;
  onBack: () => void;
  onDelete: () => void;
  onUpdate: () => void;
}

const VideoPlayerView: React.FC<VideoPlayerViewProps> = ({ videoId, onBack, onDelete, onUpdate }) => {
  const [video, setVideo] = useState<VideoMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchVideoDetails();
    incrementViews();
  }, [videoId]);

  const fetchVideoDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('id', videoId)
        .single();

      if (data && !error) {
        setVideo(data);
        setEditTitle(data.title);
        setEditDesc(data.description || '');
        setIsFavorite(data.is_favorite);
      }
    } catch (err) {
      console.error("Error fetching video details:", err);
    } finally {
      setLoading(false);
    }
  };

  const incrementViews = async () => {
    try {
      // Chama a função RPC definida no SQL
      await supabase.rpc('increment_video_views', { video_id: videoId });
    } catch (err) {
      // Falha silenciosa se o RPC ainda não existir no banco
      console.warn("View increment failed. Did you run the SQL migration?");
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('videos')
      .update({ 
        title: editTitle, 
        description: editDesc,
        is_favorite: isFavorite
      })
      .eq('id', videoId);
    
    if (!error) {
      setVideo(prev => prev ? { ...prev, title: editTitle, description: editDesc, is_favorite: isFavorite } : null);
      setEditing(false);
      onUpdate();
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!video || !window.confirm('Are you sure you want to delete this video? This cannot be undone.')) return;

    try {
      // Delete from Storage
      await supabase.storage.from(BUCKET_NAME).remove([video.file_path]);

      // Delete from Database
      const { error } = await supabase.from('videos').delete().eq('id', videoId);

      if (!error) {
        onDelete();
      }
    } catch (err) {
      console.error("Error deleting video:", err);
      alert("Failed to delete video. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="aspect-video bg-zinc-900 rounded-3xl"></div>
        <div className="h-10 bg-zinc-900 rounded w-1/3"></div>
        <div className="h-20 bg-zinc-900 rounded"></div>
      </div>
    );
  }

  if (!video) return (
    <div className="text-center py-20">
      <p className="text-zinc-500">Video not found or access denied.</p>
      <button onClick={onBack} className="mt-4 text-indigo-400">Go Back</button>
    </div>
  );

  const videoUrl = getFileUrl(video.file_path);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-4 group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        Back to Library
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl ring-1 ring-zinc-800">
            <video 
              src={videoUrl} 
              controls 
              autoPlay
              className="w-full h-full"
              poster={video.thumbnail_url || undefined}
            />
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 md:p-8">
            {editing ? (
              <div className="space-y-4">
                <input 
                  type="text" 
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-2xl font-bold rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500/50 outline-none"
                />
                <textarea 
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={4}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500/50 outline-none"
                  placeholder="Video description..."
                />
                <div className="flex justify-end gap-3 pt-2">
                  <button 
                    onClick={() => { setEditing(false); setEditTitle(video.title); setEditDesc(video.description || ''); }}
                    className="px-4 py-2 text-zinc-400 hover:text-white font-medium"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleUpdate}
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-500 px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2"
                  >
                    {saving ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">{video.title}</h2>
                    <div className="flex items-center gap-4 text-zinc-500 text-sm">
                      <div className="flex items-center gap-1.5 bg-zinc-800/50 px-3 py-1 rounded-full">
                        <Eye className="w-4 h-4" />
                        <span>{video.views} views</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-zinc-800/50 px-3 py-1 rounded-full">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(video.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => { setIsFavorite(!isFavorite); setEditing(true); }}
                      className={`p-3 rounded-full transition-all ${isFavorite ? 'bg-red-500/10 text-red-500' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                    >
                      <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>
                    <button className="p-3 bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-all">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="pt-6 border-t border-zinc-800">
                  <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {video.description || <span className="text-zinc-600 italic">No description provided.</span>}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              Management
            </h3>
            <div className="space-y-2">
              {!editing && (
                <button 
                  onClick={() => setEditing(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-zinc-300 hover:text-white transition-all font-medium"
                >
                  <Edit3 className="w-5 h-5 text-indigo-400" />
                  Edit Details
                </button>
              )}
              <button 
                onClick={handleDelete}
                className="w-full flex items-center gap-3 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-400 transition-all font-medium"
              >
                <Trash2 className="w-5 h-5" />
                Delete Video
              </button>
            </div>
          </div>

          <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-3xl p-6">
            <h3 className="font-bold text-indigo-400 mb-2">Video Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Storage Path</span>
                <span className="text-zinc-300 font-mono truncate ml-4 text-[10px]">{video.file_path.split('/')[1]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Privacy</span>
                <span className="text-zinc-300 flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  Private
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayerView;
