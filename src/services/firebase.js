import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

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

// Su web usa getAuth (localStorage), su native usa AsyncStorage per la persistenza
let auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  const { getReactNativePersistence } = require('firebase/auth');
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

export { auth };
export const db = getFirestore(app);
