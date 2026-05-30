import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS } from '../theme';
import { useApp } from '../context/AppContext';
import { Category } from '../models';
import { RootStackParamList } from '../navigation/AppNavigator';
import { formatDurationShort } from '../utils';

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

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

const DURATION_PRESETS = [
  { label: '30dk', seconds: 30 * 60 },
  { label: '45dk', seconds: 45 * 60 },
  { label: '1s',   seconds: 60 * 60 },
  { label: '1.5s', seconds: 90 * 60 },
  { label: '2s',   seconds: 120 * 60 },
  { label: '3s',   seconds: 180 * 60 },
];

export default function HomeScreen() {
  const navigation = useNavigation<NavProp>();
  const { categories, sessions, isLoading, activeTimer } = useApp();
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customMinutes, setCustomMinutes] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const todaySeconds = sessions
    .filter(s => new Date(s.startTime).toDateString() === new Date().toDateString())
    .reduce((acc, s) => acc + s.durationSeconds, 0);

  const getDurationSeconds = (): number | null => {
    if (showCustom) {
      const mins = parseInt(customMinutes, 10);
      if (!mins || mins < 1 || mins > 480) return null;
      return mins * 60;
    }
    return selectedPreset;
  };

  const handleStart = () => {
    if (!selectedCat) {
      Alert.alert('Kategori Seç', 'Lütfen bir çalışma kategorisi seçin.');
      return;
    }
    const dur = getDurationSeconds();
    if (!dur) {
      Alert.alert('Süre Girin', 'Geçerli bir süre seçin (1 - 480 dakika).');
      return;
    }
    navigation.navigate('Timer', {
      categoryId: selectedCat.id,
      categoryName: selectedCat.name,
      categoryColor: selectedCat.color,
      categoryIcon: selectedCat.icon,
      durationSeconds: dur,
    });
  };

  const canStart = selectedCat !== null && (selectedPreset !== null || (showCustom && parseInt(customMinutes) > 0));

  if (isLoading) {
    return (
      <SafeAreaView style={[s.safe, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.text} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <View style={s.appNameRow}>
            <View style={s.appNameDot} />
            <Text style={s.appName}>birikim</Text>
          </View>
          {todaySeconds > 0 && (
            <Text style={s.todayText}>Bugün {formatExact(todaySeconds)}</Text>
          )}
        </View>

        {activeTimer && (
          <TouchableOpacity
            style={[s.activeTimerBanner, { borderLeftColor: activeTimer.categoryColor }]}
            onPress={() => navigation.navigate('Timer', {
              categoryId: activeTimer.categoryId,
              categoryName: activeTimer.categoryName,
              categoryColor: activeTimer.categoryColor,
              categoryIcon: activeTimer.categoryIcon,
              durationSeconds: activeTimer.targetSeconds,
              startTime: activeTimer.startTime,
              totalPausedMs: activeTimer.pausedSeconds,
            })}
            activeOpacity={0.7}
          >
            <View style={[s.activeDot, { backgroundColor: activeTimer.categoryColor }]} />
            <Text style={s.activeTimerText}>{activeTimer.categoryName} — devam ediyor</Text>
            <Text style={[s.activeTimerCta, { color: activeTimer.categoryColor }]}>Dön</Text>
          </TouchableOpacity>
        )}

        <Text style={s.sectionLabel}>Kategori</Text>
        <View style={s.categoryGrid}>
          {categories.map(cat => {
            const isSelected = selectedCat?.id === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  s.categoryCard,
                  { borderColor: isSelected ? cat.color : COLORS.cardBorder },
                  isSelected && { backgroundColor: cat.color + '12' },
                ]}
                onPress={() => setSelectedCat(isSelected ? null : cat)}
                activeOpacity={0.7}
              >
                <View style={[s.catDot, { backgroundColor: cat.color }]} />
                <Text
                  style={[s.categoryName, isSelected && { color: cat.color, fontWeight: '700' }]}
                  numberOfLines={1}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={s.sectionLabel}>Süre</Text>
        <View style={s.presetRow}>
          {DURATION_PRESETS.map(p => {
            const isActive = !showCustom && selectedPreset === p.seconds;
            return (
              <TouchableOpacity
                key={p.seconds}
                style={[s.presetBtn, isActive && s.presetBtnActive]}
                onPress={() => {
                  setSelectedPreset(p.seconds);
                  setShowCustom(false);
                  setCustomMinutes('');
                }}
                activeOpacity={0.7}
              >
                <Text style={[s.presetLabel, isActive && s.presetLabelActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={[s.presetBtn, showCustom && s.presetBtnActive]}
            onPress={() => { setShowCustom(true); setSelectedPreset(null); }}
            activeOpacity={0.7}
          >
            <Text style={[s.presetLabel, showCustom && s.presetLabelActive]}>Özel</Text>
          </TouchableOpacity>
        </View>

        {showCustom && (
          <View style={s.customRow}>
            <TextInput
              style={s.customInput}
              value={customMinutes}
              onChangeText={setCustomMinutes}
              keyboardType="number-pad"
              placeholder="1 – 480"
              placeholderTextColor={COLORS.textSecondary}
              maxLength={3}
            />
            <Text style={s.customUnit}>dakika</Text>
          </View>
        )}

        {selectedCat && getDurationSeconds() && (
          <View style={[s.summaryBox, { borderLeftColor: selectedCat.color }]}>
            <Text style={s.summaryText}>
              {selectedCat.name} · {formatDurationShort(getDurationSeconds()!)}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[s.startBtn, canStart && s.startBtnActive]}
          onPress={handleStart}
          activeOpacity={0.85}
          disabled={!canStart}
        >
          <Text style={[s.startLabel, canStart && s.startLabelActive]}>
            Başlat
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 24, paddingBottom: 48 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'baseline', marginBottom: 36,
  },
  appNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  appNameDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2563EB' },
  appName: { fontSize: 26, fontWeight: '800', color: COLORS.text, letterSpacing: -1 },
  todayText: { fontSize: 13, color: COLORS.textSecondary },

  sectionLabel: {
    fontSize: 11, fontWeight: '600', color: COLORS.textSecondary,
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14,
  },

  categoryGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 32,
  },
  categoryCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 10, borderWidth: 1,
    backgroundColor: COLORS.card,
  },
  catDot: { width: 7, height: 7, borderRadius: 3.5 },
  categoryName: { fontSize: 13, color: COLORS.text, fontWeight: '500' },

  presetRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16,
  },
  presetBtn: {
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: 8, borderWidth: 1,
    borderColor: COLORS.cardBorder, backgroundColor: COLORS.card,
  },
  presetBtnActive: {
    borderColor: COLORS.text, backgroundColor: COLORS.text,
  },
  presetLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  presetLabelActive: { color: '#FFFFFF', fontWeight: '600' },

  customRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16,
  },
  customInput: {
    flex: 1, backgroundColor: COLORS.card, borderWidth: 1,
    borderColor: COLORS.cardBorder, borderRadius: 8,
    padding: 12, fontSize: 15, color: COLORS.text,
  },
  customUnit: { fontSize: 13, color: COLORS.textSecondary },

  summaryBox: {
    borderLeftWidth: 3, paddingLeft: 14, paddingVertical: 4,
    marginBottom: 24,
  },
  summaryText: { fontSize: 14, color: COLORS.text, fontWeight: '500' },

  activeTimerBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.card, borderRadius: 10,
    padding: 14, marginBottom: 28,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    borderLeftWidth: 3,
  },
  activeDot: { width: 7, height: 7, borderRadius: 3.5 },
  activeTimerText: { flex: 1, fontSize: 13, color: COLORS.text, fontWeight: '500' },
  activeTimerCta: { fontSize: 13, fontWeight: '700' },

  startBtn: {
    backgroundColor: COLORS.cardBorder, borderRadius: 12,
    paddingVertical: 18, alignItems: 'center',
    marginTop: 8,
  },
  startBtnActive: {
    backgroundColor: COLORS.text,
  },
  startLabel: { fontSize: 15, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 1 },
  startLabelActive: { color: '#FFFFFF' },
});
