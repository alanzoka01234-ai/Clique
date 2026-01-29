import React, { useState, useRef } from 'react';
import { supabase, BUCKET_NAME } from '../lib/supabase';
import { 
  X, 
  Upload, 
  FileVideo, 
  Loader2, 
  AlertCircle,
  Globe,
  Lock
} from 'lucide-react';

interface UploadModalProps {
  userId: string;
  onClose: () => void;
  onComplete: () => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ userId, onClose, onComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(10);

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(filePath, file);
      if (uploadError) throw uploadError;
      setProgress(60);

      const { error: dbError } = await supabase.from('videos').insert({
        user_id: userId,
        titulo: title || 'Sem título',
        descricao: description,
        url_video: filePath,
        publico: isPublic,
        thumbnail_url: `https://picsum.photos/seed/${filePath}/800/450`,
        views: 0,
        likes_count: 0
      });

      if (dbError) throw dbError;
      setProgress(100);
      setTimeout(onComplete, 500);
    } catch (err: any) {
      setError(err.message);
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-10 py-6 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-2xl font-black">Novo Vídeo</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full"><X /></button>
        </div>

        <div className="p-10 space-y-8 overflow-y-auto">
          {!file ? (
            <div onClick={() => fileInputRef.current?.click()} className="border-4 border-dashed border-zinc-800 hover:border-indigo-500/50 rounded-[2.5rem] p-16 flex flex-col items-center justify-center cursor-pointer bg-zinc-950/30 hover:bg-zinc-950/50 transition-all group">
              <div className="bg-zinc-800 p-6 rounded-full mb-6 group-hover:scale-110 group-hover:bg-indigo-500/10 transition-all">
                <Upload className="w-12 h-12 text-zinc-500 group-hover:text-indigo-400" />
              </div>
              <p className="text-xl font-bold">Arraste seu vídeo aqui</p>
              <p className="text-zinc-500 mt-2">MP4, WebM ou OGG</p>
              <input type="file" ref={fileInputRef} className="hidden" accept="video/*" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setFile(f); setTitle(f.name.split('.')[0]); }
              }} />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex items-center gap-4">
                <FileVideo className="w-10 h-10 text-indigo-500" />
                <div className="flex-1 truncate"><p className="font-bold truncate">{file.name}</p></div>
                {!uploading && <button onClick={() => setFile(null)} className="text-zinc-500 hover:text-red-400"><X /></button>}
              </div>

              <div className="space-y-4">
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="Título do vídeo" />
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 outline-none" placeholder="Descrição (opcional)" />
                
                <div className="flex items-center justify-between bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                  <div className="flex items-center gap-3 text-sm">
                    {isPublic ? <Globe className="text-emerald-500" /> : <Lock className="text-zinc-500" />}
                    <div>
                      <p className="font-bold">Privacidade {isPublic ? 'Pública' : 'Privada'}</p>
                      <p className="text-zinc-500 text-xs">{isPublic ? 'Todos podem ver seu vídeo no feed Explorar' : 'Apenas você poderá assistir'}</p>
                    </div>
                  </div>
                  <button onClick={() => setIsPublic(!isPublic)} className={`relative w-12 h-6 rounded-full transition-colors ${isPublic ? 'bg-indigo-600' : 'bg-zinc-700'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isPublic ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}

          {uploading && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-bold"><span className="text-zinc-400">Enviando vídeo...</span><span>{progress}%</span></div>
              <div className="h-3 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} /></div>
            </div>
          )}
        </div>

        <div className="px-10 py-6 bg-zinc-950/50 border-t border-zinc-800 flex justify-end gap-4">
          <button disabled={uploading} onClick={onClose} className="px-6 py-2 text-zinc-400 font-bold">Cancelar</button>
          <button disabled={!file || uploading} onClick={handleUpload} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-10 py-3 rounded-2xl font-black transition-all flex items-center gap-2">
            {uploading ? <Loader2 className="animate-spin" /> : 'Publicar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;