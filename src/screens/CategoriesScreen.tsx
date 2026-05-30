import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, Modal, TextInput, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, CATEGORY_COLORS } from '../theme';
import { useApp } from '../context/AppContext';
import { Category } from '../models';
import { generateId, formatTotalHours } from '../utils';

interface CategoryFormProps {
  initial?: Category;
  onSave: (cat: Category) => void;
  onClose: () => void;
  existingCount: number;
}

function CategoryForm({ initial, onSave, onClose, existingCount }: CategoryFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [color, setColor] = useState(initial?.color ?? CATEGORY_COLORS[1]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Kategori adı gerekli');
      return;
    }
    const cat: Category = {
      id: initial?.id ?? generateId(),
      name: name.trim(),
      color,
      icon: '',
      createdAt: initial?.createdAt ?? Date.now(),
      order: initial?.order ?? existingCount,
    };
    onSave(cat);
  };

  return (
    <View style={f.overlay}>
      <View style={f.modal}>
        <Text style={f.title}>{initial ? 'Kategoriyi Düzenle' : 'Yeni Kategori'}</Text>

        <Text style={f.label}>Ad</Text>
        <TextInput
          style={f.input}
          value={name}
          onChangeText={setName}
          placeholder="örn. Fizik, Piyano, Yoga"
          placeholderTextColor={COLORS.textSecondary}
          maxLength={30}
          autoFocus
        />

        <Text style={f.label}>Renk</Text>
        <View style={f.colorGrid}>
          {CATEGORY_COLORS.map(c => (
            <TouchableOpacity
              key={c}
              style={[f.colorBtn, { backgroundColor: c }, color === c && f.colorBtnActive]}
              onPress={() => setColor(c)}
            />
          ))}
        </View>

        <View style={[f.preview, { borderLeftColor: color }]}>
          <View style={[f.previewDot, { backgroundColor: color }]} />
          <Text style={f.previewName}>{name || 'Kategori Adı'}</Text>
        </View>

        <View style={f.btnRow}>
          <TouchableOpacity style={f.cancelBtn} onPress={onClose}>
            <Text style={f.cancelLabel}>İptal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[f.saveBtn, { backgroundColor: color }]} onPress={handleSave}>
            <Text style={f.saveLabel}>Kaydet</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const f = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: '#00000055',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: 20,
    borderTopRightRadius: 20, padding: 24, paddingBottom: 40,
  },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 24 },
  label: { fontSize: 10, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    backgroundColor: COLORS.bg, borderWidth: 1,
    borderColor: COLORS.cardBorder, borderRadius: 10,
    padding: 14, fontSize: 15, color: COLORS.text, marginBottom: 20,
  },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  colorBtn: { width: 34, height: 34, borderRadius: 17 },
  colorBtnActive: { borderWidth: 3, borderColor: COLORS.text },
  preview: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, paddingLeft: 16,
    borderLeftWidth: 3, marginBottom: 24,
  },
  previewDot: { width: 8, height: 8, borderRadius: 4 },
  previewName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  btnRow: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1, padding: 15, borderRadius: 10,
    backgroundColor: COLORS.bg, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  cancelLabel: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 14 },
  saveBtn: {
    flex: 2, padding: 15, borderRadius: 10, alignItems: 'center',
  },
  saveLabel: { color: '#FFF', fontWeight: '700', fontSize: 14 },
});

function CategoryRow({
  cat, totalSeconds, onEdit, onDelete,
}: {
  cat: Category; totalSeconds: number;
  onEdit: () => void; onDelete: () => void;
}) {
  return (
    <View style={cr.row}>
      <View style={[cr.colorBar, { backgroundColor: cat.color }]} />
      <View style={cr.info}>
        <Text style={cr.name}>{cat.name}</Text>
        <Text style={cr.hours}>{formatTotalHours(totalSeconds)}</Text>
      </View>
      <TouchableOpacity onPress={onEdit} style={cr.actionBtn}>
        <Text style={cr.actionLabel}>Düzenle</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} style={cr.deleteBtn}>
        <Text style={cr.deleteLabel}>Sil</Text>
      </TouchableOpacity>
    </View>
  );
}

const cr = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.card, borderRadius: 10,
    overflow: 'hidden', marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  colorBar: { width: 3, alignSelf: 'stretch' },
  info: { flex: 1, paddingVertical: 14, paddingLeft: 14 },
  name: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  hours: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 14 },
  actionLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  deleteBtn: { paddingHorizontal: 14, paddingVertical: 14 },
  deleteLabel: { fontSize: 12, color: COLORS.error, fontWeight: '500' },
});

export default function CategoriesScreen() {
  const { categories, sessions, addCategory, updateCategory, deleteCategory } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const secondsPerCat: Record<string, number> = {};
  sessions.forEach(s => {
    secondsPerCat[s.categoryId] = (secondsPerCat[s.categoryId] ?? 0) + s.durationSeconds;
  });

  const handleSave = async (cat: Category) => {
    if (editing) await updateCategory(cat);
    else await addCategory(cat);
    setModalOpen(false);
    setEditing(null);
  };

  const handleDelete = (cat: Category) => {
    Alert.alert(
      'Kategoriyi Sil',
      `"${cat.name}" silinecek. Geçmiş oturumlar korunacak.`,
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Sil', style: 'destructive', onPress: () => deleteCategory(cat.id) },
      ]
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>Kategoriler</Text>
        <TouchableOpacity
          style={s.addBtn}
          onPress={() => { setEditing(null); setModalOpen(true); }}
          activeOpacity={0.7}
        >
          <Text style={s.addLabel}>+ Ekle</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={categories}
        keyExtractor={c => c.id}
        contentContainerStyle={s.list}
        renderItem={({ item: cat }) => (
          <CategoryRow
            cat={cat}
            totalSeconds={secondsPerCat[cat.id] ?? 0}
            onEdit={() => { setEditing(cat); setModalOpen(true); }}
            onDelete={() => handleDelete(cat)}
          />
        )}
      />

      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <CategoryForm
          initial={editing ?? undefined}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          existingCount={categories.length}
        />
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 24, paddingBottom: 12,
  },
  title: { fontSize: 30, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  addBtn: {
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: 8, borderWidth: 1,
    borderColor: COLORS.cardBorder, backgroundColor: COLORS.card,
  },
  addLabel: { color: COLORS.text, fontWeight: '600', fontSize: 13 },
  list: { paddingHorizontal: 24, paddingBottom: 48 },
});
