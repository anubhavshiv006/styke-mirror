/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { PrimeNavbar } from './components/PrimeNavbar.tsx';
import { PrimeHeroBanner } from './components/PrimeHeroBanner.tsx';
import { PrimeCarousels } from './components/PrimeCarousels.tsx';
import { WardrobeCatalog } from './components/WardrobeCatalog.tsx';
import { WatchMode } from './components/WatchMode.tsx';
import { MagicMirror } from './components/MagicMirror.tsx';
import { FashionShow } from './components/FashionShow.tsx';
import { PhoneCompanion } from './components/PhoneCompanion.tsx';
import { PairingModal } from './components/PairingModal.tsx';
import { FestivalModeModal } from './components/FestivalModeModal.tsx';
import { VoiceStylingModal } from './components/VoiceStylingModal.tsx';
import { AIAssistantBot } from './components/AIAssistantBot.tsx';
import { ProfileModal, UserProfile } from './components/ProfileModal.tsx';
import { PRIME_CLIPS } from './data/clips.ts';
import { AppStage, Outfit, Player, VideoClip, ViewMode } from './types.ts';
import { sound } from './utils/audio.ts';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'phone') return 'phone';
    }
    return 'tv';
  });

  const [roomCode, setRoomCode] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const r = params.get('room');
      if (r) return r.toUpperCase();
    }
    return 'FIRE' + Math.floor(10 + Math.random() * 89);
  });

  const [phoneConnected, setPhoneConnected] = useState<boolean>(false);
  const [currentStage, setCurrentStage] = useState<AppStage>('home');
  const [activeClip, setActiveClip] = useState<VideoClip>(PRIME_CLIPS[0]);
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit>(PRIME_CLIPS[0].outfits[0]);
  const [outfitColor, setOutfitColor] = useState<string>(PRIME_CLIPS[0].outfits[0].defaultColor);

  // User Profile & Google Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('watch_wear_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    // Default initial signed in account for Anubhav Shiv
    return {
      name: 'Anubhav Shiv',
      email: 'anubhavshiv55@gmail.com',
      memberTier: 'Prime VIP Stylist',
      memberSince: 'Oct 2024',
      savedOutfitIds: ['royal-sherwani', 'festive-bandhgala'],
      runwayHighScore: 96,
      totalOutfitsTried: 14,
    };
  });

  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // 3-Player Family Roster
  const [players, setPlayers] = useState<Player[]>([
    {
      id: 'p1',
      name: 'Dad',
      avatar: '👨',
      outfitId: 'royal-sherwani',
      targetPoseId: 'namaste-swag',
      poseScore: 0,
      votes: 0,
    },
    {
      id: 'p2',
      name: 'Mom',
      avatar: '👩',
      outfitId: 'festive-bandhgala',
      targetPoseId: 'red-carpet',
      poseScore: 0,
      votes: 0,
    },
    {
      id: 'p3',
      name: 'Aarav',
      avatar: '👦',
      outfitId: 'mirror-kurta',
      targetPoseId: 'power-stance',
      poseScore: 0,
      votes: 0,
    },
  ]);

  const [activePlayerIndex, setActivePlayerIndex] = useState<number>(0);

  // Modals state
  const [isPairingOpen, setIsPairingOpen] = useState<boolean>(false);
  const [isFestivalOpen, setIsFestivalOpen] = useState<boolean>(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState<boolean>(false);

  // Google Sign-In handler
  const handleSignInWithGoogle = (customEmail?: string, customName?: string) => {
    const newUser: UserProfile = {
      name: customName || 'Anubhav Shiv',
      email: customEmail || 'anubhavshiv55@gmail.com',
      memberTier: 'Prime VIP Stylist',
      memberSince: 'Today',
      savedOutfitIds: ['royal-sherwani', 'festive-bandhgala'],
      runwayHighScore: 94,
      totalOutfitsTried: 8,
    };
    setCurrentUser(newUser);
    try {
      localStorage.setItem('watch_wear_user', JSON.stringify(newUser));
    } catch {}
  };

  // Sign-Out handler
  const handleSignOut = () => {
    sound.playClick();
    setCurrentUser(null);
    try {
      localStorage.removeItem('watch_wear_user');
    } catch {}
  };

  // Cross-tab sync between TV and Phone
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(`watch_wear_${roomCode}`);
      channel.onmessage = (event) => {
        const { type, payload } = event.data;
        if (type === 'PHONE_CONNECTED') {
          setPhoneConnected(true);
        } else if (type === 'COLOR') {
          setOutfitColor(payload);
        } else if (type === 'LOCK_POSE') {
          sound.playShutter();
        } else if (type === 'VOTE') {
          handleVoteSubmit(payload.playerId, 'overall', payload.rating);
        } else if (type === 'STAGE') {
          setCurrentStage(payload);
        }
      };

      if (viewMode === 'phone') {
        channel.postMessage({ type: 'PHONE_CONNECTED' });
      }
    } catch {}

    return () => {
      channel?.close();
    };
  }, [roomCode, viewMode]);

  const sendRoomAction = useCallback((action: string, payload?: any) => {
    try {
      const channel = new BroadcastChannel(`watch_wear_${roomCode}`);
      channel.postMessage({ type: action, payload });
      channel.close();
    } catch {}

    if (action === 'COLOR' && payload) {
      setOutfitColor(payload);
    } else if (action === 'NEXT_PLAYER') {
      handleNextPlayerOrVote();
    }
  }, [roomCode]);

  const handleSnapshotCaptured = (playerIdx: number, snapshotUrl: string, score: number) => {
    setPlayers(prev => {
      const updated = [...prev];
      if (updated[playerIdx]) {
        updated[playerIdx] = {
          ...updated[playerIdx],
          snapshotUrl,
          poseScore: score,
        };
      }
      return updated;
    });

    // Update user stats if high score achieved
    if (currentUser && score > currentUser.runwayHighScore) {
      const updatedUser = {
        ...currentUser,
        runwayHighScore: score,
        totalOutfitsTried: currentUser.totalOutfitsTried + 1,
      };
      setCurrentUser(updatedUser);
      try {
        localStorage.setItem('watch_wear_user', JSON.stringify(updatedUser));
      } catch {}
    }
  };

  const handleNextPlayerOrVote = () => {
    if (activePlayerIndex < players.length - 1) {
      setActivePlayerIndex(prev => prev + 1);
      sound.playClick();
    } else {
      sound.playFanfare();
      setCurrentStage('vote');
    }
  };

  const handleVoteSubmit = (playerId: string, _category: string, rating: number) => {
    setPlayers(prev =>
      prev.map(p => (p.id === playerId ? { ...p, votes: p.votes + rating } : p))
    );
  };

  const handleAnnounceWinner = () => {
    sound.playFanfare();
    setCurrentStage('winner');
  };

  const handleRestartGame = () => {
    sound.playClick();
    setActivePlayerIndex(0);
    setPlayers(prev =>
      prev.map(p => ({ ...p, poseScore: 0, votes: 0, snapshotUrl: undefined }))
    );
    setCurrentStage('home');
  };

  const activePlayer = players[activePlayerIndex] || players[0];

  if (viewMode === 'phone') {
    return (
      <PhoneCompanion
        roomCode={roomCode}
        onSendAction={sendRoomAction}
        selectedOutfit={selectedOutfit}
        outfitColor={outfitColor}
        players={players}
        activeStage={currentStage}
        onCloseCompanion={() => setViewMode('tv')}
      />
    );
  }

  return (
    <div className="relative min-h-screen bg-[#040810] text-white font-sans selection:bg-[#00a8e1] selection:text-slate-950 overflow-x-hidden">
      {/* Main Container */}
      <div className={viewMode === 'split' ? 'grid grid-cols-1 xl:grid-cols-3 min-h-screen' : 'min-h-screen'}>
        <div className={viewMode === 'split' ? 'xl:col-span-2 border-r border-slate-800 flex flex-col justify-between' : 'flex flex-col justify-between min-h-screen'}>
          {/* Prime Video Styled Top Navbar */}
          <PrimeNavbar
            currentStage={currentStage}
            setStage={setCurrentStage}
            roomCode={roomCode}
            phoneConnected={phoneConnected}
            onOpenPairing={() => setIsPairingOpen(true)}
            players={players}
            activePlayerIndex={activePlayerIndex}
            onSelectPlayer={setActivePlayerIndex}
            currentUser={currentUser}
            onOpenProfile={() => setIsProfileModalOpen(true)}
            onOpenSignIn={() => setIsProfileModalOpen(true)}
            onSignOut={handleSignOut}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />

          {/* Active Screen Stage */}
          <main className="flex-1 flex flex-col">
            {currentStage === 'home' && (
              <div className="animate-in fade-in duration-300">
                <PrimeHeroBanner
                  clips={PRIME_CLIPS}
                  onPlayClip={(clip) => {
                    setActiveClip(clip);
                    setSelectedOutfit(clip.outfits[0]);
                    setOutfitColor(clip.outfits[0].defaultColor);
                    setCurrentStage('watch');
                  }}
                  onQuickTryOutfit={(clip, outfit) => {
                    setActiveClip(clip);
                    setSelectedOutfit(outfit);
                    setOutfitColor(outfit.defaultColor);
                    setCurrentStage('mirror');
                  }}
                />

                <PrimeCarousels
                  clips={PRIME_CLIPS}
                  onSelectClip={(clip) => {
                    setActiveClip(clip);
                    setSelectedOutfit(clip.outfits[0]);
                    setOutfitColor(clip.outfits[0].defaultColor);
                    setCurrentStage('watch');
                  }}
                  onQuickTryOutfit={(clip, outfit) => {
                    setActiveClip(clip);
                    setSelectedOutfit(outfit);
                    setOutfitColor(outfit.defaultColor);
                    setCurrentStage('mirror');
                  }}
                />
              </div>
            )}

            {currentStage === 'wardrobe' && (
              <WardrobeCatalog
                selectedOutfitId={selectedOutfit?.id || ''}
                onWearOutfitOnCamera={(outfit, color) => {
                  setSelectedOutfit(outfit);
                  setOutfitColor(color);
                  setCurrentStage('mirror');
                }}
              />
            )}

            {currentStage === 'watch' && (
              <WatchMode
                currentClip={activeClip}
                onBackToBrowse={() => setCurrentStage('home')}
                selectedOutfitId={selectedOutfit?.id || null}
                onSelectOutfit={outfit => {
                  setSelectedOutfit(outfit);
                  setOutfitColor(outfit.defaultColor);
                }}
                onStartMirror={() => setCurrentStage('mirror')}
              />
            )}

            {currentStage === 'mirror' && (
              <MagicMirror
                outfit={selectedOutfit}
                outfitColor={outfitColor}
                onChangeColor={setOutfitColor}
                activePlayer={activePlayer}
                onSnapshotCaptured={handleSnapshotCaptured}
                onNextPlayerOrVote={handleNextPlayerOrVote}
                onBackToWatch={() => setCurrentStage('watch')}
                onSelectOutfit={outfit => {
                  setSelectedOutfit(outfit);
                  setOutfitColor(outfit.defaultColor);
                }}
                activePlayerIndex={activePlayerIndex}
                totalPlayers={players.length}
                onOpenVoice={() => setIsVoiceOpen(true)}
              />
            )}

            {(currentStage === 'vote' || currentStage === 'winner') && (
              <FashionShow
                players={players}
                activeStage={currentStage}
                onVoteSubmit={handleVoteSubmit}
                onAnnounceWinner={handleAnnounceWinner}
                onRestartGame={handleRestartGame}
                roomCode={roomCode}
              />
            )}
          </main>
        </div>

        {/* Right Column in Split View: Mobile Companion Simulator */}
        {viewMode === 'split' && (
          <div className="bg-[#040810] p-4 border-t xl:border-t-0 border-slate-800 flex flex-col items-center justify-center">
            <div className="w-full max-w-sm">
              <div className="text-center mb-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#38bdf8] font-bold block">
                  Companion Phone Simulator
                </span>
                <p className="text-[11px] text-slate-400">
                  Simulates a family member's phone camera, mic, and voting buzzer.
                </p>
              </div>
              <div className="rounded-[2.5rem] p-3 bg-[#0a101d] border-4 border-slate-700 shadow-2xl">
                <PhoneCompanion
                  roomCode={roomCode}
                  onSendAction={sendRoomAction}
                  selectedOutfit={selectedOutfit}
                  outfitColor={outfitColor}
                  players={players}
                  activeStage={currentStage}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Profile & Google Sign-In / Sign-Out Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onSignInWithGoogle={handleSignInWithGoogle}
        onSignOut={handleSignOut}
        allOutfits={PRIME_CLIPS.flatMap(c => c.outfits)}
        onSelectOutfitForMirror={(outfit) => {
          setSelectedOutfit(outfit);
          setOutfitColor(outfit.defaultColor);
          setCurrentStage('mirror');
        }}
      />

      {/* Modals */}
      <PairingModal
        isOpen={isPairingOpen}
        onClose={() => setIsPairingOpen(false)}
        roomCode={roomCode}
        phoneConnected={phoneConnected}
        onSimulateConnect={() => setPhoneConnected(prev => !prev)}
        onOpenSplitMode={() => setViewMode('split')}
      />

      <FestivalModeModal
        isOpen={isFestivalOpen}
        onClose={() => setIsFestivalOpen(false)}
        onSelectFestiveOutfit={(outfit, color) => {
          setSelectedOutfit(outfit);
          setOutfitColor(color);
          setCurrentStage('mirror');
        }}
      />

      <VoiceStylingModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onApplyVoiceCommand={(action, value) => {
          if (action === 'COLOR' && value) {
            setOutfitColor(value);
          } else if (action === 'OUTFIT') {
            const found = PRIME_CLIPS.flatMap(c => c.outfits).find(o => o.id === value);
            if (found) {
              setSelectedOutfit(found);
              setOutfitColor(found.defaultColor);
              setCurrentStage('mirror');
            }
          } else if (action === 'NEXT_PLAYER') {
            handleNextPlayerOrVote();
          } else if (action === 'LOCK_POSE') {
            sound.playShutter();
          }
        }}
      />

      {/* Floating AI Fashion Stylist & Guide Bot */}
      <AIAssistantBot
        currentStage={currentStage}
        onNavigate={setCurrentStage}
        onSelectOutfitAndMirror={(outfit, color) => {
          setSelectedOutfit(outfit);
          if (color) setOutfitColor(color);
          setCurrentStage('mirror');
        }}
        onChangeColor={setOutfitColor}
      />
    </div>
  );
}
