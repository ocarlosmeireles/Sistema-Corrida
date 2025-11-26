
import React, { useState } from 'react';
import { Member, TrainingPlan, Challenge } from '../types';
import { TrainingPlanGenerator } from './TrainingPlanGenerator';
import { CheckCircle2, Flag, Zap, Target, Calendar, Play, Trophy, Lock, Shield, Mountain, Activity, Timer, Feather, MapPin, Info, X, Clock, ArrowRight } from 'lucide-react';

interface TrainingCenterProps {
  currentUser: Member;
  challenges: Challenge[];
  onSavePlan: (plan: TrainingPlan) => void;
  onJoinChallenge: (id: string) => void;
  onNavigate?: (tab: string) => void;
  onStartWorkout?: (workout: any) => void;
}

type TrainingTab = 'library' | 'missions' | 'challenges' | 'generator';

export const TrainingCenter: React.FC<TrainingCenterProps> = ({ currentUser, challenges, onSavePlan, onJoinChallenge, onNavigate, onStartWorkout }) => {
  const [activeTab, setActiveTab] = useState<TrainingTab>('library');
  const [selectedWorkout, setSelectedWorkout] = useState<any | null>(null);

  // Mock Daily Missions
  const dailyMissions = [
      { id: 1, title: "Operação Trovão", desc: "Complete 5km com pace abaixo de 6:00", xp: 100, completed: false, icon: Zap, color: "text-amber-500" },
      { id: 2, title: "Protocolo Brisa", desc: "Trote regenerativo de 30min", xp: 50, completed: true, icon: Flag, color: "text-green-500" },
      { id: 3, title: "Escalada K2", desc: "Ganhe 100m de elevação em um treino", xp: 150, completed: false, icon: Target, color: "text-purple-500" }
  ];

  // Expanded Training Library - RIO DE JANEIRO & WIND THEME
  const trainingLibrary = [
      { 
          id: 't1', 
          title: "Brisa do Aterro", 
          type: "Recuperação", 
          icon: Feather,
          color: "text-cyan-400",
          borderColor: "border-cyan-400/30",
          bgGradient: "from-cyan-900/20 to-transparent",
          desc: "5km em ritmo muito leve (Z1/Z2) pelas pistas planas do Aterro do Flamengo. Foco total na técnica de passada e respiração nasal.", 
          location: "Aterro do Flamengo",
          level: "Iniciante",
          duration: "40 min",
          steps: {
              warmup: "10 min de caminhada vigorosa + alongamento dinâmico.",
              main: "25 min de trote leve (Z2) constante. Tente manter a respiração apenas pelo nariz.",
              cooldown: "5 min de caminhada leve para baixar a FC."
          }
      },
      { 
          id: 't2', 
          title: "Fartlek Carioca", 
          type: "Velocidade", 
          icon: Zap,
          color: "text-amber-500",
          borderColor: "border-amber-500/30",
          bgGradient: "from-amber-900/20 to-transparent",
          desc: "40 min na orla. Alterne a intensidade pelos postes de luz: 1 poste forte (Rajada), 1 poste leve (Brisa). Sinta a variação do vento.", 
          location: "Orla Copacabana/Ipanema",
          level: "Intermediário",
          duration: "45 min",
          steps: {
              warmup: "10 min de trote leve (Z2).",
              main: "20 min Alternado: 1 poste RÁPIDO (Z4) / 1 poste LEVE (Z2). Repita sem parar.",
              cooldown: "10 min de trote regenerativo (Z1) na areia dura se possível."
          }
      },
      { 
          id: 't3', 
          title: "Escalada da Vista", 
          type: "Força", 
          icon: Mountain,
          color: "text-purple-500",
          borderColor: "border-purple-500/30",
          bgGradient: "from-purple-900/20 to-transparent",
          desc: "Subida contínua até a Vista Chinesa. 6km de inclinação média. Mantenha o tronco inclinado à frente e passadas curtas.", 
          location: "Horto / Vista Chinesa",
          level: "Avançado",
          duration: "60-80 min",
          steps: {
              warmup: "15 min no plano (Jardim Botânico) antes de começar a subir.",
              main: "Subida contínua até a Vista Chinesa. Mantenha o esforço em Z3/Z4. Não caminhe nas partes íngremes, diminua o passo.",
              cooldown: "Descida controlada ou caminhada no topo para foto."
          }
      },
      { 
          id: 't4', 
          title: "Voo de Cruzeiro", 
          type: "Resistência", 
          icon: Activity,
          color: "text-green-500",
          borderColor: "border-green-500/30",
          bgGradient: "from-green-900/20 to-transparent",
          desc: "12km em ritmo de Maratona (Z3) constante. Ideal para fazer na Lagoa Rodrigo de Freitas (1 volta e meia sem parar).", 
          location: "Lagoa Rodrigo de Freitas",
          level: "Todos",
          duration: "1h 10min",
          steps: {
              warmup: "10 min trote progressivo.",
              main: "12km em Ritmo de Prova (Z3 alto). Foco em não quebrar o ritmo.",
              cooldown: "5 min trote solto."
          }
      },
      { 
          id: 't5', 
          title: "Tiros do Leme", 
          type: "Potência", 
          icon: Zap,
          color: "text-red-500",
          borderColor: "border-red-500/30",
          bgGradient: "from-red-900/20 to-transparent",
          desc: "Aquecimento 2km + 10x 200m (Sprint Máximo) na reta do Leme com 1 min de descanso parado. Soltura 1km.", 
          location: "Leme / Pedra do Leme",
          level: "Avançado",
          duration: "40 min",
          steps: {
              warmup: "2km trote leve + 3 retas de aceleração.",
              main: "10x 200m (Z5 Máximo). Intervalo: 1 min parado entre cada tiro.",
              cooldown: "1km trote muito leve."
          }
      },
      { 
          id: 't6', 
          title: "Longão do Atlântico", 
          type: "Endurance", 
          icon: Activity,
          color: "text-blue-500",
          borderColor: "border-blue-500/30",
          bgGradient: "from-blue-900/20 to-transparent",
          desc: "18km a 24km percorrendo toda a orla da Zona Sul (Leme ao Leblon e volta). Hidratação a cada 4km obrigatória.", 
          location: "Zona Sul Completa",
          level: "Pro",
          duration: "2h+",
          steps: {
              warmup: "2km ritmo leve.",
              main: "16km a 22km ritmo confortável (Z2). Foco no volume, não na velocidade. Hidrate a cada 20 min.",
              cooldown: "Caminhada final e água de coco."
          }
      },
      { 
          id: 't7', 
          title: "Desafio Paineiras", 
          type: "Subida", 
          icon: Mountain,
          color: "text-stone-400",
          borderColor: "border-stone-500/30",
          bgGradient: "from-stone-900/20 to-transparent",
          desc: "Corrida em trilha de asfalto com sombra. 8km de subida constante e temperatura amena. Cuidado na descida.", 
          location: "Estrada das Paineiras",
          level: "Intermediário",
          duration: "1h 30min",
          steps: {
              warmup: "Alongamento e 5 min caminhada.",
              main: "8km Subida constante. Use os braços para ajudar na impulsão.",
              cooldown: "Descida leve trotando."
          }
      },
      { 
          id: 't8', 
          title: "Progressivo Tufão", 
          type: "Tempo Run", 
          icon: Timer,
          color: "text-yellow-500",
          borderColor: "border-yellow-500/30",
          bgGradient: "from-yellow-900/20 to-transparent",
          desc: "10km totais. Comece a 6:00/km e baixe 10 segundos a cada km até terminar voando baixo.", 
          location: "Reserva da Barra",
          level: "Avançado",
          duration: "55 min",
          steps: {
              warmup: "2km aquecimento livre.",
              main: "8km Progressivos: Comece confortável e termine no seu limite (Z4/Z5).",
              cooldown: "5 min caminhada."
          }
      },
      { 
          id: 't9', 
          title: "Regenerativo Solar", 
          type: "Recuperação", 
          icon: Feather,
          color: "text-teal-400",
          borderColor: "border-teal-500/30",
          bgGradient: "from-teal-900/20 to-transparent",
          desc: "30 minutos de trote descalço na grama ou areia dura da praia, seguido de banho de mar gelado.", 
          location: "Praia (Areia Dura)",
          level: "Iniciante",
          duration: "30 min",
          steps: {
              warmup: "Mobilidade articular (tornozelos).",
              main: "30 min trote leve na areia batida ou grama. Foco em fortalecer os pés.",
              cooldown: "Mergulho no mar."
          }
      },
      { 
          id: 't10', 
          title: "Intervalado Lagoa", 
          type: "Speed", 
          icon: Zap,
          color: "text-orange-500",
          borderColor: "border-orange-500/30",
          bgGradient: "from-orange-900/20 to-transparent",
          desc: "Aquecimento 2km + 8x 400m forte com 200m leve de intervalo. Perfeito para a reta do Corte do Cantagalo.", 
          location: "Lagoa Rodrigo de Freitas",
          level: "Intermediário",
          duration: "45 min",
          steps: {
              warmup: "2km trote + educativos.",
              main: "8x 400m (Pace de 5km) com intervalo de 200m trote leve entre eles.",
              cooldown: "1km trote muito leve."
          }
      },
      { 
          id: 't11', 
          title: "Soltura Pós-Prova", 
          type: "Recovery", 
          icon: Feather,
          color: "text-indigo-400",
          borderColor: "border-indigo-500/30",
          bgGradient: "from-indigo-900/20 to-transparent",
          desc: "20 minutos de caminhada rápida + 10 minutos de trote ultra leve. Foco em soltar a musculatura após competição.", 
          location: "Qualquer Local Plano",
          level: "Todos",
          duration: "30 min",
          steps: {
              warmup: "Não há.",
              main: "20 min caminhada vigorosa + 10 min trote 'conversável'.",
              cooldown: "Alongamento estático longo."
          }
      },
      { 
          id: 't12', 
          title: "Desafio do Imperador", 
          type: "Long Hill", 
          icon: Mountain,
          color: "text-red-600",
          borderColor: "border-red-600/30",
          bgGradient: "from-red-900/20 to-transparent",
          desc: "15km misturando asfalto e inclinação na Mesa do Imperador. Apenas para quem busca a glória.", 
          location: "Alto da Boa Vista",
          level: "Pro",
          duration: "1h 45min",
          steps: {
              warmup: "3km plano.",
              main: "12km subindo a Mesa do Imperador. Gerencie a energia.",
              cooldown: "Descida de carro/ônibus para poupar joelhos."
          }
      }
  ];

  const handleStartWorkout = () => {
      if (onStartWorkout && selectedWorkout) {
          onStartWorkout(selectedWorkout);
      } else if (onNavigate) {
          onNavigate('run');
      }
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in relative">
        
        {/* WORKOUT DETAILS MODAL */}
        {selectedWorkout && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                <div className="bg-gray-900 w-full max-w-lg rounded-3xl overflow-hidden border border-gray-700 shadow-2xl flex flex-col max-h-[90vh]">
                    {/* Header */}
                    <div className={`p-6 bg-gradient-to-r ${selectedWorkout.bgGradient} border-b border-white/10 relative`}>
                        <button 
                            onClick={() => setSelectedWorkout(null)}
                            className="absolute top-4 right-4 p-2 bg-black/20 rounded-full text-white hover:bg-white/20 transition-colors"
                        >
                            <X size={20} />
                        </button>
                        <div className={`inline-flex p-3 rounded-xl bg-black/30 ${selectedWorkout.color} mb-4`}>
                            <selectedWorkout.icon size={32} />
                        </div>
                        <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-1">{selectedWorkout.title}</h2>
                        <div className="flex items-center gap-3 text-sm font-bold text-gray-300">
                            <span className="flex items-center gap-1"><Timer size={14} className="text-amber-500"/> {selectedWorkout.duration}</span>
                            <span className="flex items-center gap-1"><MapPin size={14} className="text-amber-500"/> {selectedWorkout.location}</span>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                        <p className="text-gray-300 text-sm leading-relaxed">{selectedWorkout.desc}</p>
                        
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-2">Plano de Voo</h3>
                            
                            <div className="flex gap-4 items-start">
                                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">1</div>
                                <div>
                                    <h4 className="text-blue-400 font-bold text-sm">Aquecimento</h4>
                                    <p className="text-gray-400 text-sm">{selectedWorkout.steps.warmup}</p>
                                </div>
                            </div>

                            <div className="flex gap-4 items-start">
                                <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-xs shrink-0">2</div>
                                <div>
                                    <h4 className="text-amber-500 font-bold text-sm">Principal</h4>
                                    <p className="text-gray-400 text-sm">{selectedWorkout.steps.main}</p>
                                </div>
                            </div>

                            <div className="flex gap-4 items-start">
                                <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center font-bold text-xs shrink-0">3</div>
                                <div>
                                    <h4 className="text-green-400 font-bold text-sm">Desaquecimento</h4>
                                    <p className="text-gray-400 text-sm">{selectedWorkout.steps.cooldown}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-800 bg-gray-900/50 flex gap-3">
                        <button 
                            onClick={() => setSelectedWorkout(null)}
                            className="flex-1 py-3 rounded-xl font-bold text-gray-400 hover:bg-gray-800 transition-colors"
                        >
                            Voltar
                        </button>
                        <button 
                            onClick={handleStartWorkout}
                            className="flex-[2] bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-wider py-3 rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all hover:scale-105"
                        >
                            <Play size={18} fill="currentColor" /> Iniciar Treino
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Shield className="text-amber-500" /> Centro de Treinamento
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Protocolos oficiais da equipe Filhos do Vento.</p>
            </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl overflow-x-auto no-scrollbar">
            <button onClick={() => setActiveTab('library')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'library' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                Biblioteca
            </button>
            <button onClick={() => setActiveTab('generator')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'generator' ? 'bg-amber-500 text-white shadow' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                Coach IA
            </button>
            <button onClick={() => setActiveTab('missions')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'missions' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                Missões
            </button>
            <button onClick={() => setActiveTab('challenges')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'challenges' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                Desafios
            </button>
        </div>

        {/* CONTENT: LIBRARY */}
        {activeTab === 'library' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trainingLibrary.map(train => (
                    <div 
                        key={train.id} 
                        onClick={() => setSelectedWorkout(train)}
                        className={`bg-white dark:bg-gray-800 p-6 rounded-2xl border flex flex-col relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer group ${train.borderColor}`}
                    >
                        {/* Gradient Background */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${train.bgGradient} opacity-50 group-hover:opacity-80 transition-opacity`}></div>
                        
                        <div className="relative z-10 flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl bg-gray-100 dark:bg-black/30 ${train.color}`}>
                                <train.icon size={24} />
                            </div>
                            <div className="text-right">
                                <span className="block text-[10px] uppercase font-bold text-gray-500 tracking-widest">Nível</span>
                                <span className={`text-sm font-bold ${train.color}`}>{train.level}</span>
                            </div>
                        </div>

                        <div className="relative z-10 mb-4">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1 uppercase italic tracking-tight">{train.title}</h3>
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-3">
                                <span className="flex items-center gap-1 bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded"><Timer size={10}/> {train.duration}</span>
                                <span className="flex items-center gap-1 bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded"><MapPin size={10}/> {train.location}</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2">{train.desc}</p>
                        </div>

                        <div className="relative z-10 mt-auto pt-4 border-t border-gray-200 dark:border-white/10 flex items-center justify-between">
                            <span className={`text-xs font-bold uppercase ${train.color}`}>{train.type}</span>
                            <div className="bg-gray-900 dark:bg-white text-white dark:text-black p-2 rounded-lg group-hover:scale-110 transition-transform shadow-lg">
                                <ArrowRight size={16} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* CONTENT: AI GENERATOR */}
        {activeTab === 'generator' && (
            <TrainingPlanGenerator currentUser={currentUser} onSavePlan={onSavePlan} />
        )}

        {/* CONTENT: MISSIONS */}
        {activeTab === 'missions' && (
            <div className="grid grid-cols-1 gap-4">
                {dailyMissions.map(mission => (
                    <div key={mission.id} className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${mission.completed ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30 opacity-70' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-amber-500/50'}`}>
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full ${mission.completed ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-gray-100 dark:bg-gray-700 ' + mission.color}`}>
                                <mission.icon size={24} />
                            </div>
                            <div>
                                <h4 className={`font-bold ${mission.completed ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}>{mission.title}</h4>
                                <p className="text-xs text-gray-500">{mission.desc}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            {mission.completed ? (
                                <span className="text-xs font-bold text-green-600 dark:text-green-400 flex items-center gap-1 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                                    <CheckCircle2 size={12} /> Feito
                                </span>
                            ) : (
                                <span className="text-sm font-black text-amber-500">+{mission.xp} XP</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* CONTENT: CHALLENGES */}
        {activeTab === 'challenges' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {challenges.map(challenge => {
                    const isParticipant = challenge.participants.includes(currentUser.id);
                    return (
                        <div key={challenge.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Trophy size={100} />
                            </div>
                            
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-red-100 dark:bg-red-900/20 p-2 rounded-lg text-red-600 dark:text-red-400">
                                        <Flag size={24} />
                                    </div>
                                    {isParticipant && (
                                        <span className="bg-green-100 dark:bg-green-900/20 text-green-600 text-xs font-bold px-2 py-1 rounded-full">Aceito</span>
                                    )}
                                </div>
                                
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{challenge.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{challenge.description}</p>
                                
                                <div className="flex items-center gap-4 text-xs font-mono text-gray-400 mb-6">
                                    <span className="flex items-center gap-1"><Target size={12} /> {challenge.targetKm} km</span>
                                    <span className="flex items-center gap-1"><Calendar size={12} /> Até {new Date(challenge.endDate).toLocaleDateString()}</span>
                                </div>

                                {!isParticipant ? (
                                    <button 
                                        onClick={() => onJoinChallenge(challenge.id)}
                                        className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold py-3 rounded-xl hover:opacity-90 transition-opacity"
                                    >
                                        Aceitar Desafio
                                    </button>
                                ) : (
                                    <div className="w-full bg-gray-100 dark:bg-gray-700 py-3 rounded-xl text-center text-sm font-bold text-gray-500">
                                        Em Progresso
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                {challenges.length === 0 && (
                    <div className="col-span-2 text-center py-12 text-gray-500">Nenhum desafio ativo no momento.</div>
                )}
            </div>
        )}
    </div>
  );
};
