
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { AppView } from '../types';
import { 
  Play, 
  Plus, 
  LogOut, 
  Compass, 
  Library,
  Search,
  User as UserIcon
} from 'lucide-react';

interface HeaderProps {
  user: any;
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  onUploadClick: () => void;
  onLoginClick: () => void;
  onSearch: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  user, 
  activeView, 
  onViewChange, 
  onUploadClick, 
  onLoginClick,
  onSearch 
}) => {
  const [searchValue, setSearchValue] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    onSearch(val);
  };

  return (
    <header className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800 px-4 md:px-8 py-3 flex items-center gap-4 md:gap-8">
      <div 
        className="flex items-center gap-2 cursor-pointer group shrink-0"
        onClick={() => onViewChange('explore')}
      >
        <div className="bg-indigo-600 p-2 rounded-lg group-hover:bg-indigo-500 transition-colors">
          <Play className="w-5 h-5 fill-white text-white" />
        </div>
        <h1 className="text-xl font-bold tracking-tight hidden sm:block">Supatube</h1>
      </div>

      <nav className="hidden md:flex items-center gap-1 bg-zinc-900/50 p-1 rounded-xl border border-zinc-800">
        <button 
          onClick={() => onViewChange('explore')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeView === 'explore' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Compass className="w-4 h-4" />
          Explorar
        </button>
        {user && (
          <button 
            onClick={() => onViewChange('my-library')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeView === 'my-library' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <Library className="w-4 h-4" />
            Minha Biblioteca
          </button>
        )}
      </nav>

      <div className="flex-1 max-w-xl relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input 
          type="text"
          placeholder="Buscar vídeos públicos..."
          value={searchValue}
          onChange={handleSearchChange}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
        />
      </div>

      <div className="flex items-center gap-3">
        <button 
          onClick={onUploadClick}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3 md:px-4 py-2 rounded-lg font-medium transition-all text-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden lg:inline">Upload</span>
        </button>

        {user ? (
          <div className="flex items-center gap-2 md:gap-4 pl-2 border-l border-zinc-800">
            <div className="hidden lg:flex flex-col items-end text-xs">
              <span className="font-semibold text-zinc-200">{user.email.split('@')[0]}</span>
              <span className="text-zinc-500">Logado</span>
            </div>
            <button 
              onClick={() => supabase.auth.signOut()}
              className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button 
            onClick={onLoginClick}
            className="flex items-center gap-2 text-zinc-300 hover:text-white px-4 py-2 rounded-lg text-sm font-medium border border-zinc-800 hover:bg-zinc-900 transition-all"
          >
            <UserIcon className="w-4 h-4" />
            Entrar
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
