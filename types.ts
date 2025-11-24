export enum PrizeType {
  PHYSICAL = 'PHYSICAL',
  CURRENCY = 'CURRENCY',
  EMPTY = 'EMPTY'
}

export interface Prize {
  id: string;
  name: string;
  type: PrizeType;
  amount?: number; // For currency
  probability: number; // 0.0 to 100.0 (percentage)
  color: string;
  icon?: string; // Name of lucide icon
}

export interface User {
  id: string;
  name: string;
  hasPlayed: boolean;
  wonPrize?: string; // Name of the prize won
}

export interface AppConfig {
  title: string;
  logoUrl: string | null; // Base64 string or URL
}

export interface AppState {
  prizes: Prize[];
  users: User[];
  currentUser: User | null;
  isSpinning: boolean;
  lastWinner: Prize | null;
  showAdmin: boolean;
}

export const DEFAULT_PRIZES: Prize[] = [
  { id: '1', name: 'iPhone 17 Pro', type: PrizeType.PHYSICAL, probability: 0.2, color: '#ef4444', icon: 'Smartphone' }, // Red
  { id: '2', name: '1000 Gold', type: PrizeType.CURRENCY, amount: 1000, probability: 5, color: '#fbbf24', icon: 'Coins' }, // Amber
  { id: '3', name: 'Smart Watch', type: PrizeType.PHYSICAL, probability: 0.5, color: '#8b5cf6', icon: 'Watch' }, // Violet
  { id: '4', name: '500 Gold', type: PrizeType.CURRENCY, amount: 500, probability: 15, color: '#3b82f6', icon: 'Coins' }, // Blue
  { id: '5', name: 'Motorcycle', type: PrizeType.PHYSICAL, probability: 0.2, color: '#10b981', icon: 'Bike' }, // Emerald
  { id: '6', name: '100 Gold', type: PrizeType.CURRENCY, amount: 100, probability: 30, color: '#f97316', icon: 'Coins' }, // Orange
  { id: '7', name: 'Try Again', type: PrizeType.EMPTY, probability: 49.1, color: '#64748b', icon: 'Frown' }, // Slate
];