
import React, { useState, useEffect, useRef } from 'react';
import { Story, Member, WindRank, ChatMessage, PrivateMessage } from '../types';
import { Heart, Star, PlusCircle, Quote, Medal, Send, Radio, Hash, MessageSquare, Search, Users } from 'lucide-react';

interface CommunityProps {
  stories: Story[];
  currentUser: Member;
  members: Member[];
  onAddStory: (story: Story) => void;
  onLikeStory: (id: string) => void;
  directMessages: PrivateMessage[];
  onSendMessage: (receiverId: string, content: string) => void;
  initialChatTargetId?: string | null;
  onNotifyMember?: (targetId: string, title: string, message: string) => void;
}

// Mock Featured Member
const FEATURED_MEMBER = {
  name: "Sarah Ventania",
  rank: WindRank.GALE,
  reason: "Bateu seu recorde pessoal nos 5km e ajudou 3 novatos a completarem o treino de sábado!",
  avatarUrl: "https://ui-avatars.com/api/?name=Sarah+Ventania&background=random"
};

const INITIAL_CHATS: ChatMessage[] = [
    { id: '1', senderId: '2', senderName: 'Sarah Ventania', content: 'Alguém anima longão no sábado? Aterro 6am.', timestamp: '10:30', channel: 'longao' },
    { id: '2', senderId: '3', senderName: 'Mike Furacão', content: 'Eu vou! Ritmo 5:00?', timestamp: '10:32', channel: 'longao' },
    { id: '3', senderId: '4', senderName: 'Ana Rajada', content: 'Bom dia equipe! Ótima semana de treinos.', timestamp: '08:00', channel: 'geral' },
    { id: '4', senderId: '0', senderName: 'Coach Eólico', content: 'Lembrem-se de hidratar. A previsão é de calor hoje.', timestamp: '09:15', channel: 'geral' },
    { id: '5', senderId: '1', senderName: 'Carlos Admin', content: 'Pessoal da elite, treino de tiro na pista hoje à noite.', timestamp: '11:00', channel: 'elites' },
    { id: '6', senderId: '4', senderName: 'Ana Rajada', content: 'Como faço para melhorar a respiração? Sinto pontada rápido.', timestamp: '14:20', channel: 'iniciantes' },
];

// Respostas automáticas simuladas para dar vida ao chat
const AUTO_REPLIES = [
    "Com certeza!",
    "Isso aí, foco total!",
    "Alguém vai no treino de amanhã?",
    "Meu pace melhorou muito essa semana.",
    "Cuidado com o vento contra na volta.",
    "Boa corrida a todos!",
    "Isso é muito verdade.",
    "hahaha boa!",
    "Vou tentar fazer isso no próximo treino.",
    "Estamos juntos nessa!"
];

export const Community: React.FC<CommunityProps> = ({ 
    stories, currentUser, members, onAddStory, onLikeStory, 
    directMessages, onSendMessage, initialChatTargetId, onNotifyMember 
}) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'chat' | 'direct'>('feed');
  
  // Feed State
  const [isAdding, setIsAdding] = useState(false);
  const [newStory, setNewStory] = useState({ title: '', content: '' });

  // Public Chat State
  const [currentChannel, setCurrentChannel] = useState<'geral' | 'elites' | 'longao' | 'iniciantes'>('geral');
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHATS);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);

  // Direct Message State
  const [selectedDmUser, setSelectedDmUser] = useState<string | null>(initialChatTargetId || null);
  const [dmInput, setDmInput] = useState('');
  const [dmSearch, setDmSearch] = useState('');

  // Handle deep linking to chat
  useEffect(() => {
      if (initialChatTargetId) {
          setActiveTab('direct');
          setSelectedDmUser(initialChatTargetId);
      }
  }, [initialChatTargetId]);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
      scrollToBottom();
  }, [messages, currentChannel, activeTab]);

  // Simulate Real-time Incoming Messages
  useEffect(() => {
      if (messages.length > 0 && messages[messages.length - 1].senderId === currentUser.id) {
          // If last message was me, simulate a reply
          setIsTyping(true);
          const timeout = setTimeout(() => {
              const randomMember = members[Math.floor(Math.random() * members.length)];
              if (randomMember.id === currentUser.id) return; // Don't reply to self

              const replyText = AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)];
              
              const botMsg: ChatMessage = {
                  id: Date.now().toString(),
                  senderId: randomMember.id,
                  senderName: randomMember.name,
                  content: replyText,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  channel: currentChannel
              };
              
              setMessages(prev => [...prev, botMsg]);
              setIsTyping(false);
          }, 2500 + Math.random() * 2000); // Random delay 2.5s - 4.5s

          return () => clearTimeout(timeout);
      }
  }, [messages, currentUser.id, members, currentChannel]);

  const handleStorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStory.title || !newStory.content) return;

    const story: Story = {
      id: Date.now().toString(),
      authorName: currentUser.name,
      authorRank: currentUser.rank,
      title: newStory.title,
      content: newStory.content,
      date: new Date().toISOString().split('T')[0],
      likes: 0
    };

    onAddStory(story);
    setNewStory({ title: '', content: '' });
    setIsAdding(false);
  };

  const handleChatSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(!newMessage.trim()) return;

      const msg: ChatMessage = {
          id: Date.now().toString(),
          senderId: currentUser.id,
          senderName: currentUser.name,
          content: newMessage,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          channel: currentChannel
      };

      setMessages([...messages, msg]);
      
      // Check for mentions
      if (newMessage.includes('@')) {
          const words = newMessage.split(' ');
          words.forEach(word => {
              if (word.startsWith('@')) {
                  const mentionedName = word.substring(1).toLowerCase();
                  const mentionedUser = members.find(m => m.name.toLowerCase().includes(mentionedName));
                  if (mentionedUser && mentionedUser.id !== currentUser.id && onNotifyMember) {
                      onNotifyMember(mentionedUser.id, "Você foi mencionado", `${currentUser.name} mencionou você no canal #${currentChannel}`);
                  }
              }
          });
      }

      setNewMessage('');
  };

  const handleDirectMessageSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedDmUser || !dmInput.trim()) return;
      onSendMessage(selectedDmUser, dmInput);
      setDmInput('');
  };

  const filteredMessages = messages.filter(m => m.channel === currentChannel);

  // Group DMs by user
  const getDmThreads = () => {
      const threads = new Set<string>();
      directMessages.forEach(msg => {
          if (msg.senderId === currentUser.id) threads.add(msg.receiverId);
          if (msg.receiverId === currentUser.id) threads.add(msg.senderId);
      });
      // Also add selected user if not yet in threads
      if(selectedDmUser) threads.add(selectedDmUser);
      
      return Array.from(threads).map(userId => {
          const user = members.find(m => m.id === userId);
          const lastMsg = directMessages
            .filter(m => (m.senderId === userId && m.receiverId === currentUser.id) || (m.senderId === currentUser.id && m.receiverId === userId))
            .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
          return { user, lastMsg };
      }).filter(item => item.user && item.user.name.toLowerCase().includes(dmSearch.toLowerCase()));
  };

  const activeDmMessages = selectedDmUser 
    ? directMessages.filter(m => 
        (m.senderId === currentUser.id && m.receiverId === selectedDmUser) || 
        (m.senderId === selectedDmUser && m.receiverId === currentUser.id)
      ).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    : [];

  return (
    <div className="space-y-6 pb-24">
      
      {/* HEADER WITH TABS */}
      <div className="flex flex-col gap-4">
        <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Conexão da Equipe</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Interaja com o pelotão.</p>
        </div>

        <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-xl overflow-x-auto">
             <button
                onClick={() => setActiveTab('feed')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
                    activeTab === 'feed' 
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
             >
                 <Star size={16} /> Feed
             </button>
             <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
                    activeTab === 'chat' 
                    ? 'bg-amber-500 text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
             >
                 <Radio size={16} /> Rádio
             </button>
             <button
                onClick={() => setActiveTab('direct')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
                    activeTab === 'direct' 
                    ? 'bg-blue-500 text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
             >
                 <MessageSquare size={16} /> Mensagens
             </button>
        </div>
      </div>

      {/* --- FEED TAB --- */}
      {activeTab === 'feed' && (
        <div className="animate-fade-in space-y-8">
            {/* FEATURED CARD */}
            <div className="relative bg-gradient-to-r from-yellow-200 to-amber-100 dark:from-yellow-600/20 dark:to-amber-900/40 rounded-2xl p-1 border border-amber-200 dark:border-amber-500/30 shadow-lg dark:shadow-amber-500/5">
                <div className="bg-white/80 dark:bg-gray-900/80 rounded-xl p-6 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 text-amber-500/10 -mt-4 -mr-4 rotate-12 pointer-events-none">
                    <Star size={120} fill="currentColor" />
                </div>
                
                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative flex-shrink-0">
                    <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full blur opacity-75"></div>
                    <img 
                        src={FEATURED_MEMBER.avatarUrl} 
                        alt={FEATURED_MEMBER.name}
                        className="relative w-24 h-24 rounded-full border-4 border-white dark:border-gray-900 object-cover"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-amber-500 text-white dark:text-black p-1.5 rounded-full border-4 border-white dark:border-gray-900">
                        <Medal size={20} />
                    </div>
                    </div>

                    <div className="text-center sm:text-left flex-1 w-full">
                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-widest rounded border border-amber-200 dark:border-amber-500/30">
                        Destaque da Semana
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{FEATURED_MEMBER.name}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-3 font-medium">{FEATURED_MEMBER.rank}</p>
                    <div className="relative">
                        <Quote className="absolute -top-2 -left-2 text-amber-500/20 w-6 h-6 transform -scale-x-100" />
                        <p className="text-gray-600 dark:text-gray-200 italic text-sm border-l-2 border-amber-500 pl-3 bg-amber-50 dark:bg-amber-500/5 py-2 rounded-r-lg">
                        {FEATURED_MEMBER.reason}
                        </p>
                    </div>
                    </div>
                </div>
                </div>
            </div>

            {/* STORIES */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Quote size={20} className="text-amber-500 dark:text-amber-400" />
                    Mural de Superação
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Histórias reais de quem sua a camisa.</p>
                </div>
            
                <button 
                onClick={() => setIsAdding(!isAdding)}
                className="w-full sm:w-auto bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-400/30 px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                <PlusCircle size={16} /> Contar História
                </button>
            </div>

            {/* ADD STORY FORM */}
            {isAdding && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 animate-fade-in shadow-md">
                <h4 className="text-gray-900 dark:text-white font-bold mb-4">Compartilhe sua vitória</h4>
                <form onSubmit={handleStorySubmit} className="space-y-4">
                    <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Título</label>
                    <input 
                        required 
                        type="text" 
                        value={newStory.title} 
                        onChange={e => setNewStory({...newStory, title: e.target.value})} 
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-gray-900 dark:text-white focus:ring-1 focus:ring-amber-500 outline-none" 
                        placeholder="Ex: Completei minha primeira prova!" 
                    />
                    </div>
                    <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Sua História</label>
                    <textarea 
                        required 
                        value={newStory.content} 
                        onChange={e => setNewStory({...newStory, content: e.target.value})} 
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-gray-900 dark:text-white focus:ring-1 focus:ring-amber-500 outline-none h-32 resize-none" 
                        placeholder="Conte para a equipe como você superou seus limites..." 
                    />
                    </div>
                    <div className="flex justify-end pt-2">
                    <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white dark:text-gray-900 font-bold py-2 px-6 rounded-lg transition-colors">Publicar</button>
                    </div>
                </form>
                </div>
            )}

            {/* STORIES GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {stories.map((story) => (
                <div key={story.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 flex flex-col h-full hover:border-gray-300 dark:hover:border-gray-600 transition-all shadow-sm hover:shadow-md">
                    
                    <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-gray-900 font-bold text-sm shadow-inner">
                        {story.authorName.charAt(0)}
                        </div>
                        <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{story.authorName}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wide mt-0.5">{story.authorRank}</p>
                        </div>
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded-full">{new Date(story.date).toLocaleDateString()}</span>
                    </div>

                    <h4 className="text-lg font-bold text-amber-600 dark:text-amber-400 mb-3 line-clamp-2">{story.title}</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed flex-1 whitespace-pre-line mb-4">
                    {story.content}
                    </p>

                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700/50 flex items-center gap-4 mt-auto">
                    <button 
                        onClick={() => onLikeStory(story.id)}
                        className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors group px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-400/10"
                    >
                        <Heart size={18} className={`transition-transform duration-300 ${story.likes > 0 ? "fill-red-500 dark:fill-red-400 text-red-500 dark:text-red-400 scale-110" : "group-hover:scale-110"}`} />
                        <span className="text-xs font-bold">{story.likes} Aplausos</span>
                    </button>
                    </div>
                </div>
                ))}
            </div>
        </div>
      )}

      {/* --- PUBLIC CHAT TAB --- */}
      {activeTab === 'chat' && (
          <div className="animate-fade-in flex flex-col md:flex-row gap-4 h-[600px] bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-xl">
               {/* Sidebar Channels */}
               <div className="w-full md:w-1/4 bg-gray-50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="font-bold text-gray-700 dark:text-gray-200 uppercase text-xs tracking-wider">Canais</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {[
                            { id: 'geral', label: 'Geral', icon: Hash },
                            { id: 'longao', label: 'Longões', icon: Hash },
                            { id: 'elites', label: 'Performance', icon: Hash },
                            { id: 'iniciantes', label: 'Iniciantes', icon: Hash },
                        ].map((ch) => (
                            <button
                                key={ch.id}
                                onClick={() => setCurrentChannel(ch.id as any)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${currentChannel === ch.id ? 'bg-amber-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                            >
                                <ch.icon size={16} /> {ch.label}
                            </button>
                        ))}
                    </div>
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center">
                        <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                            <Users size={12} /> {Math.floor(Math.random() * 20) + 5} online agora
                        </p>
                    </div>
               </div>

               {/* Chat Area */}
               <div className="flex-1 flex flex-col relative">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 z-10">
                        <div className="flex items-center gap-2">
                             <Hash size={20} className="text-gray-400" />
                             <h3 className="font-bold text-gray-900 dark:text-white capitalize">{currentChannel}</h3>
                        </div>
                        <span className="text-xs text-green-500 font-bold flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> 
                            Ao Vivo
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-100 dark:bg-gray-900/30 custom-scrollbar">
                        {filteredMessages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-50">
                                <MessageSquare size={48} className="mb-2" />
                                <p className="text-sm">Inicie a conversa em #{currentChannel}</p>
                            </div>
                        )}
                        {filteredMessages.map((msg) => {
                            const isMe = msg.senderId === currentUser.id;
                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    {!isMe && (
                                        <div className="mr-2 flex-shrink-0 self-end mb-1">
                                            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-xs font-bold uppercase">
                                                {msg.senderName.charAt(0)}
                                            </div>
                                        </div>
                                    )}
                                    <div className={`max-w-[80%] rounded-2xl p-3 shadow-sm relative group ${isMe ? 'bg-amber-500 text-white rounded-tr-none' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-none border border-gray-200 dark:border-gray-700'}`}>
                                        {!isMe && <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mb-1">{msg.senderName}</p>}
                                        <p className="text-sm leading-snug">{msg.content}</p>
                                        <span className={`text-[9px] block text-right mt-1 ${isMe ? 'text-amber-100' : 'text-gray-400'}`}>{msg.timestamp}</span>
                                    </div>
                                </div>
                            );
                        })}
                        {isTyping && (
                            <div className="flex justify-start animate-pulse">
                                <div className="bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-2 text-xs text-gray-500 dark:text-gray-300 italic flex items-center gap-1">
                                    <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                                    <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                    <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleChatSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex gap-2">
                        <input 
                            type="text" 
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="flex-1 bg-gray-100 dark:bg-gray-900 border border-transparent focus:border-amber-500 rounded-xl px-4 py-2 text-sm outline-none transition-colors dark:text-white"
                            placeholder={`Enviar mensagem em #${currentChannel}...`}
                        />
                        <button type="submit" disabled={!newMessage.trim()} className="bg-amber-500 disabled:bg-gray-300 text-white p-2.5 rounded-xl hover:bg-amber-600 transition-colors disabled:cursor-not-allowed">
                            <Send size={18} />
                        </button>
                    </form>
               </div>
          </div>
      )}

      {/* --- DIRECT MESSAGES TAB --- */}
      {activeTab === 'direct' && (
          <div className="animate-fade-in flex flex-col md:flex-row gap-4 h-[600px] bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-xl">
               
               {/* Sidebar Users */}
               <div className="w-full md:w-1/3 bg-gray-50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="font-bold text-gray-700 dark:text-gray-200 uppercase text-xs tracking-wider mb-3">Mensagens Diretas</h3>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input 
                                type="text" 
                                value={dmSearch}
                                onChange={e => setDmSearch(e.target.value)}
                                placeholder="Buscar membro..." 
                                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {getDmThreads().map(({ user, lastMsg }) => (
                             user && (
                                <button
                                    key={user.id}
                                    onClick={() => setSelectedDmUser(user.id)}
                                    className={`w-full text-left px-3 py-3 rounded-lg flex items-center gap-3 transition-colors ${selectedDmUser === user.id ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800' : 'hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'}`}
                                >
                                    <div className="relative">
                                        <img src={user.avatarUrl} className="w-10 h-10 rounded-full bg-gray-200 object-cover" alt={user.name} />
                                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <h4 className={`text-sm font-bold truncate ${selectedDmUser === user.id ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>{user.name}</h4>
                                        <p className="text-xs text-gray-500 truncate">{lastMsg ? lastMsg.content : 'Iniciar conversa'}</p>
                                    </div>
                                    {lastMsg && (
                                        <span className="text-[9px] text-gray-400">{new Date(lastMsg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    )}
                                </button>
                             )
                        ))}
                        {getDmThreads().length === 0 && (
                            <p className="text-xs text-gray-500 text-center py-4">Nenhuma conversa recente.</p>
                        )}
                        
                        {/* If searching, show users not in thread list */}
                        {dmSearch && members
                            .filter(m => m.id !== currentUser.id && m.name.toLowerCase().includes(dmSearch.toLowerCase()) && !getDmThreads().find(t => t.user?.id === m.id))
                            .map(user => (
                                <button
                                    key={user.id}
                                    onClick={() => { setSelectedDmUser(user.id); setDmSearch(''); }}
                                    className="w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 opacity-70"
                                >
                                    <img src={user.avatarUrl} className="w-8 h-8 rounded-full" alt={user.name} />
                                    <span className="text-sm dark:text-gray-300">{user.name}</span>
                                </button>
                            ))
                        }
                    </div>
               </div>

               {/* Chat Area */}
               <div className="flex-1 flex flex-col bg-gray-50 dark:bg-black/20">
                    {selectedDmUser ? (
                        <>
                             <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3 bg-white dark:bg-gray-800">
                                 <img src={members.find(m => m.id === selectedDmUser)?.avatarUrl} className="w-10 h-10 rounded-full" alt="User" />
                                 <div>
                                     <h3 className="font-bold text-gray-900 dark:text-white">{members.find(m => m.id === selectedDmUser)?.name}</h3>
                                     <span className="text-xs text-green-500 flex items-center gap-1">Online</span>
                                 </div>
                             </div>

                             <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                  {activeDmMessages.length === 0 ? (
                                      <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                          <MessageSquare size={48} className="mb-2 opacity-20" />
                                          <p className="text-sm">Envie a primeira mensagem!</p>
                                      </div>
                                  ) : (
                                      activeDmMessages.map(msg => {
                                          const isMe = msg.senderId === currentUser.id;
                                          return (
                                              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                  <div className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-none border border-gray-200 dark:border-gray-700'}`}>
                                                      <p className="text-sm">{msg.content}</p>
                                                      <span className={`text-[9px] block text-right mt-1 opacity-70`}>
                                                          {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                      </span>
                                                  </div>
                                              </div>
                                          );
                                      })
                                  )}
                             </div>

                             <form onSubmit={handleDirectMessageSubmit} className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                                 <input 
                                     type="text" 
                                     value={dmInput}
                                     onChange={e => setDmInput(e.target.value)}
                                     placeholder="Escreva sua mensagem..."
                                     className="flex-1 bg-gray-100 dark:bg-gray-900 border-transparent focus:border-blue-500 border rounded-xl px-4 py-3 text-sm outline-none dark:text-white"
                                 />
                                 <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl transition-colors shadow-lg shadow-blue-500/20">
                                     <Send size={18} />
                                 </button>
                             </form>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                            <div className="w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                <MessageSquare size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-600 dark:text-gray-300">Suas Mensagens</h3>
                            <p className="text-sm max-w-xs">Selecione um membro da equipe para iniciar uma conversa privada.</p>
                        </div>
                    )}
               </div>
          </div>
      )}

    </div>
  );
};
