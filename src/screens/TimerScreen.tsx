import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  AppState, AppStateStatus,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { COLORS } from '../theme';
import { useApp } from '../context/AppContext';
import { Session } from '../models';
import { RootStackParamList } from '../navigation/AppNavigator';
import { formatCountdown, formatDurationShort, generateId } from '../utils';

type RouteT = RouteProp<RootStackParamList, 'Timer'>;

export default function TimerScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteT>();
  const {
    categoryId, categoryName, categoryColor, categoryIcon,
    durationSeconds,
    startTime: paramStartTime,
    totalPausedMs: paramTotalPausedMs,
  } = route.params;

  const { addSession, setActiveTimer } = useApp();

  const startTimeRef = useRef(paramStartTime ?? Date.now());
  const totalPausedMsRef = useRef(paramTotalPausedMs ?? 0);
  const pausedAtRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const savedRef = useRef(false);

  const targetMs = durationSeconds * 1000;

  const [remainingMs, setRemainingMs] = useState(() => {
    const elapsed = (Date.now() - startTimeRef.current) - totalPausedMsRef.current;
    return Math.max(0, targetMs - elapsed);
  });
  const [isPaused, setIsPaused] = useState(false);
  const [isFinished, setIsFinished] = useState(remainingMs <= 0);

  const getRemaining = useCallback((): number => {
    if (pausedAtRef.current !== null) {
      const elapsed = (pausedAtRef.current - startTimeRef.current) - totalPausedMsRef.current;
      return Math.max(0, targetMs - elapsed);
    }
    const elapsed = (Date.now() - startTimeRef.current) - totalPausedMsRef.current;
    return Math.max(0, targetMs - elapsed);
  }, [targetMs]);

  const saveAndExit = useCallback(async (forceFullDuration = false) => {
    if (savedRef.current) return;
    savedRef.current = true;
    if (intervalRef.current) clearInterval(intervalRef.current);

    const elapsed = targetMs - getRemaining();
    const elapsedSec = forceFullDuration ? durationSeconds : Math.floor(elapsed / 1000);

    if (elapsedSec > 0) {
      const session: Session = {
        id: generateId(),
        categoryId, categoryName, categoryColor, categoryIcon,
        startTime: startTimeRef.current,
        endTime: Date.now(),
        durationSeconds: elapsedSec,
      };
      await addSession(session);
    }
    setActiveTimer(null);
    navigation.navigate('Main');
  }, [targetMs, getRemaining, durationSeconds, categoryId, categoryName, categoryColor, categoryIcon, addSession, setActiveTimer, navigation]);

  const handleComplete = useCallback(async () => {
    if (isFinished) return;
    setIsFinished(true);
    setRemainingMs(0);
    await saveAndExit(true);
  }, [isFinished, saveAndExit]);

  const startTick = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const rem = getRemaining();
      setRemainingMs(rem);
      if (rem <= 0) handleComplete();
    }, 500);
  }, [getRemaining, handleComplete]);

  useEffect(() => {
    if (isFinished) return;
    setActiveTimer({
      categoryId, categoryName, categoryColor, categoryIcon,
      startTime: startTimeRef.current,
      targetSeconds: durationSeconds,
      pausedAt: null,
      pausedSeconds: totalPausedMsRef.current,
    });
    startTick();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && state === 'active') {
        const rem = getRemaining();
        setRemainingMs(rem);
        if (rem <= 0) handleComplete();
        else if (!isPaused) startTick();
      }
      appStateRef.current = state;
    });
    return () => sub.remove();
  }, [isPaused, getRemaining, handleComplete, startTick]);

  const handleBack = () => {
    // Save state to context, timer keeps running — recalculated on return
    setActiveTimer({
      categoryId, categoryName, categoryColor, categoryIcon,
      startTime: startTimeRef.current,
      targetSeconds: durationSeconds,
      pausedAt: isPaused ? pausedAtRef.current : null,
      pausedSeconds: totalPausedMsRef.current,
    });
    navigation.navigate('Main');
  };

  const handlePause = () => {
    if (isPaused) {
      const now = Date.now();
      totalPausedMsRef.current += now - (pausedAtRef.current ?? now);
      pausedAtRef.current = null;
      setIsPaused(false);
      startTick();
    } else {
      pausedAtRef.current = Date.now();
      setIsPaused(true);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  };

  const progress = 1 - remainingMs / targetMs;
  const totalSeconds = Math.ceil(remainingMs / 1000);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: COLORS.bg }]}>
      <View style={s.container}>
        <View style={s.topBar}>
          <TouchableOpacity onPress={handleBack} style={s.backBtn}>
            <Text style={s.backLabel}>Geri</Text>
          </TouchableOpacity>
          <View style={[s.catBadge, { backgroundColor: categoryColor + '15' }]}>
            <View style={[s.catDot, { backgroundColor: categoryColor }]} />
            <Text style={[s.catName, { color: categoryColor }]}>{categoryName}</Text>
          </View>
          <View style={{ width: 52 }} />
        </View>

        <View style={s.circleContainer}>
          <View style={[s.circleOuter, { borderColor: COLORS.cardBorder }]}>
            <View
              style={[
                s.circleProgress,
                {
                  borderColor: isFinished ? COLORS.success : categoryColor,
                  opacity: 0.12 + progress * 0.88,
                },
              ]}
            />
            <View style={s.circleBg}>
              {isFinished ? (
                <View style={s.finishedContent}>
                  <Text style={s.finishedText}>Tamamlandı</Text>
                  <Text style={[s.finishedSub, { color: categoryColor }]}>
                    {formatDurationShort(durationSeconds)}
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={s.countdown}>{formatCountdown(totalSeconds)}</Text>
                  <Text style={s.countdownSub}>
                    {isPaused ? 'duraklatıldı' : 'kalan'}
                  </Text>
                  <Text style={[s.progressPct, { color: categoryColor }]}>
                    {Math.round(progress * 100)}%
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        <View style={s.progressBarContainer}>
          <View style={s.progressBarBg}>
            <View
              style={[
                s.progressBarFill,
                { width: `${Math.round(progress * 100)}%` as any, backgroundColor: categoryColor },
              ]}
            />
          </View>
        </View>

        <View style={s.infoRow}>
          <View style={s.infoItem}>
            <Text style={s.infoLabel}>Hedef</Text>
            <Text style={s.infoValue}>{formatDurationShort(durationSeconds)}</Text>
          </View>
          <View style={s.infoItem}>
            <Text style={s.infoLabel}>Geçen</Text>
            <Text style={s.infoValue}>
              {formatDurationShort(Math.floor((targetMs - remainingMs) / 1000))}
            </Text>
          </View>
        </View>

        {!isFinished && (
          <View style={s.controls}>
            <TouchableOpacity style={s.stopBtn} onPress={() => saveAndExit()} activeOpacity={0.7}>
              <Text style={s.stopLabel}>Bitir</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.pauseBtn, { borderColor: categoryColor }]}
              onPress={handlePause}
              activeOpacity={0.7}
            >
              <Text style={[s.pauseLabel, { color: categoryColor }]}>
                {isPaused ? 'Devam' : 'Duraklat'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1, paddingHorizontal: 24, paddingTop: 8,
    alignItems: 'center',
  },

  topBar: {
    width: '100%', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 32,
  },
  backBtn: { padding: 8 },
  backLabel: { fontSize: 14, color: COLORS.textSecondary },
  catBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
  },
  catDot: { width: 7, height: 7, borderRadius: 3.5 },
  catName: { fontSize: 14, fontWeight: '600' },

  circleContainer: { marginBottom: 24 },
  circleOuter: {
    width: 260, height: 260, borderRadius: 130,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  circleProgress: {
    position: 'absolute', width: 260, height: 260,
    borderRadius: 130, borderWidth: 5,
  },
  circleBg: {
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: COLORS.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  countdown: { fontSize: 54, fontWeight: '300', color: COLORS.text, letterSpacing: -2 },
  countdownSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4, letterSpacing: 0.5 },
  progressPct: { fontSize: 16, fontWeight: '600', marginTop: 8 },

  finishedContent: { alignItems: 'center' },
  finishedText: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  finishedSub: { fontSize: 16, fontWeight: '500', marginTop: 6 },

  progressBarContainer: { width: '100%', marginBottom: 24 },
  progressBarBg: {
    width: '100%', height: 2, backgroundColor: COLORS.cardBorder,
    borderRadius: 1, overflow: 'hidden',
  },
  progressBarFill: { height: 2, borderRadius: 1 },

  infoRow: { flexDirection: 'row', width: '100%', marginBottom: 36 },
  infoItem: { flex: 1, alignItems: 'center' },
  infoLabel: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 16, fontWeight: '600', color: COLORS.text },

  controls: { flexDirection: 'row', gap: 10, width: '100%' },
  stopBtn: {
    flex: 1, paddingVertical: 17, borderRadius: 12,
    backgroundColor: COLORS.card, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  stopLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  pauseBtn: {
    flex: 2, paddingVertical: 17, borderRadius: 12,
    backgroundColor: 'transparent', alignItems: 'center',
    borderWidth: 1.5,
  },
  pauseLabel: { fontSize: 15, fontWeight: '700' },
});
