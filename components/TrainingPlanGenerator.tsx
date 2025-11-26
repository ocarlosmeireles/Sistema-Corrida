
import React, { useState, useEffect } from 'react';
import { generateTrainingPlan } from '../services/geminiService';
import { Member, TrainingPlan } from '../types';
import { ScrollText, Play, CheckCircle2, Loader2, Wind, Lock, Crown, Zap, Baby, TrendingUp, Medal, Printer, Clock, ArrowRight } from 'lucide-react';
import { ProGate } from './ProGate';

interface TrainingPlanGeneratorProps {
  currentUser: Member;
  onSavePlan: (plan: TrainingPlan) => void;
}

type ExperienceLevel = 'Iniciante' | 'Intermediário' | 'Avançado';

export const TrainingPlanGenerator: React.FC<TrainingPlanGeneratorProps> = ({ currentUser, onSavePlan }) => {
  const [goal, setGoal] = useState('');
  const [days, setDays] = useState(3);
  const [experience, setExperience] = useState<ExperienceLevel>('Intermediário');
  const [loading, setLoading] = useState(false);

  const activePlan = currentUser.activePlan;
  const userPlan = currentUser.plan;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userPlan === 'basic') return;
    if (!goal) return;

    if (activePlan && !window.confirm("Você já tem um plano ativo. Gerar um novo irá arquivar o atual. Deseja continuar?")) {
        return;
    }

    setLoading(true);
    const content = await generateTrainingPlan(currentUser.rank, goal, days, experience);
    
    const newPlan: TrainingPlan = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        goal: goal,
        durationWeeks: 4, 
        content: content,
        status: 'active'
    };

    onSavePlan(newPlan);
    setLoading(false);
  };

  const handlePrint = () => {
      window.print();
  };

  const Content = (
    <div className="space-y-8 pb-24">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-plan, #printable-plan * { visibility: visible; }
          #printable-plan { 
            position: absolute; left: 0; top: 0; width: 100%; 
            color: black; background: white; padding: 40px; 
            font-family: 'Georgia', serif; line-height: 1.6;
          }
          .no-print { display: none !important; }
          h1, h2, h3 { color: black !important; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
        }
      `}</style>

      <div className="no-print">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Planilhas de Voo</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">O Coach Vento cria um plano exclusivo para sua velocidade e experiência.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* FORM CARD */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 h-fit shadow-md no-print">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-amber-100 dark:bg-amber-500/20 p-3 rounded-xl text-amber-600 dark:text-amber-400">
              <ScrollText size={24} />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white">
                {activePlan ? 'Gerar Nova Estratégia' : 'Configurar Plano'}
            </h3>
          </div>

          <form onSubmit={handleGenerate} className="space-y-6">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-3 font-bold">Nível de Experiência</label>
              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => setExperience('Iniciante')} className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${experience === 'Iniciante' ? 'bg-green-100 dark:bg-green-500/20 border-green-500 text-green-700 dark:text-green-400' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'}`}>
                  <Baby size={20} className="mb-1" />
                  <span className="text-[10px] font-bold uppercase">Iniciante</span>
                </button>
                <button type="button" onClick={() => setExperience('Intermediário')} className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${experience === 'Intermediário' ? 'bg-blue-100 dark:bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-400' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'}`}>
                  <TrendingUp size={20} className="mb-1" />
                  <span className="text-[10px] font-bold uppercase">Médio</span>
                </button>
                <button type="button" onClick={() => setExperience('Avançado')} className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${experience === 'Avançado' ? 'bg-purple-100 dark:bg-purple-500/20 border-purple-500 text-purple-700 dark:text-purple-400' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'}`}>
                  <Zap size={20} className="mb-1" />
                  <span className="text-[10px] font-bold uppercase">Pro</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2 font-bold">Qual seu objetivo principal?</label>
              <input type="text" required value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Ex: Correr 5km sem caminhar..." className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl py-3 px-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none transition-colors" />
            </div>

            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2 font-bold">Dias por semana: <span className="text-amber-600 dark:text-amber-400 font-extrabold">{days}</span></label>
              <input type="range" min="2" max="6" value={days} onChange={(e) => setDays(parseInt(e.target.value))} className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500" />
            </div>

            <button type="submit" disabled={loading || !goal} className="w-full bg-amber-500 hover:bg-amber-600 text-white dark:text-gray-900 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20">
              {loading ? <><Loader2 className="animate-spin" size={20} /> Criando Estratégia...</> : <><Play size={20} /> {activePlan ? 'Substituir Plano' : 'Gerar Planilha'}</>}
            </button>
          </form>
        </div>

        {/* RESULT AREA */}
        <div className="lg:col-span-2 h-full relative">
            {activePlan && (
                <button 
                    onClick={handlePrint} 
                    className="absolute top-4 right-4 z-10 bg-gray-100 dark:bg-gray-700 p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 no-print"
                    title="Imprimir / Exportar PDF"
                >
                    <Printer size={20} />
                </button>
            )}
            <div id="printable-plan" className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in shadow-md h-full flex flex-col min-h-[500px]">
                {/* Dummy Content for Pro Gate Preview if no plan */}
                {!activePlan && (
                    <div className="p-8 space-y-4 opacity-50">
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                        <div className="text-center pt-12 text-gray-400 font-bold">Configure ao lado para gerar seu plano.</div>
                    </div>
                )}
                
                {activePlan && (
                    <div className="p-12 prose prose-amber dark:prose-invert max-w-none flex-1 overflow-y-auto custom-scrollbar">
                        <div className="print:hidden mb-6 text-xs text-amber-500 font-bold uppercase tracking-widest border-b border-amber-500/20 pb-2">Visualização Digital</div>
                        
                        <div className="hidden print:block mb-8 border-b-2 border-black pb-4">
                            <h1 className="text-4xl font-black uppercase mb-2">Plano de Voo</h1>
                            <p className="text-sm font-bold uppercase tracking-widest">Filhos do Vento • {currentUser.name}</p>
                            <p className="text-xs mt-2">Objetivo: {activePlan.goal}</p>
                        </div>

                        <div className="whitespace-pre-line text-gray-700 dark:text-gray-300 leading-relaxed font-serif">
                        {activePlan.content}
                        </div>

                        <div className="hidden print:block mt-12 pt-4 border-t border-gray-300 text-center text-xs font-bold uppercase">
                            Documento Técnico - Uso Pessoal
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );

  if (userPlan === 'basic') {
      return (
          <ProGate 
            featureName="Planilhas de Voo (IA)"
            description="O Coach Eólico utiliza Inteligência Artificial para criar um ciclo de 4 semanas adaptado ao seu Rank e objetivos específicos."
            onUpgradeRequest={() => alert("Solicite upgrade ao administrador na aba Equipe.")}
          >
              {Content}
          </ProGate>
      );
  }

  return Content;
};
