import React, { useState, useEffect } from 'react';
import { 
  Tv, 
  Smartphone, 
  Sparkles, 
  Mic, 
  HelpCircle, 
  SlidersHorizontal,
  Flame,
  Crown
} from 'lucide-react';
import { AppStage } from '../types.ts';
import { sound } from '../utils/audio.ts';

interface HeaderTVProps {
  currentStage: AppStage;
  setStage: (stage: AppStage) => void;
  roomCode: string;
  phoneConnected: boolean;
  onOpenPairing: () => void;
  onOpenFestival: () => void;
  onOpenVoice: () => void;
  activePlayerName: string;
  totalPlayers: number;
  activePlayerIndex: number;
}

export const HeaderTV: React.FC<HeaderTVProps> = ({
  currentStage,
  setStage,
  roomCode,
  phoneConnected,
  onOpenPairing,
  onOpenFestival,
  onOpenVoice,
  activePlayerName,
  totalPlayers,
  activePlayerIndex,
}) => {
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const stages: { id: AppStage; label: string; icon: string }[] = [
    { id: 'watch', label: '1. Watch & Pause', icon: '🎬' },
    { id: 'mirror', label: '2. Magic Mirror', icon: '🪞' },
    { id: 'vote', label: '3. Family Vote', icon: '🗳️' },
    { id: 'winner', label: '4. Winner Podium', icon: '👑' },
  ];

  return (
    <header className="relative z-30 bg-gradient-to-b from-zinc-950/95 via-zinc-900/90 to-transparent px-3 sm:px-6 py-2.5 sm:py-3.5 backdrop-blur-md border-b border-zinc-800/40">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
        {/* Brand & Fire TV badge */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500 via-rose-600 to-violet-600 p-[1.5px] shadow-lg shadow-amber-500/20">
              <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
                <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-tight text-sm sm:text-lg text-white font-mono">
                  WATCH &amp; WEAR
                </span>
                <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  Fire TV
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-medium tracking-wide hidden sm:block">
                Pause. Try. Pose.
              </p>
            </div>
          </div>

          {/* Current Turn Badge */}
          <div className="hidden xl:flex items-center gap-2 ml-4 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-700/60 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs text-zinc-300">
              Turn <strong className="text-amber-400">{activePlayerIndex + 1}/{totalPlayers}</strong>: <span className="font-semibold text-white">{activePlayerName}</span>
            </span>
          </div>
        </div>

        {/* Stage Navigation (10-foot TV navigation, scrollable on mobile) */}
        <nav className="order-3 sm:order-2 w-full sm:w-auto flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 shadow-xl overflow-x-auto no-scrollbar">
          {stages.map((stg) => {
            const isActive = currentStage === stg.id;
            return (
              <button
                key={stg.id}
                onClick={() => {
                  sound.playClick();
                  setStage(stg.id);
                }}
                className={`flex items-center gap-1 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-lg shadow-amber-500/25 scale-[1.02]'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
              >
                <span>{stg.icon}</span>
                <span>{stg.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Tools: Pairing status, Festival mode, Voice, Clock */}
        <div className="order-2 sm:order-3 flex items-center gap-1.5 sm:gap-2">
          {/* Festival Mode Button */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenFestival();
            }}
            className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600/20 to-orange-600/20 hover:from-amber-600/30 hover:to-orange-600/30 border border-amber-500/40 text-amber-300 text-[11px] sm:text-xs font-semibold transition shadow-sm"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">Festival</span>
          </button>

          {/* Voice Command Button */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenVoice();
            }}
            title="Voice Styling"
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-[11px] sm:text-xs font-medium transition"
          >
            <Mic className="w-3 h-3 text-rose-400" />
            <span className="hidden md:inline">Voice</span>
          </button>

          {/* Phone Pairing Status Indicator */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenPairing();
            }}
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg border text-[11px] sm:text-xs font-medium transition ${
              phoneConnected
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-zinc-800/80 border-amber-500/40 text-amber-300 hover:bg-zinc-700'
            }`}
          >
            <Smartphone className="w-3 h-3" />
            <span className="font-mono font-bold">{roomCode}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
