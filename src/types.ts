export interface GarmentHotspot {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  label: string;
  part: 'jacket' | 'top' | 'sherwani' | 'blazer' | 'dress' | 'vest' | 'trench' | 'biker' | 'kurta' | 'lehenga' | 'gown' | 'anarkali';
}

export interface Outfit {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'unisex';
  category: 'Modern' | 'Festive' | 'Cyberpunk' | 'Formal' | 'Party';
  designer: string;
  description: string;
  defaultColor: string;
  accentColor: string;
  hotspot: GarmentHotspot;
  fabric: string;
  occasion: string;
  renderType: 'sherwani' | 'trench' | 'blazer' | 'biker' | 'vest' | 'kurta' | 'lehenga' | 'gown' | 'anarkali';
  tags: string[];
  retailPrice?: string;
  wornBy: string;
  previewImageUrl?: string;
}

export interface VideoClip {
  id: string;
  title: string;
  tagline: string;
  genre: string;
  synopsis: string;
  actor: string;
  cast: string[];
  director: string;
  releaseYear: number;
  maturityRating: 'U/A 13+' | 'U/A 16+' | 'All Ages';
  matchScore: number; // e.g. 98%
  badges: string[]; // ["4K UHD", "HDR10+", "Dolby Atmos", "X-Ray Fashion"]
  pauseTime: number; // in seconds
  duration: number;
  heroPosterUrl: string;
  backdropTheme: string;
  accentGlow: string;
  outfits: Outfit[];
}

export interface PoseTarget {
  id: string;
  name: string;
  tagline: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Pro';
  idealAngles: {
    leftShoulderElbow: number;
    rightShoulderElbow: number;
    leftElbowWrist: number;
    rightElbowWrist: number;
    shoulderTilt: number;
    torsoRotation: number;
  };
  coachTips: {
    armsDown: string;
    armsWrong: string;
    shouldersWrong: string;
    almostThere: string;
    perfect: string;
  };
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  outfitId: string;
  targetPoseId: string;
  poseScore: number;
  snapshotUrl?: string;
  votes: number;
  badge?: string;
}

export interface Keypoint {
  name: string;
  x: number;
  y: number;
  confidence: number;
}

export interface PoseFeedback {
  score: number;
  tip: string;
  isReadyToLock: boolean;
  holdProgress: number;
  detectedAngles: {
    leftArm: number;
    rightArm: number;
    shoulderTilt: number;
  };
}

export interface AICritique {
  title: string;
  critique: string;
  rating: string;
  styleAward: string;
}

export type ViewMode = 'tv' | 'phone' | 'split';
export type AppStage = 'home' | 'watch' | 'mirror' | 'wardrobe' | 'show' | 'vote' | 'winner';
