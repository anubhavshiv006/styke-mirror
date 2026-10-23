import React, { useState, useEffect } from 'react';
import { Flame, Sparkles, TrendingUp, Star, Award, Zap, ChevronRight } from 'lucide-react';
import { sound } from '../utils/audio.ts';

interface HomeLiveTickerProps {
  onQuickExplore: () => void;
}

const TICKER_ITEMS = [
  { icon: Flame, text: 'Trending Now: Royal Velvet Sherwani rated #1 in living room runways', tag: 'Top Style' },
  { icon: Sparkles, text: 'Festival Mode unlocked: Try mirror-work Kurta & Banarasi Brocade on camera', tag: 'New Looks' },
  { icon: Star, text: 'Live Pose Score Leaderboard: Red Carpet Swag averaging 94.2% accuracy', tag: 'Runway Live' },
  { icon: Zap, text: 'Instant AR Color Grading: Switch emerald, midnight navy & ruby red in real-time', tag: 'X-Ray Fashion' },
  { icon: Award, text: 'Living Room TV + Phone sync active: Multi-angle pose tracking enabled', tag: 'Prime Feature' },
];

export const HomeLiveTicker: React.FC<HomeLiveTickerProps> = ({ onQuickExplore }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % TICKER_ITEMS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const current = TICKER_ITEMS[index];
  const IconComponent = current.icon;

  return (
    <div className="relative z-20 bg-gradient-to-r from-[#060b13] via-[#0a1426] to-[#060b13] border-y border-slate-800/80 px-4 sm:px-8 py-2 overflow-hidden shadow-inner">
      <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-4">
        {/* Left Live Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[11px] font-bold font-mono tracking-wider">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>LIVE FASHION RADAR</span>
          </div>

          {/* Animated Ticker Item */}
          <div 
            key={index}
            className="flex items-center gap-2 animate-fade-in text-xs sm:text-sm font-semibold text-slate-200"
          >
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#00a8e1]/15 text-[#38bdf8] border border-[#00a8e1]/30 uppercase font-mono">
              {current.tag}
            </span>
            <span className="text-slate-300 truncate max-w-[280px] sm:max-w-xl md:max-w-2xl">
              {current.text}
            </span>
          </div>
        </div>

        {/* Right CTA */}
        <button
          onClick={() => {
            sound.playClick();
            onQuickExplore();
          }}
          className="hidden sm:flex items-center gap-1 text-xs font-bold text-[#00a8e1] hover:text-[#38bdf8] transition group flex-shrink-0"
        >
          <span>Explore Wardrobe</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
