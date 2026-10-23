import React from 'react';
import { 
  X, 
  Smartphone, 
  Tv, 
  CheckCircle2, 
  ExternalLink, 
  Sparkles,
  Wifi
} from 'lucide-react';
import { sound } from '../utils/audio.ts';

interface PairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  phoneConnected: boolean;
  onSimulateConnect: () => void;
  onOpenSplitMode: () => void;
}

export const PairingModal: React.FC<PairingModalProps> = ({
  isOpen,
  onClose,
  roomCode,
  phoneConnected,
  onSimulateConnect,
  onOpenSplitMode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#09101d] border border-slate-700/80 p-6 shadow-2xl overflow-hidden">
        {/* Glow backdrop in Prime cyan */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00a8e1]/15 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00a8e1]/15 border border-[#00a8e1]/30 text-[#38bdf8] text-xs font-mono font-bold uppercase mb-2">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Multi-Modal Device Pairing</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Turn Your Smartphone into the Camera &amp; Remote
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Scan the QR code with your mobile camera. No app download needed—runs directly in Safari or Chrome.
          </p>
        </div>

        {/* Center: Dynamic QR Code Box & 6-Char Code */}
        <div className="flex flex-col items-center">
          <div className="p-4 rounded-2xl bg-white shadow-2xl flex flex-col items-center">
            {/* High-Contrast Crisp QR Representation */}
            <svg className="w-48 h-48" viewBox="0 0 100 100" fill="none">
              <rect width="100" height="100" fill="#ffffff" />
              <rect x="10" y="10" width="24" height="24" fill="#000000" />
              <rect x="14" y="14" width="16" height="16" fill="#ffffff" />
              <rect x="18" y="18" width="8" height="8" fill="#000000" />

              <rect x="66" y="10" width="24" height="24" fill="#000000" />
              <rect x="70" y="14" width="16" height="16" fill="#ffffff" />
              <rect x="74" y="18" width="8" height="8" fill="#000000" />

              <rect x="10" y="66" width="24" height="24" fill="#000000" />
              <rect x="14" y="70" width="16" height="16" fill="#ffffff" />
              <rect x="18" y="74" width="8" height="8" fill="#000000" />

              <rect x="38" y="12" width="6" height="6" fill="#000000" />
              <rect x="48" y="12" width="6" height="6" fill="#000000" />
              <rect x="40" y="22" width="8" height="6" fill="#000000" />
              <rect x="52" y="22" width="6" height="6" fill="#000000" />

              <rect x="12" y="42" width="6" height="6" fill="#000000" />
              <rect x="22" y="42" width="6" height="6" fill="#000000" />
              <rect x="32" y="40" width="8" height="8" fill="#000000" />
              <rect x="44" y="38" width="12" height="6" fill="#000000" />
              <rect x="60" y="42" width="8" height="6" fill="#000000" />
              <rect x="72" y="40" width="6" height="6" fill="#000000" />
              <rect x="82" y="44" width="6" height="6" fill="#000000" />

              <rect x="40" y="52" width="6" height="8" fill="#000000" />
              <rect x="50" y="50" width="8" height="6" fill="#000000" />
              <rect x="62" y="54" width="8" height="6" fill="#000000" />
              <rect x="76" y="52" width="6" height="8" fill="#000000" />

              <rect x="38" y="66" width="6" height="6" fill="#000000" />
              <rect x="48" y="68" width="8" height="6" fill="#000000" />
              <rect x="60" y="66" width="6" height="8" fill="#000000" />
              <rect x="70" y="70" width="8" height="6" fill="#000000" />
              <rect x="82" y="68" width="6" height="8" fill="#000000" />

              <rect x="40" y="80" width="8" height="8" fill="#000000" />
              <rect x="52" y="82" width="6" height="6" fill="#000000" />
              <rect x="66" y="80" width="8" height="6" fill="#000000" />
              <rect x="78" y="82" width="8" height="6" fill="#000000" />

              <circle cx="50" cy="50" r="10" fill="#00a8e1" />
            </svg>

            <span className="text-[11px] font-mono font-bold text-slate-800 mt-2 tracking-wider">
              Scan with Phone Camera
            </span>
          </div>

          {/* Pairing Code Display */}
          <div className="mt-4 text-center">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-mono">
              Or manually enter code:
            </span>
            <div className="inline-block mt-1 px-6 py-2 rounded-2xl bg-black/70 border-2 border-[#00a8e1] text-2xl font-black font-mono tracking-widest text-[#38bdf8] shadow-[0_0_15px_rgba(0,168,225,0.2)]">
              {roomCode}
            </div>
          </div>

          {/* Connection Status Indicator */}
          <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 border border-slate-800">
            <span className={`w-2.5 h-2.5 rounded-full ${phoneConnected ? 'bg-emerald-400 animate-pulse' : 'bg-[#00a8e1] animate-ping'}`} />
            <span className="text-xs font-medium text-slate-300">
              {phoneConnected 
                ? 'Smartphone Paired: Living Room Device (Active)' 
                : 'Waiting for camera scan...'}
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={() => {
              sound.playClick();
              onSimulateConnect();
            }}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition"
          >
            {phoneConnected ? 'Disconnect Phone' : 'Simulate Phone Pair'}
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenSplitMode();
              onClose();
            }}
            className="py-2.5 px-3 rounded-xl bg-[#00a8e1] hover:bg-[#0094c8] text-slate-950 text-xs font-black shadow-lg shadow-[#00a8e1]/20 flex items-center justify-center gap-1.5 transition"
          >
            <span>Open Split View</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
