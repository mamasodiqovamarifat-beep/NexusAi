import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Mic, MicOff, Send, HelpCircle, Loader2, Volume2, Music, Sparkles } from 'lucide-react';
import { speakMessage, toggleAmbientMusic } from '../utils/audio';
import { Profile } from '../types';

interface Message {
  role: 'user' | 'coach';
  text: string;
  image?: {
    type: 'base64' | 'svg';
    data: string;
  };
}

interface AICoachOwlProps {
  profile: Profile;
  onXPUnlock?: (xp: number) => void;
  onCoinUnlock?: (coins: number) => void;
}

export default function AICoachOwl({ profile, onXPUnlock, onCoinUnlock }: AICoachOwlProps) {
  const isEn = profile.language === 'en';
  
  // Localized string dictionary
  const t = {
    welcome: isEn 
      ? `Hello, ${profile.name || 'friend'}! 🦉 I am your learning buddy.`
      : `Salom, ${profile.name || 'do\'stim'}! 🦉 Men sizning bilim va rasm yordamchingizman.`,
    thinking: isEn ? 'Thinking...' : 'Fikr qilmoqda...',
    voiceReady: isEn ? 'Voice assistant ready' : 'Ovozli yordamchi tayyor',
    heard: isEn ? 'I heard you!' : 'Eshitdim!',
    notSupported: isEn 
      ? "Sorry, your browser does not support speech recognition. Try Chrome or Edge."
      : "Kechirasiz, sizning brauzeringiz ovoz bilan kiritishni to'liq qo'llab-quvvatlamaydi. Chrome yoki Edge ishlating.",
    owlThinking: isEn ? "Owl is searching and preparing an answer..." : "Owl o'ylamoqda va javob tayyorlamoqda...",
    inputPlaceholder: isEn ? "Ask the smart advisor anything..." : "Aqlli maslahatchiga savol yo'llang...",
    recordingPlaceholder: isEn ? "Speaking... listening now" : "Gapiring, eshityapman...",
    sugWord: isEn ? "Teach me a new word 🇬🇧" : "Inglizcha so'z o'rgat 🇬🇧",
    sugMath: isEn ? "Give me a fun math puzzle! ➕" : "Qiziqarli matematika o'yini ➕",
    sugEssay: isEn ? "Tips for writing better essays ✍️" : "Insho yozish maslahatlari ✍️",
    drawCat: isEn ? "Draw a beautiful flying cat 🐱" : "Uchar mushuk rasmini chiz 🐱",
    imageCaption: isEn ? "Your AI Masterpiece Canvas" : "AI chizgan maxsus rasmimiz"
  };

  const [messages, setMessages] = useState<Message[]>([
    { role: 'coach', text: t.welcome }
  ]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [owlExpression, setOwlExpression] = useState<'normal' | 'happy' | 'singing' | 'thinking'>('normal');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Web Speech API for voice recognition
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = isEn ? 'en-US' : 'uz-UZ';

      rec.onstart = () => {
        setIsRecording(true);
        setOwlExpression('thinking');
      };

      rec.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        if (resultText) {
          setInputText(resultText);
          speakMessage(t.heard, isEn ? 'en' : 'uz');
        }
      };

      rec.onerror = (e: any) => {
        console.error("Speech Recognition Error:", e);
        setIsRecording(false);
        setOwlExpression('normal');
      };

      rec.onend = () => {
        setIsRecording(false);
        setOwlExpression('normal');
      };

      setRecognition(rec);
    }
  }, [profile.language]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleVoiceRecording = () => {
    if (!recognition) {
       alert(t.notSupported);
      return;
    }
    if (isRecording) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const submitMessage = async (queryText: string) => {
    if (!queryText.trim()) return;

    const userMsg: Message = { role: 'user', text: queryText };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setOwlExpression('thinking');

    try {
      const response = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: queryText,
          history: messages.slice(-6).map(m => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text })),
          profile
        })
      });

      const data = await response.json();
      if (data.success) {
        let cleanReply = data.reply || '';

        // Extract and process potential background music triggers e.g., [TRIGGER_MUSIC:piano]
        const musicRegex = /\[TRIGGER_MUSIC:(lofi|happy|piano|waves|stop)\]/i;
        const match = cleanReply.match(musicRegex);
        if (match) {
          const moodType = match[1].toLowerCase();
          if (moodType === 'stop') {
            toggleAmbientMusic(false);
          } else {
            toggleAmbientMusic(true, moodType as any);
          }
          cleanReply = cleanReply.replace(musicRegex, '').trim();
        }

        setMessages(prev => [...prev, { 
          role: 'coach', 
          text: cleanReply,
          image: data.image || undefined
        }]);

        setOwlExpression(data.image ? 'singing' : 'happy');
        // Speak out with TTS
        speakMessage(cleanReply, isEn ? 'en' : 'uz');
      } else {
        throw new Error("Coach connection failed");
      }
    } catch (err) {
      console.error(err);
      const fallbackReply = isEn 
        ? "Excellent idea! Let us continue building skills in math, English, or creative writing! 🌟"
        : "Ajoyib fikr! Matematika, ingliz tili yoki chiroyli yozishni o'rganishda davom etamiz! 🌟";
      setMessages(prev => [...prev, { role: 'coach', text: fallbackReply }]);
      setOwlExpression('happy');
      speakMessage(fallbackReply, isEn ? 'en' : 'uz');
    } finally {
      setIsLoading(false);
      setTimeout(() => setOwlExpression('normal'), 4000);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputText.trim();
    if (!query) return;
    setInputText('');
    await submitMessage(query);
  };

  // Quick suggestions buttons
  const askSuggestion = (suggestion: string) => {
    submitMessage(suggestion);
  };

  return (
    <div className="bg-white rounded-3xl border-3 border-gray-100 shadow-xl overflow-hidden flex flex-col h-[520px]">
      {/* Header section with Aqlli Boyqush animation */}
      <div className="bg-blue-600 text-white p-4 flex items-center justify-between gap-3 border-b-4 border-blue-700">
        <div className="flex items-center gap-3">
          {/* Animated SVG Owl */}
          <div className="relative w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center p-1 border-2 border-blue-400">
            <svg viewBox="0 0 100 100" className="w-full h-full animate-bounce duration-1000">
              {/* Outer Body */}
              <ellipse cx="50" cy="55" rx="35" ry="32" fill="#E2E8F0" />
              <ellipse cx="50" cy="55" rx="30" ry="28" fill="#F8FAFC" />
              <path d="M50 12 L30 35 L70 35 Z" fill="#4A5568" />
              {/* Owl Head details & Ears */}
              <polygon points="30,30 20,15 40,30" fill="#4B5563" />
              <polygon points="70,30 80,15 60,30" fill="#4B5563" />
              {/* Face mask */}
              <circle cx="38" cy="42" r="13" fill="#FFE082" />
              <circle cx="62" cy="42" r="13" fill="#FFE082" />
              {/* Pupils dynamically react */}
              {owlExpression === 'normal' && (
                <>
                  <circle cx="38" cy="42" r="7" fill="#1F2937" />
                  <circle cx="62" cy="42" r="7" fill="#1F2937" />
                  <circle cx="36" cy="40" r="3" fill="#FFFFFF" />
                  <circle cx="60" cy="40" r="3" fill="#FFFFFF" />
                </>
              )}
              {owlExpression === 'happy' && (
                <>
                  <path d="M 31 44 Q 38 32 45 44" stroke="#1F2937" strokeWidth="4" fill="none" strokeLinecap="round" />
                  <path d="M 55 44 Q 62 32 69 44" stroke="#1F2937" strokeWidth="4" fill="none" strokeLinecap="round" />
                </>
              )}
              {owlExpression === 'thinking' && (
                <>
                  <circle cx="38" cy="42" r="7" fill="#1F2937" />
                  <path d="M 55 42 L 69 42" stroke="#1F2937" strokeWidth="4" strokeLinecap="round" />
                  <circle cx="36" cy="40" r="3" fill="#FFFFFF" />
                </>
              )}
              {owlExpression === 'singing' && (
                <>
                  <circle cx="38" cy="42" r="8" fill="#1F2937" />
                  <circle cx="62" cy="42" r="8" fill="#1F2937" />
                  <ellipse cx="50" cy="54" rx="4" ry="7" fill="#EF4444" />
                </>
              )}
              {/* Beak */}
              <polygon points="50,45 45,55 55,55" fill="#EF4444" />
              {/* Hands/Wings */}
              <path d="M 12 55 Q 5 62 15 72" stroke="#4B5563" strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d="M 88 55 Q 95 62 85 72" stroke="#4B5563" strokeWidth="4" fill="none" strokeLinecap="round" />
            </svg>
            <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-slate-800 font-bold px-1 rounded-md text-[9px] uppercase tracking-wide font-sans">
              {owlExpression === 'thinking' ? '💡' : 'Coach'}
            </div>
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight flex items-center gap-1.5 font-sans">
              {isEn ? 'Smart Owl' : 'Aqlli Boyqush'} <span className="text-yellow-300">🦉</span>
            </h3>
            <p className="text-xs text-blue-100 font-mono">
              {owlExpression === 'thinking' ? t.thinking : t.voiceReady}
            </p>
          </div>
        </div>
        <button
          onClick={() => speakMessage(isEn ? "I am your smart educational companion. Let's study!" : "Men sizning Aqlli Boyqushingizman. Math, English va Ona tilini birgalikda o'rganamiz!", isEn ? 'en' : 'uz')}
          className="p-2 cursor-pointer bg-blue-500 hover:bg-blue-400 rounded-full transition"
          title="Ovozni eshitish / Speak"
        >
          <Volume2 className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-4 scroll-smooth">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-1.5`}
          >
            {msg.role === 'coach' && (
              <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center font-bold text-sm shrink-0">
                🦉
              </div>
            )}
            <div className="max-w-[85%] flex flex-col gap-2">
              <div
                className={`rounded-2xl px-4 py-2.5 shadow-sm text-sm ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                }`}
              >
                <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
              </div>

              {/* Dynamic Image Canvas inside Chat */}
              {msg.role === 'coach' && msg.image && (
                <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-md max-w-sm">
                  <div className="p-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-yellow-500 animate-spin" />
                      {t.imageCaption}
                    </span>
                    <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide">
                      {msg.image.type}
                    </span>
                  </div>
                  
                  {msg.image.type === 'svg' ? (
                    <div 
                      className="w-full h-auto max-h-[240px] p-4 flex items-center justify-center bg-slate-900" 
                      dangerouslySetInnerHTML={{ __html: msg.image.data }}
                    />
                  ) : (
                    <img 
                      src={msg.image.data} 
                      alt="AI generated illustration" 
                      className="w-full h-auto max-h-[240px] object-contain block bg-slate-900" 
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start items-center gap-2 text-slate-500 text-xs py-1">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span>{t.owlThinking}</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Questions buttons for age groups */}
      <div className="px-3 py-2 bg-slate-100 border-t border-slate-200 flex gap-2 overflow-x-auto scrollbar-none shrink-0">
        <button
          onClick={() => askSuggestion(isEn ? "Teach me a new English word 🇬🇧" : "Menga ingliz tilidan yangi so'z o'rgat 🇬🇧")}
          className="text-xs bg-white border border-slate-200 rounded-full px-3 py-1 cursor-pointer hover:bg-slate-50 hover:border-blue-400 text-slate-700 font-medium whitespace-nowrap shrink-0 transition"
        >
          {t.sugWord}
        </button>
        <button
          onClick={() => askSuggestion(isEn ? "Give me a fun math question! ➕" : "Menga qiziqarli matematika masalasi ber! ➕")}
          className="text-xs bg-white border border-slate-200 rounded-full px-3 py-1 cursor-pointer hover:bg-slate-50 hover:border-blue-400 text-slate-700 font-medium whitespace-nowrap shrink-0 transition"
        >
          {t.sugMath}
        </button>
        <button
          onClick={() => askSuggestion(isEn ? "Draw a cute smart owl drawing 🦉" : "Chiroyli aqlli boyqush rasmini chizib ber 🦉")}
          className="text-xs bg-yellow-50 border border-yellow-200 rounded-full px-3 py-1 cursor-pointer hover:bg-yellow-100 text-yellow-800 font-medium whitespace-nowrap shrink-0 transition flex items-center gap-1 shrink-0"
        >
          <Sparkles className="w-3 h-3 text-yellow-600" />
          {t.drawCat}
        </button>
        <button
          onClick={() => askSuggestion(isEn ? "How to write a good essay? ✍️" : "Insho yozish sirlari haqida maslahat ber ✍️")}
          className="text-xs bg-white border border-slate-200 rounded-full px-3 py-1 cursor-pointer hover:bg-slate-50 hover:border-blue-400 text-slate-700 font-medium whitespace-nowrap shrink-0 transition"
        >
          {t.sugEssay}
        </button>
      </div>

      {/* Input box with voice triggers */}
      <form onSubmit={handleSendMessage} className="p-3 bg-white border-t-3 border-slate-100 flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={toggleVoiceRecording}
          className={`p-3 rounded-2xl cursor-pointer transition-all duration-300 ${
            isRecording
              ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-200'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800'
          }`}
          title={isRecording ? (isEn ? "Stop Recording" : "Ovoz yozishni to'xtatish") : (isEn ? "Speak with mic" : "Gapirish orqali yozish (Mikrofon)")}
        >
          {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isRecording ? t.recordingPlaceholder : t.inputPlaceholder}
          className="flex-grow pl-4 pr-3 py-3 border-2 border-slate-100 hover:border-blue-300 focus:border-blue-500 focus:outline-none rounded-2xl text-sm text-slate-800 transition"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="bg-yellow-400 hover:bg-yellow-500 active:transform active:scale-95 text-slate-900 p-3 rounded-2xl cursor-pointer font-bold transition shadow-md shadow-yellow-100 shrink-0"
          disabled={!inputText.trim() || isLoading}
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
