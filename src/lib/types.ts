import type { Timestamp } from 'firebase/firestore';

export type UserData = {
    uid: string;
    name: string;
    email: string;
    studentId: string;
    points: number;
    branch: string;
    year: string;
    section: string;
    imageUrl?: string;
    profileComplete: boolean;
    preferredLanguages?: string[];
    isAdmin?: boolean;
};

export type Event = {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    buttonLink: string;
    buttonText: string;
    isEnabled: boolean;
    startDate: Timestamp;
    endDate: Timestamp;
};
