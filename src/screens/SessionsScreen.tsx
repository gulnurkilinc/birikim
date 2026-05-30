import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../theme';
import { useApp } from '../context/AppContext';

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

export default function SessionsScreen() {
  const { sessions, categories } = useApp();

  const catTotals = useMemo(() => {
    const map: Record<string, number> = {};
    sessions.forEach(s => {
      map[s.categoryId] = (map[s.categoryId] ?? 0) + s.durationSeconds;
    });
    return map;
  }, [sessions]);

  const totalSeconds = useMemo(
    () => sessions.reduce((a, s) => a + s.durationSeconds, 0),
    [sessions]
  );

  const sorted = useMemo(() =>
    categories
      .filter(c => (catTotals[c.id] ?? 0) > 0)
      .sort((a, b) => (catTotals[b.id] ?? 0) - (catTotals[a.id] ?? 0)),
    [categories, catTotals]
  );

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>Toplam</Text>
        {totalSeconds > 0 && (
          <Text style={s.total}>Toplam {formatExact(totalSeconds)}</Text>
        )}
      </View>

      <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
        {sorted.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyTitle}>Henüz Oturum Yok</Text>
            <Text style={s.emptySub}>İlk oturumunu başlatmak için Çalış sekmesine git</Text>
          </View>
        ) : (
          sorted.map(cat => (
            <View key={cat.id} style={[s.row, { borderLeftColor: cat.color }]}>
              <View style={[s.dot, { backgroundColor: cat.color }]} />
              <Text style={s.name}>{cat.name}</Text>
              <Text style={[s.time, { color: cat.color }]}>
                {formatExact(catTotals[cat.id] ?? 0)}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 },
  title: { fontSize: 30, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5, marginBottom: 4 },
  total: { fontSize: 13, color: COLORS.textSecondary },
  list: { paddingHorizontal: 24, paddingBottom: 48 },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.card, borderRadius: 10,
    paddingVertical: 16, paddingHorizontal: 16,
    marginBottom: 8, borderWidth: 1, borderColor: COLORS.cardBorder,
    borderLeftWidth: 3,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  name: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.text },
  time: { fontSize: 14, fontWeight: '700' },

  empty: { paddingTop: 60, alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  emptySub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
});
