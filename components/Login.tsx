
import React, { useState } from 'react';
import { Member, SoundType, WindRank } from '../types';
import { Wind, Lock, User, MapPin, LogIn, Mail, Fingerprint, UserPlus, AlertCircle, Ruler, Scale, FileText } from 'lucide-react';
import { signInWithIdentifier, signUpWithFirebase, isFirebaseInitialized } from '../services/firebase';

interface LoginProps {
  users: Member[];
  onLogin: (userId: string) => void;
  onRegister: (data: any) => void;
  playSound?: (type: SoundType) => void;
}

export const Login: React.FC<LoginProps> = ({ users, onLogin, onRegister, playSound }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Login State
  const [loginIdentifier, setLoginIdentifier] = useState(''); 
  const [loginPass, setLoginPass] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regNickname, setRegNickname] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regPassConfirm, setRegPassConfirm] = useState('');
  const [regGender, setRegGender] = useState<'male'|'female'>('male');
  const [regBio, setRegBio] = useState('');
  const [regLocation, setRegLocation] = useState('');
  const [regWeight, setRegWeight] = useState('');
  const [regHeight, setRegHeight] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setIsLoading(true);

      try {
          if (isFirebaseInitialized) {
              // Login Real com Firebase (suporta Email, Nome ou Apelido)
              const user = await signInWithIdentifier(loginIdentifier, loginPass);
              if(playSound) playSound('hero');
              onLogin(user.id);
          } else {
              // Fallback Offline / Mock
              const trimmedIdentifier = loginIdentifier.trim().toLowerCase();
              const trimmedPass = loginPass.trim();

              const user = users.find(u => {
                  const emailMatch = u.email ? u.email.toLowerCase() === trimmedIdentifier : false;
                  const nickMatch = u.nickname ? u.nickname.toLowerCase() === trimmedIdentifier : false;
                  const nameMatch = u.name.toLowerCase() === trimmedIdentifier;
                  return emailMatch || nickMatch || nameMatch;
              });
              
              if (user) {
                  if ((user.password || '123') === trimmedPass) {
                      if(playSound) playSound('hero');
                      onLogin(user.id);
                  } else {
                      throw new Error('Senha incorreta.');
                  }
              } else {
                  throw new Error('Usuário não encontrado. Verifique seus dados.');
              }
          }
      } catch (err: any) {
          if(playSound) playSound('error');
          console.error(err);
          setError(err.message);
      } finally {
          setIsLoading(false);
      }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      // Validações Básicas
      if (!regName || !regPass || !regPassConfirm || !regEmail || !regNickname) {
          setError("Preencha os campos obrigatórios (Nome, Email, Apelido, Senha).");
          return;
      }

      if (regPass !== regPassConfirm) {
          setError("As senhas não coincidem.");
          return;
      }
      
      if (regPass.length < 6) {
          setError("A senha deve ter pelo menos 6 caracteres.");
          return;
      }

      setIsLoading(true);

      // Objeto completo do Membro
      const newMemberData: Member = {
          id: '', // Será preenchido pelo Firebase Auth UID
          name: regName,
          email: regEmail,
          nickname: regNickname,
          password: regPass, // No Firebase real isso é ignorado no DB
          gender: regGender,
          bio: regBio,
          location: regLocation || 'Rio de Janeiro',
          weight: regWeight ? parseFloat(regWeight) : undefined,
          height: regHeight ? parseFloat(regHeight) : undefined,
          role: 'member',
          plan: 'basic',
          rank: WindRank.BREEZE,
          totalDistance: 0,
          seasonScore: 0,
          avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(regName)}&background=random&color=fff`,
          achievements: [],
          activities: [],
          followers: [],
          following: [],
          notifications: [{
              id: Date.now().toString(),
              title: "Bem-vindo!",
              message: "Sua jornada nos Filhos do Vento começou.",
              type: "success",
              read: false,
              date: new Date().toISOString()
          }],
          shoes: [],
          connectedApps: []
      };

      try {
          if (isFirebaseInitialized) {
              // Cadastro Real
              const createdUser = await signUpWithFirebase(newMemberData, regPass);
              
              if(playSound) playSound('success');
              onLogin(createdUser.id);
          } else {
              // Cadastro Mock Local
              if(playSound) playSound('success');
              const mockId = Date.now().toString();
              onRegister({ ...newMemberData, id: mockId });
          }

      } catch (err: any) {
          if(playSound) playSound('error');
          setError(err.message);
      } finally {
          setIsLoading(false);
      }
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 mb-4 shadow-lg shadow-amber-500/20 animate-float">
            <Wind className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Filhos do Vento</h1>
          <p className="text-gray-400 text-sm mt-2">Login Seguro</p>
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
          <div className="animate-fade-in space-y-6">
             <form onSubmit={handleLoginSubmit} className="space-y-4">
                 <div>
                   <label className="block text-xs text-gray-500 uppercase font-bold mb-1 ml-1">Identificação</label>
                   <div className="relative group">
                     <User className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-amber-500 transition-colors" size={18} />
                     <input 
                       type="text" 
                       value={loginIdentifier}
                       onChange={(e) => { setLoginIdentifier(e.target.value); setError(''); }}
                       className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-10 text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all placeholder-gray-600"
                       placeholder="Email, Nome ou Apelido"
                       required
                     />
                   </div>
                 </div>

                 <div>
                   <label className="block text-xs text-gray-500 uppercase font-bold mb-1 ml-1">Senha</label>
                   <div className="relative group">
                     <Lock className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-amber-500 transition-colors" size={18} />
                     <input 
                       type="password" 
                       value={loginPass}
                       onChange={(e) => { setLoginPass(e.target.value); setError(''); }}
                       className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-10 text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all placeholder-gray-600"
                       placeholder="••••••••"
                       required
                     />
                   </div>
                 </div>
                 
                 {error && (
                   <div className="flex items-center gap-2 text-red-400 text-xs font-bold animate-shake bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                     <AlertCircle size={16} /> {error}
                   </div>
                 )}

                 <button 
                   type="submit"
                   disabled={isLoading}
                   className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-amber-600/20 transition-all active:scale-95 uppercase tracking-wide text-sm flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {isLoading ? 'Autenticando...' : <><LogIn size={18} /> Entrar na Equipe</>}
                 </button>
             </form>
          </div>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="animate-fade-in space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
             <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2">
                   <label className="block text-xs text-gray-500 uppercase font-bold mb-1 ml-1">Email <span className="text-red-500">*</span></label>
                   <div className="relative">
                     <Mail className="absolute left-3 top-3 text-gray-500" size={16} />
                     <input 
                       type="email" 
                       value={regEmail}
                       onChange={(e) => setRegEmail(e.target.value)}
                       className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 pl-9 text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                       placeholder="exemplo@email.com"
                       required
                     />
                   </div>
                 </div>
                 <div>
                   <label className="block text-xs text-gray-500 uppercase font-bold mb-1 ml-1">Nome <span className="text-red-500">*</span></label>
                   <div className="relative">
                     <User className="absolute left-3 top-3 text-gray-500" size={16} />
                     <input 
                       type="text" 
                       value={regName}
                       onChange={(e) => setRegName(e.target.value)}
                       className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 pl-9 text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                       placeholder="Nome Real"
                       required
                     />
                   </div>
                 </div>
                 <div>
                   <label className="block text-xs text-gray-500 uppercase font-bold mb-1 ml-1">Apelido <span className="text-red-500">*</span></label>
                   <div className="relative">
                     <Fingerprint className="absolute left-3 top-3 text-gray-500" size={16} />
                     <input 
                       type="text" 
                       value={regNickname}
                       onChange={(e) => setRegNickname(e.target.value)}
                       className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 pl-9 text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                       placeholder="Nick Único"
                       required
                     />
                   </div>
                 </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs text-gray-500 uppercase font-bold mb-1 ml-1">Senha <span className="text-red-500">*</span></label>
                   <div className="relative">
                     <Lock className="absolute left-3 top-3 text-gray-500" size={16} />
                     <input 
                       type="password" 
                       value={regPass}
                       onChange={(e) => setRegPass(e.target.value)}
                       className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 pl-9 text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                       placeholder="Min 6 chars"
                       required
                     />
                   </div>
                 </div>
                 <div>
                   <label className="block text-xs text-gray-500 uppercase font-bold mb-1 ml-1">Confirmar <span className="text-red-500">*</span></label>
                   <div className="relative">
                     <Lock className="absolute left-3 top-3 text-gray-500" size={16} />
                     <input 
                       type="password" 
                       value={regPassConfirm}
                       onChange={(e) => setRegPassConfirm(e.target.value)}
                       className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 pl-9 text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                       placeholder="Repita"
                       required
                     />
                   </div>
                 </div>
             </div>

             <div>
                <label className="block text-xs text-gray-500 uppercase font-bold mb-1 ml-1">Gênero</label>
                <div className="flex gap-2 h-[42px]">
                    <button type="button" onClick={() => setRegGender('male')} className={`flex-1 rounded-lg text-xs font-bold border transition-colors ${regGender === 'male' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>Masc</button>
                    <button type="button" onClick={() => setRegGender('female')} className={`flex-1 rounded-lg text-xs font-bold border transition-colors ${regGender === 'female' ? 'bg-pink-600 border-pink-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>Fem</button>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs text-gray-500 uppercase font-bold mb-1 ml-1">Peso (kg)</label>
                   <div className="relative">
                     <Scale className="absolute left-3 top-3 text-gray-500" size={16} />
                     <input type="number" value={regWeight} onChange={e => setRegWeight(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 pl-9 text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="00.0" />
                   </div>
                 </div>
                 <div>
                   <label className="block text-xs text-gray-500 uppercase font-bold mb-1 ml-1">Altura (cm)</label>
                   <div className="relative">
                     <Ruler className="absolute left-3 top-3 text-gray-500" size={16} />
                     <input type="number" value={regHeight} onChange={e => setRegHeight(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 pl-9 text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="000" />
                   </div>
                 </div>
             </div>

             <div>
               <label className="block text-xs text-gray-500 uppercase font-bold mb-1 ml-1">Localização</label>
               <div className="relative">
                 <MapPin className="absolute left-3 top-3 text-gray-500" size={16} />
                 <input type="text" value={regLocation} onChange={e => setRegLocation(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 pl-9 text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Cidade / Bairro" />
               </div>
             </div>

             <div>
               <label className="block text-xs text-gray-500 uppercase font-bold mb-1 ml-1">Bio (Opcional)</label>
               <div className="relative">
                 <FileText className="absolute left-3 top-3 text-gray-500" size={16} />
                 <input type="text" value={regBio} onChange={e => setRegBio(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 pl-9 text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Seu lema de corrida..." />
               </div>
             </div>

             {error && (
               <div className="text-red-400 text-xs text-center font-bold animate-shake bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                 {error}
               </div>
             )}

             <button 
               type="submit"
               disabled={isLoading}
               className="w-full bg-white hover:bg-gray-200 text-black font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-95 uppercase tracking-wide text-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {isLoading ? 'Criando Perfil...' : <><UserPlus size={18} /> Criar Conta</>}
             </button>
          </form>
        )}
      </div>
      
      <p className="absolute bottom-6 text-gray-700 text-xs font-mono">SISTEMA ONLINE • v2.7</p>
    </div>
  );
};
