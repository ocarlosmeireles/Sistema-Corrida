
import { Activity } from "../types";

// Mock Service to simulate Strava API interactions
// In a real app, this would handle OAuth tokens and fetch from https://www.strava.com/api/v3/

export const connectStrava = async (): Promise<boolean> => {
    return new Promise((resolve) => {
        // Simulate popup auth delay
        setTimeout(() => {
            resolve(true);
        }, 1500);
    });
};

export const getStravaActivities = async (): Promise<Activity[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simulate 3 recent activities from Strava
            const mockData: Activity[] = [
                {
                    id: `strava_${Date.now()}_1`,
                    externalId: '123456789',
                    date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0], // 2 days ago
                    distanceKm: 8.5,
                    durationMin: 45,
                    pace: "5'17\"",
                    elevationGain: 45,
                    calories: 620,
                    feeling: 'good',
                    notes: 'Corrida Matinal - Importado do Strava',
                    mode: 'run',
                    source: 'strava'
                },
                {
                    id: `strava_${Date.now()}_2`,
                    externalId: '987654321',
                    date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0], // 5 days ago
                    distanceKm: 12.0,
                    durationMin: 68,
                    pace: "5'40\"",
                    elevationGain: 120,
                    calories: 950,
                    feeling: 'hard',
                    notes: 'Longo de Domingo - Importado do Strava',
                    mode: 'long_run',
                    source: 'strava'
                },
                {
                    id: `strava_${Date.now()}_3`,
                    externalId: '456789123',
                    date: new Date(Date.now() - 86400000 * 8).toISOString().split('T')[0], // 8 days ago
                    distanceKm: 5.0,
                    durationMin: 24,
                    pace: "4'48\"",
                    elevationGain: 10,
                    calories: 350,
                    feeling: 'great',
                    notes: 'Tiro Curto - Importado do Strava',
                    mode: 'run',
                    source: 'strava'
                }
            ];
            resolve(mockData);
        }, 2000); // Simulate network latency
    });
};
