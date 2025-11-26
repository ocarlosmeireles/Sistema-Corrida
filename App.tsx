import React, { useState, useEffect, useRef } from 'react';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { Leaderboard } from './components/Leaderboard';
import { DinoCoach } from './components/DinoCoach';
import { TeamManager } from './components/TeamManager';
import { Resources } from './components/Resources';
import { Events } from './components/Events';
import { LandingPage } from './components/LandingPage';
import { Community } from './components/Community';
import { Achievements, ACHIEVEMENTS_LIST } from './components/Achievements';
import { TrainingPlanGenerator } from './components/TrainingPlanGenerator';
import { LiveRun } from './components/LiveRun';
import { Seasons } from './components/Seasons';
import { UserProfile } from './components/UserProfile';
import { AdminPanel } from './components/AdminPanel';
import { Login } from './components/Login';
import { ProLounge } from './components/ProLounge';
import { ActivityHistory } from './components/ActivityHistory';
import { TrainingCenter } from './components/TrainingCenter';
import { Member, WindRank, RaceEvent, Activity, Season, Sponsor, Story, PlanType, Notification, TrainingPlan, PrivateMessage, SoundType, Challenge } from './types';

// Firebase Imports (Corrected path for root App.tsx)
import { 
  db, auth, seedDatabase, isFirebaseInitialized, logoutFirebase, MOCK_MEMBERS, MOCK_EVENTS, MOCK_STORIES, INITIAL_SPONSORS, MOCK_SEASON,
  collection, onSnapshot, doc, updateDoc, addDoc, setDoc, query, orderBy, onAuthStateChanged
} from './services/firebase';

// Initial Challenges Mock
const INITIAL_CHALLENGES: Challenge[] = [
    { id: 'c1', creatorId: '1', creatorName: 'Carlos Admin', title: 'Desafio 100km em 30 Dias', description: 'Acumule 100km de corrida até o final do mês. Quem topa?', targetKm: 100, participants: ['1', '2', '3'], endDate: '2025-12-31', startDate: '2023-01-01' },
    { id: 'c2', creatorId: '2', creatorName: 'Sarah Ventania', title: 'Fim de Semana 21k', description: 'Correr uma meia maratona neste fim de semana.', targetKm: 21, participants: ['2', '3'], endDate: '2025-11-30', startDate: '2023-01-01' }
];

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  
  // App State - Initialized with MOCK DATA for offline resilience
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Persistence for Offline Mode (Members)
  const [members, setMembers] = useState<Member[]>(() => {
      const saved = localStorage.getItem('fdv_members');
      if (saved) {
          try {
              const parsed = JSON.parse(saved);
              return parsed.map((m: Member) => ({
                  ...m,
                  password: m.password || '123' // Default password fallback
              }));
          } catch (e) {
              return MOCK_MEMBERS;
          }
      }
      return MOCK_MEMBERS;
  });

  const [events, setEvents] = useState<RaceEvent[]>(MOCK_EVENTS);
  const [stories, setStories] = useState<Story[]>(MOCK_STORIES);
  const [challenges, setChallenges] = useState<Challenge[]>(INITIAL_CHALLENGES); 
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [viewingMemberId, setViewingMemberId] = useState<string | null>(null);
  const [directMessages, setDirectMessages] = useState<PrivateMessage[]>([]);
  const [targetChatUserId, setTargetChatUserId] = useState<string | null>(null);
  
  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Admin / Season States
  const [allSponsors, setAllSponsors] = useState<Sponsor[]>(INITIAL_SPONSORS);
  const [currentSeason, setCurrentSeason] = useState<Season>(MOCK_SEASON);

  // --- AUTH STATE OBSERVER (Real Firebase) ---
  useEffect(() => {
      if (isFirebaseInitialized) {
          const unsubscribe = onAuthStateChanged(auth, (user: any) => {
              if (user) {
                  setCurrentUserId(user.uid);
                  setIsAuthenticated(true);
                  setShowLanding(false);
                  // Request notifications permission on login
                  if ("Notification" in window && Notification.permission !== "granted") {
                      Notification.requestPermission();
                  }
              }
          });
          return () => unsubscribe();
      } else {
          // Fallback persistence check for Mock Mode
          const savedUserId = localStorage.getItem('fdv_userId');
          if (savedUserId) {
              setCurrentUserId(savedUserId);
              setIsAuthenticated(true);
              setShowLanding(false);
          }
      }
  }, []);

  // Save members to local storage on change (Offline persistence)
  useEffect(() => {
      if (!isFirebaseInitialized) {
          localStorage.setItem('fdv_members', JSON.stringify(members));
      }
  }, [members]);

  // --- FIRESTORE SUBSCRIPTIONS WITH FALLBACK ---
  useEffect(() => {
      let unsubscribeMembers: () => void;
      let unsubscribeEvents: () => void;
      let unsubscribeStories: () => void;
      let unsubscribeSeason: () => void;
      let unsubscribeSponsors: () => void;
      let unsubscribeDMs: () => void;

      const initData = async () => {
          if (!isFirebaseInitialized) {
              return;
          }

          try {
              await seedDatabase();
              
              unsubscribeMembers = onSnapshot(collection(db, 'members'), (snapshot: any) => {
                  const loadedMembers = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Member));
                  if (loadedMembers.length > 0) setMembers(loadedMembers);
              });

              unsubscribeEvents = onSnapshot(collection(db, 'events'), (snapshot: any) => {
                  const loadedEvents = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as RaceEvent));
                  if (loadedEvents.length > 0) setEvents(loadedEvents);
              });

              unsubscribeStories = onSnapshot(query(collection(db, 'stories'), orderBy('date', 'desc')), (snapshot: any) => {
                  const loadedStories = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Story));
                  if (loadedStories.length > 0) setStories(loadedStories);
              });

              unsubscribeSeason = onSnapshot(doc(db, 'seasons', 'current'), (doc: any) => {
                  if (doc.exists()) setCurrentSeason(doc.data() as Season);
              });

              unsubscribeSponsors = onSnapshot(collection(db, 'sponsors'), (snapshot: any) => {
                  const loadedSponsors = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Sponsor));
                  if (loadedSponsors.length > 0) setAllSponsors(loadedSponsors);
              });

              unsubscribeDMs = onSnapshot(collection(db, 'direct_messages'), (snapshot: any) => {
                  const msgs = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as PrivateMessage));
                  setDirectMessages(msgs);
              });

          } catch (e) {
              console.error("Firebase connection error - using local data.", e);
          }
      };
      
      initData();

      return () => {
          if (unsubscribeMembers) unsubscribeMembers();
          if (unsubscribeEvents) unsubscribeEvents();
          if (unsubscribeStories) unsubscribeStories();
          if (unsubscribeSeason) unsubscribeSeason();
          if (unsubscribeSponsors) unsubscribeSponsors();
          if (unsubscribeDMs) unsubscribeDMs();
      };
  }, []);

  // --- SOUND ENGINE ---
  const playUISound = (type: SoundType) => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        
        if (!audioCtxRef.current) {
            audioCtxRef.current = new AudioContext();
        }
        
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }

        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        const now = ctx.currentTime;

        switch (type) {
            case 'click': break;
            case 'toggle':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.linearRampToValueAtTime(600, now + 0.1);
                gainNode.gain.setValueAtTime(0.05, now);
                gainNode.gain.linearRampToValueAtTime(0.001, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;
            case 'success':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523.25, now);
                osc.frequency.setValueAtTime(659.25, now + 0.1);
                osc.frequency.setValueAtTime(783.99, now + 0.2);
                gainNode.gain.setValueAtTime(0.05, now);
                gainNode.gain.linearRampToValueAtTime(0.1, now + 0.2);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
                osc.start(now);
                osc.stop(now + 0.6);
                break;
            case 'error':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.linearRampToValueAtTime(100, now + 0.2);
                gainNode.gain.setValueAtTime(0.1, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                break;
            case 'start': 
            case 'hero': 
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, now); // A4
                gainNode.gain.setValueAtTime(0.1, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(554.37, now); // C#5
                gain2.gain.setValueAtTime(0.1, now);
                gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
                osc.start(now);
                osc2.start(now);
                osc.stop(now + 1.5);
                osc2.stop(now + 1.5);
                break;
        }
    } catch (e) { console.error("Audio Engine Error", e); }
  };

  useEffect(() => {
    if (theme === 'dark') { document.documentElement.classList.add('dark'); } else { document.documentElement.classList.remove('dark'); }
  }, [theme]);

  // PRO PLAN Expiration Check
  useEffect(() => {
     const checkProExpiration = () => {
         const now = new Date();
         members.forEach(m => {
             if (m.plan === 'pro' && m.proExpiresAt) {
                 const expireDate = new Date(m.proExpiresAt);
                 if (now > expireDate) {
                     if (isFirebaseInitialized) {
                         try {
                            const updatedMember = { ...m, plan: 'basic' as PlanType, proExpiresAt: undefined };
                            // @ts-ignore
                            updateDoc(doc(db, 'members', m.id), updatedMember);
                            addNotification(m.id, {
                                title: "Plano PRO Expirado",
                                message: "Seu período de 30 dias encerrou. Funcionalidades limitadas.",
                                type: "warning"
                            });
                         } catch(e) { console.warn("Could not update expired member", e); }
                     } else {
                         // Local update
                         setMembers(prev => prev.map(pm => pm.id === m.id ? { ...pm, plan: 'basic', proExpiresAt: undefined } : pm));
                     }
                 }
             }
         });
     };
     const interval = setInterval(checkProExpiration, 60000);
     return () => clearInterval(interval);
  }, [members]); 

  const toggleTheme = () => {
    playUISound('toggle');
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleLogin = (userId: string) => {
      if (!isFirebaseInitialized) {
          playUISound('hero');
          setCurrentUserId(userId);
          setIsAuthenticated(true);
          if ("Notification" in window && Notification.permission !== "granted") Notification.requestPermission();
          const user = members.find(m => m.id === userId);
          if (user && (user.role === 'admin' || user.role === 'super_admin')) setActiveTab('admin');
          else setActiveTab('dashboard');
          localStorage.setItem('fdv_userId', userId);
      }
  };

  const handleRegister = async (data: any) => {
      // Data object now comes fully formed from Login component
      const newMember: Member = {
          id: Date.now().toString(), // Placeholder for local fallback
          ...data,
          role: 'member', // Enforce member role
          plan: 'basic',  // Enforce basic plan
          rank: WindRank.BREEZE,
          totalDistance: 0,
          seasonScore: 0,
          avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random&color=fff`,
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
          shoes: []
      };

      // If Firebase is active, the logic is handled inside Login.tsx calling 'signUpWithFirebase'
      // This handler is primarily for local state update in Offline Mode
      setMembers(prev => [...prev, newMember]);
      if(!isFirebaseInitialized) handleLogin(newMember.id);
  };

  const handleLogout = () => {
      playUISound('click');
      if (isFirebaseInitialized) {
          logoutFirebase();
      }
      setIsAuthenticated(false);
      setCurrentUserId('');
      setViewingMemberId(null);
      setShowLanding(true);
      localStorage.removeItem('fdv_userId');
  };

  const currentUser = members.find(m => m.id === currentUserId) || members[0] || ({} as Member);

  const addNotification = async (memberId: string, notification: Omit<Notification, 'id' | 'read' | 'date'>) => {
    if (memberId === currentUserId) playUISound('success');
    const member = members.find(m => m.id === memberId);
    if (member) {
        const newNote = {
            id: Date.now().toString(),
            read: false,
            date: new Date().toISOString(),
            ...notification
        };
        const updatedNotifications = [newNote, ...(member.notifications || [])];
        if (isFirebaseInitialized) {
            try {
                await updateDoc(doc(db, 'members', memberId), { notifications: updatedNotifications });
            } catch (e) {
                setMembers(prev => prev.map(m => m.id === memberId ? { ...m, notifications: updatedNotifications } : m));
            }
        } else {
            setMembers(prev => prev.map(m => m.id === memberId ? { ...m, notifications: updatedNotifications } : m));
        }
    }
  };

  const handleNotifyMember = (targetId: string, title: string, message: string) => {
      addNotification(targetId, { title, message, type: 'info' });
  };

  const markNotificationsRead = async () => {
      playUISound('click');
      if (currentUser && currentUser.notifications) {
          const updatedNotes = currentUser.notifications.map(n => ({ ...n, read: true }));
          if (isFirebaseInitialized) {
              try {
                await updateDoc(doc(db, 'members', currentUserId), { notifications: updatedNotes });
              } catch (e) {
                setMembers(prev => prev.map(m => m.id === currentUserId ? { ...m, notifications: updatedNotes } : m));
              }
          } else {
              setMembers(prev => prev.map(m => m.id === currentUserId ? { ...m, notifications: updatedNotes } : m));
          }
      }
  };

  const handleDeleteNotification = async (id: string) => {
      playUISound('click');
      if (currentUser && currentUser.notifications) {
          const updatedNotes = currentUser.notifications.filter(n => n.id !== id);
          if (isFirebaseInitialized) {
              try {
                  await updateDoc(doc(db, 'members', currentUserId), { notifications: updatedNotes });
              } catch (e) {
                  setMembers(prev => prev.map(m => m.id === currentUserId ? { ...m, notifications: updatedNotes } : m));
              }
          } else {
              setMembers(prev => prev.map(m => m.id === currentUserId ? { ...m, notifications: updatedNotes } : m));
          }
      }
  };

  const handleClearReadNotifications = async () => {
      playUISound('click');
      if (currentUser && currentUser.notifications) {
          const updatedNotes = currentUser.notifications.filter(n => !n.read);
          if (isFirebaseInitialized) {
              try {
                  await updateDoc(doc(db, 'members', currentUserId), { notifications: updatedNotes });
              } catch (e) {
                  setMembers(prev => prev.map(m => m.id === currentUserId ? { ...m, notifications: updatedNotes } : m));
              }
          } else {
              setMembers(prev => prev.map(m => m.id === currentUserId ? { ...m, notifications: updatedNotes } : m));
          }
      }
  };

  const handleSendMessage = async (receiverId: string, content: string) => {
      playUISound('click');
      const newMessage: PrivateMessage = {
          id: Date.now().toString(),
          senderId: currentUserId,
          receiverId: receiverId,
          content: content,
          timestamp: new Date().toISOString(),
          read: false
      };
      
      if (isFirebaseInitialized) {
          try {
            await addDoc(collection(db, 'direct_messages'), newMessage);
          } catch (e) {
            setDirectMessages(prev => [...prev, newMessage]);
          }
      } else {
          setDirectMessages(prev => [...prev, newMessage]);
      }
      
      const sender = members.find(m => m.id === currentUserId);
      addNotification(receiverId, {
          title: "Nova Mensagem Privada",
          message: `${sender?.name || 'Alguém'}: ${content.substring(0, 30)}${content.length > 30 ? '...' : ''}`,
          type: "info"
      });
  };

  const handleOpenChat = (userId: string) => {
      playUISound('click');
      setViewingMemberId(null);
      setTargetChatUserId(userId);
      setActiveTab('community');
  };

  const handleViewProfile = (memberId: string) => {
    playUISound('click');
    setViewingMemberId(memberId);
  };

  const handleTabChange = (tab: string) => {
    playUISound('click');
    setActiveTab(tab);
    setViewingMemberId(null);
    setTargetChatUserId(null); 
  };

  const handleToggleFollow = async (targetId: string) => {
    playUISound('click');
    const isFollowing = currentUser.following.includes(targetId);
    const newFollowing = isFollowing 
        ? currentUser.following.filter(id => id !== targetId) 
        : [...currentUser.following, targetId];
    const newScore = !isFollowing ? currentUser.seasonScore + 5 : currentUser.seasonScore;
    try {
        if (isFirebaseInitialized) {
            await updateDoc(doc(db, 'members', currentUserId), { following: newFollowing, seasonScore: newScore } as any);
            const targetMember = members.find(m => m.id === targetId);
            if (targetMember) {
                const newFollowers = isFollowing
                    ? targetMember.followers.filter(id => id !== currentUserId)
                    : [...targetMember.followers, currentUserId];
                await updateDoc(doc(db, 'members', targetId), { followers: newFollowers });
            }
        } else {
            setMembers(prev => prev.map(m => {
                if(m.id === currentUserId) return { ...m, following: newFollowing, seasonScore: newScore };
                if(m.id === targetId) {
                    const newFollowers = isFollowing ? m.followers.filter(id => id !== currentUserId) : [...m.followers, currentUserId];
                    return { ...m, followers: newFollowers };
                }
                return m;
            }));
        }
        if (!isFollowing) {
            addNotification(targetId, { title: "Novo Seguidor", message: `${currentUser.name} começou a seguir você!`, type: "info" });
        }
    } catch (e) { }
  };

  const handleUpdateUser = async (updatedMember: Member) => {
    const newAchievements = [...(updatedMember.achievements || [])];
    const memberToSave = { ...updatedMember, achievements: newAchievements };
    try {
        if (isFirebaseInitialized) await setDoc(doc(db, 'members', updatedMember.id), memberToSave, { merge: true });
        setMembers(prev => prev.map(m => m.id === updatedMember.id ? memberToSave : m));
    } catch(e) {
        setMembers(prev => prev.map(m => m.id === updatedMember.id ? memberToSave : m));
    }
  };

  const handleUpdateActivePlan = async (plan: TrainingPlan) => {
      const updatedUser = { ...currentUser, activePlan: plan };
      await handleUpdateUser(updatedUser);
      addNotification(currentUser.id, { title: "Novo Plano Definido", message: "Sua planilha de voo foi atualizada.", type: "info" });
  };

  const handleTogglePlan = async (memberId: string, newPlan: PlanType) => {
      let proExpiresAt = undefined;
      if (newPlan === 'pro') {
          const expirationDate = new Date();
          expirationDate.setDate(expirationDate.getDate() + 30);
          proExpiresAt = expirationDate.toISOString();
      }
      try {
        if (isFirebaseInitialized) {
            await updateDoc(doc(db, 'members', memberId), { plan: newPlan, proExpiresAt: proExpiresAt || null } as any);
        }
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, plan: newPlan, proExpiresAt: proExpiresAt } : m));
      } catch(e) {
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, plan: newPlan, proExpiresAt: proExpiresAt } : m));
      }
      addNotification(memberId, {
          title: newPlan === 'pro' ? "Upgrade Confirmado!" : "Plano Alterado",
          message: newPlan === 'pro' ? "Seu plano PRO está ativo por 30 dias." : "Seu plano foi alterado para Básico.",
          type: "success"
      });
  }

  const handleUpdateProfile = async (updatedMember: Member) => {
    try {
        if (isFirebaseInitialized) await setDoc(doc(db, 'members', updatedMember.id), updatedMember, { merge: true });
        setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
    } catch (e) {
        setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
    }
  };

  const handleSaveLiveActivity = async (activityData: Omit<Activity, 'id'>) => {
      const newActivity: Activity = { id: Date.now().toString(), ...activityData };
      const updatedDistance = currentUser.totalDistance + newActivity.distanceKm;
      let newRank = currentUser.rank;
      if (updatedDistance > 50) newRank = WindRank.GUST;
      if (updatedDistance > 150) newRank = WindRank.GALE;
      if (updatedDistance > 300) newRank = WindRank.STORM;
      if (updatedDistance > 600) newRank = WindRank.HURRICANE;
      if (updatedDistance > 1000) newRank = WindRank.TORNADO;
      let xpEarned = Math.round(newActivity.distanceKm * 10);
      if (newActivity.distanceKm >= 5) xpEarned += 50;
      let updatedShoes = [...(currentUser.shoes || [])];
      if (updatedShoes.length > 0) updatedShoes[0].currentKm += newActivity.distanceKm;
      const updatedUser = {
          ...currentUser,
          totalDistance: updatedDistance,
          rank: newRank,
          seasonScore: currentUser.seasonScore + xpEarned,
          activities: [...(currentUser.activities || []), newActivity],
          shoes: updatedShoes
      };
      await handleUpdateUser(updatedUser);
      addNotification(currentUser.id, { title: "Corrida Salva", message: `Você completou ${newActivity.distanceKm}km. +${xpEarned} XP!`, type: "success" });
      setActiveTab('dashboard');
  };

  const handleDeleteActivity = async (activityId: string) => {
      const updatedActivities = currentUser.activities.filter(a => a.id !== activityId);
      const newTotalDist = updatedActivities.reduce((acc, curr) => acc + curr.distanceKm, 0);
      const updatedUser = { ...currentUser, activities: updatedActivities, totalDistance: newTotalDist };
      try {
          if (isFirebaseInitialized) await updateDoc(doc(db, 'members', currentUser.id), updatedUser);
          setMembers(prev => prev.map(m => m.id === currentUser.id ? updatedUser : m));
          playUISound('success');
      } catch (e) {
          setMembers(prev => prev.map(m => m.id === currentUser.id ? updatedUser : m));
      }
  };

  const handleAddChallenge = (newChallenge: Challenge) => {
      setChallenges(prev => [...prev, newChallenge]);
      playUISound('success');
  };

  const handleJoinChallenge = (id: string) => {
      setChallenges(prev => prev.map(c => {
          if(c.id === id && !c.participants.includes(currentUser.id)) return { ...c, participants: [...c.participants, currentUser.id] };
          return c;
      }));
      playUISound('click');
  };

  const handleAddMember = async (name: string, plan: PlanType, gender?: 'male' | 'female') => {
    let proExpiresAt = undefined;
    if (plan === 'pro') {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 30);
        proExpiresAt = expirationDate.toISOString();
    }
    const newMember: Member = {
        id: Date.now().toString(),
        name,
        password: '123',
        gender: gender || 'male',
        role: 'member',
        plan: plan, 
        proExpiresAt: proExpiresAt,
        rank: WindRank.BREEZE,
        totalDistance: 0,
        seasonScore: 0,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`,
        achievements: [],
        activities: [],
        followers: [],
        following: [],
        notifications: [{ id: Date.now().toString(), title: "Bem-vindo!", message: "Sua jornada nos Filhos do Vento começou.", type: "success", read: false, date: new Date().toISOString() }],
        shoes: []
    };
    try {
        if (isFirebaseInitialized) await setDoc(doc(db, 'members', newMember.id), newMember);
        setMembers(prev => [...prev, newMember]);
    } catch(e) {
        setMembers(prev => [...prev, newMember]);
    }
  };

  const handleRemoveMember = async (id: string) => {
    if (members.length <= 1) { playUISound('error'); alert("A equipe precisa de pelo menos um membro!"); return; }
    playUISound('click');
    alert("Função de remover desabilitada temporariamente para segurança dos dados.");
  };

  const handleSwitchUser = (id: string) => {
    playUISound('toggle');
    setCurrentUserId(id);
    setActiveTab('dashboard');
  };

  const handleAddEvent = async (newEventData: Omit<RaceEvent, 'id'>) => {
    const newEvent: RaceEvent = { ...newEventData, id: Date.now().toString() };
    try {
        if (isFirebaseInitialized) await setDoc(doc(db, 'events', newEvent.id), newEvent);
        setEvents(prev => [...prev, newEvent]);
    } catch (e) { setEvents(prev => [...prev, newEvent]); }
    members.forEach(m => addNotification(m.id, { title: "Nova Prova!", message: `${newEvent.name} foi adicionada ao calendário.`, type: "info" }));
  };

  const handleRemoveEvent = async (id: string) => {
    playUISound('click');
    alert("Remoção de eventos desabilitada.");
  };

  const handleAddStory = async (newStory: Story) => {
     playUISound('success');
     try {
        if (isFirebaseInitialized) await setDoc(doc(db, 'stories', newStory.id), newStory);
        setStories(prev => [newStory, ...prev]);
     } catch(e) { setStories(prev => [newStory, ...prev]); }
     const updatedUser = { ...currentUser, seasonScore: currentUser.seasonScore + 20 };
     await handleUpdateUser(updatedUser);
     addNotification(currentUser.id, { title: "História Publicada", message: "Sua história está no ar! +20 XP.", type: "success" });
  };

  const handleLikeStory = async (id: string) => {
    playUISound('toggle');
    const likedStory = stories.find(s => s.id === id);
    if(likedStory) {
        const updatedStory = { ...likedStory, likes: likedStory.likes + 1 };
        try {
            if (isFirebaseInitialized) await updateDoc(doc(db, 'stories', id), { likes: updatedStory.likes });
            setStories(prev => prev.map(s => s.id === id ? updatedStory : s));
        } catch(e) { setStories(prev => prev.map(s => s.id === id ? updatedStory : s)); }
        const author = members.find(m => m.name === likedStory.authorName);
        if (author && author.id !== currentUser.id) addNotification(author.id, { title: "Nova Curtida", message: `${currentUser.name} curtiu sua história "${likedStory.title}".`, type: "info" });
    }
  };

  const handleRequestUpgrade = () => {
    playUISound('click');
    const admins = members.filter(m => m.role === 'admin' || m.role === 'super_admin');
    admins.forEach(admin => addNotification(admin.id, { title: "Solicitação de Upgrade", message: `O atleta ${currentUser.name} deseja assinar o Plano PRO.`, type: "info" }));
    addNotification(currentUser.id, { title: "Solicitação Enviada", message: "O administrador recebeu seu pedido.", type: "success" });
    alert("Solicitação enviada ao Admin com sucesso!");
    if(showLanding) setShowLanding(false);
  };

  const handleUpdateSeason = async (updatedSeason: Season) => {
    playUISound('success');
    try {
        if (isFirebaseInitialized) await setDoc(doc(db, 'seasons', 'current'), updatedSeason);
        setCurrentSeason(updatedSeason);
    } catch (e) { setCurrentSeason(updatedSeason); }
  };

  const handleAddSponsor = async (newSponsor: Sponsor) => {
    playUISound('success');
    try {
        if (isFirebaseInitialized) await setDoc(doc(db, 'sponsors', newSponsor.id), newSponsor);
        setAllSponsors(prev => [...prev, newSponsor]);
    } catch (e) { setAllSponsors(prev => [...prev, newSponsor]); }
  };

  const handleRemoveSponsor = async (id: string) => {
    playUISound('click');
    const updatedSeasonSponsors = currentSeason.sponsors.filter(s => s.id !== id);
    try {
        if (isFirebaseInitialized) await updateDoc(doc(db, 'seasons', 'current'), { sponsors: updatedSeasonSponsors });
        setCurrentSeason({ ...currentSeason, sponsors: updatedSeasonSponsors });
    } catch(e) { setCurrentSeason({ ...currentSeason, sponsors: updatedSeasonSponsors }); }
  };

  const renderContent = () => {
    if (!currentUser || !currentUser.id) return <div className="text-center p-10 text-white">Carregando QG...</div>;

    if (viewingMemberId) {
        const memberToView = members.find(m => m.id === viewingMemberId);
        if (memberToView) {
            return (
                <UserProfile 
                    member={memberToView} 
                    currentUser={currentUser} 
                    onBack={() => setViewingMemberId(null)} 
                    onToggleFollow={handleToggleFollow}
                    onUpdateProfile={handleUpdateProfile}
                    onOpenChat={() => handleOpenChat(memberToView.id)}
                    onLogout={memberToView.id === currentUser.id ? handleLogout : undefined}
                    playSound={playUISound}
                />
            );
        }
    }

    switch (activeTab) {
      case 'dashboard':
        return (
            <Dashboard 
                currentUser={currentUser} 
                season={currentSeason}
                events={events}
                teamMembers={members}
                latestStory={stories[0]}
                challenges={challenges}
                onUpdateUser={handleUpdateUser} 
                isDark={theme === 'dark'} 
                onNavigate={(tab) => handleTabChange(tab)}
                playSound={playUISound}
                onUpgradeRequest={handleRequestUpgrade} 
            />
        );
      case 'vip':
        if (currentUser.plan !== 'pro' && currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
            return <div className="text-center p-10">Acesso Restrito</div>;
        }
        return (
            <ProLounge 
                currentUser={currentUser} 
                onContactSupport={() => {
                    const admin = members.find(m => m.role === 'admin' || m.role === 'super_admin');
                    if (admin) handleOpenChat(admin.id);
                    else alert("Nenhum suporte disponível no momento.");
                }}
            />
        );
      case 'run':
        return (
            <LiveRun 
                onSaveActivity={handleSaveLiveActivity} 
                addNotification={(n) => addNotification(currentUser.id, n)}
                currentUser={currentUser}
                playSound={playUISound}
            />
        );
      case 'history':
        return (
            <ActivityHistory 
                currentUser={currentUser} 
                isDark={theme === 'dark'} 
                onDeleteActivity={handleDeleteActivity}
            />
        );
      case 'season':
        return <Seasons season={currentSeason} members={members} onViewLeaderboard={() => setActiveTab('leaderboard')} />;
      case 'training': 
        return (
            <TrainingCenter 
                currentUser={currentUser}
                challenges={challenges}
                onSavePlan={handleUpdateActivePlan} 
                onJoinChallenge={handleJoinChallenge}
                onNavigate={(tab) => handleTabChange(tab)}
            />
        );
      case 'activity':
        return (
             <Dashboard 
                currentUser={currentUser} 
                season={currentSeason}
                events={events}
                teamMembers={members}
                latestStory={stories[0]}
                challenges={challenges}
                onUpdateUser={handleUpdateUser} 
                isDark={theme === 'dark'} 
                onNavigate={(tab) => handleTabChange(tab)}
                playSound={playUISound}
                onUpgradeRequest={handleRequestUpgrade}
            />
        );
      case 'leaderboard':
        return <Leaderboard members={members} onMemberClick={handleViewProfile} />;
      case 'achievements':
        return <Achievements unlockedIds={currentUser.achievements} />;
      case 'events':
        return <Events events={events} onAddEvent={handleAddEvent} onRemoveEvent={handleRemoveEvent} currentUser={currentUser} />;
      case 'community':
        return (
            <Community 
                stories={stories} 
                currentUser={currentUser} 
                members={members}
                challenges={challenges} 
                onAddChallenge={handleAddChallenge} 
                onJoinChallenge={handleJoinChallenge} 
                onAddStory={handleAddStory} 
                onLikeStory={handleLikeStory}
                directMessages={directMessages}
                onSendMessage={handleSendMessage}
                initialChatTargetId={targetChatUserId}
                onNotifyMember={handleNotifyMember}
            />
        );
      case 'team':
        return (
            <TeamManager 
                members={members} 
                currentUserId={currentUserId}
                onAddMember={handleAddMember}
                onSwitchUser={handleSwitchUser}
                onRemoveMember={handleRemoveMember}
                onViewProfile={handleViewProfile}
                onTogglePlan={handleTogglePlan}
            />
        );
      case 'resources':
        return <Resources currentUser={currentUser} onUpdateUser={handleUpdateUser} />;
      case 'coach':
        return <DinoCoach member={currentUser} userPlan={currentUser.plan} />;
      case 'admin':
        if (currentUser.role === 'member') return (
            <div className="flex items-center justify-center h-full text-gray-500">Acesso Restrito</div>
        );
        return (
            <AdminPanel 
                currentSeason={currentSeason}
                allSponsors={allSponsors}
                onUpdateSeason={handleUpdateSeason}
                onAddSponsor={handleAddSponsor}
                onRemoveSponsor={handleRemoveSponsor}
            />
        );
      default:
        return (
            <Dashboard 
                currentUser={currentUser} 
                season={currentSeason}
                events={events}
                teamMembers={members}
                latestStory={stories[0]}
                challenges={challenges}
                onUpdateUser={handleUpdateUser} 
                isDark={theme === 'dark'} 
                onNavigate={(tab) => handleTabChange(tab)}
                playSound={playUISound}
                onUpgradeRequest={handleRequestUpgrade}
            />
        );
    }
  };

  if (showLanding) {
    return (
        <LandingPage 
            onEnter={() => { playUISound('start'); setShowLanding(false); }} 
            toggleTheme={toggleTheme} 
            isDark={theme === 'dark'} 
            onUpgradeRequest={handleRequestUpgrade}
        />
    );
  }

  if (!isAuthenticated) {
    return (
      <Login 
        users={members} 
        onLogin={handleLogin} 
        onRegister={handleRegister}
        playSound={playUISound} 
      />
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-[100dvh] bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300 overflow-hidden">
      <Navigation 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        toggleTheme={toggleTheme} 
        isDark={theme === 'dark'} 
        currentUser={currentUser} 
        onMarkNotificationsRead={markNotificationsRead}
        onDeleteNotification={handleDeleteNotification}
        onClearReadNotifications={handleClearReadNotifications}
        onViewProfile={(id) => handleViewProfile(id)}
      />
      <main className="flex-1 w-full h-full overflow-y-auto overflow-x-hidden relative scroll-smooth">
        <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12 pb-32 md:pb-12">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;