import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Crown, 
  Star, 
  Sparkles, 
  Download, 
  RotateCcw, 
  Heart, 
  Flame, 
  Award, 
  CheckCircle, 
  Share2,
  Shirt,
  ArrowRight
} from 'lucide-react';
import { AICritique, Player } from '../types.ts';
import { ALL_WARDROBE_OUTFITS } from '../data/clips.ts';
import { sound } from '../utils/audio.ts';

interface FashionShowProps {
  players: Player[];
  activeStage: 'vote' | 'winner';
  onVoteSubmit: (playerId: string, category: string, rating: number) => void;
  onAnnounceWinner: () => void;
  onRestartGame: () => void;
  roomCode: string;
}

export const FashionShow: React.FC<FashionShowProps> = ({
  players,
  activeStage,
  onVoteSubmit,
  onAnnounceWinner,
  onRestartGame,
  roomCode,
}) => {
  const [hasVotedMap, setHasVotedMap] = useState<Record<string, boolean>>({});
  const [aiCritique, setAiCritique] = useState<AICritique | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);

  const sortedPlayers = [...players].sort((a, b) => {
    const scoreA = a.votes * 10 + a.poseScore;
    const scoreB = b.votes * 10 + b.poseScore;
    return scoreB - scoreA;
  });

  const winner = sortedPlayers[0] || players[0];

  useEffect(() => {
    if (activeStage === 'winner') {
      sound.playFanfare();
      fetchWinnerCritique();
    }
  }, [activeStage]);

  const fetchWinnerCritique = async () => {
    setIsGeneratingAI(true);
    try {
      const res = await fetch('/api/ai/critique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          winnerName: winner.name,
          outfitName: winner.outfitId,
          poseScore: winner.poseScore || 95,
          poseName: winner.targetPoseId,
          festivalTheme: 'Prime Cinema Red Carpet Premiere',
        }),
      });
      const data = await res.json();
      setAiCritique(data);
    } catch {
      setAiCritique({
        title: 'Haute Couture Living Room Royalty',
        critique: `Sensational performance by ${winner.name}! The poise and silhouette locked in top marks across all categories, commanding the screen with effortless elegance!`,
        rating: '9.9 / 10',
        styleAward: 'Best Prime Video Runway Swag',
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleCastVote = (playerId: string, stars: number) => {
    sound.playClick();
    onVoteSubmit(playerId, 'overall', stars);
    setHasVotedMap(prev => ({ ...prev, [playerId]: true }));
  };

  const handleDownloadCollage = () => {
    sound.playClick();
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient in Prime navy
    const grad = ctx.createLinearGradient(0, 0, 1200, 800);
    grad.addColorStop(0, '#060b14');
    grad.addColorStop(0.5, '#0b162c');
    grad.addColorStop(1, '#02050a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 800);

    // Border
    ctx.strokeStyle = '#00a8e1';
    ctx.lineWidth = 6;
    ctx.strokeRect(30, 30, 1140, 740);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('WATCH & WEAR: LIVING ROOM FASHION SHOW', 600, 100);

    ctx.fillStyle = '#00a8e1';
    ctx.font = '24px sans-serif';
    ctx.fillText(`CHAMPION: ${winner.name.toUpperCase()} • ROOM: ${roomCode}`, 600, 145);

    const cardW = 320;
    const cardH = 460;
    const startX = 600 - (players.length * (cardW + 30)) / 2;

    players.forEach((p, idx) => {
      const x = startX + idx * (cardW + 30);
      const y = 200;

      ctx.fillStyle = p.id === winner.id ? '#0f2244' : '#0c1424';
      ctx.fillRect(x, y, cardW, cardH);
      ctx.strokeStyle = p.id === winner.id ? '#00a8e1' : '#1e293b';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, cardW, cardH);

      ctx.font = '64px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.avatar, x + cardW / 2, y + 100);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(p.name, x + cardW / 2, y + 170);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(`Accuracy: ${p.poseScore}%`, x + cardW / 2, y + 220);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '18px sans-serif';
      ctx.fillText(`Votes: ${p.votes} ⭐`, x + cardW / 2, y + 260);

      if (p.id === winner.id) {
        ctx.fillStyle = '#eab308';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText('👑 GRAND CHAMPION', x + cardW / 2, y + 340);
      }
    });

    const link = document.createElement('a');
    link.download = `watch-and-wear-show-${roomCode}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="relative w-full min-h-[calc(100vh-65px)] bg-[#040810] flex flex-col justify-between p-4 lg:p-8 select-none overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#00a8e1]/30 via-purple-600/20 to-transparent blur-3xl" />

      {activeStage === 'vote' ? (
        /* ================= PRIME VOTING ARENA ================= */
        <div className="relative z-10 max-w-[1500px] mx-auto w-full flex-1 flex flex-col justify-between">
          <div className="text-center mb-6">
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#38bdf8] font-mono">
              Living Room Runway • Family Scoring
            </span>
            <h1 className="text-3xl lg:text-4xl font-black text-white mt-1 tracking-tight">
              FAMILY RUNWAY VOTE
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto mt-1">
              Rate each family member's pose precision and living room swagger directly from your phone or TV remote.
            </p>
          </div>

          {/* Snapshots Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 items-stretch">
            {players.map((p) => {
              const hasVoted = hasVotedMap[p.id];
              return (
                <div
                  key={p.id}
                  className="relative rounded-2xl bg-[#0c1424] border border-slate-800 hover:border-[#00a8e1] p-5 shadow-2xl backdrop-blur-xl flex flex-col justify-between transition-all duration-300"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{p.avatar}</span>
                        <div>
                          <h3 className="text-base font-bold text-white">{p.name}</h3>
                          <span className="text-xs text-[#38bdf8] font-mono">
                            Pose Score: <strong>{p.poseScore}%</strong>
                          </span>
                        </div>
                      </div>
                      <div className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs text-slate-300 font-bold font-mono">
                        {p.votes} Votes
                      </div>
                    </div>

                    {/* Snapshot Frame */}
                    <div className="relative aspect-[4/3] rounded-xl bg-slate-950 overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center group">
                      {p.snapshotUrl ? (
                        <img src={p.snapshotUrl} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        (() => {
                          const outfitObj = ALL_WARDROBE_OUTFITS.find(o => o.id === p.outfitId) || ALL_WARDROBE_OUTFITS[0];
                          return (
                            <div className="relative w-full h-full">
                              <img
                                src={outfitObj.previewImageUrl}
                                alt={p.name}
                                className="w-full h-full object-cover filter brightness-90 group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                              <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/70 backdrop-blur-md border border-white/20">
                                <span className="text-sm">{p.avatar}</span>
                                <span className="text-[10px] text-white font-bold">{p.name}</span>
                              </div>
                            </div>
                          );
                        })()
                      )}
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-[#38bdf8] border border-[#00a8e1]/30 z-10">
                        Accuracy: {p.poseScore}%
                      </div>
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div className="mt-5 pt-3 border-t border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 block mb-2 text-center uppercase tracking-wider font-mono">
                      Cast Rating
                    </span>
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((stars) => (
                        <button
                          key={stars}
                          onClick={() => handleCastVote(p.id, stars)}
                          className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-[#00a8e1] hover:text-slate-950 text-amber-400 flex items-center justify-center font-bold text-sm shadow transition-all hover:scale-110 active:scale-95 border border-slate-800 hover:border-[#00a8e1]"
                        >
                          <Star className="w-5 h-5 fill-current" />
                        </button>
                      ))}
                    </div>

                    {hasVoted && (
                      <p className="text-[11px] text-emerald-400 font-bold text-center mt-2 flex items-center justify-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Vote Recorded!</span>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Bar */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => {
                sound.playClick();
                onAnnounceWinner();
              }}
              className="px-8 py-3.5 rounded-xl bg-[#00a8e1] hover:bg-[#0094c8] text-slate-950 font-black text-sm tracking-wider uppercase shadow-xl shadow-[#00a8e1]/30 flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95"
            >
              <Crown className="w-5 h-5" />
              <span>Announce Living Room Champion!</span>
            </button>
          </div>
        </div>
      ) : (
        /* ================= PRIME WINNER PODIUM ================= */
        <div className="relative z-10 max-w-[1400px] mx-auto w-full flex-1 flex flex-col justify-between animate-in zoom-in-95 duration-400">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00a8e1]/15 border border-[#00a8e1]/30 text-[#38bdf8] text-xs font-mono font-bold tracking-widest uppercase mb-2">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Living Room Grand Champion</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight">
              👑 {winner.name.toUpperCase()} CLAIMS THE RUNWAY!
            </h1>
          </div>

          {/* Winner Showcase */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            {/* Left Card: Winner Portrait */}
            <div className="relative rounded-2xl bg-[#0c1424] border-2 border-[#00a8e1] p-6 shadow-2xl flex flex-col items-center text-center">
              <div className="relative w-full aspect-[4/3] rounded-xl bg-slate-950 overflow-hidden mb-4 border border-slate-800">
                {winner.snapshotUrl ? (
                  <img src={winner.snapshotUrl} alt={winner.name} className="w-full h-full object-cover" />
                ) : (
                  (() => {
                    const winnerOutfit = ALL_WARDROBE_OUTFITS.find(o => o.id === winner.outfitId) || ALL_WARDROBE_OUTFITS[0];
                    return (
                      <div className="relative w-full h-full">
                        <img
                          src={winnerOutfit.previewImageUrl}
                          alt={winner.name}
                          className="w-full h-full object-cover filter brightness-95"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-3 text-left">
                          <span className="text-xs text-[#38bdf8] font-bold block">{winnerOutfit.name}</span>
                          <span className="text-[10px] text-slate-300">by {winnerOutfit.designer}</span>
                        </div>
                      </div>
                    );
                  })()
                )}
                <div className="absolute top-3 right-3 w-10 h-10 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg z-10">
                  <Crown className="w-6 h-6 fill-current" />
                </div>
              </div>

              <h2 className="text-2xl font-black text-white">{winner.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-3 py-1 rounded-full bg-[#00a8e1]/20 text-[#38bdf8] text-xs font-mono font-bold border border-[#00a8e1]/40">
                  Accuracy: {winner.poseScore}%
                </span>
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-mono font-bold border border-amber-500/40">
                  {winner.votes} Votes ⭐
                </span>
              </div>
            </div>

            {/* Right Card: Gemini AI Runway Stylist Critique */}
            <div className="lg:col-span-2 rounded-2xl bg-[#0c1424] border border-slate-800 p-6 shadow-2xl flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#00a8e1]" />
                    <span className="text-xs uppercase font-extrabold tracking-widest text-[#38bdf8] font-mono">
                      Gemini AI Fashion Stylist Critique
                    </span>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                    {aiCritique?.rating || '9.9 / 10'}
                  </span>
                </div>

                <div className="mt-4">
                  <h3 className="text-xl font-black text-white">
                    {aiCritique?.title || 'Prime Video Living Room Fashion Royalty'}
                  </h3>
                  <p className="text-sm text-slate-300 mt-3 leading-relaxed italic">
                    "{aiCritique?.critique || `An unforgettable runway performance! ${winner.name} nailed every posture guideline with effortless celebrity charisma, winning unanimous acclaim from the entire living room!`}"
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-6">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">Silhouette</span>
                    <span className="text-base font-extrabold text-[#38bdf8] mt-1 block">99%</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">Runway Swag</span>
                    <span className="text-base font-extrabold text-amber-400 mt-1 block">10/10</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">Living Room Votes</span>
                    <span className="text-base font-extrabold text-rose-400 mt-1 block">{winner.votes} ⭐</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleDownloadCollage}
                  className="flex-1 py-3 px-5 rounded-xl bg-[#00a8e1] hover:bg-[#0094c8] text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-[#00a8e1]/25 flex items-center justify-center gap-2 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Family Collage Card</span>
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    onRestartGame();
                  }}
                  className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider border border-slate-700 flex items-center gap-2 transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Play New Show</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
