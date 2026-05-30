import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Dimensions, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { COLORS } from '../theme';
import { useApp } from '../context/AppContext';
import { getLevel, getNextLevel, getLevelProgress, getHoursToNextLevel, LEVELS } from '../levels';
import { toDateKey, addDays } from '../utils';

function formatExact(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts = [];
  if (h > 0) parts.push(`${h} saat`);
  if (m > 0) parts.push(`${m} dk`);
  parts.push(`${s} sn`);
  return parts.join(' ');
}
import { Session, Category } from '../models';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - 48;

const CELL = 10;
const CELL_GAP = 3;
const WEEKS = 52;

function buildHeatmapData(sessions: Session[]): Record<string, number> {
  const map: Record<string, number> = {};
  sessions.forEach(s => {
    const key = toDateKey(s.startTime);
    map[key] = (map[key] ?? 0) + s.durationSeconds / 60;
  });
  return map;
}

function heatColor(minutes: number): string {
  if (minutes <= 0)   return '#EBEBEB';
  if (minutes < 30)   return '#E9D5FF';
  if (minutes < 60)   return '#C084FC';
  if (minutes < 120)  return '#A855F7';
  return '#7C3AED';
}

function Heatmap({ sessions }: { sessions: Session[] }) {
  const data = useMemo(() => buildHeatmapData(sessions), [sessions]);

  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const startDate = addDays(today, -(WEEKS * 7 - 1));

  const dayOfWeek = startDate.getDay();
  const gridStart = addDays(startDate, -dayOfWeek);

  const cells: { date: string; minutes: number }[][] = [];
  for (let w = 0; w < WEEKS + 1; w++) {
    const col: { date: string; minutes: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(gridStart, w * 7 + d);
      const key = toDateKey(date.getTime());
      col.push({ date: key, minutes: data[key] ?? 0 });
    }
    cells.push(col);
  }

  const months = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={{ flexDirection: 'row', marginBottom: 3 }}>
            {cells.map((col, wi) => {
              const firstDay = addDays(gridStart, wi * 7);
              const show = firstDay.getDate() <= 7 && wi > 0;
              return (
                <View key={wi} style={{ width: CELL + CELL_GAP }}>
                  {show && (
                    <Text style={{ fontSize: 8, color: COLORS.textSecondary }}>
                      {months[firstDay.getMonth()]}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
          <View style={{ flexDirection: 'row' }}>
            {cells.map((col, wi) => (
              <View key={wi} style={{ width: CELL + CELL_GAP }}>
                {col.map((cell, di) => (
                  <View
                    key={di}
                    style={{
                      width: CELL, height: CELL, borderRadius: CELL / 2,
                      backgroundColor: heatColor(cell.minutes),
                      marginBottom: CELL_GAP,
                    }}
                  />
                ))}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 }}>
        <Text style={{ fontSize: 9, color: COLORS.textSecondary }}>Az</Text>
        {[0, 1, 30, 60, 120].map(m => (
          <View key={m} style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: heatColor(m) }} />
        ))}
        <Text style={{ fontSize: 9, color: COLORS.textSecondary }}>Çok</Text>
      </View>
    </View>
  );
}

function LevelBadge({ totalSeconds, color }: { totalSeconds: number; color: string }) {
  const level = getLevel(totalSeconds);
  const next = getNextLevel(totalSeconds);
  const progress = getLevelProgress(totalSeconds);
  const hoursToNext = getHoursToNextLevel(totalSeconds);

  return (
    <View style={lb.container}>
      <View style={lb.header}>
        <Text style={[lb.levelName, { color: level.color }]}>{level.name}</Text>
        <Text style={lb.totalHours}>{formatExact(totalSeconds)}</Text>
      </View>
      <View style={lb.barBg}>
        <View style={[lb.barFill, { width: `${Math.round(progress * 100)}%` as any, backgroundColor: color }]} />
      </View>
      {next && (
        <Text style={lb.nextText}>
          {next.name} seviyesine {hoursToNext.toFixed(1)} saat kaldı
        </Text>
      )}
    </View>
  );
}

const lb = StyleSheet.create({
  container: { marginTop: 4 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  levelName: { fontSize: 13, fontWeight: '700' },
  totalHours: { marginLeft: 'auto' as any, fontSize: 12, color: COLORS.textSecondary },
  barBg: { height: 3, backgroundColor: COLORS.bg, borderRadius: 2, overflow: 'hidden', marginBottom: 5 },
  barFill: { height: 3, borderRadius: 2 },
  nextText: { fontSize: 11, color: COLORS.textSecondary },
});

function LevelDetailModal({
  cat, totalSeconds, onClose,
}: { cat: Category; totalSeconds: number; onClose: () => void }) {
  const hours = totalSeconds / 3600;
  const currentLevel = getLevel(totalSeconds);
  const progress = getLevelProgress(totalSeconds);
  const hoursToNext = getHoursToNextLevel(totalSeconds);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={md.overlay}>
        <View style={md.sheet}>
          {/* Header */}
          <View style={md.header}>
            <View style={[md.catDot, { backgroundColor: cat.color }]} />
            <Text style={md.catName}>{cat.name}</Text>
            <TouchableOpacity onPress={onClose} style={md.closeBtn}>
              <Text style={md.closeLabel}>Kapat</Text>
            </TouchableOpacity>
          </View>

          <Text style={md.totalTime}>{formatExact(totalSeconds)}</Text>
          <Text style={[md.currentLevelLabel, { color: currentLevel.color }]}>
            {currentLevel.name}
          </Text>

          {/* Current level progress bar */}
          <View style={md.progressRow}>
            <View style={md.progressBg}>
              <View style={[md.progressFill, {
                width: `${Math.round(progress * 100)}%` as any,
                backgroundColor: cat.color,
              }]} />
            </View>
            <Text style={md.progressPct}>{Math.round(progress * 100)}%</Text>
          </View>
          {getNextLevel(totalSeconds) && (
            <Text style={md.nextHint}>
              Sonraki seviyeye {hoursToNext.toFixed(1)} saat kaldı
            </Text>
          )}

          <View style={md.divider} />

          {/* All levels */}
          {LEVELS.map((level, i) => {
            const isDone = hours >= level.maxHours;
            const isCurrent = level.name === currentLevel.name;
            const isLocked = hours < level.minHours;
            return (
              <View key={level.name} style={[md.levelRow, isCurrent && md.levelRowActive]}>
                <View style={[md.levelDot, {
                  backgroundColor: isDone || isCurrent ? level.color : COLORS.cardBorder,
                }]} />
                <View style={md.levelInfo}>
                  <Text style={[md.levelName, {
                    color: isLocked ? COLORS.textSecondary : COLORS.text,
                    fontWeight: isCurrent ? '700' : '500',
                  }]}>
                    {level.name}
                  </Text>
                  <Text style={md.levelRange}>
                    {level.minHours.toLocaleString('tr-TR')} – {
                      level.maxHours === Infinity ? '∞' : level.maxHours.toLocaleString('tr-TR')
                    } saat
                  </Text>
                </View>
                {isDone && <Text style={[md.levelCheck, { color: level.color }]}>✓</Text>}
                {isCurrent && !isDone && (
                  <Text style={[md.levelCurrent, { color: level.color }]}>şu an</Text>
                )}
              </View>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

const md = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#00000044', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: 20,
    borderTopRightRadius: 20, padding: 24, paddingBottom: 48,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  catName: { flex: 1, fontSize: 16, fontWeight: '700', color: COLORS.text },
  closeBtn: { padding: 4 },
  closeLabel: { fontSize: 13, color: COLORS.textSecondary },

  totalTime: { fontSize: 28, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5, marginBottom: 4 },
  currentLevelLabel: { fontSize: 13, fontWeight: '600', marginBottom: 14 },

  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  progressBg: { flex: 1, height: 4, backgroundColor: COLORS.bg, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2 },
  progressPct: { fontSize: 12, color: COLORS.textSecondary, width: 36, textAlign: 'right' },
  nextHint: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 20 },

  divider: { height: 1, backgroundColor: COLORS.cardBorder, marginBottom: 16 },

  levelRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, marginBottom: 4,
  },
  levelRowActive: { backgroundColor: COLORS.bg },
  levelDot: { width: 8, height: 8, borderRadius: 4 },
  levelInfo: { flex: 1 },
  levelName: { fontSize: 14 },
  levelRange: { fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },
  levelCheck: { fontSize: 14, fontWeight: '700' },
  levelCurrent: { fontSize: 11, fontWeight: '600' },
});

function CategoryStatsCard({
  cat, totalSeconds, onPress,
}: { cat: Category; totalSeconds: number; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[cs.card, { borderLeftColor: cat.color }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={cs.top}>
        <View style={[cs.dot, { backgroundColor: cat.color }]} />
        <Text style={cs.name}>{cat.name}</Text>
        <Text style={cs.arrow}>›</Text>
      </View>
      <LevelBadge totalSeconds={totalSeconds} color={cat.color} />
    </TouchableOpacity>
  );
}

const cs = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card, borderRadius: 12,
    padding: 16, marginBottom: 8,
    borderLeftWidth: 3,
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  name: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.text },
  arrow: { fontSize: 18, color: COLORS.textSecondary },
});

export default function StatsScreen() {
  const { sessions, categories } = useApp();
  const [chartCatId, setChartCatId] = useState<string | null>(null);
  const [detailCat, setDetailCat] = useState<{ cat: Category; totalSeconds: number } | null>(null);

  const totalSecondsAll = useMemo(
    () => sessions.reduce((a, s) => a + s.durationSeconds, 0),
    [sessions]
  );

  const secondsPerCat = useMemo(() => {
    const map: Record<string, number> = {};
    sessions.forEach(s => {
      map[s.categoryId] = (map[s.categoryId] ?? 0) + s.durationSeconds;
    });
    return map;
  }, [sessions]);

  const thisWeekSeconds = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
    return sessions
      .filter(s => s.startTime >= weekAgo)
      .reduce((a, s) => a + s.durationSeconds, 0);
  }, [sessions]);

  const thisMonthSeconds = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return sessions
      .filter(s => s.startTime >= monthStart)
      .reduce((a, s) => a + s.durationSeconds, 0);
  }, [sessions]);

  const chartData = useMemo(() => {
    const catSessions = sessions
      .filter(s => chartCatId ? s.categoryId === chartCatId : true)
      .sort((a, b) => a.startTime - b.startTime);

    if (catSessions.length < 2) return null;

    let total = 0;
    const points: number[] = [];
    const labels: string[] = [];

    const step = Math.max(1, Math.ceil(catSessions.length / 20));
    catSessions.forEach((s, i) => {
      total += s.durationSeconds / 3600;
      if (i % step === 0 || i === catSessions.length - 1) {
        points.push(parseFloat(total.toFixed(2)));
        const d = new Date(s.startTime);
        labels.push(`${d.getDate()}/${d.getMonth() + 1}`);
      }
    });

    return { labels, datasets: [{ data: points }] };
  }, [sessions, chartCatId]);

  const activeChart = chartCatId
    ? categories.find(c => c.id === chartCatId) ?? null
    : null;

  const chartColor = activeChart ? activeChart.color : COLORS.text;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>İstatistik</Text>

        <View style={s.summaryRow}>
          <View style={s.summaryCard}>
            <Text style={s.summaryLabel}>Toplam</Text>
            <Text style={s.summaryValue}>{formatExact(totalSecondsAll)}</Text>
          </View>
          <View style={s.summaryCard}>
            <Text style={s.summaryLabel}>Bu Hafta</Text>
            <Text style={s.summaryValue}>{formatExact(thisWeekSeconds)}</Text>
          </View>
          <View style={s.summaryCard}>
            <Text style={s.summaryLabel}>Bu Ay</Text>
            <Text style={s.summaryValue}>{formatExact(thisMonthSeconds)}</Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Son 1 Yıl</Text>
          {sessions.length === 0 ? (
            <Text style={s.empty}>Henüz oturum yok</Text>
          ) : (
            <Heatmap sessions={sessions} />
          )}
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Birikim (saat)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            <TouchableOpacity
              style={[s.catChip, !chartCatId && s.catChipActive]}
              onPress={() => setChartCatId(null)}
            >
              <Text style={[s.catChipLabel, !chartCatId && s.catChipLabelActive]}>Tümü</Text>
            </TouchableOpacity>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[s.catChip, chartCatId === cat.id && { borderColor: cat.color, backgroundColor: cat.color + '15' }]}
                onPress={() => setChartCatId(cat.id)}
              >
                <Text style={{ color: chartCatId === cat.id ? cat.color : COLORS.textSecondary, fontWeight: '600', fontSize: 12 }}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {chartData ? (
            <LineChart
              data={chartData}
              width={CHART_W}
              height={160}
              withDots={false}
              withInnerLines={false}
              withOuterLines={false}
              bezier
              chartConfig={{
                backgroundGradientFrom: COLORS.card,
                backgroundGradientTo: COLORS.card,
                color: () => chartColor,
                strokeWidth: 2,
                labelColor: () => COLORS.textSecondary,
                fillShadowGradientFrom: chartColor,
                fillShadowGradientTo: COLORS.card,
                fillShadowGradientFromOpacity: 0.15,
                fillShadowGradientToOpacity: 0,
                propsForLabels: { fontSize: 9 },
              }}
              style={{ borderRadius: 12 }}
              fromZero
            />
          ) : (
            <View style={s.emptyChart}>
              <Text style={s.empty}>
                {sessions.length < 2 ? 'En az 2 oturum gerekli' : 'Bu kategori için veri yok'}
              </Text>
            </View>
          )}
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Kategoriler</Text>
          {categories
            .filter(cat => (secondsPerCat[cat.id] ?? 0) > 0)
            .sort((a, b) => (secondsPerCat[b.id] ?? 0) - (secondsPerCat[a.id] ?? 0))
            .map(cat => (
              <CategoryStatsCard
                key={cat.id}
                cat={cat}
                totalSeconds={secondsPerCat[cat.id] ?? 0}
                onPress={() => setDetailCat({ cat, totalSeconds: secondsPerCat[cat.id] ?? 0 })}
              />
            ))
          }
          {Object.keys(secondsPerCat).length === 0 && (
            <Text style={s.empty}>Oturum tamamlandıktan sonra detaylar görünecek</Text>
          )}
        </View>
      </ScrollView>
      {detailCat && (
        <LevelDetailModal
          cat={detailCat.cat}
          totalSeconds={detailCat.totalSeconds}
          onClose={() => setDetailCat(null)}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 30, fontWeight: '800', color: COLORS.text, marginBottom: 24, letterSpacing: -0.5 },

  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 32 },
  summaryCard: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: 12,
    padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  summaryLabel: { fontSize: 10, color: COLORS.textSecondary, marginBottom: 6, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryValue: { fontSize: 14, color: COLORS.text, fontWeight: '700' },

  section: { marginBottom: 32 },
  sectionTitle: {
    fontSize: 11, fontWeight: '600', color: COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 14,
  },

  catChip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.card, marginRight: 6,
  },
  catChipActive: { borderColor: COLORS.text, backgroundColor: COLORS.text },
  catChipLabel: { color: COLORS.textSecondary, fontWeight: '500', fontSize: 12 },
  catChipLabelActive: { color: '#FFFFFF', fontWeight: '600' },

  emptyChart: {
    backgroundColor: COLORS.card, borderRadius: 12,
    height: 100, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  empty: { color: COLORS.textSecondary, fontSize: 13, textAlign: 'center' },
});
