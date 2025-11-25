
import React, { useState } from 'react';
import { Member, WindRank } from '../types';
import { Crown, Zap, MapPin } from 'lucide-react';

interface LeaderboardProps {
  members: Member[];
  onMemberClick: (id: string) => void;
}

// Colors and Icons for Ranks
const getRankStyle = (rank: WindRank) => {
  switch (rank) {
    case WindRank.TORNADO: return { color: "text-purple-500 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-400/10", icon: "🌪️" };
    case WindRank.HURRICANE: return { color: "text-red-500 dark:text-red-400", bg: "bg-red-100 dark:bg-red-400/10", icon: "🌩️" };
    case WindRank.STORM: return { color: "text-orange-500 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-400/10", icon: "⛈️" };
    case WindRank.GALE: return { color: "text-yellow-500 dark:text-yellow-400", bg: "bg-yellow-100 dark:bg-yellow-400/10", icon: "🌬️" };
    case WindRank.GUST: return { color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-400/10", icon: "💨" };
    case WindRank.BREEZE: return { color: "text-green-500 dark:text-green-400", bg: "bg-green-100 dark:bg-green-400/10", icon: "🍃" };
    default: return { color: "text-gray-500 dark:text-gray-400", bg: "bg-gray-100 dark:bg-gray-400/10", icon: "🌫️" };
  }
};

type LeaderboardMode = 'distance' | 'season';

export const Leaderboard: React.FC<LeaderboardProps> = ({ members, onMemberClick }) => {
  const [mode, setMode] = useState<LeaderboardMode>('season');

  // Sort Logic
  const sortedMembers = [...members].sort((a, b) => {
    if (mode === 'distance') {
      return b.totalDistance - a.totalDistance;
    } else {
      return b.seasonScore - a.seasonScore;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Ranking dos Ventos</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {mode === 'season' ? 'Pontuação acumulada na temporada atual (XP).' : 'Quilometragem total vitalícia.'}
          </p>
        </div>
        
        {/* Toggle Switch */}
        <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex items-center self-start md:self-auto">
          <button
            onClick={() => setMode('season')}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
              mode === 'season' 
                ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm' 
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            <Zap size={16} /> Temporada
          </button>
          <button
            onClick={() => setMode('distance')}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
              mode === 'distance' 
                ? 'bg-white dark:bg-gray-700 text-amber-600 dark:text-amber-400 shadow-sm' 
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            <MapPin size={16} /> Distância Total
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {sortedMembers.map((member, index) => {
          const style = getRankStyle(member.rank);
          const isTop3 = index < 3;

          return (
            <div 
              key={member.id}
              onClick={() => onMemberClick(member.id)}
              className={`relative flex items-center p-4 rounded-2xl border transition-all hover:scale-[1.01] cursor-pointer
                ${isTop3 
                  ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-md' 
                  : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'}
                ${mode === 'season' && isTop3 ? 'border-l-4 border-l-purple-500' : ''}
              `}
            >
              {/* Rank Position Number */}
              <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold mr-4 
                ${index === 0 ? 'bg-yellow-400 text-black' : 
                  index === 1 ? 'bg-gray-300 text-black' : 
                  index === 2 ? 'bg-amber-700 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                {index + 1}
              </div>

              {/* Avatar */}
              <img 
                src={member.avatarUrl} 
                alt={member.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-gray-100 dark:border-gray-700 mr-4" 
              />

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center">
                  <h3 className="font-bold text-gray-900 dark:text-white mr-2">{member.name}</h3>
                  {index === 0 && <Crown size={16} className="text-yellow-500" />}
                </div>
                <div className="flex items-center text-xs space-x-2 mt-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide flex items-center gap-1 ${style.bg} ${style.color}`}>
                    {style.icon} {member.rank}
                  </span>
                </div>
              </div>

              {/* Stats Display based on Mode */}
              <div className="text-right">
                <div className={`text-lg font-bold font-mono ${mode === 'season' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-900 dark:text-white'}`}>
                  {mode === 'season' 
                    ? member.seasonScore 
                    : member.totalDistance.toFixed(1)}
                  <span className="text-sm text-gray-400 ml-1">
                    {mode === 'season' ? 'XP' : 'km'}
                  </span>
                </div>
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                  {mode === 'season' ? 'Pontos da Liga' : 'Total Acumulado'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};