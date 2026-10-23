import React, { useRef } from 'react';
import { 
  Play, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft
} from 'lucide-react';
import { VideoClip, Outfit } from '../types.ts';
import { sound } from '../utils/audio.ts';

interface PrimeCarouselsProps {
  clips: VideoClip[];
  onSelectClip: (clip: VideoClip) => void;
  onQuickTryOutfit: (clip: VideoClip, outfit: Outfit) => void;
}

export const PrimeCarousels: React.FC<PrimeCarouselsProps> = ({
  clips,
  onSelectClip,
  onQuickTryOutfit,
}) => {
  // Curated clean groupings
  const trendingClips = clips;
  const festiveClips = clips.filter(c => c.genre.includes('Festive') || c.genre.includes('Period'));
  const coutureClips = clips.filter(c => c.genre.includes('Cinema') || c.genre.includes('Gothic') || c.genre.includes('Sci-Fi'));

  const renderCarouselSection = (
    title: string,
    subtitle: string,
    items: VideoClip[]
  ) => {
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);

    const handleScroll = (direction: 'left' | 'right') => {
      sound.playClick();
      if (scrollContainerRef.current) {
        const scrollAmount = direction === 'left' ? -380 : 380;
        scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    };

    return (
      <section className="select-none">
        {/* Clean Editorial Section Header */}
        <div className="flex items-end justify-between mb-3 px-4 sm:px-8">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {title}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleScroll('left')}
              className="w-7 h-7 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 flex items-center justify-center transition"
              title="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleScroll('right')}
              className="w-7 h-7 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 flex items-center justify-center transition"
              title="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Minimal Cards Scroll Grid */}
        <div 
          ref={scrollContainerRef}
          className="flex items-stretch gap-3.5 px-4 sm:px-8 overflow-x-auto pb-4 no-scrollbar scroll-smooth"
        >
          {items.map((clip, idx) => {
            const outfit = clip.outfits[0];
            return (
              <div
                key={clip.id}
                style={{ animationDelay: `${idx * 60}ms` }}
                className="relative flex-none w-[240px] sm:w-[280px] rounded-xl bg-[#0b121e] border border-slate-800/80 hover:border-[#00a8e1] transition-all duration-300 transform hover:-translate-y-1.5 hover:shadow-xl hover:shadow-[#00a8e1]/20 group overflow-hidden cursor-pointer flex flex-col justify-between animate-fade-in"
                onClick={() => {
                  sound.playClick();
                  onSelectClip(clip);
                }}
              >
                {/* Visual Poster */}
                <div className="relative aspect-[16/9] w-full bg-slate-900 overflow-hidden">
                  {clip.heroPosterUrl ? (
                    <img
                      src={clip.heroPosterUrl}
                      alt={clip.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 filter brightness-95"
                    />
                  ) : (
                    <div 
                      className="absolute inset-0"
                      style={{
                        background: `radial-gradient(circle at 70% 30%, ${clip.accentGlow}, #090e18 80%)`
                      }}
                    />
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b121e] via-transparent to-black/30 pointer-events-none" />

                  {/* Top Subtle Match Info */}
                  <div className="absolute top-2 left-2 z-10 pointer-events-none">
                    <span className="text-[10px] font-semibold text-slate-300 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded">
                      {clip.matchScore}% Match
                    </span>
                  </div>

                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2.5 z-20">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        sound.playClick();
                        onSelectClip(clip);
                      }}
                      className="w-10 h-10 rounded-full bg-[#00a8e1] text-slate-950 flex items-center justify-center shadow-lg transform hover:scale-110 transition duration-150"
                      title="Watch scene"
                    >
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        sound.playClick();
                        onQuickTryOutfit(clip, outfit);
                      }}
                      className="w-10 h-10 rounded-full bg-slate-900/90 text-amber-400 border border-slate-700 flex items-center justify-center shadow-lg transform hover:scale-110 transition duration-150"
                      title="Try outfit"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Card Info */}
                <div className="p-3 flex flex-col justify-between flex-1">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#38bdf8] transition-colors truncate">
                      {clip.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {clip.releaseYear} · {clip.actor.split('(')[0].trim()}
                    </p>

                    {/* Outfit Line */}
                    <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center gap-2">
                      <span 
                        className="w-2.5 h-2.5 rounded-full flex-none"
                        style={{ backgroundColor: outfit.defaultColor }}
                      />
                      <span className="text-[11px] text-slate-300 truncate flex-1">
                        {outfit.name}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 pt-1 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{outfit.designer}</span>
                    <span className="text-[#38bdf8] font-medium flex items-center gap-0.5 group-hover:text-white transition">
                      <span>Try</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  return (
    <div className="py-6 space-y-8">
      {renderCarouselSection(
        'Trending Movies & Wearable Looks',
        'Watch popular scenes and instantly wear actor outfits in Magic Mirror',
        trendingClips
      )}

      {renderCarouselSection(
        'Festive & Traditional Couture',
        'Zari Sherwanis, Silk Bandhgalas, and Mirror-work Kurtas',
        festiveClips
      )}

      {renderCarouselSection(
        'Premiere & Red Carpet Styles',
        'Contemporary suits, blazers, and high-fashion cinema ensembles',
        coutureClips
      )}
    </div>
  );
};
