import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  Rotate3d, 
  Sparkles, 
  Palette,
  Camera,
  Check
} from 'lucide-react';
import { Outfit } from '../types.ts';
import { sound } from '../utils/audio.ts';
import { getTransparentGarmentCanvas } from '../utils/garmentRenderer.ts';

interface GarmentViewer3DProps {
  outfit: Outfit;
  outfitColor: string;
  onChangeColor: (color: string) => void;
  onClose?: () => void;
  onSwitchTo2DFit?: () => void;
}

export const GarmentViewer3D: React.FC<GarmentViewer3DProps> = ({
  outfit,
  outfitColor,
  onChangeColor,
  onSwitchTo2DFit,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [activeViewPreset, setActiveViewPreset] = useState<'front' | 'threeQuarter' | 'side' | 'collar'>('threeQuarter');

  // Three.js instances stored in refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const garmentGroupRef = useRef<THREE.Group | null>(null);
  const animIdRef = useRef<number | null>(null);

  // Prime Video color swatches
  const colorOptions = [
    { label: 'Royal Blue', hex: '#0284c7' },
    { label: 'Crimson Red', hex: '#991b1b' },
    { label: 'Regal Gold', hex: '#eab308' },
    { label: 'Emerald Green', hex: '#064e3b' },
    { label: 'Midnight Black', hex: '#0f172a' },
    { label: 'Imperial Violet', hex: '#7e22ce' },
  ];

  // Initialize Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 900;
    const height = container.clientHeight || 550;

    // 1. Scene & Dark Luxury Fashion Studio
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040810);
    scene.fog = new THREE.FogExp2(0x040810, 0.07);
    sceneRef.current = scene;

    // 2. Camera positioned at eye level
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 1.6, 4.4);
    cameraRef.current = camera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Orbit Controls (centered on mannequin waist/chest)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 2.0;
    controls.maxDistance = 6.5;
    controls.maxPolarAngle = Math.PI / 2 + 0.05;
    controls.target.set(0, 1.45, 0);
    controlsRef.current = controls;

    // 5. Studio Lighting Setup
    // Key Light
    const keyLight = new THREE.DirectionalLight(0xfffaed, 2.4);
    keyLight.position.set(2.5, 4.0, 3.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    // Fill Light
    const fillLight = new THREE.DirectionalLight(0xdbeafe, 1.2);
    fillLight.position.set(-3.0, 2.5, 2.0);
    scene.add(fillLight);

    // Back / Rim Light (Prime Cyan Glow)
    const rimLight = new THREE.DirectionalLight(0x00a8e1, 2.2);
    rimLight.position.set(0, 3.0, -3.0);
    scene.add(rimLight);

    // Ambient Studio Tone
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.3);
    scene.add(ambientLight);

    // 6. Turntable Root Group
    const turntable = new THREE.Group();
    scene.add(turntable);

    // Luxury Circular Stage
    const stageGeo = new THREE.CylinderGeometry(1.5, 1.6, 0.1, 64);
    const stageMat = new THREE.MeshStandardMaterial({
      color: 0x0a0f1d,
      roughness: 0.25,
      metalness: 0.85,
    });
    const stageMesh = new THREE.Mesh(stageGeo, stageMat);
    stageMesh.position.y = 0.05;
    stageMesh.receiveShadow = true;
    turntable.add(stageMesh);

    // Glowing Cyan LED Ring on Stage
    const ringGeo = new THREE.TorusGeometry(1.48, 0.02, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00a8e1 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = 0.105;
    turntable.add(ringMesh);

    // 7. Sculpted Haute Couture 3D Mannequin Body
    const mannequinGroup = new THREE.Group();
    turntable.add(mannequinGroup);

    // Brushed gunmetal stand pole
    const standMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.2,
      metalness: 0.9,
    });
    const poleGeo = new THREE.CylinderGeometry(0.035, 0.035, 2.6, 24);
    const poleMesh = new THREE.Mesh(poleGeo, standMat);
    poleMesh.position.y = 1.3;
    turntable.add(poleMesh);

    // Mannequin Head/Neck Finial
    const finialGeo = new THREE.SphereGeometry(0.08, 24, 24);
    const finialMesh = new THREE.Mesh(finialGeo, standMat);
    finialMesh.position.y = 2.62;
    turntable.add(finialMesh);

    // 3D Velvet Mannequin Bust & Torso Core (True 3D Anatomy)
    const torsoMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.85,
      metalness: 0.1,
    });

    // Neck
    const neckGeo = new THREE.CylinderGeometry(0.14, 0.18, 0.35, 32);
    const neckMesh = new THREE.Mesh(neckGeo, torsoMat);
    neckMesh.position.y = 2.35;
    turntable.add(neckMesh);

    // Chest & Shoulders
    const chestGeo = new THREE.CylinderGeometry(0.42, 0.34, 0.65, 36);
    const chestMesh = new THREE.Mesh(chestGeo, torsoMat);
    chestMesh.position.y = 1.9;
    chestMesh.scale.set(1.15, 1, 0.75); // Natural human oval depth
    turntable.add(chestMesh);

    // Waist & Hips
    const hipsGeo = new THREE.CylinderGeometry(0.33, 0.44, 0.65, 36);
    const hipsMesh = new THREE.Mesh(hipsGeo, torsoMat);
    hipsMesh.position.y = 1.3;
    hipsMesh.scale.set(1.1, 1, 0.72);
    turntable.add(hipsMesh);

    // Garment Group Hook
    const garmentGroup = new THREE.Group();
    turntable.add(garmentGroup);
    garmentGroupRef.current = garmentGroup;

    // Resize Handler
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    const animate = () => {
      animIdRef.current = requestAnimationFrame(animate);

      if (autoRotate && turntable) {
        turntable.rotation.y += 0.007;
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  // Build Real 3D Sculpted Garment on Mannequin
  useEffect(() => {
    const garmentGroup = garmentGroupRef.current;
    if (!garmentGroup) return;

    // Clean previous garment
    while (garmentGroup.children.length > 0) {
      const obj = garmentGroup.children[0];
      garmentGroup.remove(obj);
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    }

    // High-Res Fabric Texture Loader
    const textureLoader = new THREE.TextureLoader();
    const transparentCanvas = getTransparentGarmentCanvas(outfit.previewImageUrl);
    let garmentTexture: THREE.Texture;
    if (transparentCanvas) {
      garmentTexture = new THREE.CanvasTexture(transparentCanvas);
    } else {
      garmentTexture = textureLoader.load(outfit.previewImageUrl || '');
    }
    garmentTexture.colorSpace = THREE.SRGBColorSpace;

    // Fabric Material with Real PBR Physical parameters
    const fabricColor = new THREE.Color(outfitColor || outfit.defaultColor || '#991b1b');
    const fabricMat = new THREE.MeshStandardMaterial({
      map: garmentTexture,
      transparent: true,
      alphaTest: 0.08,
      side: THREE.DoubleSide,
      roughness: 0.45,
      metalness: 0.12,
    });

    const isDress = outfit.renderType === 'lehenga' || outfit.renderType === 'gown' || outfit.renderType === 'anarkali';

    // 1. 3D Front & Back Draped Clothing Shell (Centered directly on mannequin)
    const shellHeight = isDress ? 2.15 : 1.55;
    const shellWidth = 1.15;
    const shellGeo = new THREE.PlaneGeometry(shellWidth, shellHeight, 16, 16);

    // Gently curve plane vertices around mannequin body in 3D
    const pos = shellGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      // Curve edges backward around torso (Z curvature)
      const zCurve = -Math.pow(x / (shellWidth * 0.5), 2) * 0.22;
      pos.setZ(i, zCurve);
    }
    shellGeo.computeVertexNormals();

    const frontMesh = new THREE.Mesh(shellGeo, fabricMat);
    frontMesh.position.set(0, isDress ? 1.35 : 1.62, 0.26); // Sits right on chest and shoulders
    frontMesh.castShadow = true;
    garmentGroup.add(frontMesh);

    // 2. 3D Back Shell
    const backGeo = shellGeo.clone();
    const backMesh = new THREE.Mesh(backGeo, fabricMat);
    backMesh.rotation.y = Math.PI;
    backMesh.position.set(0, isDress ? 1.35 : 1.62, -0.24);
    garmentGroup.add(backMesh);

    // 3. For Lehengas / Gowns: True 3D Flared Skirt Volumetric Mesh
    if (isDress) {
      const skirtGeo = new THREE.CylinderGeometry(0.38, 1.15, 1.45, 36, 1, true);
      const skirtMat = new THREE.MeshStandardMaterial({
        color: fabricColor,
        roughness: 0.5,
        metalness: 0.1,
        side: THREE.DoubleSide,
      });
      const skirtMesh = new THREE.Mesh(skirtGeo, skirtMat);
      skirtMesh.position.set(0, 0.85, 0);
      skirtMesh.castShadow = true;
      garmentGroup.add(skirtMesh);

      // Gold embroidered waistband ring
      const waistRingGeo = new THREE.TorusGeometry(0.39, 0.02, 16, 36);
      const goldMat = new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        metalness: 0.9,
        roughness: 0.2,
      });
      const waistRing = new THREE.Mesh(waistRingGeo, goldMat);
      waistRing.rotation.x = Math.PI / 2;
      waistRing.position.set(0, 1.58, 0);
      garmentGroup.add(waistRing);

    } else {
      // For Jackets / Sherwanis / Bandhgalas: Tailored 3D Sleeves
      const sleeveMat = new THREE.MeshStandardMaterial({
        color: fabricColor,
        roughness: 0.45,
        metalness: 0.12,
      });

      // Left Sleeve
      const lSleeveGeo = new THREE.CylinderGeometry(0.12, 0.09, 0.85, 24);
      const lSleeveMesh = new THREE.Mesh(lSleeveGeo, sleeveMat);
      lSleeveMesh.position.set(-0.55, 1.65, 0);
      lSleeveMesh.rotation.z = 0.25;
      lSleeveMesh.castShadow = true;
      garmentGroup.add(lSleeveMesh);

      // Right Sleeve
      const rSleeveGeo = new THREE.CylinderGeometry(0.12, 0.09, 0.85, 24);
      const rSleeveMesh = new THREE.Mesh(rSleeveGeo, sleeveMat);
      rSleeveMesh.position.set(0.55, 1.65, 0);
      rSleeveMesh.rotation.z = -0.25;
      rSleeveMesh.castShadow = true;
      garmentGroup.add(rSleeveMesh);

      // Gold / Metallic Buttons on front
      const btnGeo = new THREE.SphereGeometry(0.025, 16, 16);
      const btnMat = new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        metalness: 0.95,
        roughness: 0.15,
      });
      for (let i = 0; i < 4; i++) {
        const btn = new THREE.Mesh(btnGeo, btnMat);
        btn.position.set(0, 1.95 - i * 0.18, 0.28);
        garmentGroup.add(btn);
      }
    }

  }, [outfit, outfitColor]);

  // Handle Preset Camera Views
  const applyViewPreset = (preset: 'front' | 'threeQuarter' | 'side' | 'collar') => {
    sound.playClick();
    setActiveViewPreset(preset);
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    if (preset === 'front') {
      camera.position.set(0, 1.6, 4.2);
      controls.target.set(0, 1.5, 0);
    } else if (preset === 'threeQuarter') {
      camera.position.set(2.2, 1.8, 3.4);
      controls.target.set(0, 1.5, 0);
    } else if (preset === 'side') {
      camera.position.set(3.8, 1.5, 0);
      controls.target.set(0, 1.45, 0);
    } else if (preset === 'collar') {
      camera.position.set(0, 2.1, 1.8);
      controls.target.set(0, 2.0, 0);
    }
    controls.update();
  };

  return (
    <div className="relative aspect-[16/9] max-h-[580px] w-full mx-auto rounded-2xl bg-[#040810] overflow-hidden border border-slate-800 shadow-2xl select-none">
      {/* 3D WebGL Canvas Container */}
      <div 
        ref={mountRef} 
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Top Floating Header HUD */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
        <div className="px-3 py-1 rounded-full bg-black/85 backdrop-blur-md border border-slate-700/80 text-white text-xs font-semibold flex items-center gap-2 shadow-lg">
          <Rotate3d className="w-3.5 h-3.5 text-[#00a8e1] animate-spin" style={{ animationDuration: '6s' }} />
          <span className="font-mono text-[11px]">3D MANNEQUIN SHOWROOM</span>
        </div>
        <div className="px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-[#00a8e1]/30 text-white text-[11px] flex items-center gap-1.5 shadow-md">
          <Sparkles className="w-3 h-3 text-[#00a8e1]" />
          <span className="text-[#38bdf8] font-bold truncate max-w-[200px]">{outfit.name}</span>
        </div>
      </div>

      {/* Top Right: Wear On Camera Action Button */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
        {onSwitchTo2DFit && (
          <button
            onClick={() => {
              sound.playClick();
              onSwitchTo2DFit();
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#00a8e1] to-[#0284c7] hover:from-[#0094c8] hover:to-[#0284c7] text-slate-950 text-xs font-black shadow-lg shadow-[#00a8e1]/30 transition transform hover:scale-105 active:scale-95"
            title="Wear this garment directly on your camera body"
          >
            <Camera className="w-3.5 h-3.5 fill-current" />
            <span>Wear on Cam (AR Fit)</span>
          </button>
        )}

        <button
          onClick={() => {
            sound.playClick();
            setAutoRotate(prev => !prev);
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border backdrop-blur-md transition flex items-center gap-1.5 shadow-lg ${
            autoRotate
              ? 'bg-[#00a8e1]/20 text-[#38bdf8] border-[#00a8e1]/40'
              : 'bg-black/80 text-slate-400 hover:text-white border-slate-700'
          }`}
          title="Toggle Turntable Rotation"
        >
          <Rotate3d className="w-3.5 h-3.5" />
          <span>{autoRotate ? 'Rotating' : 'Paused'}</span>
        </button>
      </div>

      {/* Bottom Center: Camera Presets Bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/85 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-2xl shadow-xl">
        <span className="text-[10px] uppercase font-mono text-slate-400 font-bold mr-1">Angle:</span>
        <button
          onClick={() => applyViewPreset('front')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
            activeViewPreset === 'front'
              ? 'bg-[#00a8e1] text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Front
        </button>
        <button
          onClick={() => applyViewPreset('threeQuarter')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
            activeViewPreset === 'threeQuarter'
              ? 'bg-[#00a8e1] text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          3/4 View
        </button>
        <button
          onClick={() => applyViewPreset('side')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
            activeViewPreset === 'side'
              ? 'bg-[#00a8e1] text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Profile
        </button>
        <button
          onClick={() => applyViewPreset('collar')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
            activeViewPreset === 'collar'
              ? 'bg-[#00a8e1] text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Collar Zoom
        </button>
      </div>

      {/* Bottom Right Drag Tip */}
      <div className="absolute bottom-4 right-4 z-20 pointer-events-none hidden md:block">
        <span className="text-[10px] text-slate-400 font-mono bg-black/60 px-2 py-1 rounded-md border border-slate-800">
          Drag mouse to rotate 360° • Scroll to zoom
        </span>
      </div>
    </div>
  );
};
