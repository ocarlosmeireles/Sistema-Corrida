
import React, { useState } from 'react';
import { Member, SoundType, WindRank } from '../types';
import { Wind, Lock, ArrowRight, CheckCircle2, UserPlus, User, MapPin, FileText, Users, Scale, Ruler } from 'lucide-react';

interface LoginProps {
  users: Member[];
  onLogin: (userId: string) => void;
  onRegister: (data: any) => void;
  playSound?: (type: SoundType) => void;
}

export const Login: React.FC<LoginProps> = ({ users, onLogin, onRegister, playSound }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Login State
  const [loginName, setLoginName] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [error, setError] = useState('');

  // Register State
  const [regName, setRegName] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regPassConfirm, setRegPassConfirm] = useState('');
  const [regGender, setRegGender] = useState<'male'|'female'>('male');
  const [regBio, setRegBio] = useState('');
  const [regLocation, setRegLocation] = useState('');
  const [regWeight, setRegWeight] = useState('');
  const [regHeight, setRegHeight] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const user = users.find(u => u.name.toLowerCase() === loginName.toLowerCase());
      
      // Verificação simples de senha (em produção usaria hash/auth real)
      if (user && user.password === loginPass) {
          if(playSound) playSound('hero');
          onLogin(user.id);
      } else {
          if(playSound) playSound('error');
          setError('Credenciais inválidas. Verifique nome e senha.');
      }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!regName || !regPass || !regPassConfirm) {
          setError("Preencha os campos obrigatórios.");
          return;
      }

      if (regPass !== regPassConfirm) {
          setError("As senhas não coincidem.");
          return;
      }
      
      const exists = users.some(u => u.name.toLowerCase() === regName.toLowerCase());
      if (exists) {
          setError("Este nome de atleta já está em uso.");
          return;
      }

      if(playSound) playSound('success');
      
      onRegister({
          name: regName,
          password: regPass,
          gender: regGender,
          bio: regBio,
          location: regLocation,
          weight: regWeight ? parseFloat(regWeight) : undefined,
          height: regHeight ? parseFloat(regHeight) : undefined
      });
  };

  const toggleMode = (m: 'login' | 'register') => {
      if(playSound) playSound('click');
      setMode(m);
      setError('');
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-amber-600/10 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md bg-gray-900/90 backdrop-blur-2xl border border-gray-800 p-8 rounded-3xl shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 mb-4 shadow-lg shadow-amber-500/20">
            <Wind className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Filhos do Vento</h1>
          <p className="text-gray-400 text-sm mt-2">Portal do Atleta</p>
        </div>

        {/* Toggle Switch */}
        <div className="flex bg-gray-800 p-1 rounded-xl mb-6">
            <button 
                onClick={() => toggleMode('login')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'login' ? 'bg-gray-700 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
            >
                Entrar
            </button>
            <button 
                onClick={() => toggleMode('register')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'register' ? 'bg-gray-700 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
            >
                Cadastrar
            </button>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="animate-fade-in space-y-4">
             <div>
               <label className="block text-xs text-gray-500 uppercase font-bold mb-1 ml-1">Nome de Atleta</label>
               <div className="relative">
                 <User className="absolute left-3 top-3.5 text-gray-500" size={18} />
                 <input 
                   type="text" 
                   value={loginName}
                   onChange={(e) => { setLoginName(e.target.value); setError(''); }}
                   className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-10 text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all placeholder-gray-600"
                   placeholder="Seu nome"
                   autoFocus
                 />
               </div>
             </div>

             <div>
               <label className="block text-xs text-gray-500 uppercase font-bold mb-1 ml-1">Senha</label>
               <div className="relative">
                 <Lock className="absolute left-3 top-3.5 text-gray-500" size={18} />
                 <input 
                   type="password" 
                   value={loginPass}
                   onChange={(e) => { setLoginPass(e.target.value); setError(''); }}
                   className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-10 text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all placeholder-gray-600"
                   placeholder="********"
                 />
               </div>
             </div>
             
             {error && (
               <div className="text-red-400 text-xs text-center font-bold animate-shake bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                 {error}
               </div>
             )}

             <button 
               type="submit"
               className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-amber-600/20 transition-all active:scale-95 uppercase tracking-wide text-sm flex items-center justify-center gap-2 mt-2"
             >
               <CheckCircle2 size={18} /> Acessar Sistema
             </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="animate-fade-in space-y-4">
             <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs text-gray-500 uppercase font-bold mb-1 ml-1">Nome</label>
                   <div className="relative">
                     <User className="absolute left-3 top-3 text-gray-500" size={16} />
                     <input 
                       type="text" 
                       value={regName}
                       onChange={(e) => setRegName(e.target.value)}
                       className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 pl-9 text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                       placeholder="Nome"
                       required
                     />
                   </div>
                 </div>
                 <div>
                   <label className="block text-xs text-gray-500 uppercase font-bold mb-1 ml-1">Gênero</label>
                   <div className="flex gap-2 h-[42px]">
                        <button type="button" onClick={() => setRegGender('male')} className={`flex-1 rounded-lg text-xs font-bold border transition-colors ${regGender === 'male' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>Masc</button>
                        <button type="button" onClick={() => setRegGender('female')} className={`flex-1 rounded-lg text-xs font-bold border transition-colors ${regGender === 'female' ? 'bg-pink-600 border-pink-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>Fem</button>
                   </div>
                 </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs text-gray-500 uppercase font-bold mb-1 ml-1">Senha</label>
                   <div className="relative">
                     <Lock className="absolute left-3 top-3 text-gray-500" size={16} />
                     <input 
                       type="password" 
                       value={regPass}
                       onChange={(e) => setRegPass(e.target.value)}
                       className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 pl-9 text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                       placeholder="****"
                       required
                     />
                   </div>
                 </div>
                 <div>
                   <label className="block text-xs text-gray-500 uppercase font-bold mb-1 ml-1">Confirmar</label>
                   <div className="relative">
                     <Lock className="absolute left-3 top-3 text-gray-500" size={16} />
                     <input 
                       type="password" 
                       value={regPassConfirm}
                       onChange={(e) => setRegPassConfirm(e.target.value)}
                       className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 pl-9 text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                       placeholder="****"
                       required
                     />
                   </div>
                 </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs text-gray-500 uppercase font-bold mb-1 ml-1">Peso (kg)</label>
                   <div className="relative">
                     <Scale className="absolute left-3 top-3 text-gray-500" size={16} />
                     <input 
                       type="number" 
                       value={regWeight}
                       onChange={(e) => setRegWeight(e.target.value)}
                       className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 pl-9 text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                       placeholder="0.0"
                     />
                   </div>
                 </div>
                 <div>
                   <label className="block text-xs text-gray-500 uppercase font-bold mb-1 ml-1">Altura (cm)</label>
                   <div className="relative">
                     <Ruler className="absolute left-3 top-3 text-gray-500" size={16} />
                     <input 
                       type="number" 
                       value={regHeight}
                       onChange={(e) => setRegHeight(e.target.value)}
                       className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 pl-9 text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                       placeholder="0"
                     />
                   </div>
                 </div>
             </div>

             <div>
               <label className="block text-xs text-gray-500 uppercase font-bold mb-1 ml-1">Localização</label>
               <div className="relative">
                 <MapPin className="absolute left-3 top-3 text-gray-500" size={16} />
                 <input 
                   type="text" 
                   value={regLocation}
                   onChange={(e) => setRegLocation(e.target.value)}
                   className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 pl-9 text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                   placeholder="Ex: Rio de Janeiro, RJ"
                 />
               </div>
             </div>

             <div>
               <label className="block text-xs text-gray-500 uppercase font-bold mb-1 ml-1">Bio do Atleta</label>
               <div className="relative">
                 <FileText className="absolute left-3 top-3 text-gray-500" size={16} />
                 <textarea 
                   value={regBio}
                   onChange={(e) => setRegBio(e.target.value)}
                   className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 pl-9 text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none resize-none h-20"
                   placeholder="Seus objetivos, experiência..."
                 />
               </div>
             </div>

             {error && (
               <div className="text-red-400 text-xs text-center font-bold animate-shake bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                 {error}
               </div>
             )}

             <button 
               type="submit"
               className="w-full bg-white hover:bg-gray-200 text-black font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-95 uppercase tracking-wide text-sm flex items-center justify-center gap-2 mt-2"
             >
               <UserPlus size={18} /> Criar Perfil
             </button>
             <p className="text-[10px] text-gray-500 text-center mt-2">
                 Novos membros iniciam no plano <strong className="text-gray-300">Básico</strong>.
             </p>
          </form>
        )}
      </div>
      
      <p className="absolute bottom-6 text-gray-700 text-xs font-mono">SECURE ACCESS • FILHOS DO VENTO</p>
    </div>
  );
};
