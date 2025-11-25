
import React from 'react';
import { Season, Member, WindRank } from '../types';
import { Timer, Gift, Info, TrendingUp, Heart, Share2, Award } from 'lucide-react';

interface SeasonsProps {
  season: Season;
  members: Member[];
  onViewLeaderboard: () => void;
}

export const Seasons: React.FC<SeasonsProps> = ({ season, members, onViewLeaderboard }) => {
  // Sort members by Season Score (XP)
  const seasonLeaders = [...members].sort((a, b) => b.seasonScore - a.seasonScore).slice(0, 3);

  const calculateDaysLeft = () => {
    const end = new Date(season.endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  const daysLeft = calculateDaysLeft();
  const progressPercent = Math.min(100, Math.max(0, 100 - (daysLeft / 90) * 100)); // Assuming 90 days season

  return (
    <div className="space-y-8 pb-24 animate-fade-in">
      {/* Hero Season Card */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900 to-indigo-900 opacity-90 z-0"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 z-0"></div>
        
        <div className="relative z-10 p-8 text-white">
            <div className="flex justify-between items-start mb-6">
                <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-white/20 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                    Temporada Ativa
                </div>
                <div className="text-right">
                    <div className="text-3xl font-mono font-bold">{daysLeft}</div>
                    <div className="text-xs text-purple-200 uppercase tracking-wider">Dias Restantes</div>
                </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-white drop-shadow-sm">
                {season.title}
            </h1>
            <p className="text-purple-100 text-lg max-w-xl leading-relaxed mb-8">
                {season.description}
            </p>

            {/* Progress Bar */}
            <div className="mb-2 flex justify-between text-xs font-bold uppercase tracking-wider text-purple-200">
                <span>Início</span>
                <span>Grande Final</span>
            </div>
            <div className="h-3 bg-black/30 rounded-full overflow-hidden mb-6">
                <div 
                    className="h-full bg-gradient-to-r from-purple-400 to-pink-400 shadow-[0_0_10px_rgba(192,132,252,0.5)]" 
                    style={{ width: `${progressPercent}%` }}
                ></div>
            </div>

            <button 
                onClick={onViewLeaderboard}
                className="bg-white text-purple-900 hover:bg-purple-50 font-bold py-3 px-8 rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
            >
                <Award size={20} />
                Ver Ranking da Temporada
            </button>
        </div>
      </div>

      {/* Sponsors & Prizes */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Gift className="text-purple-500" />
            Prêmios Oficiais
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {season.sponsors.map((sponsor) => (
                <div key={sponsor.id} className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-purple-400 dark:hover:border-purple-500 transition-all shadow-sm hover:shadow-xl">
                    <div className="h-32 bg-gray-100 dark:bg-gray-900 relative flex items-center justify-center p-6">
                        {/* Logo Placeholder - In a real app this would be an image */}
                        <div className="text-2xl font-black text-gray-300 dark:text-gray-700 uppercase tracking-tighter">
                            {sponsor.name}
                        </div>
                        <div className="absolute top-2 right-2 bg-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                            Patrocinador
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="flex items-start gap-4 mb-4">
                            <img src={sponsor.prizeImageUrl} alt="Prize" className="w-16 h-16 rounded-xl object-cover bg-gray-200" />
                            <div>
                                <p className="text-xs text-purple-600 dark:text-purple-400 font-bold uppercase mb-1">Prêmio do Vencedor</p>
                                <h3 className="font-bold text-gray-900 dark:text-white leading-tight">{sponsor.prizeDescription}</h3>
                            </div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                            O atleta com maior pontuação XP ao final da temporada levará este kit exclusivo oferecido pela {sponsor.name}.
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Scoring Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Info size={20} className="text-amber-500" /> Como ganhar Pontos (XP)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700">
                        <div className="bg-green-100 dark:bg-green-500/20 p-3 rounded-lg text-green-600 dark:text-green-400">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <div className="font-bold text-gray-900 dark:text-white text-lg">10 XP</div>
                            <div className="text-sm text-gray-500">A cada 1km corrido</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700">
                        <div className="bg-amber-100 dark:bg-amber-500/20 p-3 rounded-lg text-amber-600 dark:text-amber-400">
                            <Award size={24} />
                        </div>
                        <div>
                            <div className="font-bold text-gray-900 dark:text-white text-lg">100 XP</div>
                            <div className="text-sm text-gray-500">Missão Diária Cumprida</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700">
                        <div className="bg-red-100 dark:bg-red-500/20 p-3 rounded-lg text-red-600 dark:text-red-400">
                            <Share2 size={24} />
                        </div>
                        <div>
                            <div className="font-bold text-gray-900 dark:text-white text-lg">20 XP</div>
                            <div className="text-sm text-gray-500">História Compartilhada</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700">
                        <div className="bg-blue-100 dark:bg-blue-500/20 p-3 rounded-lg text-blue-600 dark:text-blue-400">
                            <Heart size={24} />
                        </div>
                        <div>
                            <div className="font-bold text-gray-900 dark:text-white text-lg">5 XP</div>
                            <div className="text-sm text-gray-500">Interagir com a equipe</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Top 3 Season Preview */}
        <div className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-gray-700">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Award size={100} />
            </div>
            <h3 className="text-lg font-bold mb-6 relative z-10">Pódio Atual</h3>
            
            <div className="space-y-4 relative z-10">
                {seasonLeaders.map((member, index) => (
                    <div key={member.id} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-gray-900 
                            ${index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-gray-300' : 'bg-orange-400'}`}>
                            {index + 1}
                        </div>
                        <img src={member.avatarUrl} className="w-10 h-10 rounded-full border-2 border-gray-700" alt={member.name} />
                        <div className="flex-1 min-w-0">
                            <p className="font-bold truncate text-sm">{member.name}</p>
                            <p className="text-xs text-gray-400">{member.rank}</p>
                        </div>
                        <div className="text-right">
                            <span className="font-mono font-bold text-yellow-400">{member.seasonScore}</span>
                            <span className="text-[10px] text-gray-500 block uppercase">XP</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-700 text-center">
                <p className="text-xs text-gray-400 mb-2">A temporada encerra em {new Date(season.endDate).toLocaleDateString()}</p>
                <button onClick={onViewLeaderboard} className="text-sm font-bold text-yellow-400 hover:text-yellow-300 underline">
                    Ver Ranking Completo
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};