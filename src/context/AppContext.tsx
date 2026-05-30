import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Category, Session, ActiveTimer } from '../models';
import * as storage from '../storage';

interface AppContextType {
  categories: Category[];
  sessions: Session[];
  activeTimer: ActiveTimer | null;
  isLoading: boolean;
  refreshCategories: () => Promise<void>;
  refreshSessions: () => Promise<void>;
  addSession: (session: Session) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  setActiveTimer: (timer: ActiveTimer | null) => void;
  addCategory: (category: Category) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeTimer, setActiveTimerState] = useState<ActiveTimer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await storage.initStorage();
      const [cats, sess, timer] = await Promise.all([
        storage.getCategories(),
        storage.getSessions(),
        storage.getActiveTimer(),
      ]);
      setCategories(cats.sort((a, b) => a.order - b.order));
      setSessions(sess);
      if (timer) setActiveTimerState(timer);
      setIsLoading(false);
    };
    init();
  }, []);

  const refreshCategories = useCallback(async () => {
    const cats = await storage.getCategories();
    setCategories(cats.sort((a, b) => a.order - b.order));
  }, []);

  const refreshSessions = useCallback(async () => {
    const sess = await storage.getSessions();
    setSessions(sess);
  }, []);

  const addSession = useCallback(async (session: Session) => {
    await storage.addSession(session);
    setSessions(prev => [session, ...prev]);
  }, []);

  const deleteSession = useCallback(async (id: string) => {
    await storage.deleteSession(id);
    setSessions(prev => prev.filter(s => s.id !== id));
  }, []);

  const setActiveTimer = useCallback((timer: ActiveTimer | null) => {
    setActiveTimerState(timer);
    if (timer) storage.saveActiveTimer(timer);
    else storage.clearActiveTimer();
  }, []);

  const addCategory = useCallback(async (category: Category) => {
    setCategories(prev => {
      const updated = [...prev, category].sort((a, b) => a.order - b.order);
      storage.saveCategories(updated);
      return updated;
    });
  }, []);

  const updateCategory = useCallback(async (category: Category) => {
    setCategories(prev => {
      const updated = prev.map(c => c.id === category.id ? category : c);
      storage.saveCategories(updated);
      return updated;
    });
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    setCategories(prev => {
      const updated = prev.filter(c => c.id !== id);
      storage.saveCategories(updated);
      return updated;
    });
  }, []);

  return (
    <AppContext.Provider value={{
      categories, sessions, activeTimer, isLoading,
      refreshCategories, refreshSessions,
      addSession, deleteSession, setActiveTimer,
      addCategory, updateCategory, deleteCategory,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
