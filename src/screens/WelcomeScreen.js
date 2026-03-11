import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { translations } from '../i18n/translations';
import { THEME } from '../theme';

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

function calcTDEE({ weight, height, age, sex, activity }) {
  const w = Number(weight);
  const h = Number(height);
  const a = Number(age);
  if (!w || !h || !a || !sex || !activity) return null;
  const bmr = sex === 'male'
    ? 10 * w + 6.25 * h - 5 * a + 5
    : 10 * w + 6.25 * h - 5 * a - 161;
  const multiplier = ACTIVITY_MULTIPLIERS[activity];
  return multiplier ? Math.round(bmr * multiplier) : null;
}


export default function WelcomeScreen({ onComplete }) {
  const [lang, setLang]         = useState('it');
  const [name, setName]         = useState('');
  const [height, setHeight]     = useState('');
  const [weight, setWeight]     = useState('');
  const [age, setAge]           = useState('');
  const [sex, setSex]           = useState(null);
  const [activity, setActivity] = useState(null);
  const [calories, setCalories] = useState('');
  const [errors, setErrors]     = useState({});

  const t = translations[lang];

  const tdee = useMemo(
    () => calcTDEE({ weight, height, age, sex, activity }),
    [weight, height, age, sex, activity]
  );

  function validate() {
    const next = {};
    if (!name.trim()) next.name = t.nameError;
    if (!height || isNaN(height) || Number(height) < 50 || Number(height) > 250)
      next.height = t.heightError;
    if (!weight || isNaN(weight) || Number(weight) < 20 || Number(weight) > 300)
      next.weight = t.weightError;
    if (!age || isNaN(age) || Number(age) < 10 || Number(age) > 120)
      next.age = t.ageError;
    if (!sex) next.sex = t.sexError;
    if (!activity) next.activity = t.activityError;
    if (!calories || isNaN(calories) || Number(calories) < 500 || Number(calories) > 10000)
      next.calories = t.caloriesError;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    onComplete({ name: name.trim(), height: Number(height), weight: Number(weight), age: Number(age), sex, activity, calories: Number(calories), tdee, lang });
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* Hero header */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.logo}>Diet<Text style={styles.logoAccent}>Planner</Text></Text>
              <Text style={styles.subtitle}>{t.appSubtitle}</Text>
            </View>
            <View style={styles.langToggle}>
              {['it', 'en'].map((l) => (
                <TouchableOpacity
                  key={l}
                  style={[styles.langBtn, lang === l && styles.langBtnActive]}
                  onPress={() => { setLang(l); setErrors({}); }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.langBtnText, lang === l && styles.langBtnTextActive]}>
                    {l.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Card: dati personali */}
        <View style={styles.card}>
          <SectionTitle number="1" title={t.name} />

          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            placeholder={t.namePlaceholder}
            placeholderTextColor={THEME.textSecondary}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            returnKeyType="next"
          />
          {errors.name && <ErrorMsg text={errors.name} />}

          <View style={[styles.row, { marginTop: 16 }]}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Label text={t.sex} />
              <View style={styles.row}>
                {[{ key: 'male', label: t.sexMale }, { key: 'female', label: t.sexFemale }].map((s, i) => (
                  <TouchableOpacity
                    key={s.key}
                    style={[styles.sexCard, sex === s.key && styles.sexCardSelected, i === 0 && { marginRight: 6 }]}
                    onPress={() => setSex(s.key)}
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
              <Label text={t.age} />
              <TextInput style={[styles.input, errors.age && styles.inputError]} placeholder="30" placeholderTextColor={THEME.textSecondary} value={age} onChangeText={setAge} keyboardType="numeric" returnKeyType="next" />
              {errors.age && <ErrorMsg text={errors.age} />}
            </View>
            <View style={{ flex: 1 }}>
              <Label text={t.height} />
              <TextInput style={[styles.input, errors.height && styles.inputError]} placeholder="175" placeholderTextColor={THEME.textSecondary} value={height} onChangeText={setHeight} keyboardType="numeric" returnKeyType="next" />
              {errors.height && <ErrorMsg text={errors.height} />}
            </View>
            <View style={{ flex: 1 }}>
              <Label text={t.weight} />
              <TextInput style={[styles.input, errors.weight && styles.inputError]} placeholder="70" placeholderTextColor={THEME.textSecondary} value={weight} onChangeText={setWeight} keyboardType="numeric" returnKeyType="next" />
              {errors.weight && <ErrorMsg text={errors.weight} />}
            </View>
          </View>
        </View>

        {/* Card: attivita' */}
        <View style={styles.card}>
          <SectionTitle number="2" title={t.activity} />
          <View style={styles.activityGrid}>
            {t.activityLevels.map((level) => {
              const selected = activity === level.key;
              return (
                <TouchableOpacity
                  key={level.key}
                  style={[styles.activityCard, selected && styles.activityCardSelected]}
                  onPress={() => setActivity(level.key)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.activityDot, selected && styles.activityDotSelected]} />
                  <Text style={[styles.activityLabel, selected && styles.activityLabelSelected]}>
                    {level.label}
                  </Text>
                  <Text style={[styles.activityDesc, selected && styles.activityDescSelected]}>
                    {level.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {errors.activity && <ErrorMsg text={errors.activity} />}
        </View>

        {/* Card: calorie */}
        <View style={styles.card}>
          <SectionTitle number="3" title={t.caloriesLabel} />

          {tdee && (
            <View style={styles.tdeeBox}>
              <View style={styles.tdeeBadge}>
                <Text style={styles.tdeeBadgeText}>{t.tdeeLabel}</Text>
              </View>
              <Text style={styles.tdeeValue}>{tdee}</Text>
              <Text style={styles.tdeeUnit}>{t.tdeeUnit}</Text>
              <Text style={styles.tdeeHint}>{t.tdeeHint}</Text>
              <TouchableOpacity style={styles.tdeeUseButton} onPress={() => setCalories(String(tdee))} activeOpacity={0.8}>
                <Text style={styles.tdeeUseButtonText}>{t.tdeeUse} →</Text>
              </TouchableOpacity>
            </View>
          )}

          <TextInput
            style={[styles.input, errors.calories && styles.inputError, { marginTop: tdee ? 12 : 0 }]}
            placeholder={tdee ? String(tdee) : '2000'}
            placeholderTextColor={THEME.textSecondary}
            value={calories}
            onChangeText={setCalories}
            keyboardType="numeric"
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />
          {errors.calories && <ErrorMsg text={errors.calories} />}
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} activeOpacity={0.85}>
          <Text style={styles.submitButtonText}>{t.submit}</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SectionTitle({ number, title }) {
  return (
    <View style={styles.sectionTitle}>
      <View style={styles.sectionNumber}>
        <Text style={styles.sectionNumberText}>{number}</Text>
      </View>
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
  scroll: {
    flexGrow: 1,
    backgroundColor: THEME.bg,
    paddingBottom: 48,
  },

  /* Hero */
  hero: {
    backgroundColor: THEME.primary,
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 32,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 20,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logo: {
    fontSize: 34,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
  },
  logoAccent: {
    color: THEME.accent,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 4,
  },

  /* Language toggle */
  langToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 3,
  },
  langBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  langBtnActive: {
    backgroundColor: THEME.accent,
  },
  langBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
  },
  langBtnTextActive: {
    color: '#fff',
  },

  /* Cards */
  card: {
    backgroundColor: THEME.card,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },

  /* Section title */
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionNumber: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: THEME.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sectionNumberText: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.accent,
  },
  sectionTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.text,
    flexShrink: 1,
  },

  /* Labels & errors */
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  error: {
    color: THEME.error,
    fontSize: 11,
    marginTop: 4,
  },

  /* Input */
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
  inputError: {
    borderColor: THEME.error,
    backgroundColor: '#fff5f5',
  },
  row: {
    flexDirection: 'row',
  },

  /* Sex cards */
  sexCard: {
    flex: 1,
    backgroundColor: THEME.inputBg,
    borderWidth: 1.5,
    borderColor: THEME.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  sexCardSelected: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
  },
  sexLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.textSecondary,
  },
  sexLabelSelected: {
    color: '#fff',
  },

  /* Activity grid */
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
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
  activityCardSelected: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.border,
    marginBottom: 6,
  },
  activityDotSelected: {
    backgroundColor: THEME.accent,
  },
  activityLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.text,
  },
  activityLabelSelected: {
    color: '#fff',
  },
  activityDesc: {
    fontSize: 10,
    color: THEME.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  activityDescSelected: {
    color: THEME.accentMid,
  },

  /* TDEE box */
  tdeeBox: {
    backgroundColor: THEME.primary,
    borderRadius: 16,
    padding: 18,
  },
  tdeeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 10,
  },
  tdeeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  tdeeValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 52,
    letterSpacing: -1,
  },
  tdeeUnit: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
    marginBottom: 8,
  },
  tdeeHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    lineHeight: 17,
  },
  tdeeUseButton: {
    marginTop: 14,
    backgroundColor: THEME.accent,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tdeeUseButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  /* Submit */
  submitButton: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: THEME.accent,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: THEME.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});
