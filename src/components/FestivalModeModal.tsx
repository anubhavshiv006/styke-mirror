import React from 'react';
import { 
  X, 
  Sparkles, 
  Check, 
  Flame, 
  Shirt, 
  ChevronRight, 
  ArrowRight
} from 'lucide-react';
import { Outfit } from '../types.ts';
import { sound } from '../utils/audio.ts';

interface FestivalModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFestiveOutfit: (outfit: Outfit, color: string) => void;
}

export const FestivalModeModal: React.FC<FestivalModeModalProps> = ({
  isOpen,
  onClose,
  onSelectFestiveOutfit,
}) => {
  if (!isOpen) return null;

  const festiveCollections = [
    {
      theme: 'Diwali Grand Gala',
      tagline: 'Pure Zari Gold, Brocade and Royal Raw Silk',
      badge: 'Diwali 2026',
      badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
      outfit: {
        id: 'royal-sherwani',
        name: 'Imperial Zari Silk Sherwani',
        category: 'Festive' as const,
        gender: 'male' as const,
        designer: 'Sabyasachi Heritage Studio',
        wornBy: 'Prince Veer',
        retailPrice: '₹1,45,000',
        description: 'Deep crimson raw silk sherwani embroidered with 24k gold bullion wire, featuring ceremonial button studs and royal stole.',
        defaultColor: '#991b1b',
        accentColor: '#eab308',
        hotspot: { id: 'hs-sherwani', x: 42, y: 38, label: 'Imperial Sherwani', part: 'sherwani' as const },
        fabric: 'Benares Raw Silk & Gold Thread',
        occasion: 'Diwali Gala & Grand Weddings',
        renderType: 'sherwani' as const,
        tags: ['Diwali', 'Royal', 'Wedding', 'Silk'],
        previewImageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=400&q=80',
      },
      recommendedPose: 'Festive Royal Namaste',
      color: '#991b1b',
    },
    {
      theme: 'Eid Mubarak Grandeur',
      tagline: 'Regal Emerald Velvet with Hand-carved Crest Buttons',
      badge: 'Eid Special',
      badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
      outfit: {
        id: 'festive-bandhgala',
        name: 'Emerald Velvet Jodhpuri Bandhgala',
        category: 'Festive' as const,
        gender: 'male' as const,
        designer: 'Raghavendra Rathore Atelier',
        wornBy: 'Prince Veer (Scene 2)',
        retailPrice: '₹89,000',
        description: 'Structured royal emerald velvet bandhgala jacket with hand-carved lion crest buttons and silk pocket square.',
        defaultColor: '#064e3b',
        accentColor: '#fbbf24',
        hotspot: { id: 'hs-bandhgala', x: 62, y: 44, label: 'Emerald Bandhgala', part: 'jacket' as const },
        fabric: 'Rich Italian Silk Velvet',
        occasion: 'Sangeet & Eid Celebrations',
        renderType: 'blazer' as const,
        tags: ['Eid', 'Velvet', 'Festive', 'Jodhpuri'],
        previewImageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=80',
      },
      recommendedPose: 'The Red Carpet Splay',
      color: '#064e3b',
    },
    {
      theme: 'Wedding Sangeet Squad',
      tagline: 'Chikankari Mirror-Work Sunshine Kurta',
      badge: 'Wedding Swag',
      badgeColor: 'bg-orange-500/15 text-orange-300 border-orange-500/40',
      outfit: {
        id: 'mirror-kurta',
        name: 'Mirror-Work Royal Silk Kurta Set',
        category: 'Festive' as const,
        gender: 'male' as const,
        designer: 'Manish Malhotra Festive',
        wornBy: 'Rohan Kapoor',
        retailPrice: '₹95,000',
        description: 'Handcrafted mirror-work and chikankari thread embroidery on sunshine saffron raw silk with draped side placket.',
        defaultColor: '#d97706',
        accentColor: '#fef08a',
        hotspot: { id: 'hs-kurta', x: 49, y: 41, label: 'Mirror-Work Kurta', part: 'kurta' as const },
        fabric: 'Chanderi Silk with Real Mirrors',
        occasion: 'Diwali, Mehendi & Wedding Sangeet',
        renderType: 'kurta' as const,
        tags: ['Wedding', 'Festive', 'Diwali', 'Mirror-work'],
        previewImageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80',
      },
      recommendedPose: 'Action Hero Power Stance',
      color: '#d97706',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-2xl rounded-3xl bg-[#09101d] border border-slate-700/80 p-6 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curated Ethnic &amp; Festive Collection</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Festival Wardrobe: Diwali, Eid &amp; Weddings
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Featured ceremonial looks from award-winning festive productions with matching poses.
          </p>
        </div>

        <div className="space-y-3">
          {festiveCollections.map((item) => (
            <div
              key={item.theme}
              className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-[#00a8e1] transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-none border border-slate-700 shadow-md">
                  <img
                    src={item.outfit.previewImageUrl}
                    alt={item.outfit.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white group-hover:text-[#38bdf8] transition">
                      {item.theme}
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{item.outfit.name}</p>
                  <span className="text-[10px] text-amber-400/90 font-mono mt-0.5 block">
                    Ideal Pose: {item.recommendedPose}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  sound.playHighlight();
                  onSelectFestiveOutfit(item.outfit, item.color);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-[#00a8e1] hover:bg-[#0094c8] text-slate-950 text-xs font-black shadow-md shadow-[#00a8e1]/20 flex items-center gap-1.5 transition hover:scale-105"
              >
                <span>Wear in Mirror</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
