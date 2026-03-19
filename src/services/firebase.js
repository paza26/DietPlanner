import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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

export const auth = getAuth(app);
export const db = getFirestore(app);
