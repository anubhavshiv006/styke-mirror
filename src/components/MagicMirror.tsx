import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  RotateCcw, 
  Sparkles, 
  CheckCircle2, 
  ChevronRight, 
  Sliders, 
  ArrowLeft,
  Rotate3d,
  Check,
  Download
} from 'lucide-react';
import { ALL_WARDROBE_OUTFITS } from '../data/clips.ts';
import { Outfit, Player } from '../types.ts';
import { sound } from '../utils/audio.ts';
import { computeGarmentTransform, drawGarmentOnCanvas, GarmentFitOptions } from '../utils/garmentRenderer.ts';
import { getSimulatedKeypoints } from '../utils/poseTracker.ts';
import { GarmentViewer3D } from './GarmentViewer3D.tsx';

interface MagicMirrorProps {
  outfit: Outfit;
  outfitColor: string;
  onChangeColor: (color: string) => void;
  activePlayer: Player;
  onSnapshotCaptured: (playerIndex: number, snapshotUrl: string, poseScore: number) => void;
  onNextPlayerOrVote: () => void;
  onBackToWatch: () => void;
  onSelectOutfit?: (outfit: Outfit) => void;
  activePlayerIndex: number;
  totalPlayers: number;
  onOpenVoice: () => void;
}

export const MagicMirror: React.FC<MagicMirrorProps> = ({
  outfit,
  outfitColor,
  onChangeColor,
  activePlayer,
  onSnapshotCaptured,
  onNextPlayerOrVote,
  onBackToWatch,
  onSelectOutfit,
  activePlayerIndex,
}) => {
  // Mode: 2D Live AR Camera Fit vs 3D 360° Studio View
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

  // Camera stream state
  const [useRealCamera, setUseRealCamera] = useState<boolean>(true);
  const [cameraActive, setCameraActive] = useState<boolean>(false);

  // Lenskart-style Body Fit Controls (Scale, Position, Width, Fabric Style)
  const [fitScale, setFitScale] = useState<number>(1.05);
  const [fitOffsetY, setFitOffsetY] = useState<number>(0);
  const [fitOffsetX, setFitOffsetX] = useState<number>(0);
  const [fitStretchX] = useState<number>(1.0);
  const [blendMode, setBlendMode] = useState<'original' | 'tint' | 'vivid'>('original');
  const [showFitHUD, setShowFitHUD] = useState<boolean>(false);
  const [bodyMode, setBodyMode] = useState<'desk' | 'standing'>('desk');

  // Interactive Drag-to-Position directly on camera
  const isDraggingRef = useRef<boolean>(false);
  const lastPointerPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Bottom Rail Filter: All | Male | Female | Festive | Formal
  const [railFilter, setRailFilter] = useState<'all' | 'male' | 'female' | 'festive' | 'formal'>('all');

  // Captured Snapshot state
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [capturedSnapshot, setCapturedSnapshot] = useState<string | null>(null);
  const [flashActive, setFlashActive] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Designer color swatches
  const colorOptions = [
    { label: 'Royal Blue', hex: '#0284c7' },
    { label: 'Crimson Red', hex: '#dc2626' },
    { label: 'Regal Gold', hex: '#eab308' },
    { label: 'Emerald Green', hex: '#059669' },
    { label: 'Midnight Black', hex: '#0f172a' },
    { label: 'Imperial Violet', hex: '#7e22ce' },
  ];

  // Request Webcam stream on mount
  useEffect(() => {
    let stream: MediaStream | null = null;
    async function startCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera API unavailable in this environment');
        }
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setCameraActive(true);
          };
        }
      } catch (err: any) {
        console.warn('Webcam fallback to simulation:', err);
        setCameraActive(false);
        setUseRealCamera(false);
      }
    }

    if (useRealCamera) {
      startCamera();
    } else {
      setCameraActive(false);
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [useRealCamera]);

  // Main rendering loop for Live AR Camera Fit
  useEffect(() => {
    const render = (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;

      // 1. Draw base video feed - completely clear and high resolution
      if (cameraActive && videoRef.current && videoRef.current.readyState >= 2) {
        ctx.save();
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0, w, h);
        ctx.restore();
      } else {
        // High quality simulated luxury studio mirror backdrop
        ctx.fillStyle = '#060a12';
        ctx.fillRect(0, 0, w, h);

        // Stage spotlight with Prime cyan ambient tone
        const spot = ctx.createRadialGradient(w / 2, h * 0.45, 80, w / 2, h * 0.45, w * 0.65);
        spot.addColorStop(0, 'rgba(15, 30, 55, 0.95)');
        spot.addColorStop(0.7, 'rgba(8, 14, 25, 0.95)');
        spot.addColorStop(1, '#04070e');
        ctx.fillStyle = spot;
        ctx.fillRect(0, 0, w, h);

        // Subtle studio grid floor
        ctx.strokeStyle = 'rgba(0, 168, 225, 0.08)';
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 60) {
          ctx.beginPath();
          ctx.moveTo(x, h * 0.65);
          ctx.lineTo(w / 2 + (x - w / 2) * 2.2, h);
          ctx.stroke();
        }
      }

      // 2. Compute keypoints
      // Zero auto-sway when camera is active so clothes stay solidly worn on user
      let variation = { armSway: 0, shoulderTilt: 0, postureDrift: 0 };
      if (!cameraActive && !isLocked) {
        const t = time * 0.002;
        variation.armSway = Math.sin(t) * 0.15;
        variation.shoulderTilt = Math.cos(t * 0.8) * 0.1;
      }

      let keypoints = getSimulatedKeypoints({ id: 'namaste-swag', name: 'Standard', difficulty: 'Easy', idealAngles: { leftElbowWrist: 90, rightElbowWrist: 90, shoulderTilt: 0 } }, variation);
      
      if (bodyMode === 'desk') {
        // Calibrated for user sitting at desk in front of webcam: head is higher and shoulders closer
        keypoints = {
          ...keypoints,
          nose: { name: 'nose', x: 0.50, y: 0.20, confidence: 0.95 },
          left_shoulder: { name: 'left_shoulder', x: 0.30, y: 0.42, confidence: 0.95 },
          right_shoulder: { name: 'right_shoulder', x: 0.70, y: 0.42, confidence: 0.95 },
          left_hip: { name: 'left_hip', x: 0.35, y: 0.82, confidence: 0.90 },
          right_hip: { name: 'right_hip', x: 0.65, y: 0.82, confidence: 0.90 },
        };
      } else {
        // Standing view
        keypoints = {
          ...keypoints,
          nose: { name: 'nose', x: 0.50, y: 0.18, confidence: 0.95 },
          left_shoulder: { name: 'left_shoulder', x: 0.37, y: 0.33, confidence: 0.95 },
          right_shoulder: { name: 'right_shoulder', x: 0.63, y: 0.33, confidence: 0.95 },
          left_hip: { name: 'left_hip', x: 0.41, y: 0.62, confidence: 0.90 },
          right_hip: { name: 'right_hip', x: 0.59, y: 0.62, confidence: 0.90 },
        };
      }

      // 3. Draw 2D Real Garment Overlay on Body (Pure Isolated Cutout, Zero Cartoon Shapes, Zero Background)
      const fitOptions: GarmentFitOptions = {
        scale: fitScale,
        offsetY: fitOffsetY,
        offsetX: fitOffsetX,
        stretchX: fitStretchX,
        blendMode: blendMode,
        opacity: 0.98,
      };
      const garmentTransform = computeGarmentTransform(keypoints, w, h, outfit.renderType, fitOptions);
      if (garmentTransform) {
        drawGarmentOnCanvas(ctx, garmentTransform, outfit, outfitColor, fitOptions);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [
    outfit,
    outfitColor,
    cameraActive,
    isLocked,
    fitScale,
    fitOffsetY,
    fitOffsetX,
    fitStretchX,
    blendMode,
    bodyMode,
  ]);

  // Direct Drag-to-Body Fit Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).closest('button')) return;
    isDraggingRef.current = true;
    lastPointerPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastPointerPosRef.current.x;
    const dy = e.clientY - lastPointerPosRef.current.y;
    lastPointerPosRef.current = { x: e.clientX, y: e.clientY };
    setFitOffsetX(prev => Math.max(-250, Math.min(250, prev + dx * 1.5)));
    setFitOffsetY(prev => Math.max(-200, Math.min(200, prev + dy * 1.5)));
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  // Manual Snapshot Capture
  const handleManualLock = () => {
    sound.playShutter();
    setIsLocked(true);
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 250);

    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      setCapturedSnapshot(dataUrl);
      onSnapshotCaptured(activePlayerIndex, dataUrl, 98);
    }
  };

  const handleRetake = () => {
    sound.playClick();
    setIsLocked(false);
    setCapturedSnapshot(null);
  };

  // Filter outfits for bottom Lenskart-style slider
  const filteredRailOutfits = ALL_WARDROBE_OUTFITS.filter(item => {
    if (railFilter === 'all') return true;
    if (railFilter === 'male') return item.gender === 'male';
    if (railFilter === 'female') return item.gender === 'female';
    if (railFilter === 'festive') return item.category.toLowerCase().includes('festive');
    if (railFilter === 'formal') return item.category.toLowerCase().includes('formal');
    return true;
  });

  return (
    <div className="relative w-full min-h-[calc(100vh-65px)] bg-[#040810] flex flex-col p-2 sm:p-5 select-none overflow-x-hidden">
      <video ref={videoRef} className="hidden" playsInline muted autoPlay />

      {/* Screen Camera Flash */}
      {flashActive && (
        <div className="fixed inset-0 z-50 bg-white pointer-events-none transition-opacity duration-200 animate-out fade-out" />
      )}

      {/* =========================================================================
          TOP MINIMAL HEADER BAR (LENSKART STYLE)
         ========================================================================= */}
      <div className="max-w-[1700px] mx-auto w-full flex items-center justify-between mb-3 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sound.playClick();
              onBackToWatch();
            }}
            className="p-2 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition"
            title="Back to Catalog"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Virtual Clothes Try-On
              </h1>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#00a8e1]/15 text-[#38bdf8] border border-[#00a8e1]/30">
                Lenskart-Style AR
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live webcam clothing drape &amp; 3D couture showroom
            </p>
          </div>
        </div>

        {/* View Mode Switcher (2D Live Cam vs 3D Showroom) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-slate-900/90 border border-slate-800 shadow-inner">
            <button
              onClick={() => {
                sound.playClick();
                setViewMode('2d');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === '2d'
                  ? 'bg-[#00a8e1] text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Live Cam Fit</span>
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setViewMode('3d');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === '3d'
                  ? 'bg-[#00a8e1] text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Rotate3d className="w-3.5 h-3.5" />
              <span>3D Showroom</span>
            </button>
          </div>

          {/* Camera On / Off Button */}
          {viewMode === '2d' && (
            <button
              onClick={() => {
                sound.playClick();
                setUseRealCamera(prev => !prev);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition shadow-sm ${
                cameraActive
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-900 border-[#00a8e1]/50 text-[#38bdf8] hover:bg-slate-800'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span>{cameraActive ? 'Camera On' : 'Turn On Camera'}</span>
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          MAIN VIRTUAL TRY-ON VIEWPORT (CLEAN & SLEEK)
         ========================================================================= */}
      <div className="max-w-[1700px] mx-auto w-full mb-3">
        {viewMode === '3d' ? (
          /* --- 3D 360° STUDIO VIEW --- */
          <GarmentViewer3D
            outfit={outfit}
            outfitColor={outfitColor}
            onChangeColor={onChangeColor}
            onSwitchTo2DFit={() => setViewMode('2d')}
          />
        ) : (
          /* --- 2D AR LIVE CAMERA MIRROR --- */
          <div 
            className="relative aspect-[16/9] max-h-[560px] w-full mx-auto rounded-2xl bg-black overflow-hidden border border-slate-800 shadow-2xl cursor-grab active:cursor-grabbing select-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <canvas
              ref={canvasRef}
              width={1280}
              height={720}
              className="w-full h-full object-cover pointer-events-none"
            />

            {/* Top-Left: Outfit Tag Pill */}
            <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 pointer-events-none">
              <div className="px-3 py-1.5 rounded-xl bg-black/85 backdrop-blur-md border border-slate-800 text-white text-xs font-semibold flex items-center gap-2 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-300 font-medium">Wearing:</span>
                <span className="text-[#38bdf8] font-bold truncate max-w-[220px]">{outfit.name}</span>
              </div>
            </div>

            {/* Top-Right: Adjust Fit & Color Toolbar */}
            <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
              {/* Color Tint Swatches */}
              <div 
                className="flex items-center gap-1.5 p-1 rounded-xl bg-black/80 backdrop-blur-md border border-slate-800 shadow-lg"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                {colorOptions.slice(0, 4).map((c) => {
                  const isSelected = outfitColor.toLowerCase() === c.hex.toLowerCase();
                  return (
                    <button
                      key={c.hex}
                      onClick={() => {
                        sound.playColorChime();
                        setBlendMode('tint');
                        onChangeColor(c.hex);
                      }}
                      title={c.label}
                      className={`w-5 h-5 rounded-full border transition-all ${
                        isSelected && blendMode === 'tint'
                          ? 'border-white scale-125 shadow-[0_0_8px_#00a8e1] ring-1 ring-[#00a8e1]'
                          : 'border-white/20 hover:scale-110 opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  );
                })}
              </div>

              {/* Adjust Fit Toggle Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  sound.playClick();
                  setShowFitHUD(prev => !prev);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border backdrop-blur-md transition flex items-center gap-1.5 shadow-lg ${
                  showFitHUD
                    ? 'bg-[#00a8e1] text-slate-950 border-white/20'
                    : 'bg-black/80 text-slate-300 hover:text-white border-slate-800'
                }`}
                title="Adjust garment size & position on body"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Adjust Fit</span>
              </button>
            </div>

            {/* Floating Live Fit HUD Tool */}
            {showFitHUD && (
              <div 
                className="absolute top-12 right-3 z-30 bg-slate-950/92 backdrop-blur-md border border-slate-700/90 rounded-2xl p-3.5 shadow-2xl w-64 text-xs text-white animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800">
                  <span className="font-bold text-[#38bdf8] flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Body Fit Controls</span>
                  </span>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setFitScale(1.05);
                      setFitOffsetY(0);
                      setFitOffsetX(0);
                      setBlendMode('original');
                    }}
                    className="text-[10px] text-slate-400 hover:text-white hover:underline flex items-center gap-1 font-mono"
                    title="Reset to default fit"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>

                {/* Body Pose Mode: Desk vs Standing */}
                <div className="mb-2">
                  <span className="text-[10px] text-slate-400 block mb-1 uppercase font-mono">Your Posture:</span>
                  <div className="grid grid-cols-2 gap-1 font-semibold text-[10px]">
                    <button
                      onClick={() => {
                        sound.playClick();
                        setBodyMode('desk');
                        setFitOffsetY(0);
                        setFitOffsetX(0);
                        setFitScale(1.05);
                      }}
                      className={`py-1.5 rounded-lg text-center transition flex items-center justify-center gap-1 ${
                        bodyMode === 'desk'
                          ? 'bg-[#00a8e1] text-slate-950 font-bold shadow-sm'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      <span>💻 Sitting at Desk</span>
                    </button>
                    <button
                      onClick={() => {
                        sound.playClick();
                        setBodyMode('standing');
                        setFitOffsetY(0);
                        setFitOffsetX(0);
                        setFitScale(0.95);
                      }}
                      className={`py-1.5 rounded-lg text-center transition flex items-center justify-center gap-1 ${
                        bodyMode === 'standing'
                          ? 'bg-[#00a8e1] text-slate-950 font-bold shadow-sm'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      <span>🧍 Standing</span>
                    </button>
                  </div>
                </div>

                {/* Garment Scale */}
                <div className="mb-2">
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1 font-mono">
                    <span>Size Scale:</span>
                    <span className="text-[#38bdf8] font-bold">{Math.round(fitScale * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setFitScale(s => Math.max(0.75, +(s - 0.05).toFixed(2)))}
                      className="w-7 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700 flex items-center justify-center"
                    >
                      -
                    </button>
                    <input
                      type="range"
                      min="0.75"
                      max="1.35"
                      step="0.02"
                      value={fitScale}
                      onChange={(e) => setFitScale(parseFloat(e.target.value))}
                      className="w-full accent-[#00a8e1] h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <button
                      onClick={() => setFitScale(s => Math.min(1.35, +(s + 0.05).toFixed(2)))}
                      className="w-7 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700 flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Position 4-Way Nudge */}
                <div className="mb-2">
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1 font-mono">
                    <span>Nudge:</span>
                    <span className="text-[#38bdf8] font-bold">X:{fitOffsetX} Y:{fitOffsetY}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    <button
                      onClick={() => setFitOffsetX(x => Math.max(-180, x - 15))}
                      className="py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition"
                      title="Nudge Left"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => setFitOffsetX(x => Math.min(180, x + 15))}
                      className="py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition"
                      title="Nudge Right"
                    >
                      →
                    </button>
                    <button
                      onClick={() => setFitOffsetY(y => Math.max(-140, y - 15))}
                      className="py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition"
                      title="Nudge Up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => setFitOffsetY(y => Math.min(140, y + 15))}
                      className="py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition"
                      title="Nudge Down"
                    >
                      ↓
                    </button>
                  </div>
                </div>

                {/* Fabric Realism Mode */}
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block mb-1 uppercase font-mono">Fabric Appearance:</span>
                  <div className="grid grid-cols-2 gap-1 font-semibold text-[10px]">
                    <button
                      onClick={() => {
                        sound.playClick();
                        setBlendMode('original');
                      }}
                      className={`py-1 rounded-lg text-center transition ${
                        blendMode === 'original'
                          ? 'bg-[#00a8e1] text-slate-950 font-bold shadow-sm'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      Real Photo
                    </button>
                    <button
                      onClick={() => {
                        sound.playClick();
                        setBlendMode('tint');
                      }}
                      className={`py-1 rounded-lg text-center transition ${
                        blendMode === 'tint'
                          ? 'bg-[#00a8e1] text-slate-950 font-bold shadow-sm'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      Color Tint
                    </button>
                  </div>
                </div>

                <div className="mt-2 pt-1 border-t border-slate-800/80 text-[9px] text-slate-400 font-mono text-center">
                  💡 Drag on the screen to align clothes directly on your shoulders
                </div>
              </div>
            )}

            {/* Bottom-Center Prominent Shutter Button (Lenskart Snapshot Style) */}
            {!isLocked && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 pointer-events-auto">
                <button
                  onClick={handleManualLock}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#00a8e1] to-[#0284c7] hover:from-[#0094c8] hover:to-[#0284c7] text-slate-950 text-xs sm:text-sm font-black shadow-2xl shadow-[#00a8e1]/50 border border-white/20 transition transform hover:scale-105 active:scale-95"
                >
                  <Camera className="w-4 h-4 fill-current" />
                  <span>Snap My Look</span>
                </button>
              </div>
            )}

            {/* Bottom-Right Subtle Drag Instruction Hint */}
            <div className="absolute bottom-4 right-4 z-10 pointer-events-none hidden md:block">
              <span className="text-[10px] text-slate-400 font-mono bg-black/60 px-2.5 py-1 rounded-full border border-slate-800 backdrop-blur-md">
                👆 Drag on screen to reposition garment
              </span>
            </div>

            {/* Snapshot Saved Overlay Modal */}
            {isLocked && capturedSnapshot && (
              <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 mb-2 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  LOOK CAPTURED!
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Wearing <strong>{outfit.name}</strong> by {outfit.designer}
                </p>

                {/* Snapshot Preview Card */}
                <div className="mt-4 max-w-sm rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
                  <img src={capturedSnapshot} alt="Captured Look" className="w-full h-auto object-cover max-h-[220px]" />
                </div>

                <div className="flex items-center gap-3 mt-5">
                  <button
                    onClick={handleRetake}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2 border border-slate-700"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Try Another Outfit</span>
                  </button>

                  <a
                    href={capturedSnapshot}
                    download={`my-${outfit.id}-look.jpg`}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2 border border-slate-700"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>

                  <button
                    onClick={() => {
                      sound.playClick();
                      onNextPlayerOrVote();
                    }}
                    className="px-5 py-2 rounded-xl bg-[#00a8e1] hover:bg-[#0094c8] text-slate-950 text-xs font-black shadow-lg shadow-[#00a8e1]/30 flex items-center gap-1.5 transition hover:scale-105"
                  >
                    <span>Runway Arena</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =========================================================================
          BOTTOM LENSKART-STYLE SLIDING CLOTHES TRAY (INSTANT 1-TAP WEAR)
         ========================================================================= */}
      <div className="max-w-[1700px] mx-auto w-full z-20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-slate-400">
              Select Outfit to Wear (Tap to Wear on Cam):
            </span>
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-1 text-[10px] font-semibold">
            {(['all', 'male', 'female', 'festive', 'formal'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  sound.playClick();
                  setRailFilter(filter);
                }}
                className={`px-2.5 py-1 rounded-lg capitalize transition ${
                  railFilter === filter
                    ? 'bg-[#00a8e1] text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {filter === 'male' ? "Men's" : filter === 'female' ? "Women's" : filter}
              </button>
            ))}
          </div>
        </div>

        {/* Horizontal Scrollable Clothes Tray */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1 pb-2">
          {filteredRailOutfits.map((item) => {
            const isCurrent = item.id === outfit.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  sound.playHighlight();
                  if (onSelectOutfit) onSelectOutfit(item);
                  onChangeColor(item.defaultColor);
                }}
                className={`flex-none w-44 p-2 rounded-2xl border text-left transition-all duration-200 group ${
                  isCurrent
                    ? 'bg-[#0c1626] border-[#00a8e1] ring-2 ring-[#00a8e1]/40 shadow-lg shadow-[#00a8e1]/20 -translate-y-1'
                    : 'bg-[#0a0f1d] border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                {/* Outfit Thumbnail */}
                <div className="relative aspect-[4/3] w-full rounded-xl bg-slate-950 overflow-hidden mb-2">
                  <img
                    src={item.previewImageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  {isCurrent && (
                    <div className="absolute top-1.5 right-1.5 z-10 px-2 py-0.5 rounded-full bg-[#00a8e1] text-slate-950 font-black text-[9px] flex items-center gap-1 shadow-md">
                      <Check className="w-2.5 h-2.5" />
                      <span>Wearing</span>
                    </div>
                  )}
                  <span className="absolute bottom-1.5 left-1.5 z-10 text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/80 text-amber-300 border border-amber-500/30">
                    {item.retailPrice}
                  </span>
                </div>

                {/* Outfit Name & Designer */}
                <h4 className="text-xs font-bold text-white truncate leading-tight">
                  {item.name}
                </h4>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {item.designer}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
