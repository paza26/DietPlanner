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
import { loadRecipesFromCloud, saveRecipesToCloud } from '../../services/firestore';
import { RECIPES_VERSION } from '../../services/storage';

const DEFAULT_RECIPES = [
  {
    id: 'd1', name: 'Pasta al pomodoro', categories: ['Pranzo', 'Cena'],
    ingredients: [
      { name: 'Pasta secca', grams: 80, nutrition: { calories: 280, protein: 10.4, carbs: 56, fat: 1.6 } },
      { name: 'Salsa di pomodoro', grams: 150, nutrition: { calories: 45, protein: 1.5, carbs: 9, fat: 0.6 } },
    ],
    nutrition: { calories: 325, protein: 11.9, carbs: 65, fat: 2.2 },
  },
  {
    id: 'd2', name: 'Pasta al pesto', categories: ['Pranzo'],
    ingredients: [
      { name: 'Pasta secca', grams: 80, nutrition: { calories: 280, protein: 10.4, carbs: 56, fat: 1.6 } },
      { name: 'Pesto genovese', grams: 30, nutrition: { calories: 156, protein: 3, carbs: 3, fat: 15 } },
    ],
    nutrition: { calories: 436, protein: 13.4, carbs: 59, fat: 16.6 },
  },
  {
    id: 'd3', name: 'Pasta con tonno', categories: ['Pranzo', 'Cena'],
    ingredients: [
      { name: 'Pasta secca', grams: 80, nutrition: { calories: 280, protein: 10.4, carbs: 56, fat: 1.6 } },
      { name: 'Tonno in scatola', grams: 120, nutrition: { calories: 139, protein: 31.2, carbs: 0, fat: 1.2 } },
    ],
    nutrition: { calories: 419, protein: 41.6, carbs: 56, fat: 2.8 },
  },
  {
    id: 'd4', name: 'Risotto ai funghi', categories: ['Pranzo', 'Cena'],
    ingredients: [
      { name: 'Riso arborio', grams: 90, nutrition: { calories: 315, protein: 6.3, carbs: 69, fat: 0.9 } },
      { name: 'Funghi misti', grams: 200, nutrition: { calories: 44, protein: 4, carbs: 6, fat: 0.4 } },
      { name: 'Parmigiano', grams: 20, nutrition: { calories: 83, protein: 7.5, carbs: 0, fat: 5.7 } },
    ],
    nutrition: { calories: 442, protein: 17.8, carbs: 75, fat: 7 },
  },
  {
    id: 'd5', name: 'Riso con pollo e verdure', categories: ['Pranzo', 'Cena'],
    ingredients: [
      { name: 'Riso cotto', grams: 200, nutrition: { calories: 260, protein: 5.4, carbs: 56, fat: 0.6 } },
      { name: 'Petto di pollo', grams: 150, nutrition: { calories: 248, protein: 46.5, carbs: 0, fat: 5.4 } },
    ],
    nutrition: { calories: 508, protein: 51.9, carbs: 56, fat: 6 },
  },
  {
    id: 'd6', name: 'Insalata di farro con pollo', categories: ['Pranzo'],
    ingredients: [
      { name: 'Farro cotto', grams: 200, nutrition: { calories: 298, protein: 10.4, carbs: 62.4, fat: 1.2 } },
      { name: 'Petto di pollo', grams: 150, nutrition: { calories: 248, protein: 46.5, carbs: 0, fat: 5.4 } },
    ],
    nutrition: { calories: 546, protein: 56.9, carbs: 62.4, fat: 6.6 },
  },
  {
    id: 'd7', name: 'Riso integrale con verdure grigliate', categories: ['Pranzo'],
    ingredients: [
      { name: 'Riso integrale cotto', grams: 200, nutrition: { calories: 218, protein: 4.6, carbs: 45.6, fat: 1.6 } },
      { name: 'Verdure grigliate', grams: 250, nutrition: { calories: 75, protein: 3.75, carbs: 15, fat: 0.5 } },
    ],
    nutrition: { calories: 293, protein: 8.4, carbs: 60.6, fat: 2.1 },
  },
  {
    id: 'd8', name: 'Minestrone di verdure', categories: ['Pranzo', 'Cena'],
    ingredients: [
      { name: 'Verdure miste', grams: 400, nutrition: { calories: 120, protein: 6, carbs: 24, fat: 0.8 } },
      { name: 'Pasta corta', grams: 60, nutrition: { calories: 210, protein: 7.8, carbs: 42, fat: 1.2 } },
    ],
    nutrition: { calories: 330, protein: 13.8, carbs: 66, fat: 2 },
  },
  {
    id: 'd9', name: 'Zuppa di lenticchie', categories: ['Pranzo', 'Cena'],
    ingredients: [
      { name: 'Lenticchie cotte', grams: 300, nutrition: { calories: 348, protein: 27, carbs: 60, fat: 1.2 } },
      { name: 'Carote e sedano', grams: 150, nutrition: { calories: 45, protein: 1, carbs: 10, fat: 0.2 } },
    ],
    nutrition: { calories: 393, protein: 28, carbs: 70, fat: 1.4 },
  },
  {
    id: 'd10', name: 'Buddha bowl di ceci', categories: ['Pranzo'],
    ingredients: [
      { name: 'Ceci cotti', grams: 200, nutrition: { calories: 328, protein: 17.8, carbs: 54, fat: 5.2 } },
      { name: 'Quinoa cotta', grams: 150, nutrition: { calories: 180, protein: 6.6, carbs: 31.5, fat: 2.85 } },
      { name: 'Verdure miste', grams: 100, nutrition: { calories: 30, protein: 1.5, carbs: 6, fat: 0.2 } },
    ],
    nutrition: { calories: 538, protein: 25.9, carbs: 91.5, fat: 8.25 },
  },
  {
    id: 'd11', name: 'Insalata di pollo e avocado', categories: ['Pranzo'],
    ingredients: [
      { name: 'Petto di pollo', grams: 150, nutrition: { calories: 248, protein: 46.5, carbs: 0, fat: 5.4 } },
      { name: 'Avocado', grams: 100, nutrition: { calories: 160, protein: 2, carbs: 9, fat: 15 } },
      { name: 'Insalata mista', grams: 100, nutrition: { calories: 20, protein: 1, carbs: 3, fat: 0.2 } },
    ],
    nutrition: { calories: 428, protein: 49.5, carbs: 12, fat: 20.6 },
  },
  {
    id: 'd12', name: 'Insalata greca', categories: ['Pranzo'],
    ingredients: [
      { name: 'Feta', grams: 80, nutrition: { calories: 212, protein: 11.2, carbs: 1.2, fat: 17.6 } },
      { name: 'Pomodori e cetrioli', grams: 250, nutrition: { calories: 50, protein: 2, carbs: 10, fat: 0.4 } },
      { name: 'Olive nere', grams: 50, nutrition: { calories: 72, protein: 0.5, carbs: 1.5, fat: 7 } },
    ],
    nutrition: { calories: 334, protein: 13.7, carbs: 12.7, fat: 25 },
  },
  {
    id: 'd13', name: 'Wrap di tonno e verdure', categories: ['Pranzo'],
    ingredients: [
      { name: 'Piadina', grams: 80, nutrition: { calories: 260, protein: 8, carbs: 46, fat: 6 } },
      { name: 'Tonno in scatola', grams: 150, nutrition: { calories: 174, protein: 39, carbs: 0, fat: 1.5 } },
      { name: 'Verdure', grams: 100, nutrition: { calories: 25, protein: 1, carbs: 5, fat: 0.1 } },
    ],
    nutrition: { calories: 459, protein: 48, carbs: 51, fat: 7.6 },
  },
  {
    id: 'd14', name: 'Piadina con bresaola e rucola', categories: ['Pranzo'],
    ingredients: [
      { name: 'Piadina', grams: 100, nutrition: { calories: 325, protein: 10, carbs: 57.5, fat: 7.5 } },
      { name: 'Bresaola', grams: 80, nutrition: { calories: 121, protein: 25.6, carbs: 0, fat: 1.6 } },
      { name: 'Rucola', grams: 30, nutrition: { calories: 8, protein: 0.75, carbs: 1.05, fat: 0.15 } },
    ],
    nutrition: { calories: 454, protein: 36.35, carbs: 58.55, fat: 9.25 },
  },
  {
    id: 'd15', name: 'Frittata di verdure', categories: ['Pranzo', 'Cena'],
    ingredients: [
      { name: 'Uova', grams: 180, nutrition: { calories: 279, protein: 23.4, carbs: 1.8, fat: 19.8 } },
      { name: 'Zucchine', grams: 150, nutrition: { calories: 24, protein: 1.8, carbs: 3.6, fat: 0.3 } },
    ],
    nutrition: { calories: 303, protein: 25.2, carbs: 5.4, fat: 20.1 },
  },
  {
    id: 'd16', name: 'Petto di pollo alla griglia con patate', categories: ['Cena'],
    ingredients: [
      { name: 'Petto di pollo', grams: 200, nutrition: { calories: 330, protein: 62, carbs: 0, fat: 7.2 } },
      { name: 'Patate', grams: 250, nutrition: { calories: 193, protein: 5, carbs: 42.5, fat: 0.25 } },
    ],
    nutrition: { calories: 523, protein: 67, carbs: 42.5, fat: 7.45 },
  },
  {
    id: 'd17', name: 'Salmone al forno con broccoli', categories: ['Cena'],
    ingredients: [
      { name: 'Salmone', grams: 180, nutrition: { calories: 374, protein: 36, carbs: 0, fat: 23.4 } },
      { name: 'Broccoli', grams: 200, nutrition: { calories: 68, protein: 5.6, carbs: 10, fat: 0.6 } },
    ],
    nutrition: { calories: 442, protein: 41.6, carbs: 10, fat: 24 },
  },
  {
    id: 'd18', name: 'Bistecca con insalata', categories: ['Cena'],
    ingredients: [
      { name: 'Manzo magro', grams: 200, nutrition: { calories: 400, protein: 52, carbs: 0, fat: 20 } },
      { name: 'Rucola e pomodori', grams: 150, nutrition: { calories: 35, protein: 2, carbs: 5, fat: 0.3 } },
    ],
    nutrition: { calories: 435, protein: 54, carbs: 5, fat: 20.3 },
  },
  {
    id: 'd19', name: 'Merluzzo al forno con pomodorini', categories: ['Cena'],
    ingredients: [
      { name: 'Merluzzo', grams: 250, nutrition: { calories: 205, protein: 45, carbs: 0, fat: 1.75 } },
      { name: 'Pomodorini', grams: 200, nutrition: { calories: 36, protein: 1.6, carbs: 7.2, fat: 0.4 } },
    ],
    nutrition: { calories: 241, protein: 46.6, carbs: 7.2, fat: 2.15 },
  },
  {
    id: 'd20', name: 'Gamberi saltati con verdure', categories: ['Cena'],
    ingredients: [
      { name: 'Gamberi', grams: 250, nutrition: { calories: 213, protein: 45, carbs: 2.25, fat: 2.5 } },
      { name: 'Verdure miste', grams: 200, nutrition: { calories: 60, protein: 3, carbs: 12, fat: 0.4 } },
    ],
    nutrition: { calories: 273, protein: 48, carbs: 14.25, fat: 2.9 },
  },
  {
    id: 'd21', name: 'Pollo al curry con riso basmati', categories: ['Cena'],
    ingredients: [
      { name: 'Petto di pollo', grams: 180, nutrition: { calories: 297, protein: 55.8, carbs: 0, fat: 6.5 } },
      { name: 'Riso basmati cotto', grams: 180, nutrition: { calories: 234, protein: 4.9, carbs: 50.4, fat: 0.5 } },
    ],
    nutrition: { calories: 531, protein: 60.7, carbs: 50.4, fat: 7 },
  },
  {
    id: 'd22', name: 'Tagliata di manzo con rucola', categories: ['Cena'],
    ingredients: [
      { name: 'Manzo', grams: 200, nutrition: { calories: 400, protein: 52, carbs: 0, fat: 20 } },
      { name: 'Rucola', grams: 80, nutrition: { calories: 20, protein: 2, carbs: 2.8, fat: 0.4 } },
      { name: 'Parmigiano', grams: 15, nutrition: { calories: 62, protein: 5.6, carbs: 0, fat: 4.3 } },
    ],
    nutrition: { calories: 482, protein: 59.6, carbs: 2.8, fat: 24.7 },
  },
  {
    id: 'd23', name: 'Orata al forno con patate', categories: ['Cena'],
    ingredients: [
      { name: 'Orata', grams: 250, nutrition: { calories: 240, protein: 50, carbs: 0, fat: 3.75 } },
      { name: 'Patate', grams: 200, nutrition: { calories: 154, protein: 4, carbs: 34, fat: 0.2 } },
    ],
    nutrition: { calories: 394, protein: 54, carbs: 34, fat: 3.95 },
  },
  {
    id: 'd24', name: 'Polpette di manzo con zucchine', categories: ['Cena'],
    ingredients: [
      { name: 'Manzo macinato', grams: 200, nutrition: { calories: 400, protein: 52, carbs: 0, fat: 20 } },
      { name: 'Zucchine', grams: 200, nutrition: { calories: 32, protein: 2.4, carbs: 4.8, fat: 0.4 } },
    ],
    nutrition: { calories: 432, protein: 54.4, carbs: 4.8, fat: 20.4 },
  },
  {
    id: 'd25', name: 'Zucchine ripiene di carne', categories: ['Cena'],
    ingredients: [
      { name: 'Manzo macinato', grams: 150, nutrition: { calories: 300, protein: 39, carbs: 0, fat: 15 } },
      { name: 'Zucchine', grams: 300, nutrition: { calories: 48, protein: 3.6, carbs: 7.2, fat: 0.6 } },
      { name: 'Parmigiano', grams: 20, nutrition: { calories: 83, protein: 7.5, carbs: 0, fat: 5.7 } },
    ],
    nutrition: { calories: 431, protein: 50.1, carbs: 7.2, fat: 21.3 },
  },
  {
    id: 'd26', name: 'Branzino al cartoccio con verdure', categories: ['Cena'],
    ingredients: [
      { name: 'Branzino', grams: 250, nutrition: { calories: 243, protein: 47.5, carbs: 0, fat: 5 } },
      { name: 'Verdure', grams: 250, nutrition: { calories: 75, protein: 3.75, carbs: 15, fat: 0.5 } },
    ],
    nutrition: { calories: 318, protein: 51.25, carbs: 15, fat: 5.5 },
  },
  {
    id: 'd27', name: 'Pollo arrosto con patate', categories: ['Cena'],
    ingredients: [
      { name: 'Coscia di pollo', grams: 250, nutrition: { calories: 413, protein: 47.5, carbs: 0, fat: 23.75 } },
      { name: 'Patate', grams: 300, nutrition: { calories: 231, protein: 6, carbs: 51, fat: 0.3 } },
    ],
    nutrition: { calories: 644, protein: 53.5, carbs: 51, fat: 24.05 },
  },
  {
    id: 'd28', name: 'Spezzatino di manzo', categories: ['Cena'],
    ingredients: [
      { name: 'Manzo a pezzi', grams: 200, nutrition: { calories: 400, protein: 52, carbs: 0, fat: 20 } },
      { name: 'Carote e patate', grams: 200, nutrition: { calories: 100, protein: 2, carbs: 22, fat: 0.2 } },
    ],
    nutrition: { calories: 500, protein: 54, carbs: 22, fat: 20.2 },
  },
  {
    id: 'd29', name: 'Filetto di maiale con mele', categories: ['Cena'],
    ingredients: [
      { name: 'Filetto di maiale', grams: 200, nutrition: { calories: 484, protein: 54, carbs: 0, fat: 28 } },
      { name: 'Mele', grams: 150, nutrition: { calories: 78, protein: 0.45, carbs: 20.7, fat: 0.3 } },
    ],
    nutrition: { calories: 562, protein: 54.45, carbs: 20.7, fat: 28.3 },
  },
  {
    id: 'd30', name: 'Tacchino con purè di patate', categories: ['Cena'],
    ingredients: [
      { name: 'Petto di tacchino', grams: 200, nutrition: { calories: 270, protein: 60, carbs: 0, fat: 2 } },
      { name: 'Purè di patate', grams: 200, nutrition: { calories: 150, protein: 4, carbs: 30, fat: 3 } },
    ],
    nutrition: { calories: 420, protein: 64, carbs: 30, fat: 5 },
  },
];

const EMPTY_FORM = { name: '', categories: [], ingredients: [] };

export default function RecipesScreen({ uid }) {
  const insets = useSafeAreaInsets();
  const t = useLang();
  const [recipes, setRecipes]           = useState(DEFAULT_RECIPES);
  const [activeCategory, setActiveCategory] = useState(t.categories[0]);

  // Carica ricette dal cloud all'avvio; se assenti o versione obsoleta, usa le default
  useEffect(() => {
    loadRecipesFromCloud(uid).then(({ recipes: saved, version: savedVersion }) => {
      if (saved && saved.length > 0 && savedVersion >= RECIPES_VERSION) {
        setRecipes(saved);
      } else {
        setRecipes(DEFAULT_RECIPES);
        saveRecipesToCloud(uid, DEFAULT_RECIPES, RECIPES_VERSION);
      }
    });
  }, [uid]);
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
    saveRecipesToCloud(uid, updated, RECIPES_VERSION);
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
      <MacroBar nutrition={recipe.nutrition} />
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

const MACRO_SEGMENTS = [
  { key: 'protein', color: '#3b82f6', label: 'P' },
  { key: 'carbs',   color: '#f59e0b', label: 'C' },
  { key: 'fat',     color: '#ef4444', label: 'G' },
];

function MacroBar({ nutrition }) {
  const { protein, carbs, fat } = nutrition;
  const total = protein + carbs + fat;
  if (total === 0) return null;

  const values = { protein, carbs, fat };

  return (
    <View style={styles.macroBar}>
      {MACRO_SEGMENTS.map((seg, i) => {
        const grams = values[seg.key];
        const pct = grams / total;
        const showText = pct > 0.13;
        const isFirst = i === 0;
        const isLast = i === MACRO_SEGMENTS.length - 1;
        return (
          <View
            key={seg.key}
            style={[
              styles.macroBarSegment,
              { flex: grams, backgroundColor: seg.color },
              isFirst && styles.macroBarLeft,
              isLast && styles.macroBarRight,
            ]}
          >
            {showText && (
              <Text style={styles.macroBarText}>{seg.label} {grams}g</Text>
            )}
          </View>
        );
      })}
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
  macroBar: { flexDirection: 'row', height: 30, borderRadius: 8, overflow: 'hidden', marginTop: 10 },
  macroBarSegment: { justifyContent: 'center', alignItems: 'center' },
  macroBarLeft: { borderTopLeftRadius: 8, borderBottomLeftRadius: 8 },
  macroBarRight: { borderTopRightRadius: 8, borderBottomRightRadius: 8 },
  macroBarText: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
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
