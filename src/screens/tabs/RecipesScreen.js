import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal,
  KeyboardAvoidingView, Platform, ActivityIndicator, FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../../theme';
import { searchFood, scaleNutrition, sumNutrition } from '../../services/nutritionApi';
import { useLang } from '../../i18n/LangContext';
import { loadRecipes, saveRecipes } from '../../services/storage';

const DEFAULT_RECIPES = [
  {
    id: '1', name: 'Avena con frutta', categories: ['Colazione'],
    ingredients: [{ name: 'Fiocchi d\'avena', grams: 80, nutrition: { calories: 302, protein: 10.7, carbs: 52, fat: 5.5 } }],
    nutrition: { calories: 302, protein: 10.7, carbs: 52, fat: 5.5 },
  },
];

const EMPTY_FORM = { name: '', categories: [], ingredients: [] };

export default function RecipesScreen() {
  const insets = useSafeAreaInsets();
  const t = useLang();
  const [recipes, setRecipes]           = useState(DEFAULT_RECIPES);
  const [activeCategory, setActiveCategory] = useState(t.categories[0]);

  // Carica ricette salvate all'avvio
  useEffect(() => {
    loadRecipes().then((saved) => {
      if (saved && saved.length > 0) setRecipes(saved);
    });
  }, []);
  const [search, setSearch]             = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [formErrors, setFormErrors]     = useState({});

  // ingredient search state
  const [ingQuery, setIngQuery]         = useState('');
  const [ingResults, setIngResults]     = useState([]);
  const [ingLoading, setIngLoading]     = useState(false);
  const [ingError, setIngError]         = useState('');
  const [selectedFood, setSelectedFood] = useState(null); // food da Open Food Facts
  const [grams, setGrams]               = useState('100');

  const searchTimeout = useRef(null);

  const filtered = recipes.filter((r) => {
    const matchCat = activeCategory === t.categories[0] || (r.categories ?? []).includes(activeCategory);
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // --- Ingredient search ---
  function handleIngQueryChange(text) {
    setIngQuery(text);
    setSelectedFood(null);
    setIngResults([]);
    setIngError('');
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (text.trim().length < 2) return;
    searchTimeout.current = setTimeout(() => doSearch(text), 600);
  }

  async function doSearch(query) {
    setIngLoading(true);
    setIngError('');
    try {
      const results = await searchFood(query);
      setIngResults(results);
      if (results.length === 0) setIngError(t.noFoodFound);
    } catch {
      setIngError(t.networkError);
    } finally {
      setIngLoading(false);
    }
  }

  function handleSelectFood(food) {
    setSelectedFood(food);
    setIngQuery(food.name);
    setIngResults([]);
    setGrams('100');
  }

  function handleAddIngredient() {
    if (!selectedFood) return;
    const g = Number(grams);
    if (!g || g <= 0) return;
    const nutrition = scaleNutrition(selectedFood, g);
    const ingredient = { name: selectedFood.name, grams: g, nutrition };
    setForm((f) => ({ ...f, ingredients: [...f.ingredients, ingredient] }));
    setSelectedFood(null);
    setIngQuery('');
    setGrams('100');
    setIngResults([]);
  }

  function handleRemoveIngredient(index) {
    setForm((f) => ({ ...f, ingredients: f.ingredients.filter((_, i) => i !== index) }));
  }

  // --- Save recipe ---
  function toggleCategory(cat) {
    setForm((f) => {
      const has = f.categories.includes(cat);
      return { ...f, categories: has ? f.categories.filter((c) => c !== cat) : [...f.categories, cat] };
    });
  }

  function validateForm() {
    const e = {};
    if (!form.name.trim()) e.name = 'Inserisci il nome della ricetta';
    if (form.categories.length === 0) e.categories = 'Seleziona almeno una categoria';
    if (form.ingredients.length === 0) e.ingredients = 'Aggiungi almeno un ingrediente';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSaveRecipe() {
    if (!validateForm()) return;
    const nutrition = sumNutrition(form.ingredients);
    const newRecipe = { id: Date.now().toString(), name: form.name.trim(), categories: form.categories, ingredients: form.ingredients, nutrition };
    const updated = [newRecipe, ...recipes];
    setRecipes(updated);
    saveRecipes(updated);
    handleClose();
  }

  function handleClose() {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setIngQuery('');
    setIngResults([]);
    setIngError('');
    setSelectedFood(null);
    setGrams('100');
    setModalVisible(false);
  }

  const totalNutrition = form.ingredients.length > 0 ? sumNutrition(form.ingredients) : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t.recipesTitle}</Text>
          <Text style={styles.headerSub}>{t.recipesSaved(recipes.length)}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={16} color={THEME.textSecondary} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder={t.recipesSearchPlaceholder}
          placeholderTextColor={THEME.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginBottom: 12 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
        {t.categories.map((cat) => (
          <TouchableOpacity key={cat} style={[styles.catChip, activeCategory === cat && styles.catChipActive]} onPress={() => setActiveCategory(cat)} activeOpacity={0.75}>
            <Text style={[styles.catChipText, activeCategory === cat && styles.catChipTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Recipe list */}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 10 }} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>🍽️</Text>
            <Text style={styles.emptyText}>{t.noRecipesFound}</Text>
          </View>
        ) : (
          filtered.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)
        )}
      </ScrollView>

      {/* === ADD RECIPE MODAL === */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modal}>

            {/* Modal header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.newRecipe}</Text>
              <TouchableOpacity onPress={handleClose} hitSlop={12}>
                <Ionicons name="close" size={24} color={THEME.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              {/* Nome ricetta */}
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>{t.recipeNameLabel}</Text>
                <TextInput
                  style={[styles.modalInput, formErrors.name && styles.modalInputError]}
                  placeholder={t.recipeNamePlaceholder}
                  placeholderTextColor={THEME.textSecondary}
                  value={form.name}
                  onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                  autoCapitalize="sentences"
                />
                {formErrors.name && <Text style={styles.modalError}>{formErrors.name}</Text>}
              </View>

              {/* Categoria (multi-select) */}
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>{t.categoriesLabel}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {t.categories.slice(1).map((cat) => {
                    const selected = form.categories.includes(cat);
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.catPill, selected && styles.catPillActive]}
                        onPress={() => toggleCategory(cat)}
                        activeOpacity={0.75}
                      >
                        {selected && <Ionicons name="checkmark" size={13} color="#fff" style={{ marginRight: 4 }} />}
                        <Text style={[styles.catPillText, selected && styles.catPillTextActive]}>{cat}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {formErrors.categories && <Text style={styles.modalError}>{formErrors.categories}</Text>}
              </View>

              {/* Sezione ingredienti */}
              <View style={styles.sectionDivider}>
                <Text style={styles.sectionDividerText}>{t.ingredientsSection}</Text>
              </View>

              {/* Search ingrediente */}
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>{t.searchFoodLabel}</Text>
                <View style={styles.ingSearchRow}>
                  <Ionicons name="search-outline" size={16} color={THEME.textSecondary} style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.ingSearchInput}
                    placeholder={t.searchFoodPlaceholder}
                    placeholderTextColor={THEME.textSecondary}
                    value={ingQuery}
                    onChangeText={handleIngQueryChange}
                    returnKeyType="search"
                    onSubmitEditing={() => ingQuery.trim().length >= 2 && doSearch(ingQuery)}
                  />
                  {ingLoading && <ActivityIndicator size="small" color={THEME.accent} style={{ marginLeft: 8 }} />}
                  {ingQuery.length > 0 && !ingLoading && (
                    <TouchableOpacity onPress={() => { setIngQuery(''); setIngResults([]); setSelectedFood(null); }} hitSlop={8}>
                      <Ionicons name="close-circle" size={18} color={THEME.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Source badge */}
                <View style={styles.sourceBadge}>
                  <Ionicons name="globe-outline" size={11} color={THEME.accent} />
                  <Text style={styles.sourceBadgeText}>{t.sourceBadge}</Text>
                </View>

                {/* Risultati ricerca */}
                {ingError ? (
                  <Text style={styles.ingError}>{ingError}</Text>
                ) : ingResults.length > 0 ? (
                  <View style={styles.resultsBox}>
                    {ingResults.map((food) => (
                      <TouchableOpacity key={food.id} style={styles.resultItem} onPress={() => handleSelectFood(food)} activeOpacity={0.75}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.resultName} numberOfLines={1}>{food.name}</Text>
                          <Text style={styles.resultMacros}>
                            {food.calories} kcal · P {food.protein}g · C {food.carbs}g · G {food.fat}g
                          </Text>
                        </View>
                        <Text style={styles.resultPer}>/ 100g</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}
              </View>

              {/* Selezione grammi + aggiungi */}
              {selectedFood && (
                <View style={styles.addIngredientBox}>
                  <View style={styles.selectedFoodRow}>
                    <Ionicons name="checkmark-circle" size={18} color={THEME.accent} />
                    <Text style={styles.selectedFoodName} numberOfLines={1}>{selectedFood.name}</Text>
                  </View>
                  <View style={styles.gramsRow}>
                    <View style={styles.gramsInputWrap}>
                      <Text style={styles.modalLabel}>{t.quantityLabel}</Text>
                      <View style={styles.gramsField}>
                        <TextInput
                          style={styles.gramsInput}
                          value={grams}
                          onChangeText={setGrams}
                          keyboardType="numeric"
                          selectTextOnFocus
                        />
                        <Text style={styles.gramsUnit}>g</Text>
                      </View>
                    </View>
                    {grams && Number(grams) > 0 && (
                      <View style={styles.gramsMacros}>
                        {(() => {
                          const n = scaleNutrition(selectedFood, Number(grams));
                          return (
                            <>
                              <Text style={styles.gramsMacroVal}>{n.calories} kcal</Text>
                              <Text style={styles.gramsMacroSub}>P {n.protein}g · C {n.carbs}g · G {n.fat}g</Text>
                            </>
                          );
                        })()}
                      </View>
                    )}
                  </View>
                  <TouchableOpacity style={styles.addIngBtn} onPress={handleAddIngredient} activeOpacity={0.85}>
                    <Ionicons name="add" size={16} color="#fff" />
                    <Text style={styles.addIngBtnText}>{t.addIngredient}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Lista ingredienti aggiunti */}
              {form.ingredients.length > 0 && (
                <View style={styles.modalField}>
                  {formErrors.ingredients && <Text style={styles.modalError}>{formErrors.ingredients}</Text>}
                  <Text style={styles.modalLabel}>{t.ingredientsAdded(form.ingredients.length)}</Text>
                  {form.ingredients.map((ing, i) => (
                    <View key={i} style={styles.ingItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.ingItemName} numberOfLines={1}>{ing.name}</Text>
                        <Text style={styles.ingItemMacros}>
                          {ing.grams}g · {ing.nutrition.calories} kcal · P {ing.nutrition.protein}g · C {ing.nutrition.carbs}g · G {ing.nutrition.fat}g
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => handleRemoveIngredient(i)} hitSlop={8}>
                        <Ionicons name="trash-outline" size={18} color={THEME.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Totale nutrizionale */}
              {totalNutrition && (
                <View style={styles.totalBox}>
                  <Text style={styles.totalLabel}>{t.totalRecipe}</Text>
                  <View style={styles.totalRow}>
                    <TotalStat label={t.macroCalories} value={totalNutrition.calories} unit="kcal" highlight />
                    <TotalStat label={t.macroProtein}  value={totalNutrition.protein}  unit="g" />
                    <TotalStat label={t.macroCarbs}    value={totalNutrition.carbs}    unit="g" />
                    <TotalStat label={t.macroFat}      value={totalNutrition.fat}      unit="g" />
                  </View>
                </View>
              )}

              {formErrors.ingredients && !form.ingredients.length && (
                <Text style={[styles.modalError, { marginTop: 4 }]}>{formErrors.ingredients}</Text>
              )}

              <TouchableOpacity style={styles.modalSubmit} onPress={handleSaveRecipe} activeOpacity={0.85}>
                <Text style={styles.modalSubmitText}>{t.saveRecipe}</Text>
              </TouchableOpacity>

            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function RecipeCard({ recipe }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <TouchableOpacity style={styles.recipeCard} onPress={() => setExpanded((e) => !e)} activeOpacity={0.85}>
      <View style={styles.recipeTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.recipeName}>{recipe.name}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 4 }}>
            {(recipe.categories ?? []).map((cat) => (
              <View key={cat} style={styles.recipeCatBadge}>
                <Text style={styles.recipeCatText}>{cat}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.recipeCalBox}>
          <Text style={styles.recipeCalValue}>{recipe.nutrition.calories}</Text>
          <Text style={styles.recipeCalUnit}>kcal</Text>
        </View>
      </View>
      <View style={styles.macros}>
        <MacroBadge label="P" value={recipe.nutrition.protein} color="#3b82f6" />
        <MacroBadge label="C" value={recipe.nutrition.carbs}   color="#f59e0b" />
        <MacroBadge label="G" value={recipe.nutrition.fat}     color="#ef4444" />
      </View>
      {expanded && recipe.ingredients?.length > 0 && (
        <View style={styles.ingredientsList}>
          <Text style={styles.ingredientsTitle}>Ingredienti</Text>
          {recipe.ingredients.map((ing, i) => (
            <View key={i} style={styles.ingredientRow}>
              <Text style={styles.ingredientName}>{ing.name}</Text>
              <Text style={styles.ingredientGrams}>{ing.grams}g — {ing.nutrition.calories} kcal</Text>
            </View>
          ))}
        </View>
      )}
      <View style={styles.expandHint}>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={THEME.textSecondary} />
      </View>
    </TouchableOpacity>
  );
}

function MacroBadge({ label, value, color }) {
  return (
    <View style={[styles.macroBadge, { borderColor: color + '33', backgroundColor: color + '11' }]}>
      <Text style={[styles.macroBadgeLabel, { color }]}>{label}</Text>
      <Text style={[styles.macroBadgeValue, { color }]}>{value}g</Text>
    </View>
  );
}

function TotalStat({ label, value, unit, highlight }) {
  return (
    <View style={styles.totalStat}>
      <Text style={styles.totalStatLabel}>{label}</Text>
      <Text style={[styles.totalStatValue, highlight && { color: THEME.accent, fontSize: 20 }]}>{value}</Text>
      <Text style={styles.totalStatUnit}>{unit}</Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: THEME.text, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: THEME.textSecondary, marginTop: 1 },
  addBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: THEME.accent, alignItems: 'center', justifyContent: 'center', shadowColor: THEME.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 5 },

  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.card, marginHorizontal: 20, borderRadius: 12, paddingHorizontal: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: THEME.text },

  catChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: THEME.card, borderWidth: 1.5, borderColor: THEME.border },
  catChipActive: { backgroundColor: THEME.primary, borderColor: THEME.primary },
  catChipText: { fontSize: 13, fontWeight: '600', color: THEME.textSecondary },
  catChipTextActive: { color: '#fff' },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 15, color: THEME.textSecondary },

  recipeCard: { backgroundColor: THEME.card, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  recipeTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  recipeName: { fontSize: 16, fontWeight: '700', color: THEME.text, marginBottom: 4 },
  recipeCatBadge: { alignSelf: 'flex-start', backgroundColor: THEME.accentLight, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  recipeCatText: { fontSize: 11, fontWeight: '700', color: THEME.accent },
  recipeCalBox: { alignItems: 'flex-end' },
  recipeCalValue: { fontSize: 22, fontWeight: '800', color: THEME.text, letterSpacing: -0.5 },
  recipeCalUnit: { fontSize: 11, color: THEME.textSecondary },
  macros: { flexDirection: 'row', gap: 6 },
  macroBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  macroBadgeLabel: { fontSize: 11, fontWeight: '800' },
  macroBadgeValue: { fontSize: 12, fontWeight: '600' },
  ingredientsList: { marginTop: 14, borderTopWidth: 1, borderTopColor: THEME.border, paddingTop: 12 },
  ingredientsTitle: { fontSize: 11, fontWeight: '700', color: THEME.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  ingredientRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  ingredientName: { fontSize: 13, color: THEME.text, flex: 1 },
  ingredientGrams: { fontSize: 12, color: THEME.textSecondary },
  expandHint: { alignItems: 'center', marginTop: 10 },

  // Modal
  modal: { flex: 1, backgroundColor: THEME.bg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 24, borderBottomWidth: 1, borderBottomColor: THEME.border, backgroundColor: THEME.card },
  modalTitle: { fontSize: 18, fontWeight: '800', color: THEME.text },
  modalBody: { padding: 20, paddingBottom: 48 },
  modalField: { marginBottom: 18 },
  modalLabel: { fontSize: 11, fontWeight: '700', color: THEME.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  modalInput: { backgroundColor: THEME.card, borderWidth: 1.5, borderColor: THEME.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: THEME.text },
  modalInputError: { borderColor: THEME.error },
  modalError: { fontSize: 11, color: THEME.error, marginTop: 4 },
  catPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: THEME.card, borderWidth: 1.5, borderColor: THEME.border },
  catPillActive: { backgroundColor: THEME.primary, borderColor: THEME.primary },
  catPillText: { fontSize: 13, fontWeight: '600', color: THEME.textSecondary },
  catPillTextActive: { color: '#fff' },

  sectionDivider: { borderTopWidth: 1, borderTopColor: THEME.border, marginBottom: 18, paddingTop: 18 },
  sectionDividerText: { fontSize: 13, fontWeight: '800', color: THEME.text, textTransform: 'uppercase', letterSpacing: 0.5 },

  ingSearchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.card, borderWidth: 1.5, borderColor: THEME.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 },
  ingSearchInput: { flex: 1, paddingVertical: 11, fontSize: 15, color: THEME.text },
  sourceBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, marginBottom: 2 },
  sourceBadgeText: { fontSize: 10, color: THEME.accent, fontWeight: '600' },
  ingError: { fontSize: 13, color: THEME.textSecondary, marginTop: 8, fontStyle: 'italic' },

  resultsBox: { marginTop: 8, backgroundColor: THEME.card, borderRadius: 12, borderWidth: 1, borderColor: THEME.border, overflow: 'hidden' },
  resultItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: THEME.border },
  resultName: { fontSize: 14, fontWeight: '600', color: THEME.text, marginBottom: 2 },
  resultMacros: { fontSize: 11, color: THEME.textSecondary },
  resultPer: { fontSize: 11, color: THEME.textSecondary, marginLeft: 8 },

  addIngredientBox: { backgroundColor: THEME.accentLight, borderRadius: 14, padding: 14, marginBottom: 18, borderWidth: 1, borderColor: THEME.accentMid },
  selectedFoodRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  selectedFoodName: { flex: 1, fontSize: 14, fontWeight: '700', color: THEME.text },
  gramsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginBottom: 12 },
  gramsInputWrap: { width: 110 },
  gramsField: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1.5, borderColor: THEME.accentMid, borderRadius: 10, paddingHorizontal: 12 },
  gramsInput: { flex: 1, paddingVertical: 10, fontSize: 18, fontWeight: '700', color: THEME.text },
  gramsUnit: { fontSize: 14, fontWeight: '600', color: THEME.textSecondary },
  gramsMacros: { flex: 1 },
  gramsMacroVal: { fontSize: 18, fontWeight: '800', color: THEME.text },
  gramsMacroSub: { fontSize: 11, color: THEME.textSecondary, marginTop: 2 },
  addIngBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: THEME.accent, borderRadius: 10, paddingVertical: 11, shadowColor: THEME.accent, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 3 },
  addIngBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  ingItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.card, borderRadius: 10, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: THEME.border },
  ingItemName: { fontSize: 14, fontWeight: '600', color: THEME.text, marginBottom: 2 },
  ingItemMacros: { fontSize: 11, color: THEME.textSecondary },

  totalBox: { backgroundColor: THEME.primary, borderRadius: 16, padding: 16, marginBottom: 18 },
  totalLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalStat: { alignItems: 'center' },
  totalStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: '600', marginBottom: 2 },
  totalStatValue: { fontSize: 17, fontWeight: '800', color: '#fff' },
  totalStatUnit: { fontSize: 10, color: 'rgba(255,255,255,0.4)' },

  modalSubmit: { backgroundColor: THEME.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center', shadowColor: THEME.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  modalSubmitText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
