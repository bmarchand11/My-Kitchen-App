import { useState } from 'react';
import { Alert, Platform, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { Button, ErrorNote, Screen, Title } from '../components/ui';
import { useSession } from '../data/SessionContext';
import { colors, fonts } from '../theme';

const AVATAR_COLORS = [colors.sunflower, '#9FD3F5', '#FFB3C7', '#BFE3D0', '#E9B872'];

function confirm(message: string, onYes: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(message)) onYes();
    return;
  }
  Alert.alert(message, undefined, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Yes', style: 'destructive', onPress: onYes },
  ]);
}

export default function HouseholdScreen() {
  const { household, members, session, signOut, leaveHousehold } = useSession();
  const [error, setError] = useState<string | null>(null);
  if (!household) return null;

  const share = () =>
    Share.share({
      message: `Join our kitchen "${household.name}" in My Kitchen with invite code ${household.invite_code}`,
    });

  return (
    <Screen tab="household">
      <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 16 }}>
        <Title>{household.name}</Title>

        <View style={styles.card}>
          <Text style={styles.heading}>Invite your household</Text>
          <Text style={styles.body}>Share this code. They enter it after creating an account.</Text>
          <Text style={styles.code} accessibilityLabel={`Invite code ${household.invite_code.split('').join(' ')}`} selectable>
            {household.invite_code}
          </Text>
          <Button label="Share invite" onPress={share} />
        </View>

        <View style={styles.card}>
          <Text style={styles.heading}>Who’s in this kitchen</Text>
          {members.map((m, i) => (
            <View key={m.user_id} style={styles.member}>
              <View style={[styles.avatar, { backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }]}>
                <Text style={styles.avatarText}>{m.display_name.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={styles.memberName}>
                {m.display_name}
                {m.user_id === session?.user.id ? ' (you)' : ''}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.signedIn}>Signed in as {session?.user.email}</Text>
        <ErrorNote message={error} />
        <Button label="Sign out" variant="secondary" onPress={signOut} />
        <Button
          label="Leave this kitchen"
          variant="secondary"
          onPress={() =>
            confirm(`Leave ${household.name}? You'll need the invite code to come back.`, () =>
              leaveHousehold().catch((e) => setError(e instanceof Error ? e.message : String(e))),
            )
          }
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  heading: { fontFamily: fonts.display, fontSize: 20, lineHeight: 24, color: colors.ink },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.inkSoft },
  code: {
    fontFamily: fonts.display,
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: 6,
    color: colors.ink,
    textAlign: 'center',
    backgroundColor: colors.useSoon,
    borderRadius: 14,
    paddingVertical: 6,
    overflow: 'hidden',
  },
  member: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.bodyHeavy, fontSize: 16, color: colors.ink },
  memberName: { fontFamily: fonts.bodyHeavy, fontSize: 16, color: colors.ink },
  signedIn: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.inkSoft, textAlign: 'center' },
});
