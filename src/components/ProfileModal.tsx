import React, { useState } from 'react';
import { 
  X, 
  User, 
  LogOut, 
  LogIn, 
  Sparkles, 
  Heart, 
  Award, 
  ShieldCheck, 
  Tv, 
  Smartphone, 
  CheckCircle2, 
  ExternalLink,
  Shirt,
  Star,
  Flame,
  ChevronRight
} from 'lucide-react';
import { Outfit, VideoClip } from '../types.ts';
import { sound } from '../utils/audio.ts';

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl?: string;
  memberTier: string;
  memberSince: string;
  savedOutfitIds: string[];
  runwayHighScore: number;
  totalOutfitsTried: number;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onSignInWithGoogle: (customEmail?: string, customName?: string) => void;
  onSignOut: () => void;
  allOutfits: Outfit[];
  onSelectOutfitForMirror: (outfit: Outfit) => void;
}

// Authentic Google Multi-Color G Logo SVG
const GoogleGLogo = () => (
  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
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

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSignInWithGoogle,
  onSignOut,
  allOutfits,
  onSelectOutfitForMirror,
}) => {
  const [customEmail, setCustomEmail] = useState('anubhavshiv55@gmail.com');
  const [customName, setCustomName] = useState('Anubhav Shiv');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'saved' | 'achievements'>('overview');

  if (!isOpen) return null;

  const savedOutfitsList = allOutfits.filter(o => 
    currentUser?.savedOutfitIds?.includes(o.id)
  );

  const handleSignIn = (emailToUse: string, nameToUse: string) => {
    sound.playFanfare();
    onSignInWithGoogle(emailToUse, nameToUse);
  };

  const handleSignOutClick = () => {
    sound.playClick();
    onSignOut();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#09101d] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Prime Video Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#060b13] via-[#0d172a] to-[#060b13] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00a8e1]/15 border border-[#00a8e1]/40 flex items-center justify-center text-[#38bdf8]">
              <User className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white tracking-tight">
                  {currentUser ? 'My Profile & Account' : 'Sign In to Watch & Wear'}
                </h3>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#00a8e1]/20 text-[#38bdf8] uppercase tracking-wider font-mono">
                  Prime Fashion
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {currentUser 
                  ? 'Manage your Prime Wardrobe, synced looks & Runway badges'
                  : 'Sign in with your Gmail account to sync outfits and join family runway'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto no-scrollbar space-y-6">
          {currentUser ? (
            /* ================= SIGNED IN VIEW ================= */
            <div className="space-y-6">
              {/* Profile Card Banner */}
              <div className="relative rounded-2xl bg-gradient-to-br from-[#0c182b] to-[#09111e] p-5 border border-slate-700/80 shadow-lg overflow-hidden">
                {/* Glowing cyan accent */}
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#00a8e1]/20 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 relative z-10">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#00a8e1] via-indigo-600 to-purple-600 flex items-center justify-center text-3xl font-black text-white shadow-xl ring-2 ring-[#00a8e1]/40">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    {/* Google G mini badge */}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-md p-0.5">
                      <GoogleGLogo />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <h2 className="text-xl font-black text-white">
                        {currentUser.name}
                      </h2>
                      <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Google Verified
                      </span>
                    </div>

                    <p className="text-sm text-slate-300 font-mono mt-0.5">
                      {currentUser.email}
                    </p>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3 text-xs text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-[#00a8e1]/10 text-[#38bdf8] font-bold border border-[#00a8e1]/30">
                        {currentUser.memberTier}
                      </span>
                      <span>Member since {currentUser.memberSince}</span>
                    </div>
                  </div>

                  {/* Direct Sign Out Button */}
                  <button
                    onClick={handleSignOutClick}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-xs font-bold transition duration-200 group"
                  >
                    <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                    <span>Sign Out</span>
                  </button>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-800/80">
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                    <div className="text-lg font-black text-[#38bdf8]">
                      {currentUser.totalOutfitsTried}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-semibold">
                      Outfits Tried
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                    <div className="text-lg font-black text-amber-400 flex items-center justify-center gap-1">
                      <Star className="w-4 h-4 fill-amber-400" />
                      {currentUser.runwayHighScore}%
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-semibold">
                      Runway Best
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                    <div className="text-lg font-black text-purple-400">
                      {currentUser.savedOutfitIds.length}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-semibold">
                      Saved Looks
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <button
                  onClick={() => { sound.playClick(); setActiveTab('overview'); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeTab === 'overview'
                      ? 'bg-[#00a8e1] text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Wardrobe Sync
                </button>
                <button
                  onClick={() => { sound.playClick(); setActiveTab('saved'); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'saved'
                      ? 'bg-[#00a8e1] text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5" />
                  <span>My Wishlist ({savedOutfitsList.length})</span>
                </button>
                <button
                  onClick={() => { sound.playClick(); setActiveTab('achievements'); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'achievements'
                      ? 'bg-[#00a8e1] text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Runway Medals</span>
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'overview' && (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#00a8e1]/15 text-[#38bdf8] flex items-center justify-center">
                        <Tv className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">Living Room TV Sync</h4>
                        <p className="text-[11px] text-slate-400">
                          Active profile syncs poses, outfit bookmarks, and mirror snapshots
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Synchronized
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">Companion Phone Handoff</h4>
                        <p className="text-[11px] text-slate-400">
                          Control mirror poses and color palette straight from mobile
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#00a8e1]/15 text-[#38bdf8] border border-[#00a8e1]/30">
                      Ready
                    </span>
                  </div>
                </div>
              )}

              {activeTab === 'saved' && (
                <div className="space-y-2">
                  {savedOutfitsList.length === 0 ? (
                    <div className="p-6 text-center rounded-xl bg-slate-900/40 border border-dashed border-slate-800">
                      <Shirt className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-xs text-slate-400">No saved outfits yet.</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Browse the Clothes catalog or Watch movies to bookmark looks.
                      </p>
                    </div>
                  ) : (
                    savedOutfitsList.map(outfit => (
                      <div 
                        key={outfit.id}
                        className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-[#00a8e1]/60 flex items-center justify-between transition"
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow"
                            style={{ backgroundColor: outfit.defaultColor }}
                          >
                            <Shirt className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white">{outfit.name}</h4>
                            <p className="text-[10px] text-slate-400">by {outfit.designer} • {outfit.category}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            sound.playClick();
                            onSelectOutfitForMirror(outfit);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#00a8e1] hover:bg-[#0094c8] text-slate-950 text-xs font-bold flex items-center gap-1 transition"
                        >
                          <span>Try in Mirror</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'achievements' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-amber-500/30 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg">
                      🏆
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-amber-300">Runway Champion</h4>
                      <p className="text-[10px] text-slate-400">Scored 90%+ in Red Carpet pose</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-cyan-500/30 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-lg">
                      ✨
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-cyan-300">Style Innovator</h4>
                      <p className="text-[10px] text-slate-400">Changed outfit color palette 10+ times</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-purple-500/30 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-lg">
                      🎬
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-purple-300">Cinema Connoisseur</h4>
                      <p className="text-[10px] text-slate-400">Paused and tried looks from 3+ blockbusters</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-emerald-500/30 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
                      📱
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-emerald-300">Living Room Sync</h4>
                      <p className="text-[10px] text-slate-400">Successfully paired TV with phone companion</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ================= SIGN IN WITH GMAIL VIEW ================= */
            <div className="space-y-6">
              {/* Highlight Banner */}
              <div className="text-center space-y-2 py-3">
                <div className="w-14 h-14 rounded-2xl bg-white/10 border border-slate-700 mx-auto flex items-center justify-center shadow-lg">
                  <GoogleGLogo />
                </div>
                <h3 className="text-xl font-black text-white">
                  Sign in with Gmail
                </h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  Connect your Google account to save movie outfits, sync living room family styling, and compete on the Family Runway.
                </p>
              </div>

              {/* 1-Click Fast Google Sign-In Card for Anubhav Shiv */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800/90 to-slate-900 border border-slate-700 hover:border-[#00a8e1] transition shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    One-Tap Quick Sign-In
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Recommended
                  </span>
                </div>

                <button
                  onClick={() => handleSignIn('anubhavshiv55@gmail.com', 'Anubhav Shiv')}
                  className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition transform hover:scale-[1.01] active:scale-[0.99]"
                >
                  <GoogleGLogo />
                  <span>Continue as Anubhav Shiv (anubhavshiv55@gmail.com)</span>
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-800" />
                <span className="text-[11px] font-mono text-slate-500 uppercase">Or custom Gmail</span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>

              {/* Custom Gmail Form */}
              <div className="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-[#00a8e1]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Gmail Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={customEmail}
                      onChange={e => setCustomEmail(e.target.value)}
                      placeholder="e.g. yourname@gmail.com"
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-[#00a8e1]"
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (customEmail.trim()) {
                      handleSignIn(customEmail.trim(), customName.trim() || 'Style Enthusiast');
                    }
                  }}
                  className="w-full py-2.5 rounded-lg bg-[#00a8e1] hover:bg-[#0094c8] text-slate-950 font-bold text-xs tracking-wide transition shadow flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In with this Gmail</span>
                </button>
              </div>

              {/* Benefits Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-[11px] text-slate-400">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Instant outfit bookmarking from movie pauses</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Cross-device sync between TV and Phone</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Save Magic Mirror pose snapshots & awards</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-[#060b13] border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-mono text-[11px]">Prime Video Living Room Fashion Edition</span>
          </div>

          <div className="flex items-center gap-2">
            {currentUser && (
              <button
                onClick={handleSignOutClick}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold transition"
              >
                Sign Out
              </button>
            )}
            <button
              onClick={() => { sound.playClick(); onClose(); }}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
