import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft,
  Star,
  Shirt
} from 'lucide-react';
import { VideoClip, Outfit } from '../types.ts';
import { sound } from '../utils/audio.ts';

interface PrimeHeroBannerProps {
  clips: VideoClip[];
  onPlayClip: (clip: VideoClip) => void;
  onQuickTryOutfit: (clip: VideoClip, outfit: Outfit) => void;
}

export const PrimeHeroBanner: React.FC<PrimeHeroBannerProps> = ({
  clips,
  onPlayClip,
  onQuickTryOutfit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentClip = clips[currentIndex] || clips[0];

  // Auto rotate banner every 9 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % clips.length);
    }, 9000);
    return () => clearInterval(timer);
  }, [clips.length]);

  const featuredOutfit = currentClip.outfits[0];

  return (
    <div className="relative w-full h-[460px] sm:h-[520px] lg:h-[560px] overflow-hidden select-none bg-[#060b13]">
      {/* Background Cinematic Visual with smooth zoom and subtle breathing */}
      <div className="absolute inset-0 overflow-hidden">
        {currentClip.heroPosterUrl ? (
          <img
            key={currentClip.id}
            src={currentClip.heroPosterUrl}
            alt={currentClip.title}
            className="absolute inset-0 w-full h-full object-cover object-right-top filter brightness-[0.88] transition-all duration-1000 ease-out transform scale-100 hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 bg-[#0c1424]" />
        )}

        {/* Prime Cinematic Vignette Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#040810] via-[#040810]/85 to-transparent w-full md:w-3/5 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#040810] via-transparent to-black/30 z-10" />
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#00a8e1]/10 rounded-full blur-3xl pointer-events-none animate-ambient-breathe" />
      </div>

      {/* Hero Content */}
      <div 
        key={`content-${currentClip.id}`}
        className="relative z-20 max-w-[1700px] mx-auto h-full px-4 sm:px-8 flex flex-col justify-center animate-fade-in"
      >
        <div className="max-w-xl">
          {/* Clean Unboxed Metadata */}
          <div className="flex items-center gap-2 text-xs text-slate-300 font-medium mb-2.5">
            <span className="text-[#38bdf8] font-bold flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-[#38bdf8] text-[#38bdf8]" />
              {currentClip.matchScore}% Match
            </span>
            <span className="text-slate-500">·</span>
            <span>{currentClip.releaseYear}</span>
            <span className="text-slate-500">·</span>
            <span>{currentClip.maturityRating}</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">{currentClip.genre}</span>
          </div>

          {/* Title & Tagline */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            {currentClip.title}
          </h1>
          <p className="text-xs sm:text-sm font-medium text-[#38bdf8] mt-1 tracking-wide">
            {currentClip.tagline}
          </p>

          {/* Synopsis */}
          <p className="text-xs sm:text-sm text-slate-300 mt-2.5 line-clamp-2 leading-relaxed">
            {currentClip.synopsis}
          </p>

          {/* Quiet Outfit Preview */}
          <div className="mt-4 flex items-center gap-3 py-2 px-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-300 max-w-md">
            <div 
              className="w-7 h-7 rounded flex items-center justify-center text-white flex-shrink-0 text-xs font-bold"
              style={{ backgroundColor: featuredOutfit.defaultColor }}
            >
              <Shirt className="w-4 h-4" />
            </div>
            <div className="flex-1 truncate">
              <span className="text-slate-400 text-[11px] block">Featured Look</span>
              <span className="font-semibold text-white truncate block">{featuredOutfit.name}</span>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                onQuickTryOutfit(currentClip, featuredOutfit);
              }}
              className="text-[#00a8e1] hover:text-[#38bdf8] font-semibold text-xs flex items-center gap-0.5 transition flex-shrink-0"
            >
              <span>Try on</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={() => {
                sound.playClick();
                onPlayClip(currentClip);
              }}
              className="px-5 py-2.5 rounded-lg bg-[#00a8e1] hover:bg-[#0094c8] text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 transition transform active:scale-95 shadow"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>Watch &amp; Try Outfits</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onQuickTryOutfit(currentClip, featuredOutfit);
              }}
              className="px-4 py-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white font-semibold text-xs sm:text-sm border border-slate-700/80 flex items-center gap-1.5 transition"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Magic Mirror</span>
            </button>

            {/* Slide Navigation */}
            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={() => {
                  sound.playClick();
                  setCurrentIndex(prev => (prev > 0 ? prev - 1 : clips.length - 1));
                }}
                className="w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center border border-slate-800 transition"
                title="Previous slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setCurrentIndex(prev => (prev + 1) % clips.length);
                }}
                className="w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center border border-slate-800 transition"
                title="Next slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Minimal Carousel Slide Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
        {clips.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              sound.playClick();
              setCurrentIndex(i);
            }}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === currentIndex
                ? 'w-6 bg-[#00a8e1]'
                : 'w-1.5 bg-slate-600/70 hover:bg-slate-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
