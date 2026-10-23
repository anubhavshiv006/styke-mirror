import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  Mic, 
  ArrowRight, 
  Shirt, 
  Camera, 
  Flame, 
  HelpCircle,
  CheckCircle2,
  Minimize2
} from 'lucide-react';
import { AppStage, Outfit } from '../types.ts';
import { ALL_WARDROBE_OUTFITS } from '../data/clips.ts';
import { sound } from '../utils/audio.ts';

interface AIAssistantBotProps {
  currentStage: AppStage;
  onNavigate: (stage: AppStage) => void;
  onSelectOutfitAndMirror: (outfit: Outfit, color?: string) => void;
  onChangeColor: (color: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  suggestedAction?: {
    type: 'WEAR_OUTFIT' | 'NAVIGATE' | 'CHANGE_COLOR';
    outfitId?: string;
    stage?: AppStage;
    colorHex?: string;
    label: string;
  };
  time: string;
}

export const AIAssistantBot: React.FC<AIAssistantBotProps> = ({
  currentStage,
  onNavigate,
  onSelectOutfitAndMirror,
  onChangeColor,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: 'Namaste! Main Astra hoon, aapka Watch & Wear AI Fashion Stylist & Guide. Aap mujhse outfits recommendation, camera try-on ke tips ya game ke kisi bhi feature ke baare me pooch sakte hain!',
      time: 'Just now',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    sound.playClick();
    setInputMessage('');

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const history = messages.slice(-4).map(m => ({ role: m.sender, text: m.text }));
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      });

      const data = await res.json();
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: data.reply || "Aapka outfit ready hai! Kripya niche diye gaye action button par click kijiye.",
        suggestedAction: data.suggestedAction,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, botMsg]);
      sound.playHighlight();
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: "Aap kapde dekhne ke liye 'Clothes' section me ja sakte hain ya Magic Mirror me camera on kar ke kapde pehan sakte hain!",
          suggestedAction: { type: 'NAVIGATE', stage: 'wardrobe', label: 'Open Clothes Store' },
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteAction = (action: NonNullable<ChatMessage['suggestedAction']>) => {
    sound.playClick();
    if (action.type === 'WEAR_OUTFIT' && action.outfitId) {
      const outfit = ALL_WARDROBE_OUTFITS.find(o => o.id === action.outfitId) || ALL_WARDROBE_OUTFITS[0];
      onSelectOutfitAndMirror(outfit);
      setIsOpen(false);
    } else if (action.type === 'NAVIGATE' && action.stage) {
      onNavigate(action.stage);
      setIsOpen(false);
    } else if (action.type === 'CHANGE_COLOR' && action.colorHex) {
      onChangeColor(action.colorHex);
      onNavigate('mirror');
      setIsOpen(false);
    }
  };

  const handleVoiceInput = () => {
    sound.playClick();
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      handleSendMessage("Suggest an outfit for Diwali gala");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const spoken = event.results[0][0].transcript;
        setIsListening(false);
        handleSendMessage(spoken);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const quickQuestions = [
    { label: '🪔 Diwali ke liye best look?', query: 'Diwali ke liye sabse shandar royal dress kaunsi hai?' },
    { label: '👗 Women\'s Lehengas & Gowns', query: 'Show me best festive lehenga and evening gowns for women' },
    { label: '👔 Men\'s Sherwani & Tuxedos', query: 'Men\'s collection me kya options hain?' },
    { label: '📷 Camera on kaise karein?', query: 'Camera on karke clothes kaise wear karein?' },
    { label: '🏆 Fashion show voting guide', query: 'Family fashion show me vote kaise karein aur winner kaise bante hain?' },
  ];

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="fixed bottom-5 right-5 z-40">
        {!isOpen ? (
          <button
            onClick={() => {
              sound.playClick();
              setIsOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900/95 hover:bg-slate-800 text-white shadow-xl border border-slate-700/80 hover:border-[#00a8e1] transition-all transform hover:scale-105 active:scale-95 group text-xs font-semibold"
            title="Open AI Fashion Guide"
          >
            <Bot className="w-4 h-4 text-[#00a8e1]" />
            <span className="text-slate-200">Astra AI Guide</span>
          </button>
        ) : null}
      </div>

      {/* Floating Chat Modal / Drawer */}
      {isOpen && (
        <div className="fixed bottom-5 right-5 z-50 w-[95vw] sm:w-[420px] max-h-[620px] rounded-3xl bg-[#080e1b]/98 backdrop-blur-xl border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-[#0c1a33] via-[#0a162b] to-[#080e1b] border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00a8e1] to-purple-600 flex items-center justify-center text-slate-950 font-black shadow">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-white">Astra</h3>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    AI Online
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">
                  Fashion Stylist &amp; Living Room Guide
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                setIsOpen(false);
              }}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Questions Chips */}
          <div className="px-3 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {quickQuestions.map((q) => (
              <button
                key={q.label}
                onClick={() => handleSendMessage(q.query)}
                className="flex-none px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-[#00a8e1]/20 hover:border-[#00a8e1] border border-slate-800 text-[10px] font-medium text-slate-300 hover:text-[#38bdf8] transition whitespace-nowrap"
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 max-h-[380px] text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 shadow-md ${
                    m.sender === 'user'
                      ? 'bg-[#00a8e1] text-slate-950 font-medium rounded-br-none'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                  }`}
                >
                  <p className="leading-relaxed">{m.text}</p>

                  {/* Suggested Interactive Action Button */}
                  {m.suggestedAction && (
                    <div className="mt-2.5 pt-2 border-t border-slate-700/60">
                      <button
                        onClick={() => handleExecuteAction(m.suggestedAction!)}
                        className="w-full py-1.5 px-3 rounded-lg bg-[#00a8e1] hover:bg-[#0094c8] text-slate-950 font-black text-[11px] shadow flex items-center justify-center gap-1.5 transition transform hover:scale-[1.02]"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{m.suggestedAction.label}</span>
                        <ArrowRight className="w-3 h-3 ml-0.5" />
                      </button>
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-slate-500 font-mono mt-1 px-1">
                  {m.time}
                </span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs w-28 animate-pulse">
                <Sparkles className="w-3.5 h-3.5 text-[#00a8e1] animate-spin" />
                <span>Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-3 bg-slate-950/90 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ask about outfits, poses, camera..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00a8e1] transition"
              />

              <button
                onClick={handleVoiceInput}
                className={`p-2 rounded-xl border transition ${
                  isListening
                    ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
                }`}
                title="Speak question"
              >
                <Mic className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isLoading}
                className="p-2 rounded-xl bg-[#00a8e1] hover:bg-[#0094c8] disabled:opacity-40 text-slate-950 font-bold transition"
                title="Send"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
