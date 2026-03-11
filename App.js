import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import WelcomeScreen from './src/screens/WelcomeScreen';

export default function App() {
  const [user, setUser] = useState(null);

  if (!user) {
    return <WelcomeScreen onComplete={setUser} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Ciao, {user.name}!</Text>
      <Text style={styles.info}>Target: {user.calories} kcal/giorno</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a2e',
  },
  info: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
});
