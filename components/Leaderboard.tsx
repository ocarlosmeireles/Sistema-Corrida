
import React, { useState } from 'react';
import { Member, WindRank } from '../types';
import { Crown, Zap, MapPin, TrendingUp, Medal, Flame } from 'lucide-react';

interface LeaderboardProps {
  members: Member[];
  onMemberClick: (id: string) => void;
}

// Colors and Icons for Ranks
const getRankStyle = (rank: WindRank) => {
  switch (rank) {
    case WindRank.TORNADO: return { color: "text-purple-500", bg: "bg-purple-100 dark:bg-purple-500/20", border: "border-purple-500", icon: "🌪️" };
    case WindRank.HURRICANE: return { color: "text-red-500", bg: "bg-red-100 dark:bg-red-500/20", border: "border-red-500", icon: "🌩️" };
    case WindRank.STORM: return { color: "text-orange-500", bg: "bg-orange-100 dark:bg-orange-500/20", border: "border-orange-500", icon: "⛈️" };
    case WindRank.GALE: return { color: "text-yellow-500", bg: "bg-yellow-100 dark:bg-yellow-500/20", border: "border-yellow-500", icon: "🌬️" };
    case WindRank.GUST: return { color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-500/20", border: "border-blue-500", icon: "💨" };
    case WindRank.BREEZE: return { color: "text-green-500", bg: "bg-green-100 dark:bg-green-500/20", border: "border-green-500", icon: "🍃" };
    default: return { color: "text-gray-500", bg: "bg-gray-100 dark:bg-gray-800", border: "border-gray-500", icon: "🌫️" };
  }
};

type LeaderboardMode = 'distance' | 'season' | 'legend';

export const Leaderboard: React.FC<LeaderboardProps> = ({ members, onMemberClick }) => {
  const [mode, setMode] = useState<LeaderboardMode>('season');

  // Sort Logic
  let sortedMembers = [...members];
  
  if (mode === 'distance') {
      sortedMembers.sort((a, b) => b.totalDistance - a.totalDistance);
  } else if (mode === 'season') {
      sortedMembers.sort((a, b) => b.seasonScore - a.seasonScore);
  } else if (mode === 'legend') {
      // Sort by frequency (number of activities in last 90 days)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      sortedMembers.sort((a, b) => {
          const countA = a.activities.filter(act => new Date(act.date) >= ninetyDaysAgo).length;
          const countB = b.activities.filter(act => new Date(act.date) >= ninetyDaysAgo).length;
          return countB - countA;
      });
  }

  const top3 = sortedMembers.slice(0, 3);
  const rest = sortedMembers.slice(3);

  // Value accessor helper
  const getValue = (m: Member) => {
      if (mode === 'season') return m.seasonScore;
      if (mode === 'distance') return m.totalDistance;
      // Legend mode: Activity Count
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      return m.activities.filter(act => new Date(act.date) >= ninetyDaysAgo).length;
  };
  
  const maxValue = sortedMembers.length > 0 ? getValue(sortedMembers[0]) : 1;

  const getUnit = () => {
      if (mode === 'season') return 'XP';
      if (mode === 'distance') return 'km';
      return 'treinos';
  };

  return (
    <div className="space-y-8 pb-20 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Crown className="text-amber-500" /> Ranking dos Ventos
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {mode === 'season' ? 'Quem domina a temporada (XP).' : mode === 'distance' ? 'Os maiores acumuladores de milhas (KM).' : 'Quem mais treina nos últimos 90 dias.'}
          </p>
        </div>
        
        <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex items-center self-start md:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setMode('season')}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              mode === 'season' 
                ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm' 
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            <Zap size={16} /> XP
          </button>
          <button
            onClick={() => setMode('distance')}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              mode === 'distance' 
                ? 'bg-white dark:bg-gray-700 text-amber-600 dark:text-amber-400 shadow-sm' 
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            <MapPin size={16} /> KM
          </button>
          <button
            onClick={() => setMode('legend')}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              mode === 'legend' 
                ? 'bg-white dark:bg-gray-700 text-yellow-500 shadow-sm' 
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            <Flame size={16} /> Lendas
          </button>
        </div>
      </div>

      {/* --- PODIUM SECTION --- */}
      {top3.length > 0 && (
        <div className="flex justify-center items-end gap-2 md:gap-6 py-4 mb-8">
            {/* 2nd Place */}
            {top3[1] && (
                <div className="flex flex-col items-center cursor-pointer group" onClick={() => onMemberClick(top3[1].id)}>
                    <div className="relative">
                        <img src={top3[1].avatarUrl} className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-gray-300 dark:border-gray-500 object-cover shadow-lg group-hover:scale-105 transition-transform" alt={top3[1].name} />
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gray-300 dark:bg-gray-500 text-gray-900 font-black text-xs px-2 py-0.5 rounded-full border-2 border-white dark:border-gray-800">2º</div>
                    </div>
                    <div className="mt-4 text-center">
                        <p className="font-bold text-gray-900 dark:text-white text-sm md:text-base truncate max-w-[100px]">{top3[1].name}</p>
                        <p className={`text-xs font-bold ${mode === 'season' ? 'text-purple-500' : 'text-amber-500'}`}>
                            {mode === 'distance' ? top3[1].totalDistance.toFixed(0) : getValue(top3[1])} {getUnit()}
                        </p>
                        <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 mt-1 inline-block`}>
                            {top3[1].rank}
                        </span>
                    </div>
                    <div className="h-24 w-full bg-gradient-to-t from-gray-200/50 to-gray-100/0 dark:from-gray-800/50 dark:to-gray-800/0 mt-2 rounded-t-lg"></div>
                </div>
            )}

            {/* 1st Place */}
            {top3[0] && (
                <div className="flex flex-col items-center z-10 -mx-2 md:mx-0 cursor-pointer group" onClick={() => onMemberClick(top3[0].id)}>
                    <div className="relative">
                        <Crown size={32} className="absolute -top-8 left-1/2 -translate-x-1/2 text-yellow-400 animate-bounce-slow filter drop-shadow-lg" fill="currentColor" />
                        <img src={top3[0].avatarUrl} className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-yellow-400 object-cover shadow-xl shadow-yellow-400/20 group-hover:scale-105 transition-transform" alt={top3[0].name} />
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 font-black text-sm px-3 py-0.5 rounded-full border-2 border-white dark:border-gray-800">1º</div>
                    </div>
                    <div className="mt-5 text-center">
                        <p className="font-bold text-gray-900 dark:text-white text-base md:text-lg">{top3[0].name}</p>
                        <p className={`text-sm font-black ${mode === 'season' ? 'text-purple-500' : 'text-amber-500'}`}>
                            {mode === 'distance' ? top3[0].totalDistance.toFixed(0) : getValue(top3[0])} {getUnit()}
                        </p>
                        {mode === 'legend' && (
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-yellow-400/20 text-yellow-500 mt-1 inline-block border border-yellow-400/30">
                                Lenda do Vento
                            </span>
                        )}
                        {mode !== 'legend' && (
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-yellow-400/10 text-yellow-600 dark:text-yellow-400 mt-1 inline-block border border-yellow-400/20`}>
                                {top3[0].rank}
                            </span>
                        )}
                    </div>
                    <div className="h-32 w-full bg-gradient-to-t from-yellow-400/20 to-yellow-400/0 mt-2 rounded-t-lg shadow-[0_0_20px_rgba(250,204,21,0.1)]"></div>
                </div>
            )}

            {/* 3rd Place */}
            {top3[2] && (
                <div className="flex flex-col items-center cursor-pointer group" onClick={() => onMemberClick(top3[2].id)}>
                    <div className="relative">
                        <img src={top3[2].avatarUrl} className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-orange-400 object-cover shadow-lg group-hover:scale-105 transition-transform" alt={top3[2].name} />
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-orange-400 text-orange-900 font-black text-xs px-2 py-0.5 rounded-full border-2 border-white dark:border-gray-800">3º</div>
                    </div>
                    <div className="mt-4 text-center">
                        <p className="font-bold text-gray-900 dark:text-white text-sm md:text-base truncate max-w-[100px]">{top3[2].name}</p>
                        <p className={`text-xs font-bold ${mode === 'season' ? 'text-purple-500' : 'text-amber-500'}`}>
                            {mode === 'distance' ? top3[2].totalDistance.toFixed(0) : getValue(top3[2])} {getUnit()}
                        </p>
                        <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 mt-1 inline-block`}>
                            {top3[2].rank}
                        </span>
                    </div>
                    <div className="h-16 w-full bg-gradient-to-t from-orange-400/20 to-orange-400/0 mt-2 rounded-t-lg"></div>
                </div>
            )}
        </div>
      )}

      {/* --- LIST SECTION --- */}
      <div className="grid gap-3">
        {rest.map((member, index) => {
          const realIndex = index + 3;
          const style = getRankStyle(member.rank);
          const val = getValue(member);
          const percent = Math.max(5, (val / maxValue) * 100);

          return (
            <div 
              key={member.id}
              onClick={() => onMemberClick(member.id)}
              className="relative overflow-hidden bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-amber-500/50 transition-all cursor-pointer group"
            >
              {/* Relative Progress Bar Background */}
              <div 
                className={`absolute left-0 top-0 bottom-0 opacity-5 dark:opacity-10 transition-all duration-1000 ${mode === 'season' ? 'bg-purple-500' : 'bg-amber-500'}`}
                style={{ width: `${percent}%` }}
              ></div>

              <div className="flex items-center relative z-10">
                <div className="w-8 font-mono font-bold text-gray-400 text-center mr-4">
                  {realIndex + 1}
                </div>

                <img 
                  src={member.avatarUrl} 
                  alt={member.name}
                  className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600 mr-4 group-hover:scale-110 transition-transform" 
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate">{member.name}</h3>
                  </div>
                  <div className="flex items-center mt-0.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase flex items-center gap-1 ${style.bg} ${style.color}`}>
                        {style.icon} {member.rank}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-lg font-bold font-mono ${mode === 'season' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-900 dark:text-white'}`}>
                    {mode === 'distance' ? val.toFixed(1) : val}
                    <span className="text-xs text-gray-400 ml-1 font-sans">
                      {getUnit()}
                    </span>
                  </div>
                  {mode === 'season' && (
                      <div className="text-[10px] text-gray-400 flex items-center justify-end gap-1">
                          <TrendingUp size={10} /> Score
                      </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
