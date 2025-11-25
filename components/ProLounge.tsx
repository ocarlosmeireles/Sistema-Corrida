
import React from 'react';
import { Member } from '../types';
import { Crown, MessageSquare, Video, BookOpen, Star, ShieldCheck, Users } from 'lucide-react';

interface ProLoungeProps {
  currentUser: Member;
  onContactSupport: () => void;
}

export const ProLounge: React.FC<ProLoungeProps> = ({ currentUser, onContactSupport }) => {
  return (
    <div className="space-y-8 pb-24 animate-fade-in">
      {/* Hero Header */}
      <div className="relative rounded-3xl overflow-hidden p-8 md:p-12 shadow-2xl border border-amber-500/30">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-950 to-black z-0"></div>
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] z-0"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] animate-pulse"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-amber-500 p-2 rounded-lg shadow-lg shadow-amber-500/20">
                        <Crown size={32} className="text-black" fill="currentColor" />
                    </div>
                    <h2 className="text-amber-500 font-black uppercase tracking-widest text-sm">Membro Elite</h2>
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tighter">
                    VIP <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-600">LOUNGE</span>
                </h1>
                <p className="text-gray-400 max-w-xl text-lg leading-relaxed">
                    Bem-vindo ao quartel general da elite. Aqui você tem acesso direto ao suporte, mentorias exclusivas e conteúdos avançados para acelerar sua evolução.
                </p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-md border border-amber-500/20 p-6 rounded-2xl flex flex-col items-center text-center min-w-[200px]">
                <ShieldCheck size={40} className="text-amber-500 mb-2" />
                <span className="text-white font-bold text-lg">Status Ativo</span>
                <span className="text-gray-500 text-xs uppercase tracking-wider mt-1">Plano PRO</span>
            </div>
        </div>
      </div>

      {/* Main Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Support Card */}
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700 hover:border-amber-500/50 transition-all group cursor-pointer relative overflow-hidden shadow-lg" onClick={onContactSupport}>
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                  <MessageSquare size={100} />
              </div>
              <div className="relative z-10">
                  <div className="w-14 h-14 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 mb-6 group-hover:bg-amber-500 group-hover:text-black transition-colors">
                      <Users size={28} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Suporte Prioritário</h3>
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                      Acesso direto à nossa equipe de treinadores. Tire dúvidas sobre planilhas, dores ou estratégia de prova.
                  </p>
                  <button className="text-amber-500 font-bold text-sm uppercase tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all">
                      Iniciar Chat <div className="w-8 h-px bg-amber-500"></div>
                  </button>
              </div>
          </div>

          {/* Mentorship Card */}
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700 hover:border-blue-500/50 transition-all group relative overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Video size={100} />
              </div>
              <div className="relative z-10">
                  <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 mb-6 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                      <Video size={28} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Mentoria Mensal</h3>
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                      Próxima Live: <strong>28/11 às 20h</strong>.<br/> Tema: "Estratégia Nutricional para Longas Distâncias" com Dr. Nutri.
                  </p>
                  <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wide transition-colors shadow-lg shadow-blue-600/20">
                      Definir Lembrete
                  </button>
              </div>
          </div>

          {/* Content Card */}
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700 hover:border-green-500/50 transition-all group relative overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                  <BookOpen size={100} />
              </div>
              <div className="relative z-10">
                  <div className="w-14 h-14 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500 mb-6 group-hover:bg-green-500 group-hover:text-white transition-colors">
                      <Star size={28} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Conteúdo Elite</h3>
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                      Biblioteca exclusiva de vídeos técnicos, guias de fortalecimento e descontos em lojas parceiras.
                  </p>
                  <button className="text-green-500 font-bold text-sm uppercase tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all">
                      Acessar Biblioteca <div className="w-8 h-px bg-green-500"></div>
                  </button>
              </div>
          </div>

      </div>

      {/* Exclusive Feed Section */}
      <div className="mt-12">
          <div className="flex items-center gap-4 mb-6">
              <div className="h-px flex-1 bg-gray-800"></div>
              <span className="text-gray-500 font-bold uppercase text-xs tracking-widest">Destaques da Semana para PROs</span>
              <div className="h-px flex-1 bg-gray-800"></div>
          </div>

          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 flex flex-col md:flex-row items-center gap-6">
              <div className="w-full md:w-1/3 h-48 bg-gray-800 rounded-xl overflow-hidden relative">
                  <img src="https://images.unsplash.com/photo-1552674605-46d504a04084?auto=format&fit=crop&q=80&w=1000" alt="Workout" className="w-full h-full object-cover opacity-60 hover:opacity-80 transition-opacity" />
                  <div className="absolute top-2 left-2 bg-amber-500 text-black text-[10px] font-bold px-2 py-1 rounded uppercase">Novo Vídeo</div>
              </div>
              <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">Técnica de Corrida: Cadência Ideal</h3>
                  <p className="text-gray-400 text-sm mb-4">
                      Aprenda como aumentar sua cadência para 180bpm pode reduzir o impacto nas articulações e melhorar sua economia de corrida. Análise biomecânica detalhada.
                  </p>
                  <button className="text-amber-500 hover:text-amber-400 text-sm font-bold underline decoration-amber-500/30 underline-offset-4">
                      Assistir Agora
                  </button>
              </div>
          </div>
      </div>
    </div>
  );
};
