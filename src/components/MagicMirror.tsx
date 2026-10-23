import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  RotateCcw, 
  Sparkles, 
  Mic, 
  CheckCircle2, 
  Flame, 
  Volume2, 
  ChevronRight, 
  Palette, 
  Layers, 
  User, 
  Sliders, 
  ArrowLeft,
  ArrowRight,
  Eye,
  Info,
  Check,
  Rotate3d
} from 'lucide-react';
import { POSE_TARGETS } from '../data/poses.ts';
import { ALL_WARDROBE_OUTFITS } from '../data/clips.ts';
import { Keypoint, Outfit, Player, PoseFeedback, PoseTarget } from '../types.ts';
import { sound } from '../utils/audio.ts';
import { computeGarmentTransform, drawGarmentOnCanvas, GarmentFitOptions } from '../utils/garmentRenderer.ts';
import { evaluatePose, getSimulatedKeypoints } from '../utils/poseTracker.ts';
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
  totalPlayers,
  onOpenVoice,
}) => {
  const [currentTarget, setCurrentTarget] = useState<PoseTarget>(
    POSE_TARGETS.find(p => p.id === activePlayer.targetPoseId) || POSE_TARGETS[0]
  );

  // 2D Live Fit vs 3D Turntable View
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

  const [useRealCamera, setUseRealCamera] = useState<boolean>(true);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Interactive Real Clothes Fit Controls (Scale, Position, Width, Fabric Style)
  const [fitScale, setFitScale] = useState<number>(1.0);
  const [fitOffsetY, setFitOffsetY] = useState<number>(0);
  const [fitStretchX, setFitStretchX] = useState<number>(1.0);
  const [blendMode, setBlendMode] = useState<'original' | 'tint' | 'vivid'>('original');
  const [showFitHUD, setShowFitHUD] = useState<boolean>(true);

  // Quick wear rail filter tab for Men / Women / All
  const [railGenderFilter, setRailGenderFilter] = useState<'all' | 'male' | 'female'>('all');

  // Simulation parameters for testing without standing
  const [simArmSway, setSimArmSway] = useState<number>(0);
  const [simShoulderTilt, setSimShoulderTilt] = useState<number>(0);
  const [autoSway, setAutoSway] = useState<boolean>(true);

  // Pose evaluation & countdown hold state
  const [feedback, setFeedback] = useState<PoseFeedback>({
    score: 0,
    tip: 'Step into the camera view to align your pose',
    isReadyToLock: false,
    holdProgress: 0,
    detectedAngles: { leftArm: 0, rightArm: 0, shoulderTilt: 0 },
  });

  const [holdMs, setHoldMs] = useState<number>(0);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [capturedSnapshot, setCapturedSnapshot] = useState<string | null>(null);
  const [flashActive, setFlashActive] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const holdStartTimeRef = useRef<number | null>(null);

  // Prime Video color swatches
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
            setCameraError(null);
          };
        }
      } catch (err: any) {
        console.warn('Webcam fallback to simulation:', err);
        setCameraError('Webcam not accessible. Pose Simulator enabled!');
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

  // Main rendering loop for Magic Mirror
  useEffect(() => {
    let lastTickTime = 0;

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
        // High quality simulated studio mirror backdrop
        ctx.fillStyle = '#060a12';
        ctx.fillRect(0, 0, w, h);

        // Stage spotlight with Prime cyan ambient tone
        const spot = ctx.createRadialGradient(w / 2, h * 0.45, 80, w / 2, h * 0.45, w * 0.65);
        spot.addColorStop(0, 'rgba(15, 30, 55, 0.95)');
        spot.addColorStop(0.7, 'rgba(8, 14, 25, 0.95)');
        spot.addColorStop(1, '#04070e');
        ctx.fillStyle = spot;
        ctx.fillRect(0, 0, w, h);

        // Floor reflection grid
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
      let variation = { armSway: simArmSway, shoulderTilt: simShoulderTilt, postureDrift: 0 };
      if (autoSway && !isLocked) {
        const t = time * 0.002;
        variation.armSway = Math.sin(t) * 0.15;
        variation.shoulderTilt = Math.cos(t * 0.8) * 0.1;
      }

      const keypoints = getSimulatedKeypoints(currentTarget, variation);

      // 3. Draw subtle alignment guides (minimalist corners, keeping camera feed 100% clear)
      if (!isLocked) {
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 168, 225, 0.35)';
        ctx.lineWidth = 2.5;

        // Subtle target corner brackets
        const marginX = w * 0.18;
        const marginY = h * 0.08;
        const cornerLen = 30;

        // Top-left
        ctx.beginPath();
        ctx.moveTo(marginX, marginY + cornerLen);
        ctx.lineTo(marginX, marginY);
        ctx.lineTo(marginX + cornerLen, marginY);
        ctx.stroke();

        // Top-right
        ctx.beginPath();
        ctx.moveTo(w - marginX - cornerLen, marginY);
        ctx.lineTo(w - marginX, marginY);
        ctx.lineTo(w - marginX, marginY + cornerLen);
        ctx.stroke();

        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(marginX, h - marginY - cornerLen);
        ctx.lineTo(marginX, h - marginY);
        ctx.lineTo(marginX + cornerLen, h - marginY);
        ctx.stroke();

        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(w - marginX - cornerLen, h - marginY);
        ctx.lineTo(w - marginX, h - marginY);
        ctx.lineTo(w - marginX, h - marginY - cornerLen);
        ctx.stroke();

        ctx.restore();
      }

      // 4. Warp & Draw 2D Real Garment Overlay on Body (Zero cartoon graphics, pure photo overlay)
      const fitOptions: GarmentFitOptions = {
        scale: fitScale,
        offsetY: fitOffsetY,
        stretchX: fitStretchX,
        blendMode: blendMode,
        opacity: 0.98,
      };
      const garmentTransform = computeGarmentTransform(keypoints, w, h, outfit.renderType, fitOptions);
      if (garmentTransform) {
        drawGarmentOnCanvas(ctx, garmentTransform, outfit, outfitColor, fitOptions);
      }

      // 5. Evaluate pose accuracy for real-time coach feedback
      // Auto-capture is explicitly disabled per user request: user controls shutter manually
      if (!isLocked) {
        const evalResult = evaluatePose(keypoints, currentTarget, 0, 2000);
        setFeedback(evalResult);
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
    currentTarget,
    outfit,
    outfitColor,
    cameraActive,
    simArmSway,
    simShoulderTilt,
    autoSway,
    isLocked,
    holdMs,
    fitScale,
    fitOffsetY,
    fitStretchX,
    blendMode,
  ]);

  const handleRetake = () => {
    sound.playClick();
    setIsLocked(false);
    setCapturedSnapshot(null);
    setHoldMs(0);
    holdStartTimeRef.current = null;
  };

  const handleManualLock = () => {
    sound.playShutter();
    setIsLocked(true);
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 300);

    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setCapturedSnapshot(dataUrl);
      onSnapshotCaptured(activePlayerIndex, dataUrl, Math.max(90, feedback.score));
    }
  };

  const filteredRailOutfits = ALL_WARDROBE_OUTFITS.filter(item => {
    if (railGenderFilter === 'all') return true;
    return item.gender === railGenderFilter;
  });

  return (
    <div className="relative w-full min-h-[calc(100vh-65px)] bg-[#040810] flex flex-col p-3 sm:p-6 select-none overflow-x-hidden">
      <video ref={videoRef} className="hidden" playsInline muted autoPlay />

      {/* Screen Camera Flash */}
      {flashActive && (
        <div className="fixed inset-0 z-50 bg-white pointer-events-none transition-opacity duration-300 animate-out fade-out" />
      )}

      {/* Top Header Controls Bar */}
      <div className="max-w-[1700px] mx-auto w-full flex items-center justify-between mb-4 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sound.playClick();
              onBackToWatch();
            }}
            className="p-2 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Back to Scene"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-white">
                Live Magic Mirror
              </h1>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#00a8e1]/15 text-[#38bdf8] border border-[#00a8e1]/30">
                Player {activePlayerIndex + 1} of {totalPlayers}: {activePlayer.name}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live AR garment try-on with real-time pose tracking &amp; camera overlay
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* 2D AR Fit vs 3D 360° Studio View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-inner">
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
              <span>2D AR Fit</span>
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
              <span>3D 360° View</span>
            </button>
          </div>

          {/* Camera On / Off Button (for 2D mode) */}
          {viewMode === '2d' && (
            <button
              onClick={() => {
                sound.playClick();
                setUseRealCamera(prev => !prev);
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-xs font-bold transition shadow-sm ${
                cameraActive
                  ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : 'bg-slate-900 border-[#00a8e1]/60 text-[#38bdf8] hover:bg-slate-800'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>{cameraActive ? '● Camera Active' : 'Turn On Camera'}</span>
            </button>
          )}

          {/* Quick Snap Shutter Button (Top-Right) */}
          {!isLocked && (
            <button
              onClick={handleManualLock}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#00a8e1] hover:bg-[#0094c8] text-slate-950 text-xs font-black shadow-md shadow-[#00a8e1]/20 transition transform hover:scale-105"
            >
              <Camera className="w-3.5 h-3.5 fill-current" />
              <span>Capture Photo</span>
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          STAGE 1: THE MAGIC MIRROR (2D AR FIT OR 3D 360° STUDIO VIEW)
         ========================================================================= */}
      <div className="max-w-[1700px] mx-auto w-full mb-6">
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
          <div className="relative aspect-[16/9] max-h-[580px] w-full mx-auto rounded-2xl bg-black overflow-hidden border border-slate-800 shadow-2xl">
            <canvas
              ref={canvasRef}
              width={1280}
              height={720}
              className="w-full h-full object-cover"
            />

            {/* Minimal Live Status Tag & Real Garment Indicator (Top-Left) */}
            <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 pointer-events-none">
              <div className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-slate-700/80 text-white text-xs font-semibold flex items-center gap-2 shadow-lg">
                <span className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-emerald-400 animate-pulse' : 'bg-[#00a8e1]'}`} />
                <span className="font-mono text-[11px]">
                  {cameraActive ? 'LIVE CAMERA AR FIT' : 'STUDIO MIRROR SIMULATOR'}
                </span>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-[#00a8e1]/30 text-white text-[11px] flex items-center gap-1.5 shadow-md">
                <Sparkles className="w-3 h-3 text-[#00a8e1]" />
                <span className="text-[#38bdf8] font-bold">Real Fabric:</span>
                <span className="text-slate-200 truncate max-w-[200px]">{outfit.name}</span>
              </div>
            </div>

            {/* Pose Match & Fit Toolbar (Top-Right) */}
            <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
              <div className="px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-slate-700/80 text-xs font-mono font-bold flex items-center gap-2 shadow-lg">
                <span className="text-slate-400">Match:</span>
                <span className={feedback.score >= 80 ? 'text-emerald-400' : 'text-amber-400'}>
                  {feedback.score}%
                </span>
              </div>

              <button
                onClick={() => {
                  sound.playClick();
                  setShowFitHUD(prev => !prev);
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md transition flex items-center gap-1.5 shadow-lg ${
                  showFitHUD
                    ? 'bg-[#00a8e1] text-slate-950 border-white/20'
                    : 'bg-black/75 text-slate-300 hover:text-white border-slate-700'
                }`}
                title="Adjust garment size & position on body"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Adjust Fit</span>
              </button>
            </div>

            {/* Floating Live Fit HUD Tool */}
            {showFitHUD && (
              <div className="absolute top-12 right-3 z-30 bg-slate-950/92 backdrop-blur-md border border-slate-700/90 rounded-2xl p-3.5 shadow-2xl w-64 text-xs text-white animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-slate-800">
                  <span className="font-bold text-[#38bdf8] flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Real Garment Fit</span>
                  </span>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setFitScale(1.0);
                      setFitOffsetY(0);
                      setFitStretchX(1.0);
                      setBlendMode('original');
                    }}
                    className="text-[10px] text-slate-400 hover:text-white hover:underline flex items-center gap-1 font-mono"
                    title="Reset to default fit"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>

                {/* Garment Scale */}
                <div className="mb-2.5">
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1 font-mono">
                    <span>Fit Size:</span>
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

                {/* Vertical Position */}
                <div className="mb-2.5">
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1 font-mono">
                    <span>Height:</span>
                    <span className="text-[#38bdf8] font-bold">{fitOffsetY > 0 ? `+${fitOffsetY}px` : `${fitOffsetY}px`}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => setFitOffsetY(y => Math.max(-80, y - 10))}
                      className="py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-[11px] border border-slate-700 transition"
                    >
                      ↑ Move Up
                    </button>
                    <button
                      onClick={() => setFitOffsetY(y => Math.min(80, y + 10))}
                      className="py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-[11px] border border-slate-700 transition"
                    >
                      ↓ Move Down
                    </button>
                  </div>
                </div>

                {/* Fabric Realism Mode */}
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block mb-1 uppercase font-mono">Fabric Realism:</span>
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
              </div>
            )}

            {/* Center-Bottom Prominent Shutter Button (Manual Capture Only) */}
            {!isLocked && (
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
                <button
                  onClick={handleManualLock}
                  className="flex items-center gap-2.5 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#00a8e1] via-[#0284c7] to-[#38bdf8] hover:from-[#0094c8] hover:to-[#0284c7] text-slate-950 text-xs sm:text-sm font-black shadow-2xl shadow-[#00a8e1]/40 border border-white/20 transition transform hover:scale-105 active:scale-95"
                >
                  <Camera className="w-4 h-4 fill-current" />
                  <span>Take Snapshot &amp; Lock Look</span>
                  {feedback.score > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-950/40 text-white font-mono text-xs">
                      {feedback.score}%
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* Snapshot Locked Screen */}
            {isLocked && (
              <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
                <div className="w-16 h-16 rounded-full bg-[#00a8e1]/20 border-2 border-[#00a8e1] flex items-center justify-center text-[#00a8e1] mb-3 shadow-[0_0_20px_#00a8e1]">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  SHOT LOCKED! {activePlayer.name.toUpperCase()} NAILED THE LOOK!
                </h3>
                <p className="text-sm text-slate-300 mt-1 max-w-md">
                  Accuracy Score: <strong className="text-amber-400">{feedback.score}%</strong> on {currentTarget.name}!
                </p>

                <div className="flex items-center gap-3 mt-6">
                  <button
                    onClick={handleRetake}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2 border border-slate-700"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Retake Pose</span>
                  </button>

                  <button
                    onClick={() => {
                      sound.playClick();
                      onNextPlayerOrVote();
                    }}
                    className="px-6 py-3 rounded-xl bg-[#00a8e1] hover:bg-[#0094c8] text-slate-950 text-sm font-black shadow-xl shadow-[#00a8e1]/30 flex items-center gap-2 transition hover:scale-105"
                  >
                    <span>
                      {activePlayerIndex < totalPlayers - 1 
                        ? 'Pass Phone to Next Player' 
                        : 'Proceed to Family Runway Vote!'}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =========================================================================
          STAGE 2: DEDICATED DETAILS SECTION BELOW THE CAMERA 
          ("jb cam on hota h toh us jaga ki details niche ek section bna vha show kro")
         ========================================================================= */}
      <div className="max-w-[1700px] mx-auto w-full">
        {/* Section Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#00a8e1]" />
            <h2 className="text-sm font-mono uppercase font-black tracking-widest text-[#38bdf8]">
              Look Details &amp; Runway Styling Console
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {cameraActive ? '✓ Camera Active & Tracking Body' : '● Camera Ready'}
          </span>
        </div>

        {/* Console Grid: 4 Dedicated Interactive Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* CARD 1: LIVE GARMENT DETAILS & PHOTO */}
          <div className="p-4 rounded-2xl bg-[#0a101d] border border-slate-800/90 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">
                  Current Garment on Body
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#00a8e1]/20 text-[#38bdf8] border border-[#00a8e1]/30">
                  {outfit.gender === 'female' ? "Women's" : "Men's"}
                </span>
              </div>

              {/* Garment Image & Name */}
              <div className="flex items-center gap-3">
                {outfit.previewImageUrl ? (
                  <img
                    src={outfit.previewImageUrl}
                    alt={outfit.name}
                    className="w-16 h-16 rounded-xl object-cover flex-none border border-slate-700 shadow-md"
                  />
                ) : (
                  <div 
                    className="w-16 h-16 rounded-xl flex-none border border-white/20 shadow-md"
                    style={{ backgroundColor: outfitColor }}
                  />
                )}
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate leading-snug">
                    {outfit.name}
                  </h3>
                  <p className="text-xs text-[#38bdf8] truncate font-medium">
                    by {outfit.designer}
                  </p>
                  <span className="text-xs font-black text-amber-400 font-mono block mt-0.5">
                    {outfit.retailPrice}
                  </span>
                </div>
              </div>

              {/* Specs */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-[11px]">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">Fabric</span>
                  <span className="text-slate-200 font-medium truncate block">{outfit.fabric}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">Occasion</span>
                  <span className="text-slate-200 font-medium truncate block">{outfit.occasion}</span>
                </div>
              </div>

              {/* Real Photo Quality Indicator */}
              <div className="mt-3 p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-emerald-300 font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-400 flex-none" />
                  <span>Real Catalog Photo Overlay</span>
                </div>
                <button
                  onClick={() => {
                    sound.playClick();
                    setBlendMode(b => b === 'original' ? 'tint' : 'original');
                  }}
                  className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30 transition border border-emerald-500/30"
                >
                  {blendMode === 'original' ? 'Original Colors' : 'Tint Active'}
                </button>
              </div>
            </div>

            {/* Garment Color Swatches */}
            <div className="mt-4 pt-3 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                  {blendMode === 'original' ? 'Apply Color Tint' : 'Selected Tint'}
                </span>
                <button
                  onClick={onOpenVoice}
                  className="text-[10px] text-[#38bdf8] hover:underline flex items-center gap-1 font-mono"
                >
                  <Mic className="w-3 h-3 text-[#00a8e1]" />
                  <span>Voice</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                {colorOptions.map((c) => {
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
                      className={`w-7 h-7 rounded-full border transition-all ${
                        isSelected && blendMode === 'tint'
                          ? 'border-white scale-125 shadow-[0_0_10px_#00a8e1] ring-2 ring-[#00a8e1]'
                          : 'border-white/20 hover:scale-110 opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* CARD 2: REAL-TIME POSE COACH & ACCURACY SCORE */}
          <div className="p-4 rounded-2xl bg-[#0a101d] border border-slate-800/90 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">
                  AI Pose Coach &amp; Score
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Target: {currentTarget.difficulty}
                </span>
              </div>

              {/* Big Score Gauge */}
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 flex-none rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center shadow-lg">
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="8" />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={feedback.isReadyToLock ? '#eab308' : '#00a8e1'}
                      strokeWidth="8"
                      strokeDasharray="251"
                      strokeDashoffset={251 - (251 * feedback.score) / 100}
                      strokeLinecap="round"
                      className="transition-all duration-200"
                    />
                  </svg>
                  <div className="text-center">
                    <span className="text-xl font-black font-mono text-white leading-none">
                      {feedback.score}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 block uppercase font-mono">
                      %
                    </span>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-white block">
                    {currentTarget.name}
                  </span>
                  <p className="text-[11px] text-[#38bdf8] font-medium leading-snug mt-1">
                    {feedback.tip}
                  </p>
                </div>
              </div>
            </div>

            {/* Manual Shutter Shutter Trigger Button */}
            <div className="mt-4 pt-3 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-2">
                <span>Shutter Status</span>
                <span className={feedback.score >= 70 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                  {feedback.score >= 70 ? 'Pose Aligned! Ready' : 'Align Pose'}
                </span>
              </div>
              <button
                onClick={handleManualLock}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-[#00a8e1] hover:text-slate-950 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-2 border border-slate-700 shadow-sm"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Snap Pose Now ({feedback.score}%)</span>
              </button>
            </div>
          </div>

          {/* CARD 3: QUICK WEAR WARDROBE RAIL (MEN & WOMEN) */}
          <div className="p-4 rounded-2xl bg-[#0a101d] border border-slate-800/90 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">
                  Switch Clothes (Wear on Cam)
                </span>
                {/* Male / Female / All filter */}
                <div className="flex items-center gap-1 text-[9px] font-bold">
                  <button
                    onClick={() => setRailGenderFilter('all')}
                    className={`px-1.5 py-0.5 rounded transition ${
                      railGenderFilter === 'all' ? 'bg-[#00a8e1] text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setRailGenderFilter('male')}
                    className={`px-1.5 py-0.5 rounded transition ${
                      railGenderFilter === 'male' ? 'bg-[#00a8e1] text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Men
                  </button>
                  <button
                    onClick={() => setRailGenderFilter('female')}
                    className={`px-1.5 py-0.5 rounded transition ${
                      railGenderFilter === 'female' ? 'bg-[#00a8e1] text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Women
                  </button>
                </div>
              </div>

              {/* Scrollable Clothes List with Real Photos */}
              <div className="space-y-1.5 max-h-[155px] overflow-y-auto no-scrollbar pr-1">
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
                      className={`w-full p-1.5 rounded-xl border flex items-center justify-between text-left transition ${
                        isCurrent
                          ? 'bg-[#00a8e1]/15 border-[#00a8e1] text-white shadow-sm'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {item.previewImageUrl ? (
                          <img
                            src={item.previewImageUrl}
                            alt={item.name}
                            className="w-8 h-8 rounded-lg object-cover flex-none border border-slate-700"
                          />
                        ) : (
                          <span
                            className="w-8 h-8 rounded-lg flex-none border border-white/20"
                            style={{ backgroundColor: item.defaultColor }}
                          />
                        )}
                        <div className="min-w-0">
                          <span className="text-xs font-semibold truncate block">
                            {item.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.gender === 'female' ? 'Women' : 'Men'} • {item.category}
                          </span>
                        </div>
                      </div>
                      {isCurrent && (
                        <span className="text-[10px] bg-[#00a8e1] text-slate-950 font-bold px-1.5 py-0.5 rounded">
                          Wearing
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-800/80">
              <span className="text-[10px] text-slate-400 block text-center font-mono">
                Click any outfit to instantly wear it on your camera!
              </span>
            </div>
          </div>

          {/* CARD 4: TARGET POSE & RUNWAY PASS */}
          <div className="p-4 rounded-2xl bg-[#0a101d] border border-slate-800/90 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">
                  Target Pose Selection
                </span>
                <span className="text-[10px] text-[#38bdf8] font-mono font-bold">
                  {POSE_TARGETS.length} Guides
                </span>
              </div>

              {/* Pose Choices */}
              <div className="space-y-1.5 max-h-[145px] overflow-y-auto no-scrollbar">
                {POSE_TARGETS.map((p) => {
                  const isSelected = p.id === currentTarget.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        sound.playClick();
                        setCurrentTarget(p);
                      }}
                      className={`w-full p-2 rounded-xl text-xs font-semibold text-left border transition ${
                        isSelected
                          ? 'bg-[#00a8e1]/15 border-[#00a8e1] text-[#38bdf8]'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{p.name}</span>
                        <span className="text-[10px] font-mono opacity-70">{p.difficulty}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Button: Next Player or Vote */}
            <div className="mt-3 pt-3 border-t border-slate-800/80">
              <button
                onClick={() => {
                  sound.playClick();
                  onNextPlayerOrVote();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#00a8e1] hover:bg-[#0094c8] text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-[#00a8e1]/25 flex items-center justify-center gap-1.5 transition hover:scale-[1.02]"
              >
                <span>
                  {activePlayerIndex < totalPlayers - 1 ? 'Next Family Member' : 'Runway Vote Arena'}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
