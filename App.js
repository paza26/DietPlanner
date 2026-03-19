import { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { onAuthStateChanged } from 'firebase/auth';
import { LangContext } from './src/i18n/LangContext';
import WelcomeScreen from './src/screens/WelcomeScreen';
import AuthScreen from './src/screens/AuthScreen';
import MainNavigator from './src/navigation/MainNavigator';
import { auth } from './src/services/firebase';
import { loadUserProfile, saveUserProfile } from './src/services/firestore';
import { THEME } from './src/theme';

export default function App() {
  const [firebaseUser, setFirebaseUser] = useState(undefined); // undefined = ancora in attesa
  const [userProfile, setUserProfile]   = useState(null);
  const [lang, setLang]                 = useState('it');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        const profile = await loadUserProfile(fbUser.uid);
        if (profile) {
          setLang(profile.lang ?? 'it');
          setUserProfile(profile);
        } else {
          setUserProfile(null);
        }
      } else {
        setFirebaseUser(null);
        setUserProfile(null);
      }
    });
    return unsubscribe;
  }, []);

  async function handleProfileComplete(data) {
    setLang(data.lang);
    setUserProfile(data);
    await saveUserProfile(firebaseUser.uid, data);
  }

  function handleProfileUpdate(updatedData) {
    setLang(updatedData.lang ?? lang);
    setUserProfile(updatedData);
  }

  // Spinner iniziale mentre Firebase verifica la sessione
  if (firebaseUser === undefined) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: THEME.bg }}>
        <ActivityIndicator size="large" color={THEME.accent} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <LangContext.Provider value={lang}>
        <NavigationContainer>
          {!firebaseUser
            ? <AuthScreen />
            : !userProfile
              ? <WelcomeScreen onComplete={handleProfileComplete} />
              : <MainNavigator user={userProfile} uid={firebaseUser.uid} onProfileUpdate={handleProfileUpdate} />}
        </NavigationContainer>
      </LangContext.Provider>
    </SafeAreaProvider>
  );
}
