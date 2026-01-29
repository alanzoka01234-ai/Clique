
import React from 'react';
import { supabase } from '../lib/supabase';
import { 
  Play, 
  Plus, 
  LogOut, 
  User, 
  LayoutGrid,
  Search
} from 'lucide-react';

interface HeaderProps {
  user: any;
  onUploadClick: () => void;
  onLogoClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onUploadClick, onLogoClick }) => {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 px-4 md:px-8 py-4 flex items-center justify-between">
      <div 
        className="flex items-center gap-2 cursor-pointer group"
        onClick={onLogoClick}
      >
        <div className="bg-indigo-600 p-2 rounded-lg group-hover:bg-indigo-500 transition-colors">
          <Play className="w-5 h-5 fill-white text-white" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">Supatube</h1>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <button 
          onClick={onUploadClick}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Upload</span>
        </button>

        <div className="h-8 w-[1px] bg-zinc-800 hidden sm:block"></div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end text-sm">
            <span className="font-medium text-zinc-200">{user?.email?.split('@')[0]}</span>
            <span className="text-zinc-500 text-xs">Personal Account</span>
          </div>
          <button 
            onClick={handleSignOut}
            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-red-400 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
