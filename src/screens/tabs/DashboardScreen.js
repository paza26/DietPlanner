import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '../../theme';
import { useLang } from '../../i18n/LangContext';

export default function DashboardScreen({ user }) {
  const insets = useSafeAreaInsets();
  const t = useLang();

  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Greeting */}
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>{t.greeting(user.name)}</Text>
        <Text style={styles.greetingSubtitle}>{t.greetingSubtitle}</Text>
      </View>

      {/* Calorie card */}
      <View style={styles.calorieCard}>
        <View>
          <Text style={styles.calorieLabel}>{t.dailyTarget}</Text>
          <Text style={styles.calorieValue}>{user.calories}</Text>
          <Text style={styles.calorieUnit}>kcal</Text>
        </View>
        <View style={styles.calorieDivider} />
        <View style={styles.calorieStats}>
          <StatItem label="TDEE" value={user.tdee ?? '—'} unit="kcal" />
          <StatItem label={t.statWeight} value={user.weight} unit="kg" />
          <StatItem label={t.statAge} value={user.age} unit={t.statUnitYears} />
        </View>
      </View>

      {/* Week strip */}
      <Text style={styles.sectionTitle}>{t.thisWeek}</Text>
      <View style={styles.weekStrip}>
        {t.daysShort.map((d, i) => (
          <View key={d} style={[styles.dayChip, i === todayIndex && styles.dayChipToday]}>
            <Text style={[styles.dayLabel, i === todayIndex && styles.dayLabelToday]}>{d}</Text>
            <View style={[styles.dayDot, i === todayIndex && styles.dayDotToday]} />
          </View>
        ))}
      </View>

      {/* Empty state */}
      <View style={styles.emptyCard}>
        <Text style={styles.emptyIcon}>🥗</Text>
        <Text style={styles.emptyTitle}>{t.noMealsTitle}</Text>
        <Text style={styles.emptyDesc}>{t.noMealsDesc}</Text>
      </View>
    </ScrollView>
  );
}

function StatItem({ label, value, unit }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statUnit}>{unit}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  content: { padding: 20, paddingBottom: 32 },
  greeting: { marginBottom: 20 },
  greetingText: { fontSize: 26, fontWeight: '800', color: THEME.text, letterSpacing: -0.5 },
  greetingSubtitle: { fontSize: 14, color: THEME.textSecondary, marginTop: 2 },

  calorieCard: { backgroundColor: THEME.primary, borderRadius: 20, padding: 20, marginBottom: 24, flexDirection: 'row', alignItems: 'center' },
  calorieLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.45)', letterSpacing: 0.8 },
  calorieValue: { fontSize: 52, fontWeight: '800', color: '#fff', letterSpacing: -2, lineHeight: 56 },
  calorieUnit: { fontSize: 14, color: THEME.accent, fontWeight: '600' },
  calorieDivider: { width: 1, height: 60, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 20 },
  calorieStats: { flex: 1, gap: 10 },
  statItem: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  statLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: 0.5, width: 52 },
  statValue: { fontSize: 15, fontWeight: '700', color: '#fff' },
  statUnit: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },

  sectionTitle: { fontSize: 13, fontWeight: '700', color: THEME.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 },

  weekStrip: { flexDirection: 'row', gap: 6, marginBottom: 24 },
  dayChip: { flex: 1, alignItems: 'center', backgroundColor: THEME.card, borderRadius: 12, paddingVertical: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  dayChipToday: { backgroundColor: THEME.primary },
  dayLabel: { fontSize: 11, fontWeight: '700', color: THEME.textSecondary },
  dayLabelToday: { color: '#fff' },
  dayDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: THEME.border, marginTop: 5 },
  dayDotToday: { backgroundColor: THEME.accent },

  emptyCard: { backgroundColor: THEME.card, borderRadius: 20, padding: 28, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: THEME.text, marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: THEME.textSecondary, textAlign: 'center', lineHeight: 18 },
});
