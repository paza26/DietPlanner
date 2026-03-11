import { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LangContext } from './src/i18n/LangContext';
import WelcomeScreen from './src/screens/WelcomeScreen';
import MainNavigator from './src/navigation/MainNavigator';
import { loadUser, saveUser } from './src/services/storage';
import { THEME } from './src/theme';

export default function App() {
  const [user, setUser]       = useState(null);
  const [lang, setLang]       = useState('it');
  const [loading, setLoading] = useState(true);

  // Carica utente salvato all'avvio
  useEffect(() => {
    loadUser().then((saved) => {
      if (saved) {
        setUser(saved);
        setLang(saved.lang ?? 'it');
      }
      setLoading(false);
    });
  }, []);

  async function handleComplete(data) {
    setLang(data.lang);
    setUser(data);
    await saveUser(data);
  }

  if (loading) {
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
          {user
            ? <MainNavigator user={user} />
            : <WelcomeScreen onComplete={handleComplete} />}
        </NavigationContainer>
      </LangContext.Provider>
    </SafeAreaProvider>
  );
}
