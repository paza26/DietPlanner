import { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { saveUserProfile } from '../../services/firestore';
import { THEME } from '../../theme';

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const ACTIVITY_LEVELS = [
  { key: 'sedentary',   label: 'Sedentario', description: '< 1 volta/sett.' },
  { key: 'light',       label: 'Leggero',    description: '1-2 volte/sett.' },
  { key: 'moderate',    label: 'Moderato',   description: '3-4 volte/sett.' },
  { key: 'active',      label: 'Attivo',     description: '5-6 volte/sett.' },
  { key: 'very_active', label: 'Intenso',    description: 'Ogni giorno' },
];

function calcTDEE({ weight, height, age, sex, activity }) {
  const w = Number(weight), h = Number(height), a = Number(age);
  if (!w || !h || !a || !sex || !activity) return null;
  const bmr = sex === 'male'
    ? 10 * w + 6.25 * h - 5 * a + 5
    : 10 * w + 6.25 * h - 5 * a - 161;
  const m = ACTIVITY_MULTIPLIERS[activity];
  return m ? Math.round(bmr * m) : null;
}

export default function ProfileScreen({ user, uid, onUpdate }) {
  const insets = useSafeAreaInsets();

  const [name, setName]         = useState(String(user.name ?? ''));
  const [height, setHeight]     = useState(String(user.height ?? ''));
  const [weight, setWeight]     = useState(String(user.weight ?? ''));
  const [age, setAge]           = useState(String(user.age ?? ''));
  const [sex, setSex]           = useState(user.sex ?? null);
  const [activity, setActivity] = useState(user.activity ?? null);
  const [calories, setCalories] = useState(String(user.calories ?? ''));
  const [errors, setErrors]     = useState({});
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  const tdee = useMemo(
    () => calcTDEE({ weight, height, age, sex, activity }),
    [weight, height, age, sex, activity]
  );

  function validate() {
    const e = {};
    if (!name.trim()) e.name = 'Inserisci il tuo nome';
    if (!height || isNaN(height) || Number(height) < 50 || Number(height) > 250)
      e.height = 'Altezza non valida (50-250 cm)';
    if (!weight || isNaN(weight) || Number(weight) < 20 || Number(weight) > 300)
      e.weight = 'Peso non valido (20-300 kg)';
    if (!age || isNaN(age) || Number(age) < 10 || Number(age) > 120)
      e.age = "Età non valida";
    if (!sex) e.sex = 'Seleziona il sesso biologico';
    if (!activity) e.activity = "Seleziona il livello d'attività";
    if (!calories || isNaN(calories) || Number(calories) < 500 || Number(calories) > 10000)
      e.calories = 'Target calorico non valido (500-10000 kcal)';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    const updated = {
      ...user,
      name: name.trim(),
      height: Number(height),
      weight: Number(weight),
      age: Number(age),
      sex,
      activity,
      calories: Number(calories),
      tdee,
    };
    await saveUserProfile(uid, updated);
    onUpdate(updated);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleLogout() {
    Alert.alert(
      'Logout',
      'Vuoi davvero uscire dal tuo account?',
      [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Esci', style: 'destructive', onPress: () => signOut(auth) },
      ]
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Profilo</Text>
            <Text style={styles.headerSub}>{user.name}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={18} color={THEME.error} />
            <Text style={styles.logoutText}>Esci</Text>
          </TouchableOpacity>
        </View>

        {/* Card: dati personali */}
        <View style={styles.card}>
          <SectionTitle icon="person-outline" title="Dati personali" />

          <Label text="NOME" />
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            placeholder="Come ti chiami?"
            placeholderTextColor={THEME.textSecondary}
            value={name}
            onChangeText={(v) => { setName(v); setErrors((e) => ({ ...e, name: undefined })); }}
            autoCapitalize="words"
          />
          {errors.name && <ErrorMsg text={errors.name} />}

          <View style={[styles.row, { marginTop: 16 }]}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Label text="SESSO BIOLOGICO" />
              <View style={styles.row}>
                {[{ key: 'male', label: 'Uomo' }, { key: 'female', label: 'Donna' }].map((s, i) => (
                  <TouchableOpacity
                    key={s.key}
                    style={[styles.sexCard, sex === s.key && styles.sexCardSelected, i === 0 && { marginRight: 6 }]}
                    onPress={() => { setSex(s.key); setErrors((e) => ({ ...e, sex: undefined })); }}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.sexLabel, sex === s.key && styles.sexLabelSelected]}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.sex && <ErrorMsg text={errors.sex} />}
            </View>
          </View>

          <View style={[styles.row, { marginTop: 16, gap: 8 }]}>
            <View style={{ flex: 1 }}>
              <Label text="ETÀ" />
              <TextInput style={[styles.input, errors.age && styles.inputError]} placeholder="30" placeholderTextColor={THEME.textSecondary} value={age} onChangeText={(v) => { setAge(v); setErrors((e) => ({ ...e, age: undefined })); }} keyboardType="numeric" />
              {errors.age && <ErrorMsg text={errors.age} />}
            </View>
            <View style={{ flex: 1 }}>
              <Label text="ALTEZZA (CM)" />
              <TextInput style={[styles.input, errors.height && styles.inputError]} placeholder="175" placeholderTextColor={THEME.textSecondary} value={height} onChangeText={(v) => { setHeight(v); setErrors((e) => ({ ...e, height: undefined })); }} keyboardType="numeric" />
              {errors.height && <ErrorMsg text={errors.height} />}
            </View>
            <View style={{ flex: 1 }}>
              <Label text="PESO (KG)" />
              <TextInput style={[styles.input, errors.weight && styles.inputError]} placeholder="70" placeholderTextColor={THEME.textSecondary} value={weight} onChangeText={(v) => { setWeight(v); setErrors((e) => ({ ...e, weight: undefined })); }} keyboardType="numeric" />
              {errors.weight && <ErrorMsg text={errors.weight} />}
            </View>
          </View>
        </View>

        {/* Card: attività */}
        <View style={styles.card}>
          <SectionTitle icon="barbell-outline" title="Attività fisica settimanale" />
          <View style={styles.activityGrid}>
            {ACTIVITY_LEVELS.map((level) => {
              const selected = activity === level.key;
              return (
                <TouchableOpacity
                  key={level.key}
                  style={[styles.activityCard, selected && styles.activityCardSelected]}
                  onPress={() => { setActivity(level.key); setErrors((e) => ({ ...e, activity: undefined })); }}
                  activeOpacity={0.75}
                >
                  <View style={[styles.activityDot, selected && styles.activityDotSelected]} />
                  <Text style={[styles.activityLabel, selected && styles.activityLabelSelected]}>{level.label}</Text>
                  <Text style={[styles.activityDesc, selected && styles.activityDescSelected]}>{level.description}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {errors.activity && <ErrorMsg text={errors.activity} />}
        </View>

        {/* Card: calorie */}
        <View style={styles.card}>
          <SectionTitle icon="flame-outline" title="Target calorico giornaliero" />

          {tdee && (
            <View style={styles.tdeeBox}>
              <Text style={styles.tdeeBadgeText}>TDEE STIMATO</Text>
              <Text style={styles.tdeeValue}>{tdee} <Text style={styles.tdeeUnit}>kcal/giorno</Text></Text>
              <TouchableOpacity style={styles.tdeeUseButton} onPress={() => setCalories(String(tdee))} activeOpacity={0.8}>
                <Text style={styles.tdeeUseButtonText}>Usa questo valore →</Text>
              </TouchableOpacity>
            </View>
          )}

          <Label text="TARGET (KCAL)" />
          <TextInput
            style={[styles.input, errors.calories && styles.inputError, { marginTop: 4 }]}
            placeholder={tdee ? String(tdee) : '2000'}
            placeholderTextColor={THEME.textSecondary}
            value={calories}
            onChangeText={(v) => { setCalories(v); setErrors((e) => ({ ...e, calories: undefined })); }}
            keyboardType="numeric"
            returnKeyType="done"
          />
          {errors.calories && <ErrorMsg text={errors.calories} />}
        </View>

        {/* Feedback salvato */}
        {saved && (
          <View style={styles.savedBanner}>
            <Ionicons name="checkmark-circle" size={18} color={THEME.accent} />
            <Text style={styles.savedText}>Profilo aggiornato con successo!</Text>
          </View>
        )}

        {/* Salva */}
        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveButtonText}>Salva modifiche</Text>}
        </TouchableOpacity>

        {/* Logout (anche in fondo per comodità) */}
        <TouchableOpacity style={styles.logoutBottom} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={16} color={THEME.error} />
          <Text style={styles.logoutBottomText}>Esci dall'account</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SectionTitle({ icon, title }) {
  return (
    <View style={styles.sectionTitle}>
      <Ionicons name={icon} size={16} color={THEME.accent} style={{ marginRight: 8 }} />
      <Text style={styles.sectionTitleText}>{title}</Text>
    </View>
  );
}

function Label({ text }) {
  return <Text style={styles.label}>{text}</Text>;
}

function ErrorMsg({ text }) {
  return <Text style={styles.error}>{text}</Text>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  content: { padding: 20, paddingBottom: 48 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: THEME.text, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: THEME.textSecondary, marginTop: 2 },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff5f5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutText: { fontSize: 13, fontWeight: '700', color: THEME.error },

  card: {
    backgroundColor: THEME.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },

  sectionTitle: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionTitleText: { fontSize: 15, fontWeight: '700', color: THEME.text },

  label: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  error: { color: THEME.error, fontSize: 11, marginTop: 4 },

  input: {
    backgroundColor: THEME.inputBg,
    borderWidth: 1.5,
    borderColor: THEME.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: THEME.text,
  },
  inputError: { borderColor: THEME.error, backgroundColor: '#fff5f5' },
  row: { flexDirection: 'row' },

  sexCard: {
    flex: 1,
    backgroundColor: THEME.inputBg,
    borderWidth: 1.5,
    borderColor: THEME.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  sexCardSelected: { backgroundColor: THEME.primary, borderColor: THEME.primary },
  sexLabel: { fontSize: 14, fontWeight: '700', color: THEME.textSecondary },
  sexLabelSelected: { color: '#fff' },

  activityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  activityCard: {
    backgroundColor: THEME.inputBg,
    borderWidth: 1.5,
    borderColor: THEME.border,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    flex: 1,
    minWidth: '28%',
  },
  activityCardSelected: { backgroundColor: THEME.primary, borderColor: THEME.primary },
  activityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: THEME.border, marginBottom: 6 },
  activityDotSelected: { backgroundColor: THEME.accent },
  activityLabel: { fontSize: 12, fontWeight: '700', color: THEME.text },
  activityLabelSelected: { color: '#fff' },
  activityDesc: { fontSize: 10, color: THEME.textSecondary, marginTop: 2, textAlign: 'center' },
  activityDescSelected: { color: THEME.accentMid },

  tdeeBox: {
    backgroundColor: THEME.primary,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  tdeeBadgeText: { fontSize: 10, fontWeight: '700', color: THEME.accent, letterSpacing: 0.6, marginBottom: 6 },
  tdeeValue: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  tdeeUnit: { fontSize: 14, fontWeight: '400', color: 'rgba(255,255,255,0.5)' },
  tdeeUseButton: {
    marginTop: 12,
    backgroundColor: THEME.accent,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
  },
  tdeeUseButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: THEME.accentLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  savedText: { fontSize: 14, fontWeight: '600', color: THEME.accent },

  saveButton: {
    backgroundColor: THEME.accent,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: THEME.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 16,
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.4 },

  logoutBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  logoutBottomText: { fontSize: 14, fontWeight: '600', color: THEME.error },
});
