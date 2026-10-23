import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Sparkles, 
  Shirt, 
  ArrowRight, 
  Film, 
  Tag, 
  Layers,
  ChevronRight,
  Info,
  ArrowLeft,
  Volume2,
  VolumeX,
  Maximize,
  Sliders,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { VideoClip, Outfit } from '../types.ts';
import { sound } from '../utils/audio.ts';

interface WatchModeProps {
  currentClip: VideoClip;
  onBackToBrowse: () => void;
  selectedOutfitId: string | null;
  onSelectOutfit: (outfit: Outfit) => void;
  onStartMirror: () => void;
  focusedIndex?: number;
}

export const WatchMode: React.FC<WatchModeProps> = ({
  currentClip,
  onBackToBrowse,
  selectedOutfitId,
  onSelectOutfit,
  onStartMirror,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(38); // default paused at scene with actor
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit>(
    currentClip.outfits.find(o => o.id === selectedOutfitId) || currentClip.outfits[0]
  );
  const [isMuted, setIsMuted] = useState(false);
  const [xRayOpen, setXRayOpen] = useState(true);

  // Playback timer simulation
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 98) {
            setIsPlaying(false);
            return currentClip.pauseTime * 10;
          }
          return prev + 1;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentClip]);

  const togglePlay = () => {
    sound.playClick();
    setIsPlaying(prev => !prev);
  };

  const handlePickOutfit = (outfit: Outfit) => {
    sound.playHighlight();
    setSelectedOutfit(outfit);
    onSelectOutfit(outfit);
  };

  return (
    <div className="relative w-full min-h-[calc(100vh-65px)] bg-[#040810] flex flex-col justify-between select-none overflow-hidden">
      {/* Background Cinematic Video Stage */}
      <div className="relative flex-1 w-full max-w-[1700px] mx-auto p-3 sm:p-6 flex flex-col justify-between">
        
        {/* Top Prime Video Player Bar */}
        <div className="relative z-30 flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                sound.playClick();
                onBackToBrowse();
              }}
              className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition"
              title="Back to Browse (Esc)"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {currentClip.title}
                </h1>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {currentClip.maturityRating}
                </span>
                <span className="text-[10px] font-mono font-bold text-[#38bdf8] bg-[#00a8e1]/15 px-1.5 py-0.5 rounded border border-[#00a8e1]/30">
                  ★ {currentClip.matchScore}% Match
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Starring: <strong className="text-slate-200">{currentClip.actor}</strong> • Directed by {currentClip.director}
              </p>
            </div>
          </div>

          {/* Right Action: X-Ray Fashion Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setXRayOpen(prev => !prev)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition ${
                xRayOpen
                  ? 'bg-[#00a8e1]/20 border-[#00a8e1] text-[#38bdf8] shadow-[0_0_12px_rgba(0,168,225,0.25)]'
                  : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${xRayOpen ? 'bg-[#00a8e1] animate-pulse' : 'bg-slate-500'}`} />
              <span className="font-mono">X-RAY FASHION</span>
            </button>
          </div>
        </div>

        {/* Main Center Video & X-Ray Layout */}
        <div className="relative flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
          
          {/* Main Cinematic Video Player (3 cols on large screen) */}
          <div className="lg:col-span-3 relative aspect-[16/9] w-full rounded-2xl bg-black overflow-hidden border border-slate-800 shadow-2xl group">
            {/* High-Resolution Dynamic Scene Visuals */}
            <div className="absolute inset-0 bg-[#080d16] flex items-center justify-center overflow-hidden">
              {currentClip.heroPosterUrl ? (
                <img
                  src={currentClip.heroPosterUrl}
                  alt={currentClip.title}
                  className={`absolute inset-0 w-full h-full object-cover filter brightness-95 transition-transform duration-700 ${
                    isPlaying ? 'scale-105 transition-transform duration-[8000ms] ease-out' : 'scale-100'
                  }`}
                />
              ) : (
                <div className="absolute inset-0 bg-[#0b162c]" />
              )}

              {/* Ambient cinematic vignetting */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />
            </div>

            {/* OUTFIT HOTSPOTS (Prime X-Ray Fashion Pins) */}
            {xRayOpen && (
              <div className="absolute inset-0 pointer-events-none z-20">
                {currentClip.outfits.map((outfit) => {
                  const isSelected = selectedOutfit.id === outfit.id;
                  const hs = outfit.hotspot;
                  return (
                    <div
                      key={outfit.id}
                      style={{ left: `${hs.x}%`, top: `${hs.y}%` }}
                      className="absolute pointer-events-auto -translate-x-1/2 -translate-y-1/2 cursor-pointer group/pin"
                      onClick={() => handlePickOutfit(outfit)}
                    >
                      <div className="relative flex items-center justify-center">
                        {/* Cyan Pulse Rings */}
                        <span className="absolute w-12 h-12 rounded-full bg-[#00a8e1]/40 animate-ping" />
                        <span className={`w-9 h-9 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
                          isSelected
                            ? 'bg-[#00a8e1] text-slate-950 scale-125 ring-4 ring-[#00a8e1]/50 shadow-[0_0_20px_#00a8e1]'
                            : 'bg-slate-900/90 text-[#38bdf8] border-2 border-[#00a8e1] hover:scale-110'
                        }`}>
                          <Shirt className="w-4 h-4 fill-current" />
                        </span>

                        {/* Floating Hotspot Tag */}
                        <div className={`absolute left-full ml-3 px-3 py-1.5 rounded-lg whitespace-nowrap shadow-2xl transition-all duration-200 flex items-center gap-2 ${
                          isSelected
                            ? 'bg-gradient-to-r from-[#00a8e1] to-purple-600 text-slate-950 font-black text-xs scale-105'
                            : 'bg-slate-950/90 text-slate-200 border border-slate-700 text-[11px] font-semibold'
                        }`}>
                          <span>{hs.label}</span>
                          <span className="opacity-70 font-normal">({outfit.wornBy})</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Video HUD State Label */}
            <div className="absolute top-4 left-4 z-20 pointer-events-none">
              <div className="px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md border border-slate-800 flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-[#00a8e1]'}`} />
                <span className="text-xs font-mono font-bold uppercase text-white tracking-wider">
                  {isPlaying ? 'PLAYING SCENE' : 'SCENE PAUSED • SELECT ACTOR OUTFIT'}
                </span>
              </div>
            </div>

            {/* Bottom Prime Video Player Controls Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/85 to-transparent z-20">
              {/* Prime Cyan Timeline Bar */}
              <div 
                className="w-full bg-slate-800/80 h-1.5 hover:h-2.5 rounded-full overflow-hidden mb-3 cursor-pointer transition-all duration-150"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickPos = (e.clientX - rect.left) / rect.width;
                  setProgress(Math.round(clickPos * 100));
                }}
              >
                <div 
                  className="h-full bg-gradient-to-r from-[#00a8e1] to-[#38bdf8] rounded-full transition-all duration-150 shadow-[0_0_10px_#00a8e1]"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlay}
                    className="w-10 h-10 rounded-full bg-[#00a8e1] hover:bg-[#0094c8] text-slate-950 flex items-center justify-center font-bold shadow-lg transition-transform hover:scale-105"
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                  </button>

                  <button
                    onClick={() => setIsMuted(prev => !prev)}
                    className="p-2 text-slate-400 hover:text-white transition"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>

                  <div>
                    <h3 className="text-xs font-bold text-white">{currentClip.title}</h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      00:{Math.floor(progress / 10).toString().padStart(2, '0')} / 00:{currentClip.duration}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-300 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00a8e1]" />
                    <span>Prime Video • Interactive Hotspots</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: X-Ray Fashion Inspector Card (1 col on right) */}
          <div className="rounded-2xl bg-[#0a101d]/95 border border-slate-800/80 p-5 shadow-2xl backdrop-blur-xl flex flex-col justify-between h-full">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#00a8e1]" />
                  <span className="text-xs uppercase font-extrabold tracking-widest text-[#38bdf8] font-mono">
                    X-Ray Fashion
                  </span>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#00a8e1]/15 text-[#38bdf8] border border-[#00a8e1]/30">
                  {selectedOutfit.category}
                </span>
              </div>

              {/* Garment Visual Photo Card */}
              {selectedOutfit.previewImageUrl && (
                <div className="mt-3.5 relative aspect-[16/10] w-full rounded-xl overflow-hidden border border-slate-700/80 shadow-lg">
                  <img
                    src={selectedOutfit.previewImageUrl}
                    alt={selectedOutfit.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/70 backdrop-blur-md border border-white/20 uppercase font-mono">
                      {selectedOutfit.gender === 'female' ? "Women's Collection" : "Men's Collection"}
                    </span>
                    <span className="text-xs font-black text-amber-400 font-mono">
                      {selectedOutfit.retailPrice}
                    </span>
                  </div>
                </div>
              )}

              {/* Garment Title */}
              <div className="mt-3">
                <span className="text-[11px] text-slate-400 font-medium block">
                  Worn on screen by <strong className="text-white">{selectedOutfit.wornBy}</strong>
                </span>
                <h2 className="text-base font-black text-white leading-snug mt-0.5">
                  {selectedOutfit.name}
                </h2>
                <p className="text-xs text-[#38bdf8] font-semibold mt-0.5">
                  Designed by {selectedOutfit.designer}
                </p>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-300 mt-2 leading-relaxed line-clamp-3">
                {selectedOutfit.description}
              </p>

              {/* Garment Specs */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Fabric</span>
                  <span className="text-xs font-semibold text-slate-200 mt-0.5 block truncate">
                    {selectedOutfit.fabric}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Value</span>
                  <span className="text-xs font-bold text-amber-400 mt-0.5 block truncate">
                    {selectedOutfit.retailPrice || 'Haute Couture'}
                  </span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {selectedOutfit.tags.map(t => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/60 font-medium">
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            {/* Primary Action Button: Step into Magic Mirror */}
            <div className="mt-6 pt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  sound.playClick();
                  onStartMirror();
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-[#00a8e1] hover:bg-[#0094c8] text-slate-950 font-black text-sm tracking-wide shadow-xl shadow-[#00a8e1]/25 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Wear in Magic Mirror</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[11px] text-center text-slate-400 mt-2 font-mono">
                Instant AR Try-On with Live Camera preview
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
