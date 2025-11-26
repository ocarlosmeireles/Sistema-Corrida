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
import { Member, WindRank, RaceEvent, Activity, Season, Sponsor, Story, PlanType, Notification, TrainingPlan, PrivateMessage, SoundType, Challenge } from './types';

// Firebase Imports
import { db, seedDatabase, isFirebaseInitialized, MOCK_MEMBERS, MOCK_EVENTS, MOCK_STORIES, INITIAL_SPONSORS, MOCK_SEASON } from './services/firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc, setDoc, query, orderBy } from 'firebase/firestore';

// MOCK CHALLENGES (Initial)
const INITIAL_CHALLENGES: Challenge[] = [
    { id: 'c1', creatorId: '1', creatorName: 'Carlos Admin', title: 'Desafio 100km em 30 Dias', description: 'Acumule 100km de corrida até o final do mês. Quem topa?', targetKm: 100, participants: ['1', '2', '3'], startDate: '2023-10-01', endDate: '2025-12-31' },
    { id: 'c2', creatorId: '2', creatorName: 'Sarah Ventania', title: 'Fim de Semana 21k', description: 'Correr uma meia maratona neste fim de semana.', targetKm: 21, participants: ['2', '3'], startDate: '2023-10-27', endDate: '2025-11-30' }
];

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  
  // App State - Initialized with MOCK DATA for offline resilience
  const [activeTab, setActiveTab] = useState('dashboard');
  const [members, setMembers] = useState<Member[]>(MOCK_MEMBERS);
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
              console.warn("Firebase not initialized. Using Local Mock Data.");
              return;
          }

          try {
              await seedDatabase();
              
              // Subscribe to Members
              unsubscribeMembers = onSnapshot(collection(db, 'members'), (snapshot) => {
                  const loadedMembers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
                  if (loadedMembers.length > 0) setMembers(loadedMembers);
              }, (error) => {
                  console.warn("Members Sync failed (Offline Mode active).");
              });

              // Subscribe to Events
              unsubscribeEvents = onSnapshot(collection(db, 'events'), (snapshot) => {
                  const loadedEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RaceEvent));
                  if (loadedEvents.length > 0) setEvents(loadedEvents);
              }, (error) => {
                  console.warn("Events Sync failed (Offline Mode active).");
              });

              // Subscribe to Stories
              unsubscribeStories = onSnapshot(query(collection(db, 'stories'), orderBy('date', 'desc')), (snapshot) => {
                  const loadedStories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Story));
                  if (loadedStories.length > 0) setStories(loadedStories);
              }, (error) => {
                  console.warn("Stories Sync failed (Offline Mode active).");
              });

              // Subscribe to Season
              unsubscribeSeason = onSnapshot(doc(db, 'seasons', 'current'), (doc) => {
                  if (doc.exists()) {
                      setCurrentSeason(doc.data() as Season);
                  }
              }, (error) => {
                  console.warn("Season Sync failed (Offline Mode active).");
              });

              // Subscribe to Sponsors
              unsubscribeSponsors = onSnapshot(collection(db, 'sponsors'), (snapshot) => {
                  const loadedSponsors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sponsor));
                  if (loadedSponsors.length > 0) setAllSponsors(loadedSponsors);
              }, (error) => {
                  console.warn("Sponsors Sync failed (Offline Mode active).");
              });

              // Subscribe to Direct Messages
              unsubscribeDMs = onSnapshot(collection(db, 'direct_messages'), (snapshot) => {
                  const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PrivateMessage));
                  setDirectMessages(msgs);
              }, (error) => {
                  console.warn("DM Sync failed (Offline Mode active).");
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

  // --- PUSH NOTIFICATIONS ---
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  const sendPushNotification = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
      try {
        new Notification(title, { body, icon: 'https://cdn-icons-png.flaticon.com/512/2553/2553658.png' });
      } catch (e) {
        console.error("Push error", e);
      }
    }
  };

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
            case 'click':
                // Silent for clicks as requested
                break;
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
                osc.frequency.setValueAtTime(523.25, now); // C5
                osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
                osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
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
            case 'start': // Enhanced Wind/Scifi Start
                // Noise Buffer for "Wind"
                const bufferSize = ctx.sampleRate * 2; // 2 seconds
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                const noise = ctx.createBufferSource();
                noise.buffer = buffer;
                const noiseFilter = ctx.createBiquadFilter();
                noiseFilter.type = 'lowpass';
                noiseFilter.frequency.setValueAtTime(200, now);
                noiseFilter.frequency.linearRampToValueAtTime(2000, now + 1.5);
                const noiseGain = ctx.createGain();
                noiseGain.gain.setValueAtTime(0.2, now);
                noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
                noise.connect(noiseFilter);
                noiseFilter.connect(noiseGain);
                noiseGain.connect(ctx.destination);
                noise.start(now);

                // Tone
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(800, now + 0.4);
                gainNode.gain.setValueAtTime(0.1, now);
                gainNode.gain.linearRampToValueAtTime(0.2, now + 0.4);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
                osc.start(now);
                osc.stop(now + 1.5);
                break;
            case 'hero': 
                // Chord
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
    } catch (e) {
        console.error("Audio Engine Error", e);
    }
  };

  // Theme Logic
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
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
      playUISound('hero');
      setCurrentUserId(userId);
      setIsAuthenticated(true);
      
      if ("Notification" in window && Notification.permission !== "granted") {
          Notification.requestPermission();
      }
      
      const user = members.find(m => m.id === userId);
      if (user && (user.role === 'admin' || user.role === 'super_admin')) {
          setActiveTab('admin');
      } else {
          setActiveTab('dashboard');
      }
  };

  const handleRegister = async (data: any) => {
      const newMember: Member = {
          id: Date.now().toString(),
          name: data.name,
          password: data.password,
          gender: data.gender,
          bio: data.bio,
          location: data.location,
          weight: data.weight,
          height: data.height,
          role: 'member',
          plan: 'basic',
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

      try {
          if (isFirebaseInitialized) {
            await setDoc(doc(db, 'members', newMember.id), newMember);
          }
          setMembers(prev => [...prev, newMember]);
          handleLogin(newMember.id);
      } catch(e) {
          console.error("Registration failed", e);
          alert("Erro ao cadastrar.");
          setMembers(prev => [...prev, newMember]);
          handleLogin(newMember.id);
      }
  };

  const handleLogout = () => {
      playUISound('click');
      setIsAuthenticated(false);
      setCurrentUserId('');
      setViewingMemberId(null);
      setShowLanding(true);
  };

  const currentUser = members.find(m => m.id === currentUserId) || members[0] || ({} as Member);

  const addNotification = async (memberId: string, notification: Omit<Notification, 'id' | 'read' | 'date'>) => {
    if (memberId === currentUserId) {
        playUISound('success');
        sendPushNotification(notification.title, notification.message);
    }
    
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
            await updateDoc(doc(db, 'members', currentUserId), { 
                following: newFollowing, 
                seasonScore: newScore 
            });

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
            addNotification(targetId, {
                title: "Novo Seguidor",
                message: `${currentUser.name} começou a seguir você!`,
                type: "info"
            });
        }
    } catch (e) {
        // Fallback logic already handled by else block for initialization check or generic error catch if needed
    }
  };

  const calculateStreak = (activities: Activity[]) => {
      if (!activities || activities.length === 0) return 0;
      const dates = Array.from(new Set(activities.map(a => a.date.split('T')[0])))
        .sort((a,b) => new Date(b).getTime() - new Date(a).getTime());
      
      let streak = 0;
      if (dates.length === 0) return 0;

      const today = new Date();
      today.setHours(0,0,0,0);
      const lastRun = new Date(dates[0]);
      lastRun.setHours(0,0,0,0);
      
      const diffSinceLast = (today.getTime() - lastRun.getTime()) / (1000 * 3600 * 24);
      if (diffSinceLast > 1) return 0; 

      streak = 1;
      for (let i = 0; i < dates.length - 1; i++) {
        const curr = new Date(dates[i]);
        const prev = new Date(dates[i+1]);
        curr.setHours(0,0,0,0);
        prev.setHours(0,0,0,0);
        if ((curr.getTime() - prev.getTime()) / (1000 * 3600 * 24) === 1) streak++;
        else break;
      }
      return streak;
  };

  const getPaceInSeconds = (paceStr: string) => {
      if (!paceStr) return 99999;
      try {
        const clean = paceStr.replace(/[^\d:.]/g, '').replace(':', '.'); 
        const parts = paceStr.split(/[:']/);
        if (parts.length === 2) {
            const min = parseInt(parts[0], 10);
            const sec = parseInt(parts[1].replace('"', ''), 10);
            return (min * 60) + (sec || 0);
        }
        return 99999;
      } catch (e) {
        return 99999;
      }
  };

  const handleUpdateUser = async (updatedMember: Member) => {
    const newAchievements = [...(updatedMember.achievements || [])];
    const currentStreak = calculateStreak(updatedMember.activities);
    const activities = updatedMember.activities || [];
    const lastActivity = activities.length > 0 ? activities[activities.length - 1] : null;

    ACHIEVEMENTS_LIST.forEach(ach => {
        if (!newAchievements.includes(ach.id)) {
            let unlocked = false;
            if (ach.conditionType === 'total_distance' && updatedMember.totalDistance >= ach.threshold) unlocked = true;
            if (ach.conditionType === 'distance_single' && lastActivity && lastActivity.distanceKm >= ach.threshold) unlocked = true;
            if (ach.conditionType === 'pace' && lastActivity) {
                const activityPaceSec = getPaceInSeconds(lastActivity.pace);
                if (activityPaceSec > 0 && activityPaceSec <= ach.threshold) unlocked = true;
            }
            if (ach.conditionType === 'streak' && currentStreak >= ach.threshold) unlocked = true;

            if (unlocked) {
                newAchievements.push(ach.id);
                addNotification(updatedMember.id, {
                    title: "Conquista Desbloqueada!",
                    message: `Você alcançou: ${ach.title}`,
                    type: "achievement"
                });
            }
        }
    });
    
    const memberToSave = { ...updatedMember, achievements: newAchievements };
    try {
        if (isFirebaseInitialized) {
            await updateDoc(doc(db, 'members', updatedMember.id), memberToSave);
        }
        setMembers(prev => prev.map(m => m.id === updatedMember.id ? memberToSave : m));
    } catch(e) {
        setMembers(prev => prev.map(m => m.id === updatedMember.id ? memberToSave : m));
    }
  };

  const handleUpdateActivePlan = async (plan: TrainingPlan) => {
      const updatedUser = { ...currentUser, activePlan: plan };
      await handleUpdateUser(updatedUser);
      addNotification(currentUser.id, {
          title: "Novo Plano Definido",
          message: "Sua planilha de voo foi atualizada. Bons treinos!",
          type: "info"
      });
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
            // @ts-ignore
            await updateDoc(doc(db, 'members', memberId), {
                plan: newPlan,
                proExpiresAt: proExpiresAt || null 
            });
        }
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, plan: newPlan, proExpiresAt: proExpiresAt } : m));
      } catch(e) {
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, plan: newPlan, proExpiresAt: proExpiresAt } : m));
      }
      
      addNotification(memberId, {
          title: newPlan === 'pro' ? "Upgrade Confirmado!" : "Plano Alterado",
          message: newPlan === 'pro' 
            ? "Seu plano PRO está ativo por 30 dias. Aproveite o Coach IA!" 
            : "Seu plano foi alterado para Básico.",
          type: "success"
      });
  }

  const handleUpdateProfile = async (updatedMember: Member) => {
    try {
        if (isFirebaseInitialized) {
            await updateDoc(doc(db, 'members', updatedMember.id), updatedMember);
        }
        setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
    } catch (e) {
        setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
    }
  };

  const handleSaveLiveActivity = async (activityData: Omit<Activity, 'id'>) => {
      const newActivity: Activity = {
          id: Date.now().toString(),
          ...activityData
      };

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
      if (updatedShoes.length > 0) {
          updatedShoes[0].currentKm += newActivity.distanceKm;
      }

      const updatedUser = {
          ...currentUser,
          totalDistance: updatedDistance,
          rank: newRank,
          seasonScore: currentUser.seasonScore + xpEarned,
          activities: [...(currentUser.activities || []), newActivity],
          shoes: updatedShoes
      };

      await handleUpdateUser(updatedUser);
      
      addNotification(currentUser.id, {
          title: "Corrida Salva",
          message: `Você completou ${newActivity.distanceKm}km. +${xpEarned} XP!`,
          type: "success"
      });

      setActiveTab('dashboard');
  };

  const handleDeleteActivity = async (activityId: string) => {
      const updatedActivities = currentUser.activities.filter(a => a.id !== activityId);
      // Recalculate total distance
      const newTotalDist = updatedActivities.reduce((acc, curr) => acc + curr.distanceKm, 0);
      
      const updatedUser = {
          ...currentUser,
          activities: updatedActivities,
          totalDistance: newTotalDist
      };

      try {
          if (isFirebaseInitialized) {
              await updateDoc(doc(db, 'members', currentUser.id), updatedUser);
          }
          setMembers(prev => prev.map(m => m.id === currentUser.id ? updatedUser : m));
          playUISound('success');
      } catch (e) {
          setMembers(prev => prev.map(m => m.id === currentUser.id ? updatedUser : m));
      }
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
    
    try {
        if (isFirebaseInitialized) {
            await setDoc(doc(db, 'members', newMember.id), newMember);
        }
        setMembers(prev => [...prev, newMember]);
    } catch(e) {
        setMembers(prev => [...prev, newMember]);
    }
  };

  const handleRemoveMember = async (id: string) => {
    if (members.length <= 1) {
        playUISound('error');
        alert("A equipe precisa de pelo menos um membro!");
        return;
    }
    playUISound('click');
    alert("Função de remover desabilitada temporariamente para segurança dos dados.");
  };

  const handleSwitchUser = (id: string) => {
    playUISound('toggle');
    setCurrentUserId(id);
    setActiveTab('dashboard');
  };

  const handleAddEvent = async (newEventData: Omit<RaceEvent, 'id'>) => {
    const newEvent: RaceEvent = {
        ...newEventData,
        id: Date.now().toString()
    };
    try {
        if (isFirebaseInitialized) {
            await setDoc(doc(db, 'events', newEvent.id), newEvent);
        }
        setEvents(prev => [...prev, newEvent]);
    } catch (e) {
        setEvents(prev => [...prev, newEvent]);
    }
    
    members.forEach(m => {
        addNotification(m.id, {
            title: "Nova Prova!",
            message: `${newEvent.name} foi adicionada ao calendário.`,
            type: "info"
        });
    });
  };

  const handleRemoveEvent = async (id: string) => {
    playUISound('click');
    alert("Remoção de eventos desabilitada.");
  };

  const handleAddStory = async (newStory: Story) => {
     playUISound('success');
     try {
        if (isFirebaseInitialized) {
            await setDoc(doc(db, 'stories', newStory.id), newStory);
        }
        setStories(prev => [newStory, ...prev]);
     } catch(e) {
        setStories(prev => [newStory, ...prev]);
     }
     
     const updatedUser = { 
        ...currentUser, 
        seasonScore: currentUser.seasonScore + 20 
     };
     await handleUpdateUser(updatedUser);
     
     addNotification(currentUser.id, {
         title: "História Publicada",
         message: "Sua história está no ar! +20 XP.",
         type: "success"
     });
  };

  const handleLikeStory = async (id: string) => {
    playUISound('toggle');
    const likedStory = stories.find(s => s.id === id);
    if(likedStory) {
        const updatedStory = { ...likedStory, likes: likedStory.likes + 1 };
        try {
            if (isFirebaseInitialized) {
                await updateDoc(doc(db, 'stories', id), { likes: updatedStory.likes });
            }
            setStories(prev => prev.map(s => s.id === id ? updatedStory : s));
        } catch(e) {
            setStories(prev => prev.map(s => s.id === id ? updatedStory : s));
        }
        
        const author = members.find(m => m.name === likedStory.authorName);
        if (author && author.id !== currentUser.id) {
            addNotification(author.id, {
                title: "Nova Curtida",
                message: `${currentUser.name} curtiu sua história "${likedStory.title}".`,
                type: "info"
            });
        }
    }
  };

  const handleRequestUpgrade = () => {
    playUISound('click');
    const admins = members.filter(m => m.role === 'admin' || m.role === 'super_admin');
    admins.forEach(admin => {
        addNotification(admin.id, {
            title: "Solicitação de Upgrade",
            message: `O atleta ${currentUser.name} deseja assinar o Plano PRO.`,
            type: "info"
        });
    });

    addNotification(currentUser.id, {
        title: "Solicitação Enviada",
        message: "O administrador recebeu seu pedido. Aguarde contato.",
        type: "success"
    });

    alert("Solicitação enviada ao Admin com sucesso!");
    if(showLanding) setShowLanding(false);
  };

  const handleUpdateSeason = async (updatedSeason: Season) => {
    playUISound('success');
    try {
        if (isFirebaseInitialized) {
            await setDoc(doc(db, 'seasons', 'current'), updatedSeason);
        }
        setCurrentSeason(updatedSeason);
    } catch (e) {
        setCurrentSeason(updatedSeason);
    }
  };

  const handleAddSponsor = async (newSponsor: Sponsor) => {
    playUISound('success');
    try {
        if (isFirebaseInitialized) {
            await setDoc(doc(db, 'sponsors', newSponsor.id), newSponsor);
        }
        setAllSponsors(prev => [...prev, newSponsor]);
    } catch (e) {
        setAllSponsors(prev => [...prev, newSponsor]);
    }
  };

  const handleRemoveSponsor = async (id: string) => {
    playUISound('click');
    const updatedSeasonSponsors = currentSeason.sponsors.filter(s => s.id !== id);
    try {
        if (isFirebaseInitialized) {
            await updateDoc(doc(db, 'seasons', 'current'), { sponsors: updatedSeasonSponsors });
        }
        setCurrentSeason({ ...currentSeason, sponsors: updatedSeasonSponsors });
    } catch(e) {
        setCurrentSeason({ ...currentSeason, sponsors: updatedSeasonSponsors });
    }
  };

  // Challenge Functions
  const handleCreateChallenge = (challenge: Omit<Challenge, 'id'>) => {
      const newChallenge = { ...challenge, id: Date.now().toString() };
      setChallenges(prev => [...prev, newChallenge]);
      playUISound('success');
  };

  const handleJoinChallenge = (challengeId: string) => {
      setChallenges(prev => prev.map(c => {
          if(c.id === challengeId && !c.participants.includes(currentUser.id)) {
              return { ...c, participants: [...c.participants, currentUser.id] };
          }
          return c;
      }));
      playUISound('success');
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
      case 'plans':
        return (
            <TrainingPlanGenerator 
                currentUser={currentUser}
                onSavePlan={handleUpdateActivePlan} 
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
                onAddStory={handleAddStory} 
                onLikeStory={handleLikeStory}
                directMessages={directMessages}
                onSendMessage={handleSendMessage}
                initialChatTargetId={targetChatUserId}
                onNotifyMember={handleNotifyMember}
                challenges={challenges}
                onCreateChallenge={handleCreateChallenge}
                onJoinChallenge={handleJoinChallenge}
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