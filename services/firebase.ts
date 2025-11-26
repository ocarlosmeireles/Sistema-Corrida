// @ts-nocheck
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged as onAuthStateChangedLib,
  Auth
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  getDoc, 
  getDocs,
  where,
  onSnapshot, 
  query, 
  orderBy, 
  writeBatch
} from 'firebase/firestore';
import { Member, RaceEvent, Story, Season, Sponsor, WindRank } from '../types';

// --- CONFIGURAÇÃO DO FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyCTtyJO5NUi0dDCIgdJkNezxXblcB4ih1s",
  authDomain: "instavit-5487f.firebaseapp.com",
  databaseURL: "https://instavit-5487f.firebaseio.com",
  projectId: "instavit-5487f",
  storageBucket: "instavit-5487f.firebasestorage.app",
  messagingSenderId: "379094525129",
  appId: "1:379094525129:web:fb06b2c937618f8c921918",
  measurementId: "G-SG4FYZBZY7"
};

// Flag para verificar se está configurado (Simulação para exemplo)
// Em produção, você usaria variáveis de ambiente
export const isFirebaseInitialized = firebaseConfig.apiKey !== "SUA_API_KEY_AQUI";

// --- INICIALIZAÇÃO MODULAR ---
let app;
let auth: any;
let db: any;

if (isFirebaseInitialized) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (e) {
    console.error("Erro ao inicializar Firebase:", e);
  }
}

export { auth, db };

// --- RE-EXPORTS DA API MODULAR ---
// Exportamos as funções nativas do v9 diretamente para uso nos componentes
export { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  getDoc, 
  getDocs,
  where,
  onSnapshot, 
  query, 
  orderBy, 
  writeBatch 
};

// Wrapper para onAuthStateChanged para garantir compatibilidade de tipos
export const onAuthStateChanged = (authInstance: any, cb: any) => {
    if (!authInstance) return () => {};
    return onAuthStateChangedLib(authInstance, cb);
};

// --- SERVIÇOS DE AUTENTICAÇÃO ---

export const signUpWithFirebase = async (memberData: Member, password: string) => {
  if (!isFirebaseInitialized || !auth) throw new Error("Firebase não configurado.");

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, memberData.email!, password);
    const user = userCredential.user;
    if (!user) throw new Error("Falha na criação do usuário.");

    const newMember: Member = {
      ...memberData,
      id: user.uid,
    };

    await setDoc(doc(db, "members", user.uid), newMember);
    return newMember;

  } catch (error: any) {
    throw new Error(mapAuthCodeToMessage(error.code));
  }
};

export const signInWithIdentifier = async (identifier: string, password: string) => {
  if (!isFirebaseInitialized || !auth) throw new Error("Firebase não configurado.");
  
  let emailToUse = identifier;
  
  // Se não parece um email, tenta buscar pelo nickname ou nome
  if (!identifier.includes('@')) {
      try {
          // 1. Tenta pelo Nickname
          const qNick = query(collection(db, "members"), where("nickname", "==", identifier));
          const snapshotNick = await getDocs(qNick);
          
          if (!snapshotNick.empty) {
              emailToUse = snapshotNick.docs[0].data().email;
          } else {
              // 2. Tenta pelo Nome exato
              const qName = query(collection(db, "members"), where("name", "==", identifier));
              const snapshotName = await getDocs(qName);
              
              if (!snapshotName.empty) {
                  emailToUse = snapshotName.docs[0].data().email;
              } else {
                  throw new Error("Usuário não encontrado com este Apelido ou Nome.");
              }
          }
      } catch (e: any) {
          // Se for erro nosso, relança. Se for erro de conexão, deixa passar para o auth tentar (vai falhar)
          if (e.message.includes("Usuário não encontrado")) throw e;
          console.error("Erro ao buscar usuário por identificador:", e);
      }
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, emailToUse, password);
    const user = userCredential.user;
    if (!user) throw new Error("Falha no login.");
    
    const userDoc = await getDoc(doc(db, "members", user.uid));
    
    if (userDoc.exists()) {
      return userDoc.data() as Member;
    } else {
      throw new Error("Perfil de usuário não encontrado no banco de dados.");
    }

  } catch (error: any) {
    throw new Error(mapAuthCodeToMessage(error.code));
  }
};

export const logoutFirebase = async () => {
  if (!isFirebaseInitialized || !auth) return;
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Erro ao sair", error);
  }
};

// --- HELPER: TRADUÇÃO DE ERROS ---
const mapAuthCodeToMessage = (code: string): string => {
  switch (code) {
    case 'auth/email-already-in-use': return 'Este email já está sendo usado por outro atleta.';
    case 'auth/invalid-email': return 'O formato do email é inválido.';
    case 'auth/operation-not-allowed': return 'Operação não permitida.';
    case 'auth/weak-password': return 'A senha é muito fraca (mínimo 6 caracteres).';
    case 'auth/user-disabled': return 'Este usuário foi desabilitado.';
    case 'auth/user-not-found': return 'Não encontramos este email na base.';
    case 'auth/wrong-password': return 'Senha incorreta. Tente novamente.';
    case 'auth/invalid-credential': return 'Credenciais inválidas.';
    default: return 'Ocorreu um erro desconhecido. Tente novamente.';
  }
};

// --- DADOS MOCK PARA SEED/OFFLINE ---
export const MOCK_MEMBERS: Member[] = [
  {
    id: '1',
    name: 'Carlos Admin',
    email: 'admin@fdv.com',
    nickname: 'Zeus',
    password: '123',
    gender: 'male',
    role: 'super_admin',
    plan: 'pro',
    rank: WindRank.TORNADO,
    totalDistance: 1250.5,
    seasonScore: 4500,
    avatarUrl: 'https://ui-avatars.com/api/?name=Carlos+Admin&background=0D8ABC&color=fff',
    achievements: ['first_run', '10k_runner', 'total_1000', 'streak_30'],
    activities: [],
    followers: ['2', '3', '4'],
    following: ['2', '3'],
    notifications: [],
    shoes: [],
    connectedApps: []
  },
];

export const MOCK_EVENTS: RaceEvent[] = [
  { id: 'e1', name: 'Maratona do Rio', date: '2025-06-15', location: 'Aterro do Flamengo', distances: ['21km', '42km'] },
  { id: 'e2', name: 'Night Run Copacabana', date: '2025-08-20', location: 'Posto 6', distances: ['5km', '10km'] }
];

export const MOCK_STORIES: Story[] = [
  { id: 's1', authorName: 'Ana Rajada', authorRank: WindRank.GALE, title: 'Meu primeiro 21k!', content: 'Foi difícil, mas o vento a favor no final ajudou muito. Obrigado time!', date: '2025-02-10', likes: 24 },
];

export const MOCK_SEASON: Season = {
  id: 'season_2025_1',
  title: 'Temporada dos Ventos Uivantes',
  description: 'A temporada de outono chegou. O desafio é manter a consistência mesmo com o vento contra.',
  startDate: '2025-03-01',
  endDate: '2025-06-30',
  isActive: true,
  sponsors: []
};

export const INITIAL_SPONSORS: Sponsor[] = [
  { id: 'sp1', name: 'ASICS', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Asics_Logo.svg/2560px-Asics_Logo.svg.png', prizeDescription: 'Novablast 4', prizeImageUrl: 'https://images.asics.com/is/image/asics/1011B693_400_SR_RT_GLB?$zoom$' },
];

// --- FUNÇÃO DE SEED (Popular banco vazio) ---
export const seedDatabase = async () => {
  if (!isFirebaseInitialized || !db) return;
  
  try {
    const testDoc = await getDoc(doc(db, 'seasons', 'current'));
    if (!testDoc.exists()) {
      console.log("Seeding Database...");
      
      await setDoc(doc(db, 'seasons', 'current'), MOCK_SEASON);
      
      await Promise.all(MOCK_EVENTS.map(ev => setDoc(doc(db, 'events', ev.id), ev)));
      await Promise.all(MOCK_STORIES.map(st => setDoc(doc(db, 'stories', st.id), st)));
      await Promise.all(INITIAL_SPONSORS.map(sp => setDoc(doc(db, 'sponsors', sp.id), sp)));
      
      console.log("Database Seeded!");
    }
  } catch (e) {
    console.warn("Seed Error (pode ser permissão):", e);
  }
};