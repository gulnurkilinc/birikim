export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: number;
  order: number;
}

export interface Session {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  startTime: number;
  endTime: number;
  durationSeconds: number;
}

export interface ActiveTimer {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  startTime: number;
  targetSeconds: number;
  pausedAt: number | null;
  pausedSeconds: number;
}

export type TimerScreenParams = {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  durationSeconds: number;
  startTime?: number;
  totalPausedMs?: number;
};
