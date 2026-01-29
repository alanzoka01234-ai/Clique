
import React, { useState, useRef } from 'react';
import { supabase, BUCKET_NAME } from '../lib/supabase';
import { 
  X, 
  Upload, 
  FileVideo, 
  Loader2, 
  AlertCircle,
  CheckCircle2
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
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.type.startsWith('video/')) {
        setFile(selected);
        setTitle(selected.name.split('.')[0]);
        setError(null);
      } else {
        setError('Please select a valid video file.');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setProgress(10);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // 1. Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file);

      if (uploadError) throw uploadError;
      setProgress(60);

      // 2. Save to Database
      const { error: dbError } = await supabase
        .from('videos')
        .insert({
          user_id: userId,
          title: title || 'Untitled Video',
          description: description,
          file_path: filePath,
          thumbnail_url: `https://picsum.photos/seed/${fileName}/800/450`, // Mock thumbnail for now
          views: 0
        });

      if (dbError) throw dbError;
      setProgress(100);

      setTimeout(() => {
        onComplete();
      }, 500);
    } catch (err: any) {
      setError(err.message);
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-xl font-bold">Upload Video</h2>
          <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!file ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const droppedFile = e.dataTransfer.files?.[0];
                if (droppedFile && droppedFile.type.startsWith('video/')) {
                  setFile(droppedFile);
                  setTitle(droppedFile.name.split('.')[0]);
                }
              }}
              className="border-2 border-dashed border-zinc-700 hover:border-indigo-500 rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer bg-zinc-950/50 hover:bg-zinc-950 transition-all group"
            >
              <div className="bg-zinc-800 p-4 rounded-full mb-4 group-hover:scale-110 group-hover:bg-indigo-500/10 transition-all">
                <Upload className="w-10 h-10 text-zinc-500 group-hover:text-indigo-400" />
              </div>
              <p className="text-lg font-medium">Drag and drop video file</p>
              <p className="text-zinc-500 text-sm mt-1 text-center">Your videos will be private to your account.</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="video/*" 
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                <div className="bg-indigo-500/10 p-3 rounded-lg">
                  <FileVideo className="w-8 h-8 text-indigo-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-xs text-zinc-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
                {!uploading && (
                  <button onClick={() => setFile(null)} className="text-zinc-500 hover:text-red-400 p-2">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    placeholder="Describe your video"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Description (Optional)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    placeholder="Tell viewers about your video"
                  />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-zinc-400">{progress === 100 ? 'Upload complete!' : 'Uploading video...'}</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-500 ease-out" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-zinc-950/50 border-t border-zinc-800 flex justify-end gap-3">
          <button 
            disabled={uploading}
            onClick={onClose}
            className="px-6 py-2 rounded-lg text-zinc-400 hover:text-white transition-colors font-medium"
          >
            Cancel
          </button>
          <button 
            disabled={!file || uploading}
            onClick={handleUpload}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-2 rounded-lg font-semibold transition-all flex items-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {progress === 100 ? 'Finishing...' : 'Uploading...'}
              </>
            ) : (
              'Publish Video'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
