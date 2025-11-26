
import React, { useState, useRef, useEffect } from 'react';
import { Member, Activity } from '../types';
import { MapPin, ChevronLeft, UserPlus, UserCheck, Activity as ActivityIcon, Camera, X, Trophy, Link as LinkIcon, MessageCircle, Edit3, Save, LogOut, Upload, Scale, Ruler, RefreshCw, CheckCircle, Mail, Fingerprint } from 'lucide-react';
import { ACHIEVEMENTS_LIST } from './Achievements';
import { connectStrava, getStravaActivities } from '../services/strava';

interface UserProfileProps {
  member: Member;
  currentUser: Member;
  onBack: () => void;
  onToggleFollow: (targetId: string) => void;
  onUpdateProfile?: (updatedMember: Member) => void;
  onOpenChat: () => void;
  onLogout?: () => void;
  playSound?: (type: 'click' | 'success' | 'error' | 'toggle') => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ member, currentUser, onBack, onToggleFollow, onUpdateProfile, onOpenChat, onLogout, playSound }) => {
  const isMe = member.id === currentUser.id;
  const isFollowing = currentUser.following.includes(member.id);
  const isPro = member.plan === 'pro';
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
      name: member.name,
      email: member.email || '',
      nickname: member.nickname || '',
      bio: member.bio || '',
      location: member.location || '',
      avatarUrl: member.avatarUrl,
      weight: member.weight || '',
      height: member.height || ''
  });

  // Camera & Upload State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Integrations State
  const [isSyncing, setIsSyncing] = useState(false);
  const [connectedApps, setConnectedApps] = useState(member.connectedApps || [
      { id: 'strava', name: 'Strava', connected: false, color: 'bg-[#FC4C02]', icon: ActivityIcon },
      { id: 'garmin', name: 'Garmin', connected: false, color: 'bg-[#000000]', icon: ActivityIcon },
      { id: 'polar', name: 'Polar', connected: false, color: 'bg-[#E60000]', icon: ActivityIcon }
  ]);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    };
  }, [stream]);

  // Ensure local state updates when prop member changes
  useEffect(() => {
      setEditForm({
          name: member.name,
          email: member.email || '',
          nickname: member.nickname || '',
          bio: member.bio || '',
          location: member.location || '',
          avatarUrl: member.avatarUrl,
          weight: member.weight || '',
          height: member.height || ''
      });
      if (member.connectedApps) {
          setConnectedApps(member.connectedApps as any);
      }
  }, [member]);

  const handleSaveProfile = () => {
      if (onUpdateProfile) {
          onUpdateProfile({
              ...member,
              name: editForm.name,
              email: editForm.email,
              nickname: editForm.nickname,
              bio: editForm.bio,
              location: editForm.location,
              avatarUrl: editForm.avatarUrl,
              weight: editForm.weight ? Number(editForm.weight) : undefined,
              height: editForm.height ? Number(editForm.height) : undefined
          });
          if(playSound) playSound('success');
      }
      setIsEditing(false);
  };

  // Strava Integration Logic
  const handleConnectApp = async (appId: string) => {
      if (appId === 'strava') {
          const confirm = window.confirm("Você será redirecionado para o Strava para autorizar o Filhos do Vento.");
          if (confirm) {
              const success = await connectStrava();
              if (success) {
                  const updatedApps = connectedApps.map(app => 
                      app.id === 'strava' ? { ...app, connected: true, lastSync: new Date().toISOString() } : app
                  );
                  setConnectedApps(updatedApps as any);
                  if (onUpdateProfile) {
                      onUpdateProfile({ ...member, connectedApps: updatedApps as any });
                  }
                  if(playSound) playSound('success');
              }
          }
      } else {
          alert("Integração em breve.");
      }
  };

  const handleSyncStrava = async () => {
      setIsSyncing(true);
      try {
          const newActivities = await getStravaActivities();
          
          // Merge logic is handled by parent via onUpdateProfile
          const existingIds = new Set(member.activities.map(a => a.externalId));
          const uniqueNewActivities = newActivities.filter(a => !existingIds.has(a.externalId));
          
          if (uniqueNewActivities.length > 0) {
              const updatedActivities = [...member.activities, ...uniqueNewActivities];
              const totalDistance = updatedActivities.reduce((acc, curr) => acc + curr.distanceKm, 0);
              
              // Update connected app timestamp
              const updatedApps = connectedApps.map(app => 
                  app.id === 'strava' ? { ...app, lastSync: new Date().toISOString() } : app
              );

              if (onUpdateProfile) {
                  onUpdateProfile({
                      ...member,
                      activities: updatedActivities,
                      totalDistance: totalDistance, // Update total distance
                      connectedApps: updatedApps as any
                  });
              }
              alert(`${uniqueNewActivities.length} novas atividades importadas do Strava!`);
              if(playSound) playSound('success');
          } else {
              alert("Tudo atualizado! Nenhuma atividade nova encontrada.");
          }
      } catch (e) {
          console.error(e);
          alert("Erro ao sincronizar.");
      } finally {
          setIsSyncing(false);
      }
  };

  const startCamera = async () => {
    try {
        setIsCameraOpen(true);
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user', width: 300, height: 300 } 
        });
        setStream(mediaStream);
        setTimeout(() => {
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        }, 100);
    } catch (err) {
        console.error("Error accessing camera:", err);
        alert("Não foi possível acessar a câmera. Verifique as permissões.");
        setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
      if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
      }
      setIsCameraOpen(false);
  };

  const takePhoto = () => {
      if (videoRef.current && canvasRef.current) {
          const context = canvasRef.current.getContext('2d');
          if (context) {
              canvasRef.current.width = videoRef.current.videoWidth;
              canvasRef.current.height = videoRef.current.videoHeight;
              context.drawImage(videoRef.current, 0, 0, videoRef.current.videoWidth, videoRef.current.videoHeight);
              const dataUrl = canvasRef.current.toDataURL('image/jpeg');
              
              setEditForm(prev => ({ ...prev, avatarUrl: dataUrl }));
              stopCamera();
          }
      }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const result = reader.result as string;
              setEditForm(prev => ({ ...prev, avatarUrl: result }));
          };
          reader.readAsDataURL(file);
      }
  };

  const triggerFileInput = () => {
      fileInputRef.current?.click();
  };

  // Trophy Logic
  const totalAchievements = ACHIEVEMENTS_LIST.length;
  const unlockedCount = member.achievements.length;
  const progress = (unlockedCount / totalAchievements) * 100;

  let trophyStyle = { color: "text-orange-800/60 dark:text-orange-400/50", label: "Bronze", glow: "" };
  if (progress >= 100) {
      trophyStyle = { color: "text-cyan-300", label: "Diamante", glow: "drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-pulse" };
  } else if (progress >= 66) {
      trophyStyle = { color: "text-yellow-300", label: "Ouro", glow: "drop-shadow-[0_0_10px_rgba(253,224,71,0.6)]" };
  } else if (progress >= 33) {
      trophyStyle = { color: "text-gray-200", label: "Prata", glow: "drop-shadow-[0_0_5px_rgba(229,231,235,0.4)]" };
  }

  return (
    <div className="space-y-6 pb-24 animate-fade-in relative">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
      
      {/* Camera Modal */}
      {isCameraOpen && (
          <div className="fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center p-4">
              <div className="w-full max-w-md bg-gray-900 rounded-2xl overflow-hidden border border-gray-700 shadow-2xl">
                  <div className="p-4 flex justify-between items-center border-b border-gray-800">
                      <h3 className="text-white font-bold flex items-center gap-2">
                          <Camera size={20} className="text-amber-500" /> Nova Foto
                      </h3>
                      <button onClick={stopCamera} className="text-gray-400 hover:text-white">
                          <X size={24} />
                      </button>
                  </div>
                  <div className="relative aspect-square bg-black flex items-center justify-center overflow-hidden">
                      <video 
                          ref={videoRef} 
                          autoPlay 
                          playsInline 
                          muted 
                          className="w-full h-full object-cover transform scale-x-[-1]"
                      />
                  </div>
                  <div className="p-6 flex justify-center bg-gray-900">
                      <button 
                          onClick={takePhoto}
                          className="w-16 h-16 rounded-full bg-white border-4 border-amber-500 flex items-center justify-center hover:scale-105 transition-transform active:scale-95 shadow-lg shadow-amber-500/20"
                      >
                          <div className="w-12 h-12 rounded-full bg-amber-500" />
                      </button>
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
              </div>
          </div>
      )}

      {/* Header / Navigation */}
      <div className="flex justify-between items-center">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-gray-500 hover:text-amber-500 transition-colors font-medium"
          >
            <ChevronLeft size={20} /> Voltar
          </button>
          {isMe && (
              <button 
                onClick={() => { if(playSound) playSound('click'); onLogout && onLogout(); }}
                className="text-xs flex items-center gap-1 text-red-500 hover:text-red-400 font-bold px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors border border-red-500/20"
              >
                  <LogOut size={14} /> Sair da Conta
              </button>
          )}
      </div>

      {/* Profile Header Card */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg relative overflow-hidden group/card">
        {/* Decorative Background */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-amber-500 to-orange-600 opacity-90"></div>
        
        {/* BIG TROPHY VISUAL */}
        <div className="absolute top-4 right-6 flex flex-col items-center z-10">
            <div className={`transform transition-transform duration-700 hover:scale-110 hover:rotate-6 ${trophyStyle.glow}`}>
                <Trophy size={64} className={`${trophyStyle.color} fill-current opacity-90`} strokeWidth={1.5} />
            </div>
            <div className="bg-black/20 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-white font-bold uppercase tracking-widest mt-1 border border-white/10">
                Nível {trophyStyle.label}
            </div>
        </div>

        <div className="relative pt-16 flex flex-col md:flex-row items-end md:items-center gap-6">
            {/* Avatar Section */}
            <div className="relative group">
                <img 
                    src={isEditing ? editForm.avatarUrl : member.avatarUrl} 
                    alt={member.name} 
                    className={`w-32 h-32 rounded-full border-4 border-white dark:border-gray-900 shadow-xl object-cover bg-gray-200 ${isEditing ? 'opacity-50' : ''}`}
                />
                
                {/* Edit Overlay for Avatar */}
                {isEditing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-20">
                        <button 
                            type="button"
                            onClick={startCamera}
                            className="bg-gray-900/80 hover:bg-amber-500 p-2 rounded-full transition-colors text-white border border-white/20"
                            title="Usar Câmera"
                        >
                            <Camera size={18} />
                        </button>
                        <button 
                            type="button"
                            onClick={triggerFileInput}
                            className="bg-gray-900/80 hover:bg-blue-500 p-2 rounded-full transition-colors text-white border border-white/20"
                            title="Fazer Upload"
                        >
                            <Upload size={18} />
                        </button>
                    </div>
                )}

                {!isEditing && (
                    <div className="absolute top-0 right-0 bg-gray-900 text-white text-xs font-bold px-2 py-1 rounded-lg border border-white transform -translate-y-1/2 translate-x-1/4">
                        {member.rank}
                    </div>
                )}
            </div>

            {/* Info & Editing Form */}
            <div className="flex-1 mb-2 w-full">
                {isEditing ? (
                    <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-amber-500/30 animate-fade-in mt-4 md:mt-0">
                        <h4 className="text-amber-500 font-bold uppercase text-xs tracking-widest mb-2">Editando Perfil</h4>
                        
                        {/* Name & Location */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Nome</label>
                                <input 
                                    type="text" 
                                    value={editForm.name} 
                                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Localização</label>
                                <input 
                                    type="text" 
                                    value={editForm.location} 
                                    onChange={e => setEditForm({...editForm, location: e.target.value})}
                                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                                />
                            </div>
                        </div>

                        {/* Email & Nickname (Added) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold mb-1 flex items-center gap-1"><Mail size={12}/> Email</label>
                                <input 
                                    type="email" 
                                    value={editForm.email} 
                                    onChange={e => setEditForm({...editForm, email: e.target.value})}
                                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold mb-1 flex items-center gap-1"><Fingerprint size={12}/> Apelido</label>
                                <input 
                                    type="text" 
                                    value={editForm.nickname} 
                                    onChange={e => setEditForm({...editForm, nickname: e.target.value})}
                                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                                />
                            </div>
                        </div>
                        
                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Peso (kg)</label>
                                <input 
                                    type="number" 
                                    value={editForm.weight} 
                                    onChange={e => setEditForm({...editForm, weight: e.target.value})}
                                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Altura (cm)</label>
                                <input 
                                    type="number" 
                                    value={editForm.height} 
                                    onChange={e => setEditForm({...editForm, height: e.target.value})}
                                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Bio (Sobre mim)</label>
                            <textarea 
                                value={editForm.bio} 
                                onChange={e => setEditForm({...editForm, bio: e.target.value})}
                                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm dark:text-white focus:ring-2 focus:ring-amber-500 outline-none resize-none h-20"
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={handleSaveProfile} className="flex-1 bg-amber-500 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-amber-600 flex items-center justify-center gap-2 transition-colors shadow-lg shadow-amber-500/20">
                                <Save size={16} /> Salvar
                            </button>
                            <button onClick={() => setIsEditing(false)} className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-bold py-2.5 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                                Cancelar
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{member.name}</h1>
                                {isPro && (
                                    <div className="bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest border border-amber-200 dark:border-amber-500/30">
                                        PRO
                                    </div>
                                )}
                            </div>
                            
                            {isMe && (
                                <button 
                                    onClick={() => { if(playSound) playSound('click'); setIsEditing(true); }}
                                    className="flex items-center gap-2 text-gray-500 hover:text-amber-500 dark:text-gray-400 dark:hover:text-amber-400 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-600"
                                    title="Editar Perfil"
                                >
                                    <Edit3 size={16} /> 
                                    <span className="text-xs font-bold">Editar Dados</span>
                                </button>
                            )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-gray-500 dark:text-gray-400 text-xs">
                            <span className="flex items-center gap-1">
                                <Fingerprint size={14} /> @{member.nickname || 'user'}
                            </span>
                            <span className="flex items-center gap-1">
                                <MapPin size={14} /> {member.location || 'Rio de Janeiro, RJ'}
                            </span>
                            {member.weight && (
                                <span className="flex items-center gap-1">
                                    <Scale size={14} /> {member.weight}kg
                                </span>
                            )}
                            {member.height && (
                                <span className="flex items-center gap-1">
                                    <Ruler size={14} /> {member.height}cm
                                </span>
                            )}
                        </div>

                        <p className="text-gray-600 dark:text-gray-300 mt-3 max-w-lg leading-relaxed italic bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700/50">
                            "{member.bio || 'Correndo atrás do vento.'}"
                        </p>
                    </>
                )}
            </div>

            {/* Actions (Not Me) */}
            {!isMe && !isEditing && (
                <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
                    <button 
                        onClick={() => onToggleFollow(member.id)}
                        className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg
                        ${isFollowing 
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600' 
                            : 'bg-amber-500 hover:bg-amber-400 text-white'}`}
                    >
                        {isFollowing ? (
                            <><UserCheck size={20} /> Seguindo</>
                        ) : (
                            <><UserPlus size={20} /> Seguir</>
                        )}
                    </button>
                    <button 
                        onClick={onOpenChat}
                        className="px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                        <MessageCircle size={20} /> Mensagem
                    </button>
                </div>
            )}
        </div>

        {/* Social Stats Row */}
        <div className="mt-8 flex justify-around border-t border-gray-100 dark:border-gray-700 pt-6">
            <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{member.followers.length}</div>
                <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Seguidores</div>
            </div>
            <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{member.following.length}</div>
                <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Seguindo</div>
            </div>
            <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{member.totalDistance.toFixed(0)}</div>
                <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">KM Totais</div>
            </div>
        </div>
      </div>

      {/* INTEGRATIONS SECTION */}
      {isMe && !isEditing && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                 <div className="bg-blue-100 dark:bg-blue-500/20 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                     <LinkIcon size={24} />
                 </div>
                 <h3 className="font-bold text-gray-900 dark:text-white">Sincronia Eólica</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Conecte seus dispositivos para importar atividades automaticamente.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {connectedApps.map((app, index) => (
                      <div key={app.name} className={`relative overflow-hidden p-4 rounded-xl border transition-all ${app.connected ? 'bg-gray-50 dark:bg-gray-900 border-green-500/50' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-90'}`}>
                          <div className="flex items-center gap-3 mb-4">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${app.id === 'strava' ? 'bg-[#FC4C02]' : app.id === 'garmin' ? 'bg-black' : 'bg-red-600'}`}>
                                  {app.name.charAt(0)}
                              </div>
                              <div>
                                <span className="font-bold text-gray-900 dark:text-white block">{app.name}</span>
                                {app.connected && app.lastSync && (
                                    <span className="text-[9px] text-gray-500 block">Sync: {new Date(app.lastSync).toLocaleDateString()}</span>
                                )}
                              </div>
                          </div>
                          
                          <button 
                            onClick={() => handleConnectApp(app.id as any)}
                            disabled={app.connected}
                            className={`w-full py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${app.connected ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                          >
                              {app.connected ? <><CheckCircle size={12} /> Conectado</> : 'Conectar'}
                          </button>

                          {app.connected && app.id === 'strava' && (
                              <button 
                                onClick={handleSyncStrava}
                                disabled={isSyncing}
                                className="w-full mt-2 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200"
                              >
                                  <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} /> {isSyncing ? "Sync..." : "Sincronizar Agora"}
                              </button>
                          )}
                      </div>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
};
