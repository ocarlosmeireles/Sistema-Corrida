
import React, { useState } from 'react';
import { Member, SoundType } from '../types';
import { Wind, Lock, ArrowRight, CheckCircle2, ShieldAlert, Search } from 'lucide-react';

interface LoginProps {
  users: Member[];
  onLogin: (userId: string) => void;
  playSound?: (type: SoundType) => void;
}

export const Login: React.FC<LoginProps> = ({ users, onLogin, playSound }) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleUserSelect = (id: string) => {
      if(playSound) playSound('click');
      setSelectedUserId(id);
      setPassword('');
      setError('');
  };

  const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedUserId) return;

      const user = users.find(u => u.id === selectedUserId);
      
      // Simple password check (mock)
      // In real app, hash comparison on backend
      const validPassword = user?.password || '123'; // Fallback for dev

      if (user && password === validPassword) {
          onLogin(user.id);
      } else {
          if(playSound) playSound('error');
          setError('Senha incorreta. Tente novamente.');
      }
  };

  const filteredUsers = users.filter(user => 
      user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <p className="text-gray-400 text-sm mt-2">Área de Membros</p>
        </div>

        {!selectedUserId ? (
          <div className="space-y-4 animate-fade-in">
            <p className="text-xs text-gray-500 uppercase font-bold mb-2 text-center tracking-widest">Selecione seu perfil</p>
            
            {/* Search Input */}
            <div className="relative mb-2 group">
                <Search className="absolute left-3 top-2.5 text-gray-500 group-focus-within:text-amber-500 transition-colors" size={16} />
                <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar atleta por nome..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
            </div>
            
            {searchQuery && (
                <p className="text-[10px] text-gray-500 text-right px-1">
                    {filteredUsers.length} encontrado(s)
                </p>
            )}

            <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
              {filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => handleUserSelect(user.id)}
                      className="w-full flex items-center gap-4 p-3 rounded-xl border border-gray-800 hover:border-amber-500/50 hover:bg-gray-800/50 transition-all duration-300 group"
                    >
                      <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full bg-gray-800 object-cover border border-gray-700" />
                      <div className="text-left flex-1">
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">{user.name}</p>
                            {user.role !== 'member' && <ShieldAlert size={12} className="text-amber-600" />}
                        </div>
                        <p className="text-[10px] text-gray-500 uppercase">{user.rank}</p>
                      </div>
                      <ArrowRight size={16} className="text-gray-600 group-hover:text-amber-500 transition-colors opacity-0 group-hover:opacity-100" />
                    </button>
                  ))
              ) : (
                  <div className="text-center py-8 border border-dashed border-gray-800 rounded-xl">
                      <p className="text-sm text-gray-500">Nenhum atleta encontrado.</p>
                  </div>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="animate-fade-in space-y-6">
             <button 
                type="button" 
                onClick={() => {
                    if(playSound) playSound('click');
                    setSelectedUserId(null);
                }}
                className="text-xs text-gray-500 hover:text-white transition-colors mb-4 flex items-center gap-1"
             >
                 ← Voltar para lista
             </button>

             <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-2xl border border-gray-800 mb-6">
                 <img src={users.find(u => u.id === selectedUserId)?.avatarUrl} className="w-12 h-12 rounded-full" alt="User" />
                 <div>
                     <p className="text-white font-bold">{users.find(u => u.id === selectedUserId)?.name}</p>
                     <p className="text-xs text-gray-500">Confirmar identidade</p>
                 </div>
             </div>

             <div>
               <div className="relative">
                 <Lock className="absolute left-3 top-3.5 text-gray-500" size={18} />
                 <input 
                   type="password" 
                   value={password}
                   onChange={(e) => { setPassword(e.target.value); setError(''); }}
                   className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3.5 pl-10 text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all placeholder-gray-600"
                   placeholder="Sua senha"
                   autoFocus
                 />
               </div>
             </div>
             
             {error && (
               <div className="text-red-400 text-xs text-center font-bold animate-shake bg-red-500/10 p-2 rounded-lg">
                 {error}
               </div>
             )}

             <button 
               type="submit"
               className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-amber-600/20 transition-all active:scale-95 uppercase tracking-wide text-sm flex items-center justify-center gap-2"
             >
               <CheckCircle2 size={18} /> Acessar
             </button>
             
             <p className="text-center text-[10px] text-gray-600 mt-4">Senha padrão de testes: <strong>123</strong></p>
          </form>
        )}
      </div>
      
      <p className="absolute bottom-6 text-gray-700 text-xs font-mono">SECURE ACCESS • FILHOS DO VENTO</p>
    </div>
  );
};
