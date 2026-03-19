import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ Sostituisci questi valori con quelli del tuo progetto Firebase
// Li trovi su: Firebase Console → Il tuo progetto → Impostazioni → Le tue app
const firebaseConfig = {
  apiKey: "AIzaSyDnsD_qplMRsIj7IdhHaSL6zdpOFLWfSiM",
  authDomain: "dietplanner-e46f6.firebaseapp.com",
  projectId: "dietplanner-e46f6",
  storageBucket: "dietplanner-e46f6.firebasestorage.app",
  messagingSenderId: "408433800561",
  appId: "1:408433800561:web:0a4fc04cc1b631e780b2d0",
  measurementId: "G-KLQEZ6DPJ5"
};


const app = initializeApp(firebaseConfig);

// Auth con persistenza locale (l'utente rimane loggato dopo chiusura app)
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Firestore DB
export const db = getFirestore(app);
