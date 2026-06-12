import React, { useState } from 'react';
import { Sparkles, ArrowRight, Shield, AlertCircle } from 'lucide-react';
import { Profile, AgeGroup } from '../types';
import { playSuccessChime, speakMessage } from '../utils/audio';

interface ProfileSetupProps {
  onCompleteSetup: (profile: Profile) => void;
}

const AVATAR_OPTIONS = [
  '🤖', '🧠', '👾', '🚀', '⭐', '🦁', '🦉', '🦊', '🐼', '🐱', '🐶', '🔮'
];

export default function ProfileSetup({ onCompleteSetup }: ProfileSetupProps) {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🔮');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('13+');
  const [errorText, setErrorText] = useState('');
  const [language, setLanguage] = useState<'uz' | 'en'>('uz');

  const isEn = language === 'en';

  const t = {
    badge: isEn ? "NEXUSAI UNIFIED AI COGNITION" : "NEXUSAI SUN'IY INTELLEKT ALLYANSI",
    heading: isEn ? "NexusAi Workspace 🔮" : "NexusAi Ishchi Muhiti 🔮",
    desc: isEn 
      ? "Enter your name to unlock a world-class AI hub merging ChatGPT, Claude, Gemini, Kimi & Gamma with active presentations, animations, and voice synthesis."
      : "ChatGPT, Claude, Gemini, Kimi va Gamma model kuchlarini, interaktiv slaydlar va video generatorlar bilan birlashtirgan universal AI olamiga qadam qo'ying.",
    nameLabel: isEn ? "Enter your agent nickname: ✨" : "O'zingiz uchun taxallus (ism) kiriting: ✨",
    namePlaceholder: isEn ? "e.g., Alisher, ScholarX" : "Masalan: Alisher, ScholarX",
    nameError: isEn ? "Please type a nickname!" : "Iltimos, ismingizni yozing!",
    avatarLabel: isEn ? "Choose your master avatar: ⭐" : "Boshqaruv avatarini tanlang: ⭐",
    ageLabel: isEn ? "Select your age tier: 👶👦👨" : "Yosh toifangizni tanlang: (Tizim moslashishi uchun) 👶👦👨",
    ageY1: isEn ? "5 - 8 Years" : "5 - 8 Yosh",
    ageDesc1: isEn ? "Creative illustrations" : "Ijodiy rasmlar va oddiy fikrlash",
    ageY2: isEn ? "9 - 12 Years" : "9 - 12 Yosh",
    ageDesc2: isEn ? "Problem solving wizard" : "Kompas va muammolarni yechish",
    ageY3: isEn ? "13+ Years" : "13+ Yosh (Advanced)",
    ageDesc3: isEn ? "Full-scale high logic" : "To'liq tahliliy va texnik fikrlash",
    startBtn: isEn ? "Launch NexusAi Console" : "NexusAi Konsolini Yoqish",
    welcomeMsg: isEn ? "NexusAi system booted. Preparing workspace consoles." : "NexusAi tizimi ishga tushdi. Virtual ishchi panellar sozlanmoqda."
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorText(t.nameError);
      return;
    }

    const initialProfile: Profile = {
      name: name.trim(),
      avatar: selectedAvatar,
      frame: 'none',
      ageGroup: ageGroup,
      xp: 1500, // starting energy
      coins: 500, // starting token coins
      stars: 10,
      badges: [],
      unlockedFrames: [],
      unlockedAvatars: [selectedAvatar],
      language: language,
      musicStyle: 'lofi',
      math: {
        level: 1,
        xp: 0,
        skill: 'Beginner',
        title: 'Basic Solver'
      },
      english: {
        level: 1,
        xp: 0,
        skill: 'Beginner',
        title: 'Sentence Builder'
      },
      writing: {
        level: 1,
        xp: 0,
        skill: 'Beginner',
        title: 'Story Writer'
      },
      dailyMathCount: 0,
      dailyEnglishCount: 0,
      dailyWritingCount: 0,
      lastDailyReset: new Date().toISOString().split('T')[0]
    };

    playSuccessChime();
    speakMessage(isEn ? `Booting ${name}! ${t.welcomeMsg}` : `Tizimga xush kelibsiz ${name}! ${t.welcomeMsg}`, language);
    onCompleteSetup(initialProfile);
  };

  return (
    <div className="max-w-xl mx-auto bg-slate-900 rounded-3xl p-6 md:p-8 border-2 border-indigo-500/30 shadow-[0_0_50px_rgba(99,102,241,0.2)] relative overflow-hidden transition-all text-slate-100">
      {/* Language Quick Toggle at top-right */}
      <div className="absolute top-4 right-4 z-20">
        <button
          type="button"
          onClick={() => setLanguage(l => l === 'en' ? 'uz' : 'en')}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-full border border-slate-700/60 transition cursor-pointer"
        >
          <span>{language === 'en' ? '🇺🇿 O\'zbekcha' : '🇬🇧 English'}</span>
        </button>
      </div>

      {/* Cyberpunk gradient graphics */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/15 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-600/15 rounded-full filter blur-3xl pointer-events-none" />

      <div className="z-10 relative space-y-6">
        {/* Banner header */}
        <div className="text-center space-y-3.5">
          <div className="inline-flex items-center gap-2 bg-indigo-950/80 text-indigo-300 px-3.5 py-1 rounded-full text-xs font-extrabold tracking-widest border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-spin" />
            {t.badge}
          </div>
          <h2 className="text-3xl font-black font-sans bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 leading-tight">
            {t.heading}
          </h2>
          <p className="text-slate-400 text-xs md:text-sm max-w-sm mx-auto leading-relaxed">
            {t.desc}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nickname Field */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold tracking-wide text-slate-300 uppercase">{t.nameLabel}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrorText('');
              }}
              placeholder={t.namePlaceholder}
              className="w-full px-4 py-3.5 bg-slate-950/80 border-2 border-slate-800 focus:border-indigo-500 rounded-2xl text-slate-100 font-medium transition focus:outline-none placeholder-slate-600 shadow-inner"
            />
            {errorText && (
              <p className="text-red-400 font-bold text-xs flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errorText}
              </p>
            )}
          </div>

          {/* Avatar selector Grid */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold tracking-wide text-slate-300 uppercase">{t.avatarLabel}</label>
            <div className="grid grid-cols-6 gap-2.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
              {AVATAR_OPTIONS.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => setSelectedAvatar(av)}
                  className={`text-2xl p-2 rounded-xl transition cursor-pointer hover:scale-110 active:scale-95 ${
                    selectedAvatar === av 
                      ? 'bg-indigo-600/90 text-white shadow-lg shadow-indigo-500/20 scale-105 border border-indigo-400' 
                      : 'bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          {/* Age Selection for profile logic */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold tracking-wide text-slate-300 uppercase">{t.ageLabel}</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setAgeGroup('5-8')}
                className={`p-3.5 rounded-2xl cursor-pointer text-center border transition ${
                  ageGroup === '5-8'
                    ? 'border-indigo-500 bg-indigo-950/60 text-indigo-200 font-extrabold shadow-md'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 font-semibold'
                }`}
              >
                <span className="block text-xl mb-1">👶</span>
                <span className="block text-xs font-bold">{t.ageY1}</span>
                <span className="block text-[9px] text-slate-500 font-normal leading-tight mt-0.5">{t.ageDesc1}</span>
              </button>

              <button
                type="button"
                onClick={() => setAgeGroup('9-12')}
                className={`p-3.5 rounded-2xl cursor-pointer text-center border transition ${
                  ageGroup === '9-12'
                    ? 'border-indigo-500 bg-indigo-950/60 text-indigo-200 font-extrabold shadow-md'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 font-semibold'
                }`}
              >
                <span className="block text-xl mb-1">👦</span>
                <span className="block text-xs font-bold">{t.ageY2}</span>
                <span className="block text-[9px] text-slate-500 font-normal leading-tight mt-0.5">{t.ageDesc2}</span>
              </button>

              <button
                type="button"
                onClick={() => setAgeGroup('13+')}
                className={`p-3.5 rounded-2xl cursor-pointer text-center border transition ${
                  ageGroup === '13+'
                    ? 'border-indigo-500 bg-indigo-950/60 text-indigo-200 font-extrabold shadow-md'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 font-semibold'
                }`}
              >
                <span className="block text-xl mb-1">👨</span>
                <span className="block text-xs font-bold">{t.ageY3}</span>
                <span className="block text-[9px] text-slate-500 font-normal leading-tight mt-0.5">{t.ageDesc3}</span>
              </button>
            </div>
          </div>

          {/* Launch Button */}
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-4 rounded-2xl cursor-pointer shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 text-sm transition transition-all active:scale-95 border-b-4 border-indigo-800"
          >
            {t.startBtn} <ArrowRight className="w-5 h-5 animate-pulse" />
          </button>
        </form>

        <div className="flex items-center justify-center gap-1.5 text-slate-500 text-[10px] uppercase tracking-wider mt-4">
          <Shield className="w-3.5 h-3.5 text-indigo-500/60" />
          <span>Local sandboxed session • 256-bit simulated key</span>
        </div>
      </div>
    </div>
  );
}
