import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { auth } from '../services/firebase';
import { THEME } from '../theme';

// Necessario per completare il flusso OAuth su web
WebBrowser.maybeCompleteAuthSession();

// ⚠️ Inserisci il tuo Web Client ID
// Lo trovi su: Firebase Console → Authentication → Sign-in method → Google → Web SDK configuration
const GOOGLE_WEB_CLIENT_ID = '408433800561-poe5u8642p3tjdqpp5kcdr4lh3evdvlg.apps.googleusercontent.com';

const ERROR_MESSAGES = {
  'auth/user-not-found':        'Nessun account trovato con questa email.',
  'auth/wrong-password':        'Password errata.',
  'auth/invalid-credential':    'Email o password non corretti.',
  'auth/email-already-in-use':  'Questa email è già registrata.',
  'auth/invalid-email':         'Indirizzo email non valido.',
  'auth/weak-password':         'La password deve essere di almeno 6 caratteri.',
  'auth/network-request-failed':'Errore di rete. Controlla la connessione.',
  'auth/cancelled':             'Accesso con Google annullato.',
};

function getErrorMessage(code) {
  return ERROR_MESSAGES[code] ?? 'Si è verificato un errore. Riprova.';
}

export default function AuthScreen() {
  const [mode, setMode]         = useState('login'); // 'login' | 'register'
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  // Hook Google OAuth
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
  });

  // Gestisce la risposta del flusso Google OAuth
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      setLoading(true);
      signInWithCredential(auth, credential)
        .catch((e) => setError(getErrorMessage(e.code)))
        .finally(() => setLoading(false));
    } else if (response?.type === 'error') {
      setError('Accesso con Google fallito. Riprova.');
    }
  }, [response]);

  async function handleSubmit() {
    setError('');
    if (!email.trim() || !password) {
      setError('Inserisci email e password.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      }
      // onAuthStateChanged in App.js gestirà il cambio di schermata
    } catch (e) {
      setError(getErrorMessage(e.code));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError('');
    await promptAsync();
  }

  const isLogin = mode === 'login';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.hero}>
          <Text style={styles.logo}>Diet<Text style={styles.logoAccent}>Planner</Text></Text>
          <Text style={styles.subtitle}>Il tuo piano alimentare personale</Text>
        </View>

        {/* Card email/password */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{isLogin ? 'Accedi' : 'Crea account'}</Text>
          <Text style={styles.cardSub}>
            {isLogin
              ? 'Bentornato! Inserisci le tue credenziali.'
              : 'Registrati per salvare le tue preferenze e ricette.'}
          </Text>

          <Text style={styles.label}>EMAIL</Text>
          <TextInput
            style={styles.input}
            placeholder="nome@esempio.com"
            placeholderTextColor={THEME.textSecondary}
            value={email}
            onChangeText={(v) => { setEmail(v); setError(''); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />

          <Text style={[styles.label, { marginTop: 14 }]}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            placeholder={isLogin ? 'La tua password' : 'Minimo 6 caratteri'}
            placeholderTextColor={THEME.textSecondary}
            value={password}
            onChangeText={(v) => { setPassword(v); setError(''); }}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.submitButton, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitButtonText}>{isLogin ? 'Accedi' : 'Registrati'}</Text>}
          </TouchableOpacity>

          {/* Separatore */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>oppure</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Bottone Google */}
          <TouchableOpacity
            style={[styles.googleButton, (!request || loading) && { opacity: 0.6 }]}
            onPress={handleGoogleSignIn}
            activeOpacity={0.85}
            disabled={!request || loading}
          >
            <Ionicons name="logo-google" size={18} color="#EA4335" />
            <Text style={styles.googleButtonText}>Continua con Google</Text>
          </TouchableOpacity>
        </View>

        {/* Toggle modalità login/registra */}
        <View style={styles.toggleRow}>
          <Text style={styles.toggleText}>
            {isLogin ? 'Non hai un account? ' : 'Hai già un account? '}
          </Text>
          <TouchableOpacity onPress={() => { setMode(isLogin ? 'register' : 'login'); setError(''); }}>
            <Text style={styles.toggleLink}>{isLogin ? 'Registrati' : 'Accedi'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    backgroundColor: THEME.bg,
    paddingBottom: 48,
  },
  hero: {
    backgroundColor: THEME.primary,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 24,
    alignItems: 'center',
  },
  logo: {
    fontSize: 38,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
  },
  logoAccent: {
    color: THEME.accent,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 6,
  },
  card: {
    backgroundColor: THEME.card,
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.text,
    marginBottom: 6,
  },
  cardSub: {
    fontSize: 13,
    color: THEME.textSecondary,
    marginBottom: 24,
    lineHeight: 18,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    backgroundColor: THEME.inputBg,
    borderWidth: 1.5,
    borderColor: THEME.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: THEME.text,
  },
  error: {
    color: THEME.error,
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
  submitButton: {
    marginTop: 20,
    backgroundColor: THEME.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: THEME.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: THEME.border,
  },
  dividerText: {
    fontSize: 12,
    color: THEME.textSecondary,
    fontWeight: '600',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: THEME.card,
    borderWidth: 1.5,
    borderColor: THEME.border,
    borderRadius: 14,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.text,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  toggleText: {
    fontSize: 14,
    color: THEME.textSecondary,
  },
  toggleLink: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.accent,
  },
});
