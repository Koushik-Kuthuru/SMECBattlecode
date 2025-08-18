import type { Timestamp } from 'firebase/firestore';

export type UserData = {
    uid: string;
    name: string;
    email: string;
    studentId: string;
    points: number;
    penalties?: number;
    branch: string;
    year: string;
    section: string;
    imageUrl?: string;
    profileComplete: boolean;
    preferredLanguages: string[];
    isAdmin?: boolean;
    lastSeen?: Timestamp;
};

export type Event = {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    isEnabled: boolean;
    startDate: Timestamp;
    endDate: Timestamp;
    type: 'Podcast' | 'Challenge' | 'Workshop';
    enrolled: number;
    registrationLink?: string;
    aiHint?: string;
    status: 'live' | 'upcoming' | 'past';
    createdAt?: Timestamp;
};

export type LeaderboardUser = {
  name: string;
  points: number;
  imageUrl?: string;
  isAdmin?: boolean;
};
