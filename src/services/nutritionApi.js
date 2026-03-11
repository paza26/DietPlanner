const BASE_URL = 'https://world.openfoodfacts.org/cgi/search.pl';

/**
 * Cerca alimenti su Open Food Facts.
 * Restituisce array di { id, name, calories, protein, carbs, fat } per 100g.
 */
export async function searchFood(query) {
  if (!query || query.trim().length < 2) return [];

  const params = new URLSearchParams({
    search_terms: query.trim(),
    json: '1',
    page_size: '8',
    search_simple: '1',
    action: 'process',
    fields: 'id,product_name,nutriments,serving_size',
    lc: 'it',
  });

  const res = await fetch(`${BASE_URL}?${params}`);
  if (!res.ok) throw new Error('Errore di rete');

  const data = await res.json();

  return (data.products ?? [])
    .filter((p) => p.product_name && p.nutriments?.['energy-kcal_100g'] != null)
    .map((p) => ({
      id: p.id ?? Math.random().toString(),
      name: p.product_name,
      calories: Math.round(p.nutriments['energy-kcal_100g'] ?? 0),
      protein:  Math.round((p.nutriments['proteins_100g'] ?? 0) * 10) / 10,
      carbs:    Math.round((p.nutriments['carbohydrates_100g'] ?? 0) * 10) / 10,
      fat:      Math.round((p.nutriments['fat_100g'] ?? 0) * 10) / 10,
    }));
}

/**
 * Calcola i valori nutrizionali di un alimento per una data quantita' in grammi.
 */
export function scaleNutrition(food, grams) {
  const ratio = grams / 100;
  return {
    calories: Math.round(food.calories * ratio),
    protein:  Math.round(food.protein  * ratio * 10) / 10,
    carbs:    Math.round(food.carbs    * ratio * 10) / 10,
    fat:      Math.round(food.fat      * ratio * 10) / 10,
  };
}

/**
 * Somma i valori nutrizionali di una lista di ingredienti gia' scalati.
 */
export function sumNutrition(ingredients) {
  return ingredients.reduce(
    (acc, ing) => ({
      calories: acc.calories + ing.nutrition.calories,
      protein:  Math.round((acc.protein  + ing.nutrition.protein)  * 10) / 10,
      carbs:    Math.round((acc.carbs    + ing.nutrition.carbs)    * 10) / 10,
      fat:      Math.round((acc.fat      + ing.nutrition.fat)      * 10) / 10,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}
