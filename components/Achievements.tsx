
import React from 'react';
import { Achievement } from '../types';
import { Lock, CheckCircle2 } from 'lucide-react';

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

export const Achievements: React.FC<AchievementsProps> = ({ unlockedIds }) => {
  return (
    <div className="space-y-8 pb-24 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Galeria de Conquistas</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Sua coleção de marcos eólicos ({unlockedIds.length}/{ACHIEVEMENTS_LIST.length}).</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {ACHIEVEMENTS_LIST.map((ach) => {
          const isUnlocked = unlockedIds.includes(ach.id);
          
          return (
            <div 
              key={ach.id} 
              className={`relative p-6 rounded-2xl border flex flex-col items-center text-center transition-all group hover:scale-[1.02]
                ${isUnlocked 
                  ? 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-green-200 dark:border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]' 
                  : 'bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-800 opacity-60 grayscale'}`}
            >
              {isUnlocked && (
                <div className="absolute top-3 right-3 text-green-500">
                  <CheckCircle2 size={18} />
                </div>
              )}
              {!isUnlocked && (
                <div className="absolute top-3 right-3 text-gray-400 dark:text-gray-600">
                  <Lock size={18} />
                </div>
              )}

              <div className={`text-4xl mb-4 transition-transform duration-500 ${isUnlocked ? 'animate-bounce-slow group-hover:rotate-12' : ''}`}>
                {ach.icon}
              </div>
              
              <h3 className={`font-bold mb-1 text-sm md:text-base ${isUnlocked ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                {ach.title}
              </h3>
              
              <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 leading-tight">
                {ach.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
