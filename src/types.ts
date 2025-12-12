import type { LucideIcon } from 'lucide-react';

export interface NavItem {
    id: string;
    label: string;
    path: string;
    icon: LucideIcon;
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export interface Task {
    id: number;
    title: string;
    description?: string;
    status: 'todo' | 'in_progress' | 'done';
    createdAt: string;
}

export interface DocumentInfo {
    fileId: string;
    name: string;
    size: number;
    uploadDate: string;
}

export const API_BASE_URL = "https://svc-01kc5n5d8pekxmxk6zwx6k49p5.01kc1ygbvk6eye2t9pkjnv5bqz.lmapp.run";

// Get user ID from local storage or generate new one
export const getUserId = () => {
    let userId = localStorage.getItem('memoai_user_id');
    if (!userId) {
        userId = `user-${Math.floor(Math.random() * 1000000)}`;
        localStorage.setItem('memoai_user_id', userId);
    }
    return userId;
};

export const clearUser = () => {
    localStorage.removeItem('memoai_user_id');
    window.location.reload();
}
