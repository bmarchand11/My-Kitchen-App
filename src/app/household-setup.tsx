import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, ErrorNote, Field, Screen, Title } from '../components/ui';
import { useSession } from '../data/SessionContext';
import { colors, fonts } from '../theme';

type Choice = 'create' | 'join';

export default function HouseholdSetupScreen() {
  const { createHousehold, joinHousehold, signOut } = useSession();
  const [choice, setChoice] = useState<Choice>('create');
  const [myName, setMyName] = useState('');
  const [householdName, setHouseholdName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!myName.trim()) {
      setError('Tell us your first name so your household knows who added what.');
      return;
    }
    if (choice === 'create' && !householdName.trim()) {
      setError('Give your kitchen a name, like “The Smith Kitchen”.');
      return;
    }
    if (choice === 'join' && code.trim().length < 6) {
      setError('Invite codes are 6 characters. Ask whoever set up the kitchen for theirs.');
      return;
    }
    setBusy(true);
    try {
      if (choice === 'create') await createHousehold(householdName, myName);
      else await joinHousehold(code, myName);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen showBottomBar={false}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Title>Set up your kitchen</Title>
          <Text style={styles.intro}>
            Start a new kitchen, or join one someone in your household already made.
          </Text>

          <View style={styles.choices} accessibilityRole="tablist">
            {(
              [
                ['create', 'Start a new kitchen'],
                ['join', 'Join with a code'],
              ] as const
            ).map(([id, label]) => (
              <Pressable
                key={id}
                accessibilityRole="tab"
                accessibilityState={{ selected: choice === id }}
                onPress={() => {
                  setChoice(id);
                  setError(null);
                }}
                style={[styles.choice, choice === id && { backgroundColor: colors.ink }]}
              >
                <Text style={[styles.choiceText, choice === id && { color: colors.surface }]}>{label}</Text>
              </Pressable>
            ))}
          </View>

          <Field
            label="Your first name"
            value={myName}
            onChangeText={setMyName}
            autoComplete="given-name"
            textContentType="givenName"
            placeholder="Brandon"
          />
          {choice === 'create' ? (
            <Field
              label="Kitchen name"
              value={householdName}
              onChangeText={setHouseholdName}
              placeholder="Our Kitchen"
              onSubmitEditing={submit}
            />
          ) : (
            <Field
              label="Invite code"
              value={code}
              onChangeText={(t) => setCode(t.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={6}
              placeholder="ABC123"
              onSubmitEditing={submit}
            />
          )}

          <ErrorNote message={error} />
          <Button label={choice === 'create' ? 'Create my kitchen' : 'Join kitchen'} onPress={submit} busy={busy} />
          <Pressable accessibilityRole="button" onPress={signOut} style={styles.signOut}>
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { gap: 14, paddingVertical: 16 },
  intro: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.inkSoft },
  choices: { flexDirection: 'row', gap: 8 },
  choice: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  choiceText: { fontFamily: fonts.bodyHeavy, fontSize: 14, color: colors.ink },
  signOut: { alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  signOutText: { fontFamily: fonts.bodyHeavy, fontSize: 15, color: colors.inkSoft, textDecorationLine: 'underline' },
});
