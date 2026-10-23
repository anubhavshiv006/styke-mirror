import React, { useState } from 'react';
import { 
  Smartphone, 
  User, 
  ChevronDown, 
  Tv, 
  Columns2,
  LogOut, 
  LogIn,
  Check,
  Sparkles
} from 'lucide-react';
import { AppStage, Player, ViewMode } from '../types.ts';
import { UserProfile } from './ProfileModal.tsx';
import { sound } from '../utils/audio.ts';

interface PrimeNavbarProps {
  currentStage: AppStage;
  setStage: (stage: AppStage) => void;
  roomCode: string;
  phoneConnected: boolean;
  onOpenPairing: () => void;
  players: Player[];
  activePlayerIndex: number;
  onSelectPlayer: (index: number) => void;
  currentUser: UserProfile | null;
  onOpenProfile: () => void;
  onOpenSignIn: () => void;
  onSignOut: () => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

// Google Multi-Color G Icon SVG
const GoogleGIcon = () => (
  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.35 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

export const PrimeNavbar: React.FC<PrimeNavbarProps> = ({
  currentStage,
  setStage,
  roomCode,
  phoneConnected,
  onOpenPairing,
  players,
  activePlayerIndex,
  onSelectPlayer,
  currentUser,
  onOpenProfile,
  onOpenSignIn,
  onSignOut,
  viewMode,
  setViewMode,
}) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const activePlayer = players[activePlayerIndex] || players[0];

  const navItems: { stage: AppStage; label: string }[] = [
    { stage: 'home', label: 'Home' },
    { stage: 'watch', label: 'Movies & Shows' },
    { stage: 'wardrobe', label: 'Clothes' },
    { stage: 'mirror', label: 'Magic Mirror' },
    { stage: 'vote', label: 'Runway' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#060b13]/95 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-2.5 transition-colors duration-200">
      <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Navigation */}
        <div className="flex items-center gap-6 lg:gap-10">
          {/* Watch & Wear Logo */}
          <button 
            onClick={() => {
              sound.playClick();
              setStage('home');
            }}
            className="flex flex-col items-start group focus:outline-none"
          >
            <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans">
              watch<span className="text-[#00a8e1] font-light">&amp;</span>wear
            </span>
            <svg className="w-20 h-1.5 -mt-0.5" viewBox="0 0 100 8" fill="none">
              <path
                d="M 2 2 Q 50 8 98 2"
                stroke="#00a8e1"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {/* Clean Primary Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map((item) => {
              const isActive = currentStage === item.stage;
              return (
                <button
                  key={item.stage}
                  onClick={() => {
                    sound.playClick();
                    setStage(item.stage);
                  }}
                  className={`relative px-3 py-1.5 text-sm font-semibold rounded-md transition-all duration-150 ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#00a8e1] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right: View Mode Toggle, Phone Pairing Status, Profile / Sign In */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Minimal View Mode Selector */}
          <div className="hidden sm:flex items-center bg-slate-900/90 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => { sound.playClick(); setViewMode('tv'); }}
              title="Full Screen TV Mode"
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition ${
                viewMode === 'tv'
                  ? 'bg-[#00a8e1] text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">TV</span>
            </button>
            <button
              onClick={() => { sound.playClick(); setViewMode('split'); }}
              title="Split TV + Phone View"
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition ${
                viewMode === 'split'
                  ? 'bg-[#00a8e1] text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Split</span>
            </button>
            <button
              onClick={() => { sound.playClick(); setViewMode('phone'); }}
              title="Phone Companion Only"
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition ${
                viewMode === 'phone'
                  ? 'bg-[#00a8e1] text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Phone</span>
            </button>
          </div>

          {/* Minimal Phone Pairing Status */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenPairing();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 transition"
            title="Pair Phone Companion"
          >
            <Smartphone className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono text-[11px] text-[#38bdf8] font-bold">{roomCode}</span>
            <span className={`w-1.5 h-1.5 rounded-full ${phoneConnected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
          </button>

          {/* My Profile Button */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenProfile();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition"
            title="My Profile"
          >
            <User className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span className="hidden sm:inline">My Profile</span>
          </button>

          {/* Sign In with Gmail (if not signed in) */}
          {!currentUser ? (
            <button
              onClick={() => {
                sound.playClick();
                onOpenSignIn();
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-950 text-xs font-bold transition shadow-sm"
              title="Sign in with Gmail"
            >
              <GoogleGIcon />
              <span className="whitespace-nowrap">Sign in</span>
            </button>
          ) : (
            /* User Avatar & Menu */
            <div className="relative">
              <button
                onClick={() => setProfileOpen(prev => !prev)}
                className="flex items-center gap-2 px-2 py-1 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 transition"
                title="Account Menu"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#00a8e1] to-purple-600 text-white font-bold text-xs flex items-center justify-center">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-medium text-slate-200 hidden md:inline max-w-[90px] truncate">
                  {currentUser.name.split(' ')[0]}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* Minimal Account & Profile Dropdown */}
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#0b121e] border border-slate-800 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150 text-xs">
                  <div className="px-3 py-2 border-b border-slate-800/80">
                    <p className="font-bold text-white truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono truncate">{currentUser.email}</p>
                  </div>

                  <button
                    onClick={() => {
                      sound.playClick();
                      setProfileOpen(false);
                      onOpenProfile();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-slate-200 hover:bg-slate-800/60 transition"
                  >
                    <User className="w-3.5 h-3.5 text-[#38bdf8]" />
                    <span>My Profile &amp; Wardrobe</span>
                  </button>

                  {/* Family Profiles */}
                  <div className="px-3 pt-2 pb-1 border-t border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                      Family Profile
                    </span>
                  </div>
                  {players.map((p, idx) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        sound.playClick();
                        onSelectPlayer(idx);
                        setProfileOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 transition ${
                        idx === activePlayerIndex
                          ? 'bg-[#00a8e1]/15 text-[#38bdf8] font-bold'
                          : 'text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{p.avatar}</span>
                        <span>{p.name}</span>
                      </div>
                      {idx === activePlayerIndex && <Check className="w-3 h-3 text-[#38bdf8]" />}
                    </button>
                  ))}

                  <div className="mt-1 pt-1 border-t border-slate-800/80">
                    <button
                      onClick={() => {
                        sound.playClick();
                        setProfileOpen(false);
                        onSignOut();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-rose-400 hover:bg-rose-500/10 transition font-semibold"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
