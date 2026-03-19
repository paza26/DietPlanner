import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

// Struttura documento Firestore:
// users/{uid} → { name, height, weight, age, sex, activity, calories, tdee, lang, recipes: [...], recipesVersion: number }

export async function loadUserProfile(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    const { recipes, recipesVersion, ...profile } = snap.data();
    return profile;
  } catch {
    return null;
  }
}

export async function saveUserProfile(uid, profile) {
  try {
    await setDoc(doc(db, 'users', uid), profile, { merge: true });
  } catch (e) {
    console.error('saveUserProfile:', e);
  }
}

export async function loadRecipesFromCloud(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return { recipes: null, version: 0 };
    const data = snap.data();
    return { recipes: data.recipes ?? null, version: data.recipesVersion ?? 0 };
  } catch {
    return { recipes: null, version: 0 };
  }
}

export async function saveRecipesToCloud(uid, recipes, version) {
  try {
    await setDoc(doc(db, 'users', uid), { recipes, recipesVersion: version }, { merge: true });
  } catch (e) {
    console.error('saveRecipesToCloud:', e);
  }
}
