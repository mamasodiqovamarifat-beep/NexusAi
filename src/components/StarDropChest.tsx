import React, { useState } from 'react';
import { Sparkles, Gift, Flame, Trophy, Coins, RefreshCw } from 'lucide-react';
import { Profile } from '../types';
import { playStarDropSound, playSuccessChime } from '../utils/audio';

interface StarDropChestProps {
  profile: Profile;
  onUpdateProfile: (updated: Profile) => void;
  onShowMessage: (text: string, type: 'success' | 'info') => void;
  onClose: () => void;
}

interface DropResult {
  type: 'coins' | 'booster' | 'frame' | 'badge';
  title: string;
  amount?: number;
  value?: string;
  icon: string;
  color: string;
}

export default function StarDropChest({ profile, onUpdateProfile, onShowMessage, onClose }: StarDropChestProps) {
  const [chestState, setChestState] = useState<'closed' | 'shaking' | 'opened'>('closed');
  const [reward, setReward] = useState<DropResult | null>(null);

  const triggerOpen = () => {
    if (chestState !== 'closed') return;
    
    setChestState('shaking');
    playStarDropSound();

    setTimeout(() => {
      // Formulate random award drops matching user metrics
      const rand = Math.random();
      let drop: DropResult;

      if (rand < 0.40) {
        // High amount coins
        const amount = Math.floor(Math.random() * 150) + 75;
        drop = {
          type: 'coins',
          title: `${amount} Oltin Tangalar!`,
          amount,
          icon: '🪙',
          color: 'from-yellow-400 to-amber-500',
        };
      } else if (rand < 0.70) {
        // Boosters
        drop = {
          type: 'booster',
          title: 'Ikki barobar XP kuchi! (10 daqiqa)',
          icon: '⚡',
          color: 'from-blue-500 to-cyan-500',
        };
      } else if (rand < 0.90) {
        // Unlocked special frame
        const randomFrames = [
          { id: 'f_bronze', title: 'Bronze Frame (Omadli)' },
          { id: 'f_silver', title: 'Silver Expert Frame (Nodir)' },
          { id: 'f_gold', title: 'Golden Aura Frame (Lola afsonasi)' }
        ];
        const selected = randomFrames[Math.floor(Math.random() * randomFrames.length)];
        drop = {
          type: 'frame',
          title: `${selected.title} Hoshiyasi!`,
          value: selected.id,
          icon: '🖼️',
          color: 'from-purple-500 to-indigo-600',
        };
      } else {
        // Rare Badge
        drop = {
          type: 'badge',
          title: 'Yulduzli Chempion Medali! ⭐',
          value: 'star_champion',
          icon: '🏆',
          color: 'from-pink-500 to-rose-500',
        };
      }

      setChestState('opened');
      setReward(drop);
      playSuccessChime();

      // Apply changes to profile state
      const updated = { ...profile };
      if (drop.type === 'coins' && drop.amount) {
        updated.coins += drop.amount;
      } else if (drop.type === 'booster') {
        const duration = 10 * 60 * 1000;
        updated.xpBoostEndTime = Date.now() + duration;
      } else if (drop.type === 'frame' && drop.value) {
        if (!updated.unlockedFrames.includes(drop.value)) {
          updated.unlockedFrames.push(drop.value);
        }
        updated.frame = drop.value; // Automatic equip
      } else if (drop.type === 'badge' && drop.value) {
        if (!updated.badges.includes(drop.value)) {
          updated.badges.push(drop.value);
        }
      }

      onUpdateProfile(updated);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 border-4 border-slate-200 shadow-2xl relative overflow-hidden flex flex-col items-center">
        {/* Festive backgrounds */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-100 rounded-full filter blur-3xl opacity-60 z-0" />
        <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-blue-100 rounded-full filter blur-2xl opacity-50 z-0" />

        {chestState === 'closed' && (
          <div className="z-10 text-center space-y-6 py-6 flex flex-col items-center">
            <h3 className="text-2xl font-black font-sans text-slate-900 leading-tight">
              Ajoyib Omadingizni Sinang! ⭐
            </h3>
            <p className="text-sm text-slate-500 max-w-xs mx-auto">
              Duolingo-uslubidagi sehrli sandiqchamizda qanday noyob mukofot borligini ko&apos;rish uchun bosing!
            </p>

            {/* Static chest icon visually animated */}
            <div
              onClick={triggerOpen}
              className="w-40 h-40 bg-gradient-to-tr from-amber-600 to-amber-400 rounded-full shadow-lg border-b-6 border-amber-700 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-transform"
            >
              <Gift className="w-16 h-16 text-white" />
            </div>

            <button
              onClick={triggerOpen}
              className="w-full bg-yellow-400 hover:bg-yellow-500 cursor-pointer text-slate-950 px-6 py-3.5 rounded-2xl font-bold transition shadow-lg shadow-yellow-200 uppercase tracking-wider text-xs border-b-4 border-yellow-600"
            >
              Sandig&apos;ni Ochish! 🗝️
            </button>
          </div>
        )}

        {chestState === 'shaking' && (
          <div className="z-10 text-center space-y-6 py-10 flex flex-col items-center animate-pulse">
            <h3 className="text-2xl font-black font-sans text-amber-500">
              Sandiqcha Shovqinlanmoqda... 🌟
            </h3>
            <p className="text-sm text-slate-400">Sehrli nurlar yorqinlik kiritmoqda!</p>

            {/* Simulated shaking keyframe animation using simple react inline transition styles */}
            <div className="w-40 h-40 bg-gradient-to-tr from-yellow-500 to-red-400 rounded-full shadow-inner flex items-center justify-center animate-bounce">
              <Gift className="w-16 h-16 text-white" />
            </div>
          </div>
        )}

        {chestState === 'opened' && reward && (
          <div className="z-10 text-center space-y-6 py-4 flex flex-col items-center">
            <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
              Tabriklaymiz! 🎉
            </div>
            <h3 className="text-2xl font-black font-sans text-slate-900 leading-tight">
              Siz Noyob Mukofot Yutdingiz!
            </h3>

            {/* Large item visual drop card */}
            <div className={`p-6 rounded-3xl bg-gradient-to-tr ${reward.color} text-white shadow-xl max-w-xs w-64 border-b-4 border-black/20 flex flex-col items-center space-y-4 animate-scaleUp`}>
              <span className="text-6xl animate-bounce">{reward.icon}</span>
              <div className="text-center">
                <h4 className="font-extrabold text-lg leading-tight uppercase tracking-wide">
                  {reward.title}
                </h4>
                <p className="text-xs text-white/80 mt-1 font-mono">Mukofot balansi kiritildi</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-blue-600 hover:bg-blue-700 cursor-pointer text-white px-6 py-3.5 rounded-2xl font-bold transition shadow-lg shadow-blue-200 text-sm border-b-4 border-blue-800"
            >
              Platformaga Qayg&apos;ulish 👍
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
