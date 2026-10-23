import React, { useState } from 'react';
import { 
  Sparkles, 
  Shirt, 
  Search, 
  Filter, 
  Camera, 
  Eye, 
  Tag, 
  Check, 
  Flame, 
  Star,
  ChevronRight,
  Layers,
  Heart
} from 'lucide-react';
import { ALL_WARDROBE_OUTFITS } from '../data/clips.ts';
import { Outfit } from '../types.ts';
import { sound } from '../utils/audio.ts';

interface WardrobeCatalogProps {
  onWearOutfitOnCamera: (outfit: Outfit, color: string) => void;
  selectedOutfitId: string;
}

export const WardrobeCatalog: React.FC<WardrobeCatalogProps> = ({
  onWearOutfitOnCamera,
  selectedOutfitId,
}) => {
  const [selectedGender, setSelectedGender] = useState<'all' | 'male' | 'female'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredOutfits = ALL_WARDROBE_OUTFITS.filter((item) => {
    if (selectedGender !== 'all' && item.gender !== selectedGender) return false;
    if (selectedCategory !== 'all' && item.category.toLowerCase() !== selectedCategory.toLowerCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.designer.toLowerCase().includes(q) ||
        item.occasion.toLowerCase().includes(q) ||
        item.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 py-6 select-none animate-in fade-in duration-300">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-[#00a8e1]/15 text-[#38bdf8] border border-[#00a8e1]/30">
              Wardrobe Store • Men &amp; Women
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {filteredOutfits.length} Designer Outfits Available
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Movie Outfits &amp; Festive Collection
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Choose any outfit worn by actors on screen. Click <strong className="text-[#38bdf8]">"Wear with Camera"</strong> to see it on your body live through the Magic Mirror!
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search sherwani, lehenga, tuxedo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00a8e1] transition"
          />
        </div>
      </div>

      {/* Filter Tabs (Gender & Category) */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        {/* Gender Toggle: All | Men | Women */}
        <div className="flex items-center p-1 rounded-xl bg-[#0c1424] border border-slate-800">
          <button
            onClick={() => {
              sound.playClick();
              setSelectedGender('all');
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
              selectedGender === 'all'
                ? 'bg-[#00a8e1] text-slate-950 shadow-[0_0_10px_#00a8e1]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Looks
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setSelectedGender('male');
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              selectedGender === 'male'
                ? 'bg-[#00a8e1] text-slate-950 shadow-[0_0_10px_#00a8e1]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Men's Wear (Male)</span>
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setSelectedGender('female');
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              selectedGender === 'female'
                ? 'bg-[#00a8e1] text-slate-950 shadow-[0_0_10px_#00a8e1]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Women's Wear (Female)</span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {['all', 'festive', 'formal', 'cyberpunk', 'modern'].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                sound.playClick();
                setSelectedCategory(cat);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border transition ${
                selectedCategory === cat
                  ? 'bg-slate-800 border-[#00a8e1] text-[#38bdf8]'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat === 'all' ? 'All Styles' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Outfits Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredOutfits.map((outfit) => {
          const isSelected = selectedOutfitId === outfit.id;
          return (
            <div
              key={outfit.id}
              className={`relative rounded-2xl bg-[#0c1424] border transition-all duration-300 overflow-hidden flex flex-col justify-between group hover:shadow-[0_10px_30px_rgba(0,168,225,0.2)] ${
                isSelected
                  ? 'border-[#00a8e1] ring-2 ring-[#00a8e1]/40'
                  : 'border-slate-800 hover:border-slate-600'
              }`}
            >
              <div>
                {/* Garment Visual Image Box */}
                <div className="relative aspect-[4/3] w-full bg-slate-950 overflow-hidden">
                  {outfit.previewImageUrl ? (
                    <img
                      src={outfit.previewImageUrl}
                      alt={outfit.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: outfit.defaultColor }}
                    >
                      <Shirt className="w-16 h-16 text-white/50" />
                    </div>
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c1424] via-transparent to-black/30" />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded backdrop-blur-md border ${
                      outfit.gender === 'female'
                        ? 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                        : 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40'
                    }`}>
                      {outfit.gender === 'female' ? "Women's" : "Men's"}
                    </span>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-amber-300 border border-amber-500/40 font-mono">
                      {outfit.retailPrice || 'Designer'}
                    </span>
                  </div>

                  {/* Color Dot Swatch */}
                  <div className="absolute bottom-2.5 left-2.5 z-10 flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/80 backdrop-blur-md border border-slate-700">
                    <span
                      className="w-3 h-3 rounded-full border border-white/40 shadow-sm"
                      style={{ backgroundColor: outfit.defaultColor }}
                    />
                    <span className="text-[10px] font-mono text-slate-300">
                      {outfit.fabric.split('&')[0]}
                    </span>
                  </div>
                </div>

                {/* Card Body Details */}
                <div className="p-4">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span className="text-[#38bdf8] font-semibold">{outfit.designer}</span>
                    <span className="font-mono text-[10px]">{outfit.occasion.split('&')[0]}</span>
                  </div>

                  <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">
                    {outfit.name}
                  </h3>

                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {outfit.description}
                  </p>
                </div>
              </div>

              {/* Action Button: Wear Live on Camera */}
              <div className="p-4 pt-0">
                <button
                  onClick={() => {
                    sound.playClick();
                    onWearOutfitOnCamera(outfit, outfit.defaultColor);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#00a8e1] hover:bg-[#0094c8] text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-[#00a8e1]/25 flex items-center justify-center gap-2 transition hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Camera className="w-3.5 h-3.5 fill-current" />
                  <span>Wear with Camera</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
