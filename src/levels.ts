export interface Level {
  name: string;
  minHours: number;
  maxHours: number;
  color: string;
}

export const LEVELS: Level[] = [
  { name: 'Acemi',     minHours: 0,     maxHours: 100,      color: '#9A9A9A' },
  { name: 'Gelişen',   minHours: 100,   maxHours: 500,      color: '#A0522D' },
  { name: 'Yetenekli', minHours: 500,   maxHours: 2000,     color: '#6B7280' },
  { name: 'Uzman',     minHours: 2000,  maxHours: 5000,     color: '#B45309' },
  { name: 'Üstat',     minHours: 5000,  maxHours: 10000,    color: '#6366F1' },
  { name: 'Profesyonel', minHours: 10000, maxHours: Infinity, color: '#7C3AED' },
];

export const getLevel = (totalSeconds: number): Level => {
  const hours = totalSeconds / 3600;
  return LEVELS.find(l => hours >= l.minHours && hours < l.maxHours) ?? LEVELS[0];
};

export const getNextLevel = (totalSeconds: number): Level | null => {
  const hours = totalSeconds / 3600;
  const idx = LEVELS.findIndex(l => hours >= l.minHours && hours < l.maxHours);
  if (idx === -1 || idx === LEVELS.length - 1) return null;
  return LEVELS[idx + 1];
};

export const getLevelProgress = (totalSeconds: number): number => {
  const hours = totalSeconds / 3600;
  const current = LEVELS.find(l => hours >= l.minHours && hours < l.maxHours) ?? LEVELS[0];
  const next = LEVELS[LEVELS.indexOf(current) + 1];
  if (!next) return 1;
  return (hours - current.minHours) / (next.minHours - current.minHours);
};

export const getHoursToNextLevel = (totalSeconds: number): number => {
  const hours = totalSeconds / 3600;
  const next = getNextLevel(totalSeconds);
  if (!next) return 0;
  return next.minHours - hours;
};
