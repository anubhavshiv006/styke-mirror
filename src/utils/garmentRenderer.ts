import { Keypoint, Outfit } from '../types.ts';
import { ALL_WARDROBE_OUTFITS } from '../data/clips.ts';

export interface GarmentFitOptions {
  scale?: number;        // e.g. 0.8 - 1.4, default 1.0
  offsetY?: number;      // e.g. -80 to +80 px, default 0
  offsetX?: number;      // e.g. -100 to +100 px, default 0
  stretchX?: number;     // e.g. 0.8 - 1.3, default 1.0
  blendMode?: 'original' | 'tint' | 'vivid';
  opacity?: number;      // 0.7 - 1.0, default 0.98
}

export interface GarmentTransform {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  rotation: number; // in radians
  leftElbow?: { x: number; y: number };
  rightElbow?: { x: number; y: number };
}

// Global Image Cache for realistic outfit photos
const garmentImageCache = new Map<string, HTMLImageElement>();
// Global Cache of isolated transparent cutouts (white background completely removed via flood-fill)
const transparentCutoutCache = new Map<string, HTMLCanvasElement>();

/**
 * Strips out the solid studio background from the isolated garment photo using BFS Flood Fill.
 * Starts from all 4 borders inward so JPEG noise, compression artifacts, and rectangular borders
 * are 100% completely eliminated, leaving ONLY the pure apparel silhouette (like Lenskart).
 */
export function getTransparentGarmentCanvas(url?: string): HTMLCanvasElement | null {
  if (!url) return null;
  const cached = transparentCutoutCache.get(url);
  if (cached) return cached;

  const img = getGarmentImage(url);
  if (!img || !img.complete || img.naturalWidth === 0) return null;

  try {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(img, 0, 0);
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    // Fast BFS Flood-Fill from all 4 borders to remove the studio white background
    const visited = new Uint8Array(w * h);
    const queue: number[] = [];

    // Push all border pixels to queue
    for (let x = 0; x < w; x++) {
      queue.push(x, 0);
      queue.push(x, h - 1);
      visited[x] = 1;
      visited[(h - 1) * w + x] = 1;
    }
    for (let y = 1; y < h - 1; y++) {
      queue.push(0, y);
      queue.push(w - 1, y);
      visited[y * w] = 1;
      visited[y * w + (w - 1)] = 1;
    }

    let head = 0;
    while (head < queue.length) {
      const px = queue[head++];
      const py = queue[head++];
      const idx = (py * w + px) * 4;

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const brightness = (r + g + b) / 3;

      // Studio background is white / light neutral (threshold 195 catches JPG edge noise)
      if (brightness > 190) {
        data[idx + 3] = 0; // Pure transparent

        // Check 4 neighbors
        const neighbors = [
          [px + 1, py],
          [px - 1, py],
          [px, py + 1],
          [px, py - 1],
        ];

        for (let i = 0; i < 4; i++) {
          const nx = neighbors[i][0];
          const ny = neighbors[i][1];
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            const vIdx = ny * w + nx;
            if (!visited[vIdx]) {
              visited[vIdx] = 1;
              queue.push(nx, ny);
            }
          }
        }
      }
    }

    // Also remove white space inside the neck collar notch
    // Sample top center (around x = w * 0.5, y from 0.04*h to 0.25*h)
    const neckStartX = Math.floor(w * 0.5);
    const neckStartY = Math.floor(h * 0.12);
    const neckQueue: number[] = [neckStartX, neckStartY];
    while (neckQueue.length > 0) {
      const py = neckQueue.pop()!;
      const px = neckQueue.pop()!;
      const vIdx = py * w + px;
      if (visited[vIdx]) continue;
      visited[vIdx] = 1;

      const idx = vIdx * 4;
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      if (brightness > 195) {
        data[idx + 3] = 0;
        if (px + 1 < w) neckQueue.push(px + 1, py);
        if (px - 1 >= 0) neckQueue.push(px - 1, py);
        if (py + 1 < Math.floor(h * 0.38)) neckQueue.push(px, py + 1);
        if (py - 1 >= 0) neckQueue.push(px, py - 1);
      }
    }

    ctx.putImageData(imgData, 0, 0);
    transparentCutoutCache.set(url, canvas);
    return canvas;
  } catch (e) {
    console.warn('Cutout transparency generation failed:', e);
    return null;
  }
}

// Auto-preload all outfits from wardrobe so they are immediately available with zero delay
if (typeof window !== 'undefined') {
  ALL_WARDROBE_OUTFITS.forEach((o) => {
    if (o.previewImageUrl && !garmentImageCache.has(o.previewImageUrl)) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        getTransparentGarmentCanvas(o.previewImageUrl);
      };
      img.src = o.previewImageUrl;
      garmentImageCache.set(o.previewImageUrl, img);
    }
  });
}

export function getGarmentImage(url?: string): HTMLImageElement | null {
  if (!url) return null;
  const cached = garmentImageCache.get(url);
  if (cached) {
    return cached.complete && cached.naturalWidth > 0 ? cached : null;
  }
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    getTransparentGarmentCanvas(url);
  };
  img.src = url;
  garmentImageCache.set(url, img);
  return null;
}

export function computeGarmentTransform(
  keypoints: Record<string, Keypoint>,
  canvasWidth: number,
  canvasHeight: number,
  garmentType: string,
  fitOptions?: GarmentFitOptions
): GarmentTransform | null {
  const leftShoulder = keypoints['left_shoulder'];
  const rightShoulder = keypoints['right_shoulder'];
  const leftHip = keypoints['left_hip'];
  const rightHip = keypoints['right_hip'];

  if (!leftShoulder || !rightShoulder) {
    return null;
  }

  // Pixel coordinates
  const lsX = leftShoulder.x * canvasWidth;
  const lsY = leftShoulder.y * canvasHeight;
  const rsX = rightShoulder.x * canvasWidth;
  const rsY = rightShoulder.y * canvasHeight;

  // Center between shoulders
  const shoulderMidX = (lsX + rsX) / 2;
  const shoulderMidY = (lsY + rsY) / 2;

  // Shoulder distance & angle
  const dx = rsX - lsX;
  const dy = rsY - lsY;
  const shoulderDist = Math.sqrt(dx * dx + dy * dy);
  const rotation = Math.atan2(dy, dx);

  // Compute torso height if hips exist, else derive from shoulder distance
  let torsoHeight = shoulderDist * 1.5;
  if (leftHip && rightHip) {
    const hipMidX = ((leftHip.x + rightHip.x) / 2) * canvasWidth;
    const hipMidY = ((leftHip.y + rightHip.y) / 2) * canvasHeight;
    const hdx = hipMidX - shoulderMidX;
    const hdy = hipMidY - shoulderMidY;
    const measuredTorso = Math.sqrt(hdx * hdx + hdy * hdy);
    if (measuredTorso > 50) {
      torsoHeight = measuredTorso * (
        garmentType === 'lehenga' || garmentType === 'gown' || garmentType === 'anarkali'
          ? 1.75
          : 1.25
      );
    }
  }

  // Multipliers for realistic clothing proportions
  let widthMultiplier = 2.1;
  let heightMultiplier = 1.55;
  let yOffset = torsoHeight * 0.42;

  if (garmentType === 'lehenga' || garmentType === 'gown' || garmentType === 'anarkali') {
    widthMultiplier = 2.35;
    heightMultiplier = 2.2;
    yOffset = torsoHeight * 0.65;
  } else if (garmentType === 'sherwani' || garmentType === 'kurta') {
    widthMultiplier = 2.15;
    heightMultiplier = 1.95;
    yOffset = torsoHeight * 0.55;
  } else if (garmentType === 'trench') {
    widthMultiplier = 2.2;
    heightMultiplier = 1.85;
    yOffset = torsoHeight * 0.52;
  } else if (garmentType === 'vest' || garmentType === 'biker') {
    widthMultiplier = 2.05;
    heightMultiplier = 1.35;
    yOffset = torsoHeight * 0.38;
  }

  // User Interactive Fit Adjustments
  const userScale = fitOptions?.scale ?? 1.0;
  const userStretchX = fitOptions?.stretchX ?? 1.0;
  const userOffsetY = fitOptions?.offsetY ?? 0;
  const userOffsetX = fitOptions?.offsetX ?? 0;

  const leftElbow = keypoints['left_elbow'] ? {
    x: keypoints['left_elbow'].x * canvasWidth,
    y: keypoints['left_elbow'].y * canvasHeight,
  } : undefined;

  const rightElbow = keypoints['right_elbow'] ? {
    x: keypoints['right_elbow'].x * canvasWidth,
    y: keypoints['right_elbow'].y * canvasHeight,
  } : undefined;

  return {
    centerX: shoulderMidX + userOffsetX,
    centerY: shoulderMidY + yOffset + userOffsetY,
    width: Math.max(shoulderDist * widthMultiplier * userScale * userStretchX, 140),
    height: Math.max(torsoHeight * heightMultiplier * userScale, 180),
    rotation,
    leftElbow,
    rightElbow,
  };
}

/**
 * Draws the genuine transparent clothing cutout directly onto the user's body.
 * ZERO background, ZERO trees, ZERO outdoor scene, ZERO rectangular shadow boxes.
 * Operates exactly like Lenskart: ONLY the isolated garment is overlaid on the user.
 */
export function drawGarmentOnCanvas(
  ctx: CanvasRenderingContext2D,
  transform: GarmentTransform,
  outfit: Outfit,
  color: string,
  fitOptions?: GarmentFitOptions
) {
  ctx.save();
  ctx.translate(transform.centerX, transform.centerY);
  ctx.rotate(transform.rotation);

  const w = transform.width;
  const h = transform.height;
  const halfW = w / 2;
  const halfH = h / 2;

  // IMPORTANT: Keep shadowColor transparent to prevent ANY rectangular bounding box artifact!
  ctx.shadowColor = 'transparent';

  // 2. Fetch Isolated Transparent Cutout (Clean Alpha Mask)
  const cutoutCanvas = getTransparentGarmentCanvas(outfit.previewImageUrl);
  const fallbackImg = getGarmentImage(outfit.previewImageUrl);
  const source = cutoutCanvas || fallbackImg;
  const opacity = fitOptions?.opacity ?? 0.98;
  const blendMode = fitOptions?.blendMode ?? 'original';

  if (source) {
    ctx.save();
    ctx.globalAlpha = opacity;

    // Draw the genuine isolated garment directly on the user's torso
    ctx.drawImage(source, -halfW, -halfH, w, h);

    // Realistic Fabric Lighting (Subtle highlight across chest, shadow on sides)
    ctx.globalCompositeOperation = 'source-atop'; // Restrict strictly to garment pixels!

    const fabricLighting = ctx.createLinearGradient(-halfW, 0, halfW, 0);
    fabricLighting.addColorStop(0, 'rgba(0, 0, 0, 0.22)');
    fabricLighting.addColorStop(0.2, 'rgba(0, 0, 0, 0)');
    fabricLighting.addColorStop(0.5, 'rgba(255, 255, 255, 0.12)');
    fabricLighting.addColorStop(0.8, 'rgba(0, 0, 0, 0)');
    fabricLighting.addColorStop(1, 'rgba(0, 0, 0, 0.22)');
    ctx.fillStyle = fabricLighting;
    ctx.fillRect(-halfW, -halfH, w, h);

    // Custom Color Swatch Tinting (Only when requested, preserving 100% of gold embroidery)
    if (blendMode === 'tint' && color) {
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = color;
      ctx.fillRect(-halfW, -halfH, w, h);

      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(-halfW, -halfH, w, h);
    } else if (blendMode === 'vivid') {
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.fillRect(-halfW, -halfH, w, h);
    }

    ctx.restore();

  } else {
    // High-tech AR Scanner Shimmer while high-res transparent garment finishes loading
    ctx.save();
    const holoGrad = ctx.createLinearGradient(-halfW, -halfH, halfW, halfH);
    holoGrad.addColorStop(0, 'rgba(0, 168, 225, 0.18)');
    holoGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.08)');
    holoGrad.addColorStop(1, 'rgba(0, 168, 225, 0.18)');
    ctx.fillStyle = holoGrad;
    ctx.fillRect(-halfW * 0.7, -halfH * 0.8, w * 0.7, h * 0.8);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('FITTING DESIGNER FABRIC...', 0, 0);
    ctx.restore();
  }

  ctx.restore();
}
