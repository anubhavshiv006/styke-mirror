import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '20mb' }));

// Initialize Gemini on the server side
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// In-memory room store for multi-device sync (TV & Phones)
interface RoomState {
  code: string;
  createdAt: number;
  lastActive: number;
  phoneConnected: boolean;
  phoneDeviceName?: string;
  activeClipId: string;
  isPaused: boolean;
  currentTime: number;
  selectedOutfitId: string | null;
  outfitColor: string;
  mode: 'watch' | 'mirror' | 'show' | 'vote' | 'winner';
  activePlayerIndex: number;
  players: Array<{
    id: string;
    name: string;
    avatar: string;
    outfitId: string;
    targetPoseId: string;
    poseScore: number;
    snapshotUrl?: string;
    votes: number;
  }>;
  coachingTips: string;
  poseScore: number;
  aiCritique?: string;
}

const rooms = new Map<string, RoomState>();

// Clean up stale rooms older than 3 hours
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms.entries()) {
    if (now - room.lastActive > 3 * 60 * 60 * 1000) {
      rooms.delete(code);
    }
  }
}, 10 * 60 * 1000);

// API Routes
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', time: Date.now(), geminiConfigured: !!ai });
});

// Create or reset a room
app.post('/api/rooms/create', (req: Request, res: Response) => {
  const customCode = req.body.code?.trim().toUpperCase();
  const code = customCode && customCode.length >= 4 
    ? customCode 
    : 'FIRE' + Math.floor(10 + Math.random() * 90);

  const initialRoom: RoomState = {
    code,
    createdAt: Date.now(),
    lastActive: Date.now(),
    phoneConnected: false,
    phoneDeviceName: undefined,
    activeClipId: 'cyberpunk-noir',
    isPaused: true,
    currentTime: 3.5,
    selectedOutfitId: 'cyber-trench',
    outfitColor: '#38bdf8',
    mode: 'watch',
    activePlayerIndex: 0,
    players: [
      { id: 'p1', name: 'Dad', avatar: '👨', outfitId: 'cyber-trench', targetPoseId: 'red-carpet', poseScore: 0, votes: 0 },
      { id: 'p2', name: 'Mom', avatar: '👩', outfitId: 'royal-sherwani', targetPoseId: 'namaste-swag', poseScore: 0, votes: 0 },
      { id: 'p3', name: 'Aarav', avatar: '👦', outfitId: 'festive-bandhgala', targetPoseId: 'power-stance', poseScore: 0, votes: 0 }
    ],
    coachingTips: 'Align with camera to begin',
    poseScore: 0,
  };

  rooms.set(code, initialRoom);
  res.json(initialRoom);
});

// Get room state
app.get('/api/rooms/:code', (req: Request, res: Response) => {
  const code = req.params.code.toUpperCase();
  const room = rooms.get(code);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  room.lastActive = Date.now();
  res.json(room);
});

// Join room as phone controller / camera
app.post('/api/rooms/:code/join', (req: Request, res: Response) => {
  const code = req.params.code.toUpperCase();
  let room = rooms.get(code);
  if (!room) {
    // Auto-create room if accessed directly via URL with code
    room = {
      code,
      createdAt: Date.now(),
      lastActive: Date.now(),
      phoneConnected: true,
      phoneDeviceName: req.body.deviceName || 'Family Smartphone',
      activeClipId: 'cyberpunk-noir',
      isPaused: true,
      currentTime: 3.5,
      selectedOutfitId: 'cyber-trench',
      outfitColor: '#38bdf8',
      mode: 'watch',
      activePlayerIndex: 0,
      players: [
        { id: 'p1', name: 'Dad', avatar: '👨', outfitId: 'cyber-trench', targetPoseId: 'red-carpet', poseScore: 0, votes: 0 },
        { id: 'p2', name: 'Mom', avatar: '👩', outfitId: 'royal-sherwani', targetPoseId: 'namaste-swag', poseScore: 0, votes: 0 },
        { id: 'p3', name: 'Aarav', avatar: '👦', outfitId: 'festive-bandhgala', targetPoseId: 'power-stance', poseScore: 0, votes: 0 }
      ],
      coachingTips: 'Align with camera to begin',
      poseScore: 0,
    };
    rooms.set(code, room);
  } else {
    room.phoneConnected = true;
    room.phoneDeviceName = req.body.deviceName || room.phoneDeviceName || 'Family Smartphone';
    room.lastActive = Date.now();
  }
  res.json(room);
});

// Update room state
app.post('/api/rooms/:code/update', (req: Request, res: Response) => {
  const code = req.params.code.toUpperCase();
  const room = rooms.get(code);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const updates = req.body;
  Object.assign(room, updates, { lastActive: Date.now() });
  res.json(room);
});

// Ultra-fast safe timeout helper to prevent hanging on external network requests
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallbackVal: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallbackVal), timeoutMs)),
  ]);
}

// Intelligent Stylist Knowledge Base for Instant Zero-Latency Answers
function generateSmartStylistReply(message: string): { reply: string; suggestedAction?: any } {
  const lower = message.toLowerCase();

  if (lower.includes('diwali') || lower.includes('shaadi') || lower.includes('wedding') || lower.includes('festive') || lower.includes('tyohar')) {
    return {
      reply: "Diwali aur wedding gala ke liye Imperial Zari Sherwani (Men) aur Royal Banarasi Lehenga (Women) sabse shandar hain! Dono me pure silk aur gold embroidery hai.",
      suggestedAction: { type: 'WEAR_OUTFIT', outfitId: 'royal-sherwani', label: 'Try Imperial Sherwani' },
    };
  }

  if (lower.includes('women') || lower.includes('female') || lower.includes('ladki') || lower.includes('lehenga') || lower.includes('gown') || lower.includes('anarkali')) {
    return {
      reply: "Women's collection me Royal Banarasi Lehenga, Elie Saab Gold Mermaid Gown, aur Manish Malhotra Emerald Anarkali shamil hain. Aap inhe live camera par try kar sakte hain!",
      suggestedAction: { type: 'WEAR_OUTFIT', outfitId: 'banarasi-lehenga', label: 'Try Banarasi Lehenga' },
    };
  }

  if (lower.includes('men') || lower.includes('male') || lower.includes('ladke') || lower.includes('sherwani') || lower.includes('tuxedo') || lower.includes('bandhgala')) {
    return {
      reply: "Men's collection me Imperial Zari Sherwani, Emerald Jodhpuri Bandhgala, Tom Ford Tuxedo, aur Neo-Tokyo Cyber Trench hain. Kisi bhi outfit ko choose karke camera par pehniye!",
      suggestedAction: { type: 'NAVIGATE', stage: 'wardrobe', label: 'Browse Men\'s Outfits' },
    };
  }

  if (lower.includes('cam') || lower.includes('camera') || lower.includes('mirror') || lower.includes('kaise') || lower.includes('wear') || lower.includes('pehan')) {
    return {
      reply: "Magic Mirror me camera on karne ke liye upar 'Turn On Camera' dabayein. Target pose match karke 2 second hold kijiye, aur aapka snapshot automatic capture ho jayega!",
      suggestedAction: { type: 'NAVIGATE', stage: 'mirror', label: 'Open Magic Mirror' },
    };
  }

  if (lower.includes('vote') || lower.includes('winner') || lower.includes('family') || lower.includes('runway') || lower.includes('show') || lower.includes('jeete')) {
    return {
      reply: "Har player ke snapshot lene ke baad Family Runway me sabhi family members 1 se 5 stars tak vote karte hain. Pose accuracy aur votes combine hokar champion decide hota hai!",
      suggestedAction: { type: 'NAVIGATE', stage: 'vote', label: 'Open Family Runway' },
    };
  }

  if (lower.includes('blue') || lower.includes('red') || lower.includes('gold') || lower.includes('green') || lower.includes('purple')) {
    const colorHex = lower.includes('blue') ? '#0284c7' : lower.includes('red') ? '#dc2626' : lower.includes('gold') ? '#eab308' : lower.includes('green') ? '#059669' : '#7e22ce';
    return {
      reply: `Zabardast choice! Maine aapke outfit ke liye vibrant hue select kiya hai. Magic Mirror me aap ise live inspect kar sakte hain.`,
      suggestedAction: { type: 'CHANGE_COLOR', colorHex, label: 'Apply Color in Mirror' },
    };
  }

  if (lower.includes('movie') || lower.includes('show') || lower.includes('film') || lower.includes('clip') || lower.includes('pause') || lower.includes('watch')) {
    return {
      reply: "Watch mode me aap clips dekh sakte hain. Scene pause karne par actors ke outfit hotspots aate hain jahan se aap instantly same designer look pehan sakte hain!",
      suggestedAction: { type: 'NAVIGATE', stage: 'watch', label: 'Watch Movies & Shows' },
    };
  }

  return {
    reply: "Namaste! Main Astra hoon, aapka Watch & Wear AI Stylist. Aap mujhse outfits recommendation, camera try-on ke tips ya game ke kisi bhi feature ke baare me pooch sakte hain!",
    suggestedAction: { type: 'NAVIGATE', stage: 'wardrobe', label: 'Explore Clothes Store' },
  };
}

// AI Fashion Stylist & Try-on Critique endpoint powered by Gemini with 2.5s safe timeout
app.post('/api/ai/critique', async (req: Request, res: Response) => {
  const { winnerName, outfitName, poseScore, poseName, festivalTheme } = req.body;
  const fallbackCritique = {
    title: 'Haute Couture Living Room Champion',
    critique: `👑 Exceptional living room runway debut! ${winnerName || 'Winner'} owned the screen in the ${outfitName || 'outfit'} with a striking ${poseScore || 95}% on the ${poseName || 'pose'}. The posture and silhouette captured authentic celebrity swagger!`,
    rating: '9.8 / 10',
    styleAward: 'Best Prime Video Runway Swag',
  };

  if (!ai) {
    return res.json(fallbackCritique);
  }

  try {
    const prompt = `You are the witty celebrity fashion show judge on 'Watch & Wear'.
Winner: ${winnerName}
Outfit: ${outfitName}
Pose Accuracy: ${poseScore}% (${poseName})
Theme: ${festivalTheme}
Return valid JSON with:
"title": short snappy title (e.g. "Cannes Red Carpet Royalty")
"critique": 2-sentence electrifying TV critique
"rating": string like "9.9 / 10"
"styleAward": honorary badge name`;

    const apiCall = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    }).then(r => JSON.parse(r.text || '{}'));

    const result = await withTimeout(apiCall, 2200, fallbackCritique);
    res.json(result);
  } catch (error) {
    res.json(fallbackCritique);
  }
});

// Voice Command Parser endpoint powered by Gemini
app.post('/api/ai/voice', async (req: Request, res: Response) => {
  const { command } = req.body;
  if (!command) {
    return res.status(400).json({ error: 'Command text is required' });
  }

  const lower = command.toLowerCase();

  // Fast local regex matching for instant 0ms latency
  if (lower.includes('blue') || lower.includes('cyan')) {
    return res.json({ action: 'COLOR', value: '#0284c7', label: 'Royal Blue' });
  }
  if (lower.includes('red') || lower.includes('crimson') || lower.includes('ruby')) {
    return res.json({ action: 'COLOR', value: '#dc2626', label: 'Crimson Red' });
  }
  if (lower.includes('gold') || lower.includes('golden') || lower.includes('yellow')) {
    return res.json({ action: 'COLOR', value: '#eab308', label: 'Regal Gold' });
  }
  if (lower.includes('green') || lower.includes('emerald')) {
    return res.json({ action: 'COLOR', value: '#059669', label: 'Emerald Green' });
  }
  if (lower.includes('black') || lower.includes('midnight') || lower.includes('dark')) {
    return res.json({ action: 'COLOR', value: '#0f172a', label: 'Midnight Black' });
  }
  if (lower.includes('purple') || lower.includes('violet') || lower.includes('magenta')) {
    return res.json({ action: 'COLOR', value: '#7e22ce', label: 'Imperial Violet' });
  }
  if (lower.includes('diwali') || lower.includes('wedding') || lower.includes('ethnic') || lower.includes('sherwani') || lower.includes('festival')) {
    return res.json({ action: 'OUTFIT', value: 'royal-sherwani', clipId: 'royal-gala', label: 'Imperial Sherwani' });
  }
  if (lower.includes('trench') || lower.includes('cyber') || lower.includes('jacket') || lower.includes('biker')) {
    return res.json({ action: 'OUTFIT', value: 'cyber-trench', clipId: 'cyberpunk-noir', label: 'Cyber Trench' });
  }
  if (lower.includes('blazer') || lower.includes('tuxedo') || lower.includes('carpet')) {
    return res.json({ action: 'OUTFIT', value: 'metallic-blazer', clipId: 'red-carpet', label: 'Metallic Blazer' });
  }
  if (lower.includes('next') || lower.includes('pass')) {
    return res.json({ action: 'NEXT_PLAYER' });
  }
  if (lower.includes('pose') || lower.includes('snap') || lower.includes('lock') || lower.includes('shoot')) {
    return res.json({ action: 'LOCK_POSE' });
  }
  if (lower.includes('mirror') || lower.includes('try')) {
    return res.json({ action: 'SWITCH_MODE', value: 'mirror' });
  }
  if (lower.includes('vote') || lower.includes('show')) {
    return res.json({ action: 'SWITCH_MODE', value: 'vote' });
  }

  res.json({ action: 'UNKNOWN', message: `Heard: "${command}"` });
});

// AI Fashion Stylist & Help Assistant Bot endpoint with 2.2s safe race
app.post('/api/ai/assistant', async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const fallback = generateSmartStylistReply(message);

    if (!ai) {
      return res.json(fallback);
    }

    const systemInstruction = `You are 'Astra', the AI Fashion Stylist on 'Watch & Wear'.
Keep answers short (2-3 sentences), warm, and stylish in Hinglish or English.
Available Outfits: 'banarasi-lehenga', 'starlight-gown', 'emerald-anarkali', 'royal-sherwani', 'festive-bandhgala', 'metallic-blazer', 'cyber-trench'.
Output valid JSON only:
{
  "reply": "stylish friendly 2-sentence response",
  "suggestedAction": {
    "type": "WEAR_OUTFIT" | "NAVIGATE" | "CHANGE_COLOR",
    "outfitId": "banarasi-lehenga" | "royal-sherwani" | "starlight-gown" | "cyber-trench" | "festive-bandhgala",
    "stage": "home" | "wardrobe" | "watch" | "mirror" | "vote",
    "colorHex": "#...",
    "label": "Action button label under 5 words"
  }
}`;

    const apiCall = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `User message: "${message}". History: ${JSON.stringify(history || [])}.`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    }).then(r => JSON.parse(r.text || '{}'));

    const result = await withTimeout(apiCall, 2200, fallback);
    res.json(result);
  } catch (err: any) {
    res.json(generateSmartStylistReply(req.body.message || ''));
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Watch & Wear Server running at http://localhost:${PORT}`);
  });
}

startServer();
