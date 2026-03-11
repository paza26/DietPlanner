import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  USER: '@dietplanner:user',
  RECIPES: '@dietplanner:recipes',
};

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
