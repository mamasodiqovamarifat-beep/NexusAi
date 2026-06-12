export type AgeGroup = '5-8' | '9-12' | '13+';

export type SubjectType = 'math' | 'english' | 'writing';

export type SkillLevel = 'Beginner' | 'Elementary' | 'Intermediate' | 'Advanced' | 'Master';

export interface SubjectStats {
  level: number;
  xp: number;
  skill: SkillLevel;
  title: string;
}

export interface Profile {
  name: string;
  avatar: string;
  frame: string; // 'none' or special design frame: 'bronze' | 'silver' | 'gold' | 'diamond' | 'cosmic' | 'neon'
  ageGroup: AgeGroup;
  xp: number;
  coins: number;
  stars: number;
  badges: string[]; // Badge IDs
  unlockedFrames: string[]; // Frame IDs
  unlockedAvatars: string[]; // Ready avatar list
  xpBoostEndTime?: number; // timestamp
  math: SubjectStats;
  english: SubjectStats;
  writing: SubjectStats;
  dailyMathCount: number;
  dailyEnglishCount: number;
  dailyWritingCount: number;
  lastDailyReset: string; // YYYY-MM-DD
  language?: 'uz' | 'en'; // Selected UI language
  musicStyle?: 'lofi' | 'happy' | 'piano' | 'waves'; // Selected background music track
}

export interface Badge {
  id: string;
  title: string;
  uzbekTitle: string;
  description: string;
  uzbekDescription: string;
  icon: string; // Lucide icon identifier
  color: string;
}

export interface ShopItem {
  id: string;
  title: string;
  uzbekTitle: string;
  cost: number;
  type: 'frame' | 'avatar' | 'booster';
  value: string; // e.g. color class or avatar URL or multiplier
  description: string;
  uzbekDescription: string;
}

export interface LeaderboardEntry {
  name: string;
  lvl: number;
  xp: number;
  avatar: string;
  frame: string;
  isCurrentUser?: boolean;
}

export interface MathQuestion {
  id: string;
  question: string;
  options?: string[];
  answer: string;
  type: 'multiple' | 'input' | 'count';
  itemsCount?: number; // for visual graphics in 5-8 yosh (e.g. apple icon)
  promptUz?: string;
  voicePrompt?: string;
}

export interface EnglishQuestion {
  id: string;
  question: string;
  options?: string[];
  answer: string; // correct word or letter
  type: 'word' | 'grammar' | 'sentence' | 'listening';
  promptUz?: string;
  voicePrompt?: string;
}

export interface WritingTask {
  id: string;
  topic: string;
  uzTopic: string;
  description: string;
  uzDescription: string;
  suggestedWords?: string[];
}
