import { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LangContext } from './src/i18n/LangContext';
import WelcomeScreen from './src/screens/WelcomeScreen';
import MainNavigator from './src/navigation/MainNavigator';

export default function App() {
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState('it');

  function handleComplete(data) {
    setLang(data.lang);
    setUser(data);
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
