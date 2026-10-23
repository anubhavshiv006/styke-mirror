import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Mic, 
  Sparkles, 
  Star, 
  CheckCircle2, 
  RotateCcw, 
  Sliders, 
  Palette, 
  Smartphone, 
  Tv, 
  ArrowRight,
  Flame,
  Volume2
} from 'lucide-react';
import { Outfit, Player } from '../types.ts';
import { sound } from '../utils/audio.ts';

interface PhoneCompanionProps {
  roomCode: string;
  onSendAction: (action: string, payload?: any) => void;
  selectedOutfit: Outfit;
  outfitColor: string;
  players: Player[];
  activeStage: string;
  onCloseCompanion?: () => void;
}

export const PhoneCompanion: React.FC<PhoneCompanionProps> = ({
  roomCode,
  onSendAction,
  selectedOutfit,
  outfitColor,
  players,
  activeStage,
  onCloseCompanion,
}) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceText, setVoiceText] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'camera' | 'outfit' | 'vote'>('camera');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [votedMap, setVotedMap] = useState<Record<string, number>>({});

  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    async function initPhoneCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (err) {
        console.warn('Phone camera stream error:', err);
      }
    }

    if (activeTab === 'camera') {
      initPhoneCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [activeTab, facingMode]);

  const handleToggleVoice = () => {
    sound.playClick();
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceText('Voice API unavailable. Click preset chips below!');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceText('Listening for fashion styling command...');
      };

      recognition.onresult = async (event: any) => {
        const spoken = event.results[0][0].transcript;
        setVoiceText(`"${spoken}"`);
        setIsListening(false);

        try {
          const res = await fetch('/api/ai/voice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: spoken }),
          });
          const action = await res.json();
          if (action.action === 'COLOR' && action.value) {
            onSendAction('COLOR', action.value);
            sound.playColorChime();
          } else if (action.action === 'LOCK_POSE') {
            onSendAction('LOCK_POSE');
            sound.playShutter();
          } else if (action.action === 'NEXT_PLAYER') {
            onSendAction('NEXT_PLAYER');
          }
        } catch {}
      };

      recognition.onerror = () => {
        setIsListening(false);
        setVoiceText('Microphone error or permission denied.');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handlePresetVoice = (command: string) => {
    sound.playClick();
    setVoiceText(`"${command}"`);
    if (command.includes('blue')) onSendAction('COLOR', '#0284c7');
    if (command.includes('red')) onSendAction('COLOR', '#dc2626');
    if (command.includes('gold')) onSendAction('COLOR', '#eab308');
    if (command.includes('green')) onSendAction('COLOR', '#059669');
    if (command.includes('Lock')) onSendAction('LOCK_POSE');
  };

  return (
    <div className="w-full max-w-md mx-auto min-h-screen bg-[#060b13] text-white flex flex-col justify-between border-x border-slate-800 shadow-2xl p-4 select-none">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#00a8e1] flex items-center justify-center shadow text-slate-950 font-black text-sm">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold leading-tight">watch&amp;wear</span>
                <span className="text-[9px] bg-[#00a8e1]/20 text-[#38bdf8] font-mono px-1 rounded">Companion</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono font-semibold block">
                ● Connected to TV ({roomCode})
              </span>
            </div>
          </div>

          {onCloseCompanion && (
            <button
              onClick={onCloseCompanion}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
            >
              TV View
            </button>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-[#0c1424] rounded-xl border border-slate-800 mb-3">
          <button
            onClick={() => setActiveTab('camera')}
            className={`py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'camera' ? 'bg-[#00a8e1] text-slate-950 shadow' : 'text-slate-400'
            }`}
          >
            Camera &amp; Pose
          </button>
          <button
            onClick={() => setActiveTab('outfit')}
            className={`py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'outfit' ? 'bg-[#00a8e1] text-slate-950 shadow' : 'text-slate-400'
            }`}
          >
            Voice Styling
          </button>
          <button
            onClick={() => setActiveTab('vote')}
            className={`py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'vote' ? 'bg-[#00a8e1] text-slate-950 shadow' : 'text-slate-400'
            }`}
          >
            Runway Vote
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 flex flex-col justify-center">
        {activeTab === 'camera' && (
          <div className="flex flex-col items-center">
            {/* Phone Camera Viewport */}
            <div className="relative w-full aspect-[3/4] rounded-2xl bg-black overflow-hidden border border-slate-800 shadow-xl flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className="w-full h-full object-cover"
              />

              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/80 text-[10px] font-mono text-[#38bdf8] border border-[#00a8e1]/30">
                Streaming to Fire TV
              </div>

              <button
                onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/80 text-slate-300 hover:text-white border border-slate-800"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <div className="absolute bottom-3 inset-x-3 text-center">
                <span className="text-[11px] font-bold text-white bg-black/80 px-3 py-1 rounded-full border border-slate-700">
                  Outfit: {selectedOutfit.name}
                </span>
              </div>
            </div>

            {/* Tactile Pose Lock Buzzer */}
            <button
              onClick={() => {
                sound.playShutter();
                onSendAction('LOCK_POSE');
              }}
              className="w-full mt-4 py-4 rounded-2xl bg-[#00a8e1] hover:bg-[#0094c8] text-slate-950 font-black text-sm tracking-widest uppercase shadow-xl shadow-[#00a8e1]/30 flex items-center justify-center gap-2 active:scale-95 transition"
            >
              <Camera className="w-5 h-5 fill-current" />
              <span>LOCK POSE SHOT ON TV</span>
            </button>
          </div>
        )}

        {activeTab === 'outfit' && (
          <div className="flex flex-col gap-4">
            <div className="p-4 rounded-2xl bg-[#0c1424] border border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#38bdf8] block mb-2 font-mono">
                Voice-Powered Fashion Styling
              </span>

              <button
                onClick={handleToggleVoice}
                className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center transition-all ${
                  isListening
                    ? 'bg-rose-500 text-white scale-110 shadow-lg shadow-rose-500/50 animate-pulse'
                    : 'bg-slate-800 hover:bg-slate-700 text-[#00a8e1] border border-[#00a8e1]/40'
                }`}
              >
                <Mic className="w-7 h-7" />
              </button>

              <p className="text-xs text-slate-300 mt-3 font-medium min-h-[30px]">
                {voiceText || 'Tap mic and say "Make it royal blue" or "Diwali look"'}
              </p>

              <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                {['Make it blue', 'Crimson red', 'Regal gold', 'Emerald green', 'Lock pose'].map(phrase => (
                  <button
                    key={phrase}
                    onClick={() => handlePresetVoice(phrase)}
                    className="text-[10px] px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700"
                  >
                    "{phrase}"
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0c1424] border border-slate-800">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-3 font-mono">
                Direct Color Selector
              </span>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { name: 'Blue', hex: '#0284c7' },
                  { name: 'Red', hex: '#dc2626' },
                  { name: 'Gold', hex: '#eab308' },
                  { name: 'Green', hex: '#059669' },
                ].map(c => (
                  <button
                    key={c.hex}
                    onClick={() => {
                      sound.playColorChime();
                      onSendAction('COLOR', c.hex);
                    }}
                    className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center gap-1 active:scale-95 transition hover:border-[#00a8e1]"
                  >
                    <span className="w-6 h-6 rounded-full border border-white/20" style={{ backgroundColor: c.hex }} />
                    <span className="text-[10px] text-slate-300 font-medium">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vote' && (
          <div className="flex flex-col gap-3">
            <div className="text-center mb-1">
              <h3 className="text-base font-bold text-white">Cast Your Runway Votes</h3>
              <p className="text-[11px] text-slate-400">Rate each family member directly from your phone!</p>
            </div>

            {players.map(p => {
              const currentVote = votedMap[p.id] || 0;
              return (
                <div key={p.id} className="p-3 rounded-2xl bg-[#0c1424] border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{p.avatar}</span>
                    <div>
                      <h4 className="text-xs font-bold text-white">{p.name}</h4>
                      <span className="text-[10px] text-[#38bdf8] font-mono">Accuracy: {p.poseScore}%</span>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(stars => (
                      <button
                        key={stars}
                        onClick={() => {
                          sound.playClick();
                          setVotedMap(prev => ({ ...prev, [p.id]: stars }));
                          onSendAction('VOTE', { playerId: p.id, rating: stars });
                        }}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
                          currentVote >= stars ? 'bg-[#00a8e1] text-slate-950' : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span>Fire OS Companion</span>
        <span className="text-[#38bdf8]">Room: {roomCode}</span>
      </div>
    </div>
  );
};
