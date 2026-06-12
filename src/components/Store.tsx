import React from 'react';
import { ShoppingBag, Sparkles, Shield, Zap, BadgeCheck, Check } from 'lucide-react';
import { Profile, ShopItem } from '../types';
import { playSuccessChime } from '../utils/audio';

interface StoreProps {
  profile: Profile;
  onUpdateProfile: (updated: Profile) => void;
  onShowMessage: (text: string, type: 'success' | 'info') => void;
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'f_bronze',
    title: 'Bronze Frame',
    uzbekTitle: 'Bronza Hoshiya',
    cost: 100,
    type: 'frame',
    value: 'border-amber-700 shadow-md',
    description: 'A gorgeous rustic copper frame.',
    uzbekDescription: 'Chiroyli mis-bronza rangli hoshiya.'
  },
  {
    id: 'f_silver',
    title: 'Silver Expert Frame',
    uzbekTitle: 'Kumush Hoshiya',
    cost: 250,
    type: 'frame',
    value: 'border-slate-350 shadow-lg shadow-slate-200 animate-pulse',
    description: 'A solid silver frame showing great early achievements.',
    uzbekDescription: 'Mukammal kumushrangli yorqin hoshiya.'
  },
  {
    id: 'f_gold',
    title: 'Golden Aura Frame',
    uzbekTitle: 'Oltin Aura Hoshiyasi',
    cost: 500,
    type: 'frame',
    value: 'border-yellow-400 bg-amber-50 shadow-xl ring-4 ring-yellow-300 animate-bounce',
    description: 'A highly esteemed, pure gold frame with a floating effect.',
    uzbekDescription: 'Sof tillarang aura taratuvchi oliymaqom oltin hoshiya.'
  },
  {
    id: 'f_cosmic',
    title: 'Cosmic Stardust Frame',
    uzbekTitle: 'Moychechak Kosmik Aura',
    cost: 950,
    type: 'frame',
    value: 'border-purple-600 bg-slate-900 shadow-xl ring-4 ring-purple-500 animate-pulse text-purple-100',
    description: 'An elite cosmic frame filled with moving stardust particles.',
    uzbekDescription: 'Yulduzlar changi bilan qoplangan premium kosmik hoshiya.'
  },
  {
    id: 'f_neon',
    title: 'Cyber Cyberpunk Neon',
    uzbekTitle: 'Kiber Neon Hoshiya',
    cost: 1500,
    type: 'frame',
    value: 'border-cyan-400 bg-black shadow-cyan-300 shadow-2xl ring-4 ring-pink-500',
    description: 'A futuristic cybernetic neon frame that shines intensely.',
    uzbekDescription: 'Kelajak uslubidagi kiber-pank rangdor yorqin hoshiya.'
  },
  {
    id: 'b_xp_boost',
    title: '2X XP Boost (10 mins)',
    uzbekTitle: '2X XP Kuchaytirgich (10 daqiqa)',
    cost: 150,
    type: 'booster',
    value: '2',
    description: 'Earn twice the amount of XP points from all Math/English tasks.',
    uzbekDescription: '10 daqiqa davomida matematika va ingliz tilidan 2 barobar ko\'p XP oling!'
  },
  {
    id: 'a_astronaut',
    title: 'Astronaut Kid Avatar',
    uzbekTitle: 'Falajgishti Bola Avatari',
    cost: 300,
    type: 'avatar',
    value: '👨‍🚀',
    description: 'Unlock the special Space Explorer avatar style.',
    uzbekDescription: 'Fazogir kiyimidagi ajoyib sarguzashtchi bola surati.'
  },
  {
    id: 'a_wizard',
    title: 'Math Wizard Avatar',
    uzbekTitle: 'Riyozatchi Sehrgar Avatari',
    cost: 400,
    type: 'avatar',
    value: '🧙‍♂️',
    description: 'A premium wizard avatar style.',
    uzbekDescription: 'Matematika tilsimlarini yechuvchi sehrgar kulgich avatari.'
  }
];

export default function Store({ profile, onUpdateProfile, onShowMessage }: StoreProps) {
  const buyItem = (item: ShopItem) => {
    if (profile.coins < item.cost) {
      onShowMessage("Mablag' yetarli emas! Ko'proq masalalar yechib tangalar to'plang. 🪙", 'info');
      return;
    }

    const updated = { ...profile };
    updated.coins -= item.cost;

    if (item.type === 'frame') {
      if (updated.unlockedFrames.includes(item.id)) {
        onShowMessage("Ushbu hoshiyani allaqachon sotib olgansiz!", 'info');
        return;
      }
      updated.unlockedFrames.push(item.id);
      updated.frame = item.id; // Automatically equip
    } else if (item.type === 'avatar') {
      if (updated.unlockedAvatars.includes(item.value)) {
        onShowMessage("Ushbu avatarni allaqachon sotib olgansiz!", 'info');
        return;
      }
      updated.unlockedAvatars.push(item.value);
      updated.avatar = item.value; // Automatically equip
    } else if (item.type === 'booster') {
      // Add 10 mins booster
      const duration = 10 * 60 * 1000;
      updated.xpBoostEndTime = Date.now() + duration;
    }

    playSuccessChime();
    onUpdateProfile(updated);
    onShowMessage(`Xarid muvaffaqiyatli amalga oshirildi! "${item.uzbekTitle}" sotib olindi! 🛍️✨`, 'success');
  };

  const equipFrame = (item: ShopItem) => {
    const updated = { ...profile };
    updated.frame = item.id;
    onUpdateProfile(updated);
    onShowMessage(`Yangi hoshiya kiyildi: "${item.uzbekTitle}"`, 'success');
  };

  const equipAvatar = (val: string) => {
    const updated = { ...profile };
    updated.avatar = val;
    onUpdateProfile(updated);
    onShowMessage(`Yangi avatar kiyildi!`, 'success');
  };

  const isBoosterActive = profile.xpBoostEndTime && profile.xpBoostEndTime > Date.now();
  const boosterTimeLeft = isBoosterActive ? Math.ceil((profile.xpBoostEndTime! - Date.now()) / (60 * 1000)) : 0;

  return (
    <div className="space-y-6">
      {/* Balance panel */}
      <div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-3xl p-6 text-slate-950 shadow-xl border-b-4 border-amber-600 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-sans">Sotib olish va jihozlash do&apos;koni 🛒</h2>
          <p className="text-xs text-amber-950 font-medium">To&apos;g&apos;ri javoblaringiz evaziga to&apos;plangan tangalarni sarflang!</p>
          {isBoosterActive && (
            <div className="mt-3 inline-flex items-center gap-1.5 bg-white/30 px-3 py-1 rounded-full text-xs font-bold text-slate-900 border border-white/50 animate-pulse">
              <Zap className="w-3.5 h-3.5 text-yellow-600" />
              XP Booster faol: {boosterTimeLeft} daqiqa qoldi!
            </div>
          )}
        </div>
        <div className="bg-white px-5 py-3 rounded-2xl border-2 border-amber-300 flex items-center gap-2 shadow-inner">
          <span className="text-3xl">🪙</span>
          <div>
            <div className="text-2xl font-black font-mono leading-none">{profile.coins}</div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Mening tangalarim</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SHOP_ITEMS.map((item) => {
          const isFrameOwned = item.type === 'frame' && profile.unlockedFrames.includes(item.id);
          const isAvatarOwned = item.type === 'avatar' && profile.unlockedAvatars.includes(item.value);
          const isEquippedFrame = item.type === 'frame' && profile.frame === item.id;
          const isEquippedAvatar = item.type === 'avatar' && profile.avatar === item.value;

          return (
            <div
              key={item.id}
              className={`bg-white rounded-2xl p-5 border-2 text-slate-800 shadow-md hover:shadow-lg transition flex flex-col justify-between ${
                isEquippedFrame || isEquippedAvatar ? 'border-yellow-400 bg-yellow-50/20' : 'border-slate-100 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center justify-center shrink-0 w-16 h-16 relative">
                  {item.type === 'frame' && (
                    <div className={`w-8 h-8 rounded-full border-4 flex items-center justify-center font-bold text-lg ${item.value}`}>
                      🦉
                    </div>
                  )}
                  {item.type === 'booster' && <Zap className="w-8 h-8 text-yellow-500 animate-pulse" />}
                  {item.type === 'avatar' && <span className="text-4xl">{item.value}</span>}
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-black text-blue-600 tracking-wider font-mono">
                    {item.type === 'frame' ? 'HOSHIYA' : item.type === 'booster' ? 'KUCHAYTIRGICH' : 'AVATAR'}
                  </span>
                  <h4 className="font-bold text-base text-slate-900 leading-tight">{item.uzbekTitle}</h4>
                  <p className="text-xs text-slate-500">{item.uzbekDescription}</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full text-sm font-bold text-slate-700">
                  <span>🪙</span>
                  <span className="font-mono">{item.cost}</span>
                </div>

                {isFrameOwned ? (
                  isEquippedFrame ? (
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-xl border border-green-200 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 stroke-[3]" /> Kiyilgan
                    </span>
                  ) : (
                    <button
                      onClick={() => equipFrame(item)}
                      className="text-xs font-bold cursor-pointer bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-1.5 rounded-xl transition"
                    >
                      Kiyish
                    </button>
                  )
                ) : isAvatarOwned ? (
                  isEquippedAvatar ? (
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-xl border border-green-200 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 stroke-[3]" /> Kiyilgan
                    </span>
                  ) : (
                    <button
                      onClick={() => equipAvatar(item.value)}
                      className="text-xs font-bold cursor-pointer bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-1.5 rounded-xl transition"
                    >
                      Kiyish
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => buyItem(item)}
                    className="text-xs font-bold cursor-pointer bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-4 py-1.5 rounded-xl transition shadow-md shadow-blue-100"
                  >
                    Sotib olish
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
