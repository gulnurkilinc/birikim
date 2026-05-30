export const generateId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const formatCountdown = (totalSeconds: number): string => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const formatDurationShort = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}s ${m}dk`;
  if (h > 0) return `${h} saat`;
  if (m > 0) return `${m} dakika`;
  return `${seconds}sn`;
};

export const formatTotalHours = (seconds: number): string => {
  const hours = seconds / 3600;
  if (hours >= 1000) return `${Math.floor(hours).toLocaleString('tr-TR')} saat`;
  if (hours >= 10)   return `${hours.toFixed(1)} saat`;
  return `${hours.toFixed(2)} saat`;
};

export const formatDate = (timestamp: number): string => {
  const d = new Date(timestamp);
  return d.toLocaleDateString('tr-TR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

export const formatTime = (timestamp: number): string => {
  const d = new Date(timestamp);
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
};

export const toDateKey = (timestamp: number): string => {
  const d = new Date(timestamp);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const startOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const addDays = (date: Date, days: number): Date => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};
