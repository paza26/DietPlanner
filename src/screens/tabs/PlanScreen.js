import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../../theme';
import { useLang } from '../../i18n/LangContext';

const todayIndex = (() => {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
})();

const MEAL_META = [
  { bg: '#fff7ed', accent: '#f97316', icon: '🌅' },
  { bg: '#f0fdf4', accent: '#22c55e', icon: '☀️' },
  { bg: '#eff6ff', accent: '#3b82f6', icon: '🌙' },
  { bg: '#fdf4ff', accent: '#a855f7', icon: '⚡' },
];

export default function PlanScreen() {
  const insets = useSafeAreaInsets();
  const t = useLang();

  const [selectedDay, setSelectedDay] = useState(todayIndex);
  const [plan, setPlan] = useState(
    Array.from({ length: 7 }, () =>
      Object.fromEntries(t.meals.map((m) => [m, []]))
    )
  );

  function removeMealItem(day, meal, index) {
    setPlan((prev) =>
      prev.map((d, i) =>
        i === day ? { ...d, [meal]: d[meal].filter((_, j) => j !== index) } : d
      )
    );
  }

  const dayPlan = plan[selectedDay];
  const daysShort = t.daysShort;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.planTitle}</Text>
        <Text style={styles.headerSub}>{t.days[selectedDay]}</Text>
      </View>

      {/* Day selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll} contentContainerStyle={styles.dayContent}>
        {daysShort.map((d, i) => (
          <TouchableOpacity
            key={d}
            style={[styles.dayBtn, selectedDay === i && styles.dayBtnActive, i === todayIndex && selectedDay !== i && styles.dayBtnToday]}
            onPress={() => setSelectedDay(i)}
            activeOpacity={0.75}
          >
            <Text style={[styles.dayBtnText, selectedDay === i && styles.dayBtnTextActive]}>{d}</Text>
            {i === todayIndex && <View style={[styles.todayDot, selectedDay === i && styles.todayDotActive]} />}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Meals */}
      <ScrollView contentContainerStyle={styles.mealsContent} showsVerticalScrollIndicator={false}>
        {t.meals.map((meal, idx) => (
          <MealSection
            key={meal}
            meal={meal}
            meta={MEAL_META[idx]}
            items={dayPlan[meal] ?? []}
            mealEmpty={t.mealEmpty}
            onRemove={(i) => removeMealItem(selectedDay, meal, i)}
          />
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

function MealSection({ meal, meta, items, mealEmpty, onRemove }) {
  return (
    <View style={styles.mealCard}>
      <View style={styles.mealHeader}>
        <View style={[styles.mealIconBadge, { backgroundColor: meta.bg }]}>
          <Text style={styles.mealIcon}>{meta.icon}</Text>
        </View>
        <Text style={styles.mealTitle}>{meal}</Text>
        <TouchableOpacity style={[styles.mealAddBtn, { backgroundColor: meta.accent }]} activeOpacity={0.8}>
          <Ionicons name="add" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <Text style={styles.mealEmpty}>{mealEmpty}</Text>
      ) : (
        items.map((item, i) => (
          <View key={i} style={styles.mealItem}>
            <Text style={styles.mealItemName}>{item}</Text>
            <TouchableOpacity onPress={() => onRemove(i)} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={THEME.textSecondary} />
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: THEME.text, letterSpacing: -0.5 },
  headerSub: { fontSize: 14, color: THEME.textSecondary, marginTop: 1, marginBottom: 12 },

  dayScroll: { flexGrow: 0 },
  dayContent: { paddingHorizontal: 20, gap: 8, paddingBottom: 16 },
  dayBtn: { width: 48, height: 56, borderRadius: 14, backgroundColor: THEME.card, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  dayBtnActive: { backgroundColor: THEME.primary },
  dayBtnToday: { borderWidth: 1.5, borderColor: THEME.accent },
  dayBtnText: { fontSize: 12, fontWeight: '700', color: THEME.textSecondary },
  dayBtnTextActive: { color: '#fff' },
  todayDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: THEME.accent, marginTop: 3 },
  todayDotActive: { backgroundColor: THEME.accentMid },

  mealsContent: { paddingHorizontal: 20, gap: 10 },
  mealCard: { backgroundColor: THEME.card, borderRadius: 18, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  mealHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  mealIconBadge: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  mealIcon: { fontSize: 16 },
  mealTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: THEME.text },
  mealAddBtn: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  mealEmpty: { fontSize: 13, color: THEME.textSecondary, fontStyle: 'italic', paddingBottom: 2 },
  mealItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: THEME.border },
  mealItemName: { flex: 1, fontSize: 14, color: THEME.text, fontWeight: '500' },
});
