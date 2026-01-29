
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { AuthState, AppView } from './types';
import Login from './components/Auth';
import Header from './components/Header';
import VideoGrid from './components/VideoGrid';
import UploadModal from './components/UploadModal';
import VideoPlayerView from './components/VideoPlayerView';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({ user: null, session: null, loading: true });
  const [view, setView] = useState<AppView>('explore');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuth({ session, user: session?.user ?? null, loading: false });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuth({ session, user: session?.user ?? null, loading: false });
      if (session) setShowLogin(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshVideos = () => setRefreshTrigger(prev => prev + 1);

  const handleSelectVideo = (id: string) => {
    setSelectedVideoId(id);
    setView('player');
  };

  const handleOpenProfile = (userId: string) => {
    setProfileUserId(userId);
    setView('profile');
    setSelectedVideoId(null);
  };

  const handleBack = () => {
    setSelectedVideoId(null);
    if (profileUserId && view === 'player') {
      setView('profile');
    } else {
      setProfileUserId(null);
      setView(auth.session ? 'my-library' : 'explore');
    }
  };

  if (auth.loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (showLogin && !auth.session) {
    return (
      <div className="relative">
        <button 
          onClick={() => setShowLogin(false)}
          className="absolute top-8 left-8 z-50 text-zinc-400 hover:text-white flex items-center gap-2"
        >
          &larr; Voltar para Explorar
        </button>
        <Login />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <Header 
        user={auth.user} 
        activeView={view}
        onViewChange={(v) => { 
          setView(v); 
          setSelectedVideoId(null); 
          if (v !== 'profile') setProfileUserId(null); 
        }}
        onUploadClick={() => auth.session ? setIsUploadOpen(true) : setShowLogin(true)} 
        onLoginClick={() => setShowLogin(true)}
        onSearch={setSearchQuery}
      />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {view === 'player' && selectedVideoId ? (
          <VideoPlayerView 
            videoId={selectedVideoId} 
            userId={auth.user?.id}
            onBack={handleBack} 
            onDelete={() => { handleBack(); refreshVideos(); }}
            onUpdate={refreshVideos}
            onOpenProfile={handleOpenProfile}
          />
        ) : (
          <div className="max-w-7xl mx-auto">
            {view === 'profile' && profileUserId && (
               <div className="mb-8 p-8 bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] flex items-center gap-6">
                 <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-3xl font-bold">
                   {profileUserId.charAt(0).toUpperCase()}
                 </div>
                 <div>
                   <h2 className="text-2xl font-black">Perfil do Usuário</h2>
                   <p className="text-zinc-500">Explorando vídeos públicos deste criador</p>
                 </div>
               </div>
            )}
            
            <VideoGrid 
              userId={view === 'profile' ? profileUserId! : auth.user?.id}
              mode={view === 'my-library' ? 'personal' : (view === 'profile' ? 'profile' : 'public')}
              searchQuery={searchQuery}
              refreshTrigger={refreshTrigger}
              onSelectVideo={handleSelectVideo} 
            />
          </div>
        )}
      </main>

      {isUploadOpen && auth.user && (
        <UploadModal 
          userId={auth.user.id} 
          onClose={() => setIsUploadOpen(false)} 
          onComplete={() => {
            setIsUploadOpen(false);
            refreshVideos();
            setView('my-library');
          }}
        />
      )}
    </div>
  );
};

export default App;
