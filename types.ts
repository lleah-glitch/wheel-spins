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
  imageUrl?: string; // Optional image URL for physical prizes
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
  ipWhitelist: string[]; // List of allowed IPs for Admin access
  customerServiceUrl: string; // URL for customer service
  wheelDisplayMode: 'IMAGE' | 'TEXT'; // Sector type display mode
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
  { id: '1', name: 'Hair Dryer', type: PrizeType.PHYSICAL, probability: 0.2, color: '#fcd34d', icon: 'Zap' }, // Yellow
  { id: '2', name: '1000 Gold', type: PrizeType.CURRENCY, amount: 1000, probability: 5, color: '#0ea5e9', icon: 'Coins' }, // Blue
  { id: '3', name: 'Controller', type: PrizeType.PHYSICAL, probability: 0.5, color: '#fcd34d', icon: 'Gamepad' }, // Yellow
  { id: '4', name: '500 Gold', type: PrizeType.CURRENCY, amount: 500, probability: 15, color: '#0ea5e9', icon: 'Coins' }, // Blue
  { id: '5', name: 'Sneakers', type: PrizeType.PHYSICAL, probability: 0.2, color: '#fcd34d', icon: 'Footprints' }, // Yellow
  { id: '6', name: '100 Gold', type: PrizeType.CURRENCY, amount: 100, probability: 30, color: '#0ea5e9', icon: 'Coins' }, // Blue
  { id: '7', name: 'Try Again', type: PrizeType.EMPTY, probability: 49.1, color: '#fcd34d', icon: 'Frown' }, // Yellow
  { id: '8', name: 'Bonus', type: PrizeType.CURRENCY, amount: 50, probability: 0, color: '#0ea5e9', icon: 'Star' }, // Blue
];