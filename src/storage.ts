import AsyncStorage from '@react-native-async-storage/async-storage';
import { Category, Session, ActiveTimer } from './models';

const KEYS = {
  CATEGORIES: 'sayac_categories',
  SESSIONS: 'sayac_sessions',
  ACTIVE_TIMER: 'sayac_active_timer',
  INITIALIZED: 'sayac_initialized',
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Fizik',      color: '#2563EB', icon: '⚛️', createdAt: 0, order: 0 },
  { id: 'cat-2', name: 'Kimya',      color: '#059669', icon: '⚗️', createdAt: 0, order: 1 },
  { id: 'cat-3', name: 'İngilizce',  color: '#DC2626', icon: '🔤', createdAt: 0, order: 2 },
  { id: 'cat-4', name: 'Matematik',  color: '#7C3AED', icon: '➗', createdAt: 0, order: 3 },
  { id: 'cat-5', name: 'Yazılım',    color: '#0891B2', icon: '💻', createdAt: 0, order: 4 },
  { id: 'cat-6', name: 'Araştırma',  color: '#D97706', icon: '🔬', createdAt: 0, order: 5 },
  { id: 'cat-7', name: 'Spor',       color: '#DB2777', icon: '🏃', createdAt: 0, order: 6 },
  { id: 'cat-8', name: 'Müzik',      color: '#65A30D', icon: '🎵', createdAt: 0, order: 7 },
];

export const initStorage = async (): Promise<void> => {
  const initialized = await AsyncStorage.getItem(KEYS.INITIALIZED);
  if (!initialized) {
    await AsyncStorage.setItem(KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    await AsyncStorage.setItem(KEYS.SESSIONS, JSON.stringify([]));
    await AsyncStorage.setItem(KEYS.INITIALIZED, '1');
  }
};

export const getCategories = async (): Promise<Category[]> => {
  const raw = await AsyncStorage.getItem(KEYS.CATEGORIES);
  return raw ? JSON.parse(raw) : DEFAULT_CATEGORIES;
};

export const saveCategories = async (categories: Category[]): Promise<void> => {
  await AsyncStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
};

export const getSessions = async (): Promise<Session[]> => {
  const raw = await AsyncStorage.getItem(KEYS.SESSIONS);
  return raw ? JSON.parse(raw) : [];
};

export const addSession = async (session: Session): Promise<void> => {
  const sessions = await getSessions();
  await AsyncStorage.setItem(KEYS.SESSIONS, JSON.stringify([session, ...sessions]));
};

export const deleteSession = async (sessionId: string): Promise<void> => {
  const sessions = await getSessions();
  await AsyncStorage.setItem(
    KEYS.SESSIONS,
    JSON.stringify(sessions.filter(s => s.id !== sessionId))
  );
};

export const getActiveTimer = async (): Promise<ActiveTimer | null> => {
  const raw = await AsyncStorage.getItem(KEYS.ACTIVE_TIMER);
  return raw ? JSON.parse(raw) : null;
};

export const saveActiveTimer = async (timer: ActiveTimer): Promise<void> => {
  await AsyncStorage.setItem(KEYS.ACTIVE_TIMER, JSON.stringify(timer));
};

export const clearActiveTimer = async (): Promise<void> => {
  await AsyncStorage.removeItem(KEYS.ACTIVE_TIMER);
};
