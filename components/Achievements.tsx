
import React from 'react';
import { Achievement } from '../types';
import { Lock, CheckCircle2, Trophy, Star } from 'lucide-react';

export const ACHIEVEMENTS_LIST: Achievement[] = [
  // --- DISTÂNCIA ÚNICA ---
  {
    id: 'first_run',
    title: 'Primeiro Sopro',
    description: 'Complete sua primeira corrida.',
    icon: '🍃',
    conditionType: 'total_distance',
    threshold: 0.1
  },
  {
    id: '5k_runner',
    title: 'Rajada de 5K',
    description: 'Complete uma corrida de 5km.',
    icon: '💨',
    conditionType: 'distance_single',
    threshold: 5
  },
  {
    id: '10k_runner',
    title: 'Vendaval de 10K',
    description: 'Supere a marca dos 10km em um treino.',
    icon: '🌪️',
    conditionType: 'distance_single',
    threshold: 10
  },
  {
    id: '21k_runner',
    title: 'Meia Tempestade',
    description: 'Complete uma Meia Maratona (21km).',
    icon: '⚡',
    conditionType: 'distance_single',
    threshold: 21
  },
  {
    id: '42k_runner',
    title: 'O Furacão (42k)',
    description: 'Complete uma Maratona completa.',
    icon: '👑',
    conditionType: 'distance_single',
    threshold: 42
  },

  // --- DISTÂNCIA TOTAL ---
  {
    id: 'total_50',
    title: 'Brisa Constante',
    description: 'Acumule 50km totais.',
    icon: '🌱',
    conditionType: 'total_distance',
    threshold: 50
  },
  {
    id: 'total_100',
    title: 'Corrente de Ar',
    description: 'Acumule 100km totais.',
    icon: '🌫️',
    conditionType: 'total_distance',
    threshold: 100
  },
  {
    id: 'total_500',
    title: 'Ciclone',
    description: 'Acumule 500km totais.',
    icon: '🌀',
    conditionType: 'total_distance',
    threshold: 500
  },
  {
    id: 'total_1000',
    title: 'Lenda do Vento',
    description: 'Acumule 1000km totais.',
    icon: '🗿',
    conditionType: 'total_distance',
    threshold: 1000
  },

  // --- PACE (VELOCIDADE) ---
  // Threshold em SEGUNDOS por KM (ex: 6 min = 360s)
  {
    id: 'pace_6',
    title: 'Quebrando a Barreira',
    description: 'Faça um treino com pace abaixo de 6:00 min/km.',
    icon: '🐇',
    conditionType: 'pace',
    threshold: 360 
  },
  {
    id: 'pace_5',
    title: 'Velocidade do Som',
    description: 'Faça um treino com pace abaixo de 5:00 min/km.',
    icon: '🚀',
    conditionType: 'pace',
    threshold: 300
  },
  {
    id: 'pace_4',
    title: 'Mach 1',
    description: 'Faça um treino com pace abaixo de 4:00 min/km.',
    icon: '🔥',
    conditionType: 'pace',
    threshold: 240
  },

  // --- STREAK (SEQUÊNCIA) ---
  {
    id: 'streak_3',
    title: 'Tripla Rajada',
    description: 'Corra 3 dias consecutivos.',
    icon: '📅',
    conditionType: 'streak',
    threshold: 3
  },
  {
    id: 'streak_7',
    title: 'Semana de Ventania',
    description: 'Corra 7 dias consecutivos.',
    icon: '🗓️',
    conditionType: 'streak',
    threshold: 7
  },
  {
    id: 'streak_30',
    title: 'Mês do Tufão',
    description: 'Mantenha uma sequência de 30 dias.',
    icon: '🌕',
    conditionType: 'streak',
    threshold: 30
  },
  {
    id: 'ultra_runner',
    title: 'Resistência Infinita',
    description: 'Complete uma ultra distância (+50km).',
    icon: '🏔️',
    conditionType: 'distance_single',
    threshold: 50
  }
];

interface AchievementsProps {
  unlockedIds: string[];
}

export const Achievements: React.FC<AchievementsProps> = ({ unlockedIds = [] }) => {
  // Ensure unlockedIds is always an array
  const safeUnlockedIds = Array.isArray(unlockedIds) ? unlockedIds : [];
  
  const totalCount = ACHIEVEMENTS_LIST.length;
  const unlockedCount = safeUnlockedIds.length;
  const progressPercentage = Math.round((unlockedCount / totalCount) * 100);

  return (
    <div className="space-y-8 pb-24 animate-fade-in">
      {/* Header Stats */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex justify-between items-center mb-4">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Trophy className="text-amber-500" /> Galeria de Troféus
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Colecione marcos da sua jornada eólica.
                </p>
            </div>
            <div className="text-right">
                <span className="text-3xl font-black text-amber-500">{unlockedCount}</span>
                <span className="text-gray-400 text-sm font-bold">/{totalCount}</span>
            </div>
        </div>
        
        {/* Progress Bar */}
        <div className="relative h-4 bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
            <div 
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-1000 ease-out relative"
                style={{ width: `${progressPercentage}%` }}
            >
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
            </div>
        </div>
        <p className="text-xs text-right mt-2 text-gray-500 uppercase font-bold tracking-wider">{progressPercentage}% Completo</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {ACHIEVEMENTS_LIST.map((ach) => {
          const isUnlocked = safeUnlockedIds.includes(ach.id);
          
          return (
            <div 
              key={ach.id} 
              className={`relative p-6 rounded-2xl border flex flex-col items-center text-center transition-all duration-300 group
                ${isUnlocked 
                  ? 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-amber-200 dark:border-amber-500/30 shadow-[0_4px_20px_rgba(245,158,11,0.15)] scale-[1.02]' 
                  : 'bg-gray-100 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 opacity-70 grayscale hover:grayscale-0 hover:opacity-100'}`}
            >
              {isUnlocked ? (
                <div className="absolute top-3 right-3 text-green-500 bg-green-100 dark:bg-green-900/30 p-1 rounded-full">
                  <CheckCircle2 size={14} />
                </div>
              ) : (
                <div className="absolute top-3 right-3 text-gray-400 dark:text-gray-600">
                  <Lock size={14} />
                </div>
              )}

              <div className={`text-4xl mb-4 transition-transform duration-500 ${isUnlocked ? 'animate-bounce-slow scale-110 filter drop-shadow-md' : 'opacity-50'}`}>
                {ach.icon}
              </div>
              
              <h3 className={`font-bold mb-2 text-sm leading-tight ${isUnlocked ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-500'}`}>
                {ach.title}
              </h3>
              
              <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed px-1">
                {ach.description}
              </p>

              {isUnlocked && (
                  <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-amber-500 flex items-center justify-center gap-1">
                          <Star size={8} fill="currentColor" /> Conquistado
                      </span>
                  </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
