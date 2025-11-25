
import React, { useEffect, useState } from 'react';
import { Member, PlanType } from '../types';
import { getWindCoachingTip, getTrainingAnalysis } from '../services/geminiService';
import { Bot, Sparkles, ChevronRight, Wind, Zap, Lock, Crown } from 'lucide-react';
import { ProGate } from './ProGate';

interface DinoCoachProps {
  member: Member;
  userPlan?: PlanType;
}

export const DinoCoach: React.FC<DinoCoachProps> = ({ member, userPlan = 'basic' }) => {
  const [tip, setTip] = useState<string>('O Coach Eólico está medindo a direção do vento...');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch tip logic (Only run if pro to avoid api calls, OR run it but show blurred)
  // To simulate the "See but don't touch", we can fetch it or just show a placeholder if basic.
  useEffect(() => {
    let isMounted = true;
    const fetchTip = async () => {
      // Even basic users might see a generic tip, but for the sake of "Pro features", let's fetch it but gate it visually
      if (userPlan === 'basic') {
          if (isMounted) setTip("A brisa de hoje traz renovação. [Conteúdo exclusivo bloqueado]");
          return;
      }
      const result = await getWindCoachingTip(member, member.activities[member.activities.length - 1]);
      if (isMounted) setTip(result);
    };
    fetchTip();
    return () => { isMounted = false; };
  }, [member, userPlan]);

  const handleDeepAnalysis = async () => {
    if (userPlan === 'basic') return;
    setLoading(true);
    const result = await getTrainingAnalysis(member.activities);
    setAnalysis(result);
    setLoading(false);
  };

  const Content = (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <div className="bg-amber-500 rounded-full p-3 shadow-lg shadow-amber-500/20">
             <Wind className="text-white" size={32} strokeWidth={2.5} />
        </div>
        <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Coach Eólico</h2>
            <p className="text-amber-600 dark:text-amber-400 text-sm font-bold uppercase tracking-wide flex items-center gap-1">
                <Sparkles size={12} /> Inteligência Artificial Ativa
            </p>
        </div>
      </div>

      {/* Daily Tip Card */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-900 border border-blue-100 dark:border-gray-700 rounded-3xl p-6 relative overflow-hidden shadow-sm">
        <div className="absolute -right-8 -top-8 opacity-5 dark:opacity-[0.03] text-white">
          <Wind size={200} />
        </div>
        
        <div className="flex items-start space-x-4 relative z-10">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-blue-100 dark:border-gray-700 shadow-sm">
            <Bot className="text-amber-500" size={28} />
          </div>
          <div>
            <h3 className="text-blue-800 dark:text-blue-400 font-bold text-xs uppercase tracking-widest mb-2 flex items-center gap-1">
                <Zap size={12} className="text-amber-500" /> Mensagem do dia
            </h3>
            <p className="text-gray-800 dark:text-gray-200 leading-relaxed italic font-medium text-lg">"{tip}"</p>
          </div>
        </div>
      </div>

      {/* Deep Analysis Section */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between mb-6 relative z-10">
          <h3 className="font-bold text-xl text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles size={20} className="text-amber-500" />
            Análise de Desempenho
          </h3>
        </div>

        {!analysis ? (
          <div className="text-center py-8 relative z-10">
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
              Permita que a IA analise seus treinos no Aterro, Lagoa e Leblon para traçar um perfil aerodinâmico da sua evolução.
            </p>
            <button 
              onClick={handleDeepAnalysis}
              disabled={loading || userPlan === 'basic'}
              className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-amber-500 dark:hover:bg-amber-400 hover:text-white dark:hover:text-gray-900 px-8 py-4 rounded-2xl font-bold transition-all flex items-center justify-center mx-auto disabled:opacity-50 shadow-xl w-full md:w-auto"
            >
              {loading ? 'Lendo correntes de ar...' : 'Solicitar Análise Completa'}
              {!loading && <ChevronRight size={18} className="ml-2" />}
            </button>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none relative z-10">
            <div className="whitespace-pre-line text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700/50">
              {analysis}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (userPlan === 'basic') {
      return (
          <ProGate 
            featureName="Coach Eólico (IA)"
            description="Liberte o poder da inteligência artificial para analisar seus dados aerodinâmicos, receber conselhos diários e feedback de pós-treino."
            onUpgradeRequest={() => alert("Solicite upgrade ao administrador na aba Equipe.")}
          >
              {Content}
          </ProGate>
      );
  }

  return Content;
};
