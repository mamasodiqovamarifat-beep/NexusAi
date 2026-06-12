import { Trophy, TrendingUp, Award, Zap } from 'lucide-react';
import { Profile, LeaderboardEntry } from '../types';

interface LeaderboardProps {
  profile: Profile;
}

const DEFAULT_COMPETITORS: LeaderboardEntry[] = [
  { name: 'Sarvar Bilimdon ⚡', lvl: 14, xp: 2450, avatar: '👦', frame: 'f_gold' },
  { name: 'Lobar Smart 🌸', lvl: 11, xp: 1980, avatar: '👧', frame: 'none' },
  { name: 'Dilshod Math 📐', lvl: 9, xp: 1420, avatar: '👦', frame: 'f_bronze' },
  { name: 'Jasur English 🇬🇧', lvl: 15, xp: 2610, avatar: '🦁', frame: 'f_cosmic' },
  { name: 'Nafisa Story ✍️', lvl: 8, xp: 1150, avatar: '🦄', frame: 'none' },
  { name: 'Olimjon Solver', lvl: 5, xp: 750, avatar: '🦉', frame: 'none' }
];

export default function Leaderboard({ profile }: LeaderboardProps) {
  // Aggregate current player's stats
  const playerXP = profile.xp;
  const playerLvl = Math.floor(playerXP / 350) + 1;

  // Insert player and sort
  const allEntries: LeaderboardEntry[] = [
    ...DEFAULT_COMPETITORS,
    {
      name: `${profile.name} (Siz) ⭐`,
      lvl: playerLvl,
      xp: playerXP,
      avatar: profile.avatar || '👶',
      frame: profile.frame,
      isCurrentUser: true
    }
  ].sort((a, b) => b.xp - a.xp);

  const getRankBadgeColor = (index: number) => {
    if (index === 0) return 'bg-yellow-400 text-slate-900 border-2 border-yellow-300';
    if (index === 1) return 'bg-slate-350 text-slate-800 border-2 border-slate-200';
    if (index === 2) return 'bg-amber-600 text-white border-2 border-amber-500';
    return 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="bg-white rounded-3xl p-6 border-3 border-gray-100 shadow-xl space-y-6">
      {/* League Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-5 rounded-2xl border-b-4 border-indigo-800 flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs bg-indigo-500/50 px-2.5 py-1 rounded-full font-bold uppercase tracking-widest text-indigo-100">
            Haftalik Turnir
          </span>
          <h3 className="text-xl font-bold font-sans flex items-center gap-2">
            🥇 Oltin Chempionlar Ligasi
          </h3>
          <p className="text-xs text-indigo-100">
            Har safar savollarni to&apos;g&apos;ri yechib, Yuqori reytinglarga ko&apos;tariling!
          </p>
        </div>
        <Trophy className="w-12 h-12 text-yellow-300 animate-pulse shrink-0" />
      </div>

      {/* Leaderboard entries */}
      <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden shadow-inner bg-slate-50">
        {allEntries.map((entry, index) => {
          const rank = index + 1;

          return (
            <div
              key={index}
              className={`flex items-center justify-between p-4 transition ${
                entry.isCurrentUser
                  ? 'bg-yellow-50/70 border-l-4 border-yellow-400 font-bold'
                  : 'bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Ranking circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 shadow-sm ${getRankBadgeColor(index)}`}
                >
                  {rank}
                </div>

                {/* Avatar representation matching actual cosmetics */}
                <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
                  <div className="text-2xl z-10">{entry.avatar}</div>
                  {/* Absolute frame background style conditional */}
                  {entry.frame && entry.frame !== 'none' && (
                    <div
                      className={`absolute inset-0 rounded-xl border-2 pointer-events-none ${
                        entry.frame === 'f_bronze'
                          ? 'border-amber-700'
                          : entry.frame === 'f_silver'
                          ? 'border-slate-350 bg-slate-100/10'
                          : entry.frame === 'f_gold'
                          ? 'border-yellow-400 bg-amber-50/10'
                          : entry.frame === 'f_cosmic'
                          ? 'border-purple-600 bg-purple-900/10'
                          : 'border-cyan-400 bg-cyan-900/10'
                      }`}
                    />
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    {entry.name}
                    {rank <= 3 && <Award className="w-3.5 h-3.5 text-yellow-500" />}
                  </h4>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Daraja: <span className="text-blue-600 font-bold">{entry.lvl}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl font-bold text-sm border border-blue-100 shadow-sm font-mono shrink-0">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>{entry.xp} XP</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Promotion Status info banner */}
      <div className="bg-green-50 rounded-2xl p-4 border border-green-200 text-green-800 flex items-center gap-3">
        <TrendingUp className="w-6 h-6 text-green-600 shrink-0" />
        <div className="text-xs">
          <p className="font-bold">Reytingingiz ko&apos;tarilmoqda!</p>
          <p className="text-green-700">Insholarni AI Coach orqali tekshirtirish va to&apos;g&apos;ri javoblar ko&apos;p ball olib keladi!</p>
        </div>
      </div>
    </div>
  );
}
