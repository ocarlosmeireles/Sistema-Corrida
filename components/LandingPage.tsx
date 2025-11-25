
import React, { useEffect, useState } from 'react';
import { 
  Wind, ChevronDown, Crown, 
  CheckCircle, Rocket,
  MapPin, Bot, Zap, Trophy, 
  Activity, BarChart, Lock,
  Users, Shield, ArrowRight,
  Cpu, Star, Flame, Globe,
  Smartphone, Headphones, Heart,
  Quote
} from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
  toggleTheme: () => void;
  isDark: boolean;
  onUpgradeRequest?: () => void;
}

// Custom Icons
const Cloud = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19c0-1.7-1.3-3-3-3h-11c-1.7 0-3 1.3-3 3s1.3 3 3 3h11c1.7 0 3-1.3 3-3z"/><path d="M17.5 16c.9 0 1.7-.3 2.3-.9.7-.6 1.2-1.5 1.2-2.6 0-2.2-1.8-4-4-4-.3 0-.7.1-1 .2-.5-2.3-2.5-4-5-4-2.8 0-5 2.2-5 5 0 .3.1.7.2 1-.3-.1-.7-.2-1-.2C2.5 10.5 1 12 1 13.8c0 1.5 1.1 2.8 2.5 3.2"/></svg>;
const Tornado = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 4H3"/><path d="M18 8H6"/><path d="M19 12H9"/><path d="M16 16h-6"/><path d="M11 20H9"/></svg>;

// --- WIND RANKS DATA ---
const RANKS = [
    { name: "Brisa", range: "0 - 50 km", desc: "O início suave. Você está aprendendo a respirar e a sentir o ritmo.", icon: Wind, color: "text-green-400", bg: "bg-green-900/20" },
    { name: "Rajada", range: "50 - 150 km", desc: "Ganhando força. Seus primeiros recordes começam a cair.", icon: Zap, color: "text-cyan-400", bg: "bg-cyan-900/20" },
    { name: "Ventania", range: "150 - 300 km", desc: "Fluxo constante. A resistência se torna sua maior aliada.", icon: Activity, color: "text-blue-400", bg: "bg-blue-900/20" },
    { name: "Tempestade", range: "300 - 600 km", desc: "Intensidade pura. Você corre em qualquer clima, sem desculpas.", icon: Cloud, color: "text-purple-400", bg: "bg-purple-900/20" },
    { name: "Furacão", range: "600 - 1000 km", desc: "Poder destrutivo contra seus próprios limites. Elite da equipe.", icon: Tornado, color: "text-orange-500", bg: "bg-orange-900/20" },
    { name: "Tornado", range: "+1000 km", desc: "Lenda viva. Sua história inspira toda a nova geração.", icon: Crown, color: "text-yellow-400", bg: "bg-yellow-900/20" }
];

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter, onUpgradeRequest }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      if (isScrolled !== scrolled) setScrolled(isScrolled);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen font-sans bg-[#050505] text-white selection:bg-amber-500 selection:text-black overflow-x-hidden scroll-smooth">
      
      {/* --- NAVBAR --- */}
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ease-out ${scrolled ? 'bg-black/90 backdrop-blur-xl border-b border-white/5 py-4 shadow-2xl' : 'bg-transparent py-8'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="bg-amber-500 p-1.5 rounded-lg shadow-lg shadow-amber-500/20">
                <Wind size={20} className="text-white" fill="currentColor" />
            </div>
            <span className="font-black text-lg tracking-tighter">FILHOS<span className="text-amber-500">DO</span>VENTO</span>
          </div>
          <div className="hidden lg:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-gray-400">
              <button onClick={() => scrollToSection('manifesto')} className="hover:text-white transition-colors">Filosofia</button>
              <button onClick={() => scrollToSection('ranks')} className="hover:text-amber-500 transition-colors text-amber-500/80">Ranks</button>
              <button onClick={() => scrollToSection('ecosystem')} className="hover:text-white transition-colors">Ecossistema</button>
              <button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-colors">Planos</button>
          </div>
          <button onClick={onEnter} className="px-6 py-2.5 bg-white text-black rounded-lg text-xs font-black uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              Acessar Sistema
          </button>
        </div>
      </nav>

      {/* 1. HERO SECTION */}
      <header className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.15)_0%,rgba(0,0,0,0)_70%)] pointer-events-none"></div>
        <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none"></div>
        
        <div className="relative z-10 max-w-5xl mx-auto space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 backdrop-blur-md text-amber-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-4 shadow-lg shadow-amber-500/10">
                <Rocket size={12} /> App Oficial v2.5
            </div>
            
            <h1 className="text-6xl md:text-[9rem] font-black tracking-tighter text-white leading-[0.9] drop-shadow-2xl">
                DOMINE<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">OS VENTOS</span>
            </h1>
            
            <p className="text-xl text-gray-400 max-w-2xl mx-auto font-medium leading-relaxed">
                Mais que um app de corrida. Um sistema de evolução pessoal baseado em dados, gamificação e inteligência artificial.
            </p>
            
            <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-6">
                <button onClick={onEnter} className="group px-10 py-5 bg-amber-500 text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-amber-400 transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:scale-105">
                    Começar Jornada <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button onClick={() => scrollToSection('ranks')} className="px-10 py-5 bg-white/5 border border-white/10 text-white font-bold text-sm uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all backdrop-blur-sm">
                    Conhecer os Ranks
                </button>
            </div>
        </div>

        <div className="absolute bottom-10 animate-bounce text-gray-600">
            <ChevronDown size={32} />
        </div>
      </header>

      {/* 2. MANIFESTO (Philosophy) */}
      <section id="manifesto" className="py-32 px-6 bg-[#0a0a0a] border-t border-white/5">
          <div className="max-w-4xl mx-auto text-center">
              <Quote size={48} className="mx-auto text-amber-600 mb-8 opacity-50" />
              <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-8">
                  "Não corremos para fugir da vida.<br/>Corremos para que a vida não fuja de nós."
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed max-w-2xl mx-auto">
                  A equipe <strong>Filhos do Vento</strong> nasceu nas pistas do Aterro do Flamengo com um propósito simples: transformar o corredor amador em uma máquina de consistência. Usamos tecnologia de ponta para monitorar cada passo da sua evolução.
              </p>
          </div>
      </section>

      {/* 3. THE WIND RANKS (HIERARCHY) - HIGHLIGHTED */}
      <section id="ranks" className="py-32 px-6 bg-black relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-amber-600/5 rounded-full blur-[120px] pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto relative z-10">
              <div className="text-center mb-20">
                  <h2 className="text-amber-500 font-black uppercase tracking-widest text-sm mb-4">Gamificação Exclusiva</h2>
                  <h3 className="text-5xl md:text-6xl font-black text-white mb-6">A ESCALA DOS VENTOS</h3>
                  <p className="text-gray-400 max-w-2xl mx-auto">
                      Sua jornada não é medida apenas em quilômetros, mas em status. Desbloqueie novas patentes conforme sua distância total aumenta.
                  </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {RANKS.map((rank, i) => (
                      <div key={i} className={`group relative p-8 rounded-3xl border border-white/5 bg-gray-900/50 backdrop-blur-sm hover:bg-gray-900 transition-all hover:-translate-y-2 hover:border-amber-500/30`}>
                          <div className={`absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity`}>
                              <rank.icon size={100} />
                          </div>
                          
                          <div className={`w-16 h-16 rounded-2xl ${rank.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                              <rank.icon className={rank.color} size={32} />
                          </div>
                          
                          <h4 className="text-3xl font-black text-white uppercase mb-2">{rank.name}</h4>
                          <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-6 ${rank.bg} ${rank.color} border border-white/5`}>
                              {rank.range}
                          </div>
                          
                          <p className="text-gray-400 text-sm leading-relaxed font-medium border-t border-white/5 pt-4">
                              {rank.desc}
                          </p>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* 4. ECOSYSTEM GRID (Bento Box Style) */}
      <section id="ecosystem" className="py-32 px-6 bg-[#080808]">
          <div className="max-w-7xl mx-auto">
              <div className="mb-16">
                  <h2 className="text-4xl font-black text-white mb-4">O ECOSSISTEMA</h2>
                  <p className="text-gray-400">Todas as ferramentas que você precisa em um único lugar.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-6 h-auto md:h-[600px]">
                  
                  {/* AI Coach - Large Box */}
                  <div className="md:col-span-2 md:row-span-2 bg-gray-900 rounded-3xl p-8 border border-gray-800 relative overflow-hidden group hover:border-blue-500/50 transition-all">
                      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                          <Bot size={200} />
                      </div>
                      <div className="relative z-10 h-full flex flex-col justify-between">
                          <div>
                              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 text-blue-400">
                                  <Bot size={24} />
                              </div>
                              <h3 className="text-2xl font-bold text-white mb-2">Coach Eólico (IA)</h3>
                              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                                  Nossa inteligência artificial analisa seus dados de treino e cria planilhas personalizadas de 4 semanas, adaptadas ao seu nível e objetivo.
                              </p>
                          </div>
                          <div className="bg-black/40 backdrop-blur rounded-xl p-4 border border-white/5 mt-8">
                              <div className="flex gap-3 items-center text-xs text-gray-300 font-mono">
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                  "Sugerindo treino de tiros no Aterro hoje..."
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Live HUD */}
                  <div className="md:col-span-2 bg-gradient-to-r from-amber-600 to-orange-600 rounded-3xl p-8 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                      <div className="relative z-10 flex justify-between items-center h-full">
                          <div>
                              <h3 className="text-2xl font-bold text-white mb-2">Live HUD</h3>
                              <p className="text-white/80 text-sm max-w-xs">
                                  Painel de controle em tempo real com GPS, Voz Carioca e integração Spotify.
                              </p>
                          </div>
                          <div className="bg-white/20 p-4 rounded-full backdrop-blur-md group-hover:scale-110 transition-transform">
                              <Smartphone size={32} className="text-white" />
                          </div>
                      </div>
                  </div>

                  {/* Community */}
                  <div className="md:col-span-1 bg-gray-900 rounded-3xl p-6 border border-gray-800 hover:border-purple-500/50 transition-all">
                      <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4 text-purple-400">
                          <Users size={20} />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">Tribo</h3>
                      <p className="text-gray-400 text-xs">Feed social, chat em tempo real e ranking de XP.</p>
                  </div>

                  {/* Analytics */}
                  <div className="md:col-span-1 bg-gray-900 rounded-3xl p-6 border border-gray-800 hover:border-green-500/50 transition-all">
                      <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mb-4 text-green-400">
                          <BarChart size={20} />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">Dados</h3>
                      <p className="text-gray-400 text-xs">Gráficos de evolução, volume semanal e recordes.</p>
                  </div>

              </div>
          </div>
      </section>

      {/* 5. FEATURES LIST (Detailed) */}
      <section className="py-24 px-6 bg-black">
          <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                      <div className="flex gap-4">
                          <div className="bg-gray-800 p-3 rounded-xl h-fit"><MapPin className="text-amber-500" /></div>
                          <div>
                              <h4 className="text-xl font-bold text-white mb-2">Território Mapeado</h4>
                              <p className="text-gray-400 text-sm">Rotas otimizadas no Aterro do Flamengo, Lagoa Rodrigo de Freitas e Orla do Leblon.</p>
                          </div>
                      </div>
                      <div className="flex gap-4">
                          <div className="bg-gray-800 p-3 rounded-xl h-fit"><Headphones className="text-amber-500" /></div>
                          <div>
                              <h4 className="text-xl font-bold text-white mb-2">Trilha Sonora Dinâmica</h4>
                              <p className="text-gray-400 text-sm">Playlists do Spotify que se ajustam ao ritmo do seu treino (Brisa, Rajada, Tempestade).</p>
                          </div>
                      </div>
                      <div className="flex gap-4">
                          <div className="bg-gray-800 p-3 rounded-xl h-fit"><Shield className="text-amber-500" /></div>
                          <div>
                              <h4 className="text-xl font-bold text-white mb-2">Badges & Conquistas</h4>
                              <p className="text-gray-400 text-sm">Mais de 15 medalhas virtuais para desbloquear, desde "Primeiro 5K" até "Ultramaratonista".</p>
                          </div>
                      </div>
                  </div>
                  <div className="bg-gray-900 rounded-3xl border border-gray-800 p-8 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                      <div className="text-center relative z-10">
                          <div className="text-6xl font-black text-white mb-2">15+</div>
                          <div className="text-amber-500 font-bold uppercase tracking-widest text-sm">Ferramentas Integradas</div>
                          <p className="text-gray-500 text-xs mt-4 max-w-xs mx-auto">Calculadora de Pace, Previsão de Prova, Controle de Tênis, Nutrição IA e muito mais.</p>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* 6. PRICING */}
      <section id="pricing" className="py-32 px-6 bg-[#050505] border-t border-gray-900">
          <div className="max-w-6xl mx-auto">
              <div className="text-center mb-20">
                  <h2 className="text-4xl font-black text-white mb-4">INVESTIMENTO NA SUA EVOLUÇÃO</h2>
                  <p className="text-gray-400">Escolha o plano que combina com sua ambição.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                  
                  {/* BASIC */}
                  <div className="p-8 rounded-3xl border border-gray-800 bg-gray-900/30 hover:bg-gray-900/80 transition-all">
                      <div className="flex justify-between items-start mb-8">
                          <div>
                              <h3 className="text-lg font-bold text-gray-300 uppercase tracking-widest">Iniciante</h3>
                              <div className="text-4xl font-black text-white mt-2">Grátis</div>
                          </div>
                          <div className="bg-gray-800 p-2 rounded-lg"><Wind size={24} className="text-gray-500" /></div>
                      </div>
                      <ul className="space-y-4 mb-10 text-gray-400 text-sm">
                          <li className="flex gap-3"><CheckCircle size={16} className="text-white" /> Acesso ao App & GPS</li>
                          <li className="flex gap-3"><CheckCircle size={16} className="text-white" /> Limite de 15 Atividades</li>
                          <li className="flex gap-3"><CheckCircle size={16} className="text-white" /> Comunidade Básica</li>
                          <li className="flex gap-3 opacity-50 line-through decoration-gray-600"><Lock size={16} /> Coach IA Personalizado</li>
                          <li className="flex gap-3 opacity-50 line-through decoration-gray-600"><Lock size={16} /> Assistente de Voz Carioca</li>
                      </ul>
                      <button onClick={onEnter} className="w-full py-4 rounded-xl border border-gray-700 text-white font-bold hover:bg-white hover:text-black transition-all uppercase tracking-widest text-xs">
                          Começar Grátis
                      </button>
                  </div>

                  {/* PRO */}
                  <div className="relative p-8 rounded-3xl border border-amber-500 bg-gray-900 shadow-[0_0_40px_rgba(245,158,11,0.15)] transform md:-translate-y-4">
                      <div className="absolute top-0 right-0 bg-amber-500 text-black text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">
                          Melhor Escolha
                      </div>
                      <div className="flex justify-between items-start mb-8">
                          <div>
                              <h3 className="text-lg font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
                                  <Flame size={16} /> Pro Athlete
                              </h3>
                              <div className="text-5xl font-black text-white mt-2">R$ 29<span className="text-lg text-gray-500 font-medium">/mês</span></div>
                          </div>
                          <div className="bg-amber-500 p-2 rounded-lg"><Crown size={24} className="text-white" /></div>
                      </div>
                      <ul className="space-y-4 mb-10 text-gray-300 text-sm">
                          <li className="flex gap-3 text-white font-bold"><Star size={16} className="text-amber-500" /> Tudo do plano Grátis</li>
                          <li className="flex gap-3"><Star size={16} className="text-amber-500" /> Coach IA Ilimitado</li>
                          <li className="flex gap-3"><Star size={16} className="text-amber-500" /> Nutri-Vento AI</li>
                          <li className="flex gap-3"><Star size={16} className="text-amber-500" /> Histórico Ilimitado</li>
                          <li className="flex gap-3"><Star size={16} className="text-amber-500" /> Voz & Playlists Integradas</li>
                      </ul>
                      <button 
                          onClick={() => onUpgradeRequest ? onUpgradeRequest() : onEnter()}
                          className="w-full py-4 rounded-xl bg-amber-500 text-black font-black hover:bg-amber-400 transition-all uppercase tracking-widest text-xs shadow-lg flex items-center justify-center gap-2"
                      >
                          {onUpgradeRequest ? 'Solicitar Upgrade' : 'Assinar Agora'} <ArrowRight size={16} />
                      </button>
                  </div>

              </div>
          </div>
      </section>

      {/* 7. CTA FINAL */}
      <section className="py-32 px-6 bg-gradient-to-b from-black to-gray-900 text-center">
          <div className="max-w-3xl mx-auto">
              <h2 className="text-5xl font-black text-white mb-8">PRONTO PARA VOAR?</h2>
              <p className="text-xl text-gray-400 mb-12">
                  Junte-se a mais de 10.000 corredores que transformaram seu suor em dados e seus dados em evolução.
              </p>
              <button onClick={onEnter} className="px-12 py-6 bg-white text-black font-black text-sm uppercase tracking-widest rounded-full hover:scale-105 transition-transform shadow-2xl">
                  Entrar na Equipe
              </button>
          </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 bg-black border-t border-gray-900 text-center">
          <div className="flex items-center justify-center gap-2 mb-4 opacity-50 hover:opacity-100 transition-opacity">
              <Wind size={24} className="text-amber-600" />
              <span className="font-black tracking-tight text-xl text-gray-500">FILHOS DO VENTO</span>
          </div>
          <div className="flex justify-center gap-6 mb-8 text-gray-600 text-xs font-bold uppercase tracking-widest">
              <a href="#" className="hover:text-white">Sobre</a>
              <a href="#" className="hover:text-white">Termos</a>
              <a href="#" className="hover:text-white">Privacidade</a>
              <a href="#" className="hover:text-white">Contato</a>
          </div>
          <p className="text-gray-800 text-xs">© 2025 Running Team. Rio de Janeiro, Brasil.</p>
      </footer>
    </div>
  );
};
