
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { AuthState } from './types';
import Login from './components/Auth';
import Header from './components/Header';
import VideoGrid from './components/VideoGrid';
import UploadModal from './components/UploadModal';
import VideoPlayerView from './components/VideoPlayerView';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({ user: null, session: null, loading: true });
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuth({ session, user: session?.user ?? null, loading: false });
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuth({ session, user: session?.user ?? null, loading: false });
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshVideos = () => setRefreshTrigger(prev => prev + 1);

  if (auth.loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!auth.session) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <Header 
        user={auth.user} 
        onUploadClick={() => setIsUploadOpen(true)} 
        onLogoClick={() => setSelectedVideoId(null)}
      />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {selectedVideoId ? (
          <VideoPlayerView 
            videoId={selectedVideoId} 
            onBack={() => setSelectedVideoId(null)} 
            onDelete={() => {
              setSelectedVideoId(null);
              refreshVideos();
            }}
            onUpdate={refreshVideos}
          />
        ) : (
          <VideoGrid 
            userId={auth.user.id} 
            refreshTrigger={refreshTrigger}
            onSelectVideo={setSelectedVideoId} 
          />
        )}
      </main>

      {isUploadOpen && (
        <UploadModal 
          userId={auth.user.id} 
          onClose={() => setIsUploadOpen(false)} 
          onComplete={() => {
            setIsUploadOpen(false);
            refreshVideos();
          }}
        />
      )}
    </div>
  );
};

export default App;
