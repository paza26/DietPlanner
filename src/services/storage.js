import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  USER: '@dietplanner:user',
  RECIPES: '@dietplanner:recipes',
  RECIPES_VERSION: '@dietplanner:recipes_version',
};

export const RECIPES_VERSION = 2; // incrementa ogni volta che i default cambiano

export async function loadUser() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveUser(user) {
  try {
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
  } catch {}
}

export async function clearUser() {
  try {
    await AsyncStorage.removeItem(KEYS.USER);
  } catch {}
}

export async function loadRecipes() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.RECIPES);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveRecipes(recipes) {
  try {
    await AsyncStorage.setItem(KEYS.RECIPES, JSON.stringify(recipes));
  } catch {}
}

export async function getRecipesVersion() {
  try {
    const v = await AsyncStorage.getItem(KEYS.RECIPES_VERSION);
    return v ? Number(v) : 0;
  } catch {
    return 0;
  }
}

export async function saveRecipesVersion(version) {
  try {
    await AsyncStorage.setItem(KEYS.RECIPES_VERSION, String(version));
  } catch {}
}
