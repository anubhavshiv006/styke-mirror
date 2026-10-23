import React, { useState } from 'react';
import { 
  X, 
  Mic, 
  Sparkles, 
  Check, 
  Volume2, 
  Palette, 
  ArrowRight
} from 'lucide-react';
import { sound } from '../utils/audio.ts';

interface VoiceStylingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyVoiceCommand: (action: string, value?: string) => void;
}

export const VoiceStylingModal: React.FC<VoiceStylingModalProps> = ({
  isOpen,
  onClose,
  onApplyVoiceCommand,
}) => {
  if (!isOpen) return null;

  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [feedback, setFeedback] = useState('');

  const sampleCommands = [
    { label: 'Make it blue', action: 'COLOR', value: '#0284c7', desc: 'Recolors garment to Royal Blue' },
    { label: 'Make it crimson red', action: 'COLOR', value: '#dc2626', desc: 'Recolors garment to Festive Red' },
    { label: 'Golden festival glow', action: 'COLOR', value: '#eab308', desc: 'Shifts to 24k Regal Gold' },
    { label: 'Emerald green', action: 'COLOR', value: '#059669', desc: 'Shifts to Royal Emerald' },
    { label: 'Show wedding sherwani', action: 'OUTFIT', value: 'royal-sherwani', desc: 'Switches to Imperial Silk Sherwani' },
    { label: 'Lock pose shot', action: 'LOCK_POSE', desc: 'Freezes snapshot immediately' },
    { label: 'Next player turn', action: 'NEXT_PLAYER', desc: 'Passes turn to next family member' },
  ];

  const handleMicClick = () => {
    sound.playClick();
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setFeedback('Microphone API not supported in this browser. Try the quick buttons below!');
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

      recognition.onstart = () => {
        setIsListening(true);
        setSpokenText('Listening... Say: "Make it blue" or "Lock pose"');
      };

      recognition.onresult = async (e: any) => {
        const text = e.results[0][0].transcript;
        setSpokenText(`"${text}"`);
        setIsListening(false);

        try {
          const res = await fetch('/api/ai/voice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: text }),
          });
          const data = await res.json();
          if (data.action === 'COLOR' && data.value) {
            onApplyVoiceCommand('COLOR', data.value);
            sound.playColorChime();
            setFeedback(`Applied ${data.label || 'Color'}!`);
            setTimeout(onClose, 800);
          } else if (data.action === 'LOCK_POSE') {
            onApplyVoiceCommand('LOCK_POSE');
            sound.playShutter();
            setFeedback('Pose Locked!');
            setTimeout(onClose, 800);
          } else if (data.action === 'NEXT_PLAYER') {
            onApplyVoiceCommand('NEXT_PLAYER');
            setFeedback('Passed to Next Player!');
            setTimeout(onClose, 800);
          }
        } catch {
          setFeedback('Command received.');
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        setFeedback('Microphone permission needed or timed out.');
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleExecute = (cmd: typeof sampleCommands[0]) => {
    sound.playClick();
    if (cmd.action === 'COLOR') {
      sound.playColorChime();
    }
    onApplyVoiceCommand(cmd.action, cmd.value);
    setFeedback(`Executed: "${cmd.label}"`);
    setTimeout(onClose, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#09101d] border border-slate-700/80 p-6 shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00a8e1]/15 border border-[#00a8e1]/30 text-[#38bdf8] text-xs font-mono font-bold uppercase mb-2">
            <Mic className="w-3.5 h-3.5" />
            <span>Voice-Powered Styling</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Speak to Style Your Outfit
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Say natural commands into your phone or Fire TV remote to shift colors, pick outfits, or freeze your pose.
          </p>
        </div>

        <div className="flex flex-col items-center my-4">
          <button
            onClick={handleMicClick}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
              isListening
                ? 'bg-rose-500 text-white scale-110 shadow-2xl shadow-rose-500/50 animate-pulse'
                : 'bg-slate-900 hover:bg-slate-800 text-[#00a8e1] border-2 border-[#00a8e1]/40 shadow-xl hover:scale-105'
            }`}
          >
            <Mic className="w-9 h-9" />
          </button>

          <p className="text-xs font-bold text-slate-300 mt-3 font-mono">
            {spokenText || 'Click mic & speak command'}
          </p>
          {feedback && (
            <p className="text-xs text-[#38bdf8] font-bold mt-1 animate-pulse">
              {feedback}
            </p>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-2 text-center">
            Or test with one-click voice presets:
          </span>
          <div className="grid grid-cols-2 gap-2">
            {sampleCommands.map((cmd) => (
              <button
                key={cmd.label}
                onClick={() => handleExecute(cmd)}
                className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-[#00a8e1]/50 text-left transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-[#38bdf8]">
                    "{cmd.label}"
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-[#00a8e1] transition" />
                </div>
                <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                  {cmd.desc}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
