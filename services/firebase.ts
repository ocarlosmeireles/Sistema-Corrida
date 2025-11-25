
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  writeBatch, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";
import { Member, WindRank, RaceEvent, Story, Sponsor, Season } from "../types";

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyCTtyJO5NUi0dDCIgdJkNezxXblcB4ih1s",
  authDomain: "instavit-5487f.firebaseapp.com",
  databaseURL: "https://instavit-5487f.firebaseio.com",
  projectId: "instavit-5487f",
  storageBucket: "instavit-5487f.firebasestorage.app",
  messagingSenderId: "379094525129",
  appId: "1:379094525129:web:fb06b2c937618f8c921918"
};

// Initialize Firebase with Persistence
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore with persistent cache
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

// --- MOCK DATA (Exported for fallback) ---
export const INITIAL_SPONSORS: Sponsor[] = [
  {
      id: 'sp1',
      name: 'ASICS',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Asics_Logo.svg/2560px-Asics_Logo.svg.png',
      prizeDescription: 'Tênis Novablast 3',
      prizeImageUrl: 'https://images.asics.com/is/image/asics/1011B458_400_SR_RT_GLB?$zoom$'
  },
  {
      id: 'sp2',
      name: 'Gatorade',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/18/Gatorade_logo.svg/1200px-Gatorade_logo.svg.png',
      prizeDescription: 'Kit Hidratação Mensal',
      prizeImageUrl: 'https://m.media-amazon.com/images/I/71wM2VvB1zL._AC_SX679_.jpg'
  },
  {
      id: 'sp3',
      name: 'Águas Prata',
      logoUrl: 'https://encrypted-tbn0.gstatic.com/images/q=tbn:ANd9GcQ6yP6d8hTfoiQ82uW_jQ8-r_K-l95tF4T0hA&s',
      prizeDescription: 'Suprimento de Água Mineral',
      prizeImageUrl: 'https://www.aguasprata.com.br/wp-content/uploads/2020/09/garrafa-agua-mineral-prata.png'
  },
  {
      id: 'sp4',
      name: 'Super Mercado Zona Sul',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Zona_Sul_Supermercados_Logo.png',
      prizeDescription: 'Vale Compras Saudável R$ 500',
      prizeImageUrl: 'https://zonasul.vtexassets.com/assets/vtex.file-manager-graphql/images/8ad5c452-e97f-4f06-9073-27d1b09a2e83___655b084b61c128341697550d9b62a24a.jpg'
  }
];

export const MOCK_MEMBERS: Member[] = [
  {
    id: '0',
    name: 'ZEUS (Super Admin)',
    password: '123',
    gender: 'male',
    role: 'super_admin',
    plan: 'pro',
    proExpiresAt: '2099-12-31T23:59:59.999Z',
    bio: 'Controlando os ventos.',
    location: 'Olimpo, RJ',
    weight: 90,
    height: 195,
    rank: WindRank.TORNADO,
    totalDistance: 9999.9,
    seasonScore: 9999, 
    avatarUrl: 'https://ui-avatars.com/api/?name=Zeus&background=000&color=fff',
    achievements: [],
    activities: [],
    followers: [],
    following: [],
    notifications: [],
    shoes: []
  },
  {
    id: '1',
    name: 'Carlos Admin',
    password: '123',
    gender: 'male',
    role: 'admin',
    plan: 'pro',
    proExpiresAt: '2025-12-31T23:59:59.999Z',
    bio: 'Correndo contra o relógio, um dia de cada vez.',
    location: 'Copacabana, RJ',
    weight: 78,
    height: 182,
    rank: WindRank.BREEZE,
    totalDistance: 32.5,
    seasonScore: 450,
    avatarUrl: 'https://ui-avatars.com/api/?name=Carlos+Admin&background=random',
    achievements: ['first_run', '5k_runner'],
    activities: [
      { id: 'a1', date: '2023-10-20', distanceKm: 5.0, durationMin: 30, pace: "6'00\"", notes: 'Trote leve no Aterro do Flamengo', feeling: 'good' },
      { id: 'a2', date: '2023-10-22', distanceKm: 7.5, durationMin: 45, pace: "6'00\"", notes: 'Chuva na Lagoa', feeling: 'hard' },
    ],
    followers: ['2', '3'],
    following: ['2'],
    notifications: [],
    shoes: [
        { id: 's1', brand: 'Nike', model: 'Pegasus 40', currentKm: 350, maxKm: 800, status: 'active', imageUrl: '' },
        { id: 's2', brand: 'Adidas', model: 'Adizero SL', currentKm: 120, maxKm: 600, status: 'active', imageUrl: '' }
    ]
  },
  {
    id: '2',
    name: 'Sarah Ventania',
    password: '123',
    gender: 'female',
    role: 'member',
    plan: 'pro',
    proExpiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    bio: 'Viciada em endorfina. Maratona sub 4h loading...',
    location: 'Leblon, RJ',
    weight: 58,
    height: 165,
    rank: WindRank.GALE,
    totalDistance: 180.2,
    seasonScore: 1250,
    avatarUrl: 'https://ui-avatars.com/api/?name=Sarah+Ventania&background=random',
    achievements: ['first_run', '5k_runner', '10k_runner', 'veteran'],
    activities: [],
    followers: ['1', '3', '4'],
    following: ['1', '3'],
    notifications: [],
    connectedApps: [{ id: 'strava', name: 'Strava', connected: true }],
    shoes: []
  },
  {
    id: '3',
    name: 'Mike Furacão',
    password: '123',
    gender: 'male',
    role: 'member',
    plan: 'basic',
    bio: 'Treinador e amante da velocidade. Se não for pra suar, nem vou.',
    location: 'Barra, RJ',
    weight: 82,
    height: 180,
    rank: WindRank.HURRICANE,
    totalDistance: 620.5,
    seasonScore: 890,
    avatarUrl: 'https://ui-avatars.com/api/?name=Mike+Furacao&background=random',
    achievements: ['first_run', 'veteran', '21k_runner'],
    activities: [],
    followers: ['1', '2'],
    following: ['4'],
    notifications: [],
    shoes: []
  },
  {
    id: '4',
    name: 'Ana Rajada',
    password: '123',
    gender: 'female',
    role: 'member',
    plan: 'basic',
    bio: 'Começando agora mas com foco total!',
    location: 'Botafogo, RJ',
    weight: 60,
    height: 168,
    rank: WindRank.GUST,
    totalDistance: 85.0,
    seasonScore: 600,
    avatarUrl: 'https://ui-avatars.com/api/?name=Ana+Rajada&background=random',
    achievements: ['first_run', '5k_runner'],
    activities: [],
    followers: [],
    following: ['2'],
    notifications: [],
    shoes: []
  }
];

export const MOCK_EVENTS: RaceEvent[] = [
  {
    id: '1',
    name: 'Circuito das Estações',
    date: '2025-08-25',
    location: 'Aterro do Flamengo, RJ',
    distances: ['5km', '10km']
  },
  {
    id: '2',
    name: 'Maratona do Rio',
    date: '2025-06-22',
    location: 'Aterro do Flamengo, RJ',
    distances: ['21km', '42km']
  },
  {
    id: '3',
    name: 'Desafio da Serra',
    date: '2025-09-10',
    location: 'Petrópolis, RJ',
    distances: ['16km', '32km']
  }
];

export const MOCK_STORIES: Story[] = [
  {
    id: '1',
    authorName: 'Carlos "Furacão" Silva',
    authorRank: WindRank.HURRICANE,
    title: 'Superando a Lesão no Joelho',
    content: 'Há 6 meses, achei que nunca mais correria. Mas com o apoio da equipe Filhos do Vento e fortalecimento, hoje completei meus primeiros 10km sem dor na Lagoa! A persistência é o segredo.',
    date: '2023-10-24',
    likes: 15
  },
  {
    id: '2',
    authorName: 'Ana Maria',
    authorRank: WindRank.GUST,
    title: 'Minha primeira prova oficial',
    content: 'Sempre tive vergonha de correr em público. O grupo me incentivou a me inscrever na Maratona do Rio. O frio na barriga foi grande, mas cruzar a linha de chegada no Aterro foi indescritível.',
    date: '2023-10-20',
    likes: 28
  }
];

export const MOCK_SEASON: Season = {
    id: 's1',
    title: 'Temporada Verão 2025',
    description: 'O calor do Rio não perdoa, mas a recompensa é doce. Acumule XP correndo e interagindo para ganhar prêmios exclusivos dos nossos parceiros.',
    startDate: '2025-01-01',
    endDate: '2025-03-31',
    isActive: true,
    sponsors: [INITIAL_SPONSORS[0], INITIAL_SPONSORS[1]]
};

// --- SEED FUNCTION ---
export const seedDatabase = async () => {
    console.log("Attempting to seed database...");
    try {
        const batch = writeBatch(db);
        let hasChanges = false;

        // Check if members exist
        const membersRef = collection(db, "members");
        const membersSnap = await getDocs(membersRef);
        
        if (membersSnap.empty) {
            console.log("Seeding Members...");
            MOCK_MEMBERS.forEach(member => {
                const ref = doc(db, "members", member.id);
                batch.set(ref, member);
            });
            hasChanges = true;
        }

        // Events
        const eventsRef = collection(db, "events");
        const eventsSnap = await getDocs(eventsRef);
        if (eventsSnap.empty) {
            console.log("Seeding Events...");
            MOCK_EVENTS.forEach(event => {
                const ref = doc(db, "events", event.id);
                batch.set(ref, event);
            });
            hasChanges = true;
        }

        // Stories
        const storiesRef = collection(db, "stories");
        const storiesSnap = await getDocs(storiesRef);
        if (storiesSnap.empty) {
            console.log("Seeding Stories...");
            MOCK_STORIES.forEach(story => {
                const ref = doc(db, "stories", story.id);
                batch.set(ref, story);
            });
            hasChanges = true;
        }

        // Sponsors
        const sponsorsRef = collection(db, "sponsors");
        const sponsorsSnap = await getDocs(sponsorsRef);
        if (sponsorsSnap.empty) {
            console.log("Seeding Sponsors...");
            INITIAL_SPONSORS.forEach(sponsor => {
                const ref = doc(db, "sponsors", sponsor.id);
                batch.set(ref, sponsor);
            });
            hasChanges = true;
        }

        // Seasons (Config)
        const seasonsRef = collection(db, "seasons");
        const seasonsSnap = await getDocs(seasonsRef);
        if (seasonsSnap.empty) {
            console.log("Seeding Season...");
            const ref = doc(db, "seasons", "current");
            batch.set(ref, MOCK_SEASON);
            hasChanges = true;
        }

        if (hasChanges) {
            await batch.commit();
            console.log("Database seeded successfully!");
        } else {
            console.log("Database already has data.");
        }
    } catch (error: any) {
        // Graceful degradation for offline or permission denied
        if (error.code === 'permission-denied' || error.code === 'unavailable' || error.code === 'failed-precondition') {
             console.warn("⚠️ Firebase Disconnected: Running in Offline/Demo Mode.");
             return; // Do not throw, allowing app to proceed with mock data
        }
        console.error("Seeding failed:", error);
        // Still allow app to continue even on other errors
    }
};
