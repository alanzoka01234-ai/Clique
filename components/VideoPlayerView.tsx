
import React, { useState, useEffect } from 'react';
import { supabase, getFileUrl } from '../lib/supabase';
import { VideoMetadata } from '../types';
import { 
  ArrowLeft, 
  Trash2, 
  Edit3, 
  Eye, 
  Calendar, 
  Save, 
  Share2,
  Check,
  Globe,
  Lock,
  ThumbsUp,
  Info,
  User as UserIcon
} from 'lucide-react';

interface VideoPlayerViewProps {
  videoId: string;
  userId?: string;
  onBack: () => void;
  onDelete: () => void;
  onUpdate: () => void;
  onOpenProfile: (userId: string) => void;
}

const VideoPlayerView: React.FC<VideoPlayerViewProps> = ({ videoId, userId, onBack, onDelete, onUpdate, onOpenProfile }) => {
  const [video, setVideo] = useState<VideoMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPublic, setEditPublic] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchVideoDetails();
    incrementViews();
    if (userId) checkLikeStatus();
  }, [videoId, userId]);

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
        setEditPublic(data.is_public);
      }
    } finally {
      setLoading(false);
    }
  };

  const checkLikeStatus = async () => {
    const { data } = await supabase
      .from('video_likes')
      .select('id')
      .eq('video_id', videoId)
      .eq('user_id', userId)
      .single();
    setIsLiked(!!data);
  };

  const incrementViews = async () => {
    try {
      await supabase.rpc('increment_video_views', { video_id: videoId });
    } catch (err) {}
  };

  const handleToggleLike = async () => {
    if (!userId) {
      alert("Você precisa estar logado para curtir vídeos!");
      return;
    }

    const { data, error } = await supabase.rpc('toggle_video_like', { 
      target_video_id: videoId, 
      target_user_id: userId 
    });

    if (!error) {
      setIsLiked(data.liked);
      setVideo(prev => prev ? { 
        ...prev, 
        likes_count: data.liked ? Number(prev.likes_count) + 1 : Number(prev.likes_count) - 1 
      } : null);
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('videos')
      .update({ 
        title: editTitle, 
        description: editDesc,
        is_public: editPublic
      })
      .eq('id', videoId);
    
    if (!error) {
      setVideo(prev => prev ? { ...prev, title: editTitle, description: editDesc, is_public: editPublic } : null);
      setEditing(false);
      onUpdate();
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="animate-pulse space-y-8 max-w-6xl mx-auto">
      <div className="h-10 w-24 bg-zinc-900 rounded-xl"></div>
      <div className="aspect-video bg-zinc-900 rounded-[2.5rem]"></div>
      <div className="h-32 bg-zinc-900 rounded-[2.5rem]"></div>
    </div>
  );

  if (!video) return <div className="text-center py-20 text-zinc-500">Vídeo não encontrado.</div>;

  const isOwner = userId === video.user_id;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <button onClick={onBack} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group">
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        Voltar
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="aspect-video bg-black rounded-[2.5rem] overflow-hidden shadow-2xl ring-1 ring-zinc-800">
            <video src={getFileUrl(video.file_path)} controls autoPlay className="w-full h-full" />
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-[2.5rem] p-8">
            {editing ? (
              <div className="space-y-6">
                <input 
                  type="text" 
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-2xl font-bold rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
                <textarea 
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={4}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 outline-none"
                  placeholder="Descrição do vídeo..."
                />
                <div className="flex items-center justify-between bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${editPublic ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-800 text-zinc-500'}`}>
                      {editPublic ? <Globe className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm">Visibilidade {editPublic ? 'Pública' : 'Privada'}</p>
                      <p className="text-xs text-zinc-500">{editPublic ? 'Qualquer um pode assistir' : 'Só você pode ver'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setEditPublic(!editPublic)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${editPublic ? 'bg-indigo-600' : 'bg-zinc-700'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editPublic ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setEditing(false)} className="px-6 py-2 text-zinc-400 font-medium">Cancelar</button>
                  <button onClick={handleUpdate} disabled={saving} className="bg-indigo-600 hover:bg-indigo-500 px-8 py-2 rounded-xl font-bold flex items-center gap-2">
                    {saving ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />} Salvar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div>
                    <h2 className="text-3xl font-black text-white leading-tight">{video.title}</h2>
                    <div className="flex flex-wrap items-center gap-4 mt-4 text-zinc-500 text-sm">
                      <div className="flex items-center gap-1.5 bg-zinc-800/50 px-3 py-1.5 rounded-full border border-zinc-800">
                        <Eye className="w-4 h-4" />
                        <span className="font-bold">{video.views}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-zinc-800/50 px-3 py-1.5 rounded-full border border-zinc-800">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(video.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${video.is_public ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                        {video.is_public ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        <span className="font-bold text-xs uppercase tracking-tighter">{video.is_public ? 'Público' : 'Privado'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleToggleLike}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold transition-all ${isLiked ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700'}`}
                    >
                      <ThumbsUp className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                      {video.likes_count}
                    </button>
                    <button className="p-2.5 bg-zinc-800 border border-zinc-700 rounded-full text-zinc-400 hover:text-white transition-all">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="pt-8 border-t border-zinc-800/50">
                   <div 
                     onClick={() => onOpenProfile(video.user_id)}
                     className="flex items-center gap-4 mb-6 cursor-pointer group w-fit"
                   >
                     <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-xl font-bold group-hover:bg-indigo-500 transition-colors">
                       <UserIcon className="w-6 h-6" />
                     </div>
                     <div>
                       <p className="font-bold text-white group-hover:text-indigo-400 transition-colors">Criador do Vídeo</p>
                       <p className="text-xs text-zinc-500 uppercase tracking-widest">Ver todos os vídeos públicos</p>
                     </div>
                   </div>
                  <p className="text-zinc-300 leading-relaxed text-lg whitespace-pre-wrap">
                    {video.description || <span className="text-zinc-600 italic">Sem descrição.</span>}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {isOwner && (
            <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-[2rem] p-6 space-y-3">
              <h3 className="font-bold flex items-center gap-2 text-zinc-400 mb-2">
                <Info className="w-4 h-4" /> Gerenciamento
              </h3>
              {!editing && (
                <button onClick={() => setEditing(true)} className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-800 rounded-2xl text-zinc-300 font-bold transition-all">
                  <Edit3 className="w-5 h-5 text-indigo-400" /> Editar Detalhes
                </button>
              )}
              <button onClick={() => { if(window.confirm('Excluir vídeo permanentemente?')) onDelete(); }} className="w-full flex items-center gap-3 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-2xl text-red-400 font-bold transition-all">
                <Trash2 className="w-5 h-5" /> Excluir Vídeo
              </button>
            </div>
          )}
          
          <div className="bg-indigo-600/5 border border-indigo-500/10 rounded-[2rem] p-6">
            <h3 className="font-bold text-indigo-400 mb-4 flex items-center gap-2">Estatísticas</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Popularidade</span>
                <span className="text-white font-bold">{video.likes_count} Curtidas</span>
              </div>
              <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500" style={{ width: `${Math.min((Number(video.likes_count) / 100) * 100, 100)}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayerView;
