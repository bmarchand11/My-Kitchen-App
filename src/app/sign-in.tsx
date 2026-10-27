import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Sticker } from '../components/Sticker';
import { Button, ErrorNote, Field, Screen, Title } from '../components/ui';
import { useSession } from '../data/SessionContext';
import { colors, fonts } from '../theme';

type Mode = 'signIn' | 'signUp';

function friendly(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'That email and password don’t match. Try again?';
  if (/email not confirmed/i.test(message)) return 'Please confirm your email first. Check your inbox for a link.';
  if (/already registered/i.test(message)) return 'That email already has an account. Try signing in instead.';
  if (/password/i.test(message) && /6/.test(message)) return 'Passwords need at least 6 characters.';
  return message;
}

export default function SignInScreen() {
  const { signIn, signUp } = useSession();
  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setNotice(null);
    if (!email.trim() || !password) {
      setError('Enter your email and a password.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signIn') {
        await signIn(email, password);
      } else {
        const needsConfirmation = await signUp(email, password);
        if (needsConfirmation) {
          setNotice('Almost there! We emailed you a link. Tap it to confirm, then come back and sign in.');
          setMode('signIn');
        }
      }
    } catch (e) {
      setError(friendly(e instanceof Error ? e.message : String(e)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen showBottomBar={false}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View style={styles.stickers}>
              <Sticker name="milk" size={56} />
              <Sticker name="carrot" size={56} />
              <Sticker name="cheese" size={56} />
            </View>
            <Title>My Kitchen</Title>
            <Text style={styles.tagline}>Everything in your fridge, freezer, and pantry, shared with your household.</Text>
          </View>

          <View style={styles.form}>
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              placeholder="you@example.com"
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
              textContentType={mode === 'signIn' ? 'password' : 'newPassword'}
              placeholder={mode === 'signUp' ? 'At least 6 characters' : undefined}
              onSubmitEditing={submit}
            />
            <ErrorNote message={error} />
            {notice && <Text style={styles.notice}>{notice}</Text>}
            <Button label={mode === 'signIn' ? 'Sign in' : 'Create account'} onPress={submit} busy={busy} />
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setMode(mode === 'signIn' ? 'signUp' : 'signIn');
                setError(null);
              }}
              style={styles.switch}
            >
              <Text style={styles.switchText}>
                {mode === 'signIn' ? 'New here? Create an account' : 'Already have an account? Sign in'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flexGrow: 1, justifyContent: 'center', gap: 28, paddingVertical: 24 },
  hero: { alignItems: 'center', gap: 6 },
  stickers: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  tagline: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.inkSoft, textAlign: 'center', maxWidth: 300 },
  form: { gap: 14 },
  notice: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.useSoonText,
    backgroundColor: colors.useSoon,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 14,
    padding: 12,
    overflow: 'hidden',
  },
  switch: { alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  switchText: { fontFamily: fonts.bodyHeavy, fontSize: 15, color: colors.ink, textDecorationLine: 'underline' },
});
