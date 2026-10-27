import { router, type Href } from 'expo-router';
import type { ReactNode, Ref } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputInstance,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import type { Freshness } from '../data/kitchen';
import { colors, fonts } from '../theme';

type ScreenProps = {
  children: ReactNode;
  tab?: 'kitchen' | 'list' | 'household';
  // Screens without the bottom bar (item detail, add food) set this to false.
  showBottomBar?: boolean;
};

export function Screen({ children, tab, showBottomBar = true }: ScreenProps) {
  return (
    <SafeAreaView style={styles.screen} edges={showBottomBar ? ['top'] : ['top', 'bottom']}>
      <View style={styles.content}>{children}</View>
      {showBottomBar && <BottomBar active={tab} />}
    </SafeAreaView>
  );
}

export function BackButton({ label, href }: { label: string; href?: Href }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Back to ${label}`}
      onPress={() => (href ? router.navigate(href) : router.back())}
      hitSlop={8}
      style={styles.back}
    >
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path d="M15 6l-6 6 6 6" stroke={colors.ink} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
      <Text style={styles.backText}>{label}</Text>
    </Pressable>
  );
}

export function Title({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={style}>
      <Text style={styles.title} accessibilityRole="header">
        {children}
      </Text>
    </View>
  );
}

export function Pill({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.pill}>
      <Text style={styles.pillText}>{label}</Text>
    </Pressable>
  );
}

export function Field({ label, ref, style, ...input }: { label: string; ref?: Ref<TextInputInstance> } & TextInputProps) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        placeholderTextColor={colors.inkQuiet}
        style={[styles.field, style]}
        {...input}
      />
    </View>
  );
}

export function Button({
  label,
  onPress,
  busy = false,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  variant?: 'primary' | 'secondary';
}) {
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy, disabled: busy }}
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: primary ? colors.ink : colors.surface },
        (pressed || busy) && { opacity: 0.7 },
      ]}
    >
      {busy ? (
        <ActivityIndicator color={primary ? colors.surface : colors.ink} />
      ) : (
        <Text style={[styles.buttonText, { color: primary ? colors.surface : colors.ink }]}>{label}</Text>
      )}
    </Pressable>
  );
}

// Closes the add-food sheet from any screen inside it.
export function CloseButton() {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => router.dismissTo('/')} style={styles.close}>
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path d="M6 6l12 12M18 6L6 18" stroke={colors.ink} strokeWidth={2.6} strokeLinecap="round" />
      </Svg>
    </Pressable>
  );
}

export function ChoiceChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.choiceChip, selected && { backgroundColor: colors.ink }]}
    >
      <Text style={[styles.choiceChipText, selected && { color: colors.surface }]}>{label}</Text>
    </Pressable>
  );
}

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View style={styles.error} accessibilityLiveRegion="polite">
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

const chipColors: Record<Exclude<Freshness, 'fresh'>, { bg: string; fg: string }> = {
  useSoon: { bg: colors.useSoon, fg: colors.useSoonText },
  expired: { bg: colors.expired, fg: colors.expiredText },
};

export function FreshnessChip({ freshness, label }: { freshness: Freshness; label: string }) {
  if (freshness === 'fresh') return null;
  const c = chipColors[freshness];
  return (
    <View style={[styles.chip, { backgroundColor: c.bg }]}>
      <Text style={[styles.chipText, { color: c.fg }]}>{label}</Text>
    </View>
  );
}

function TabButton({
  label,
  active,
  href,
  icon,
}: {
  label: string;
  active: boolean;
  href: Href;
  icon: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={() => router.navigate(href)}
      style={styles.tab}
    >
      {icon}
      <Text style={[styles.tabText, active && { color: colors.ink }]}>{label}</Text>
    </Pressable>
  );
}

function BottomBar({ active }: { active?: ScreenProps['tab'] }) {
  const tint = (tab: ScreenProps['tab']) => (active === tab ? colors.ink : colors.inkQuiet);
  return (
    <SafeAreaView edges={['bottom']} style={styles.bar}>
      <View style={styles.barRow} accessibilityRole="tablist">
        <TabButton
          label="Kitchen"
          active={active === 'kitchen'}
          href="/"
          icon={
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={tint('kitchen')} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Rect x={6} y={2} width={12} height={20} rx={2} />
              <Path d="M6 9h12M9 5v2M9 12v4" />
            </Svg>
          }
        />
        <TabButton
          label="List"
          active={active === 'list'}
          href="/list"
          icon={
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={tint('list')} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />
            </Svg>
          }
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add food"
          onPress={() => router.push('/add')}
          style={styles.addButton}
        >
          <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
            <Path d="M12 5v14M5 12h14" stroke={colors.ink} strokeWidth={3} strokeLinecap="round" />
          </Svg>
        </Pressable>
        <TabButton
          label="Household"
          active={active === 'household'}
          href="/household"
          icon={
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={tint('household')} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Circle cx={9} cy={8} r={3.5} />
              <Path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5" />
              <Circle cx={17} cy={9} r={2.5} />
              <Path d="M17 14.5c2.3 0 4 1.5 4.5 4" />
            </Svg>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 8, gap: 14 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, alignSelf: 'flex-start' },
  backText: { fontFamily: fonts.bodyHeavy, fontSize: 15, color: colors.ink },
  title: { fontFamily: fonts.display, fontSize: 32, lineHeight: 38, color: colors.ink },
  pill: {
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: colors.surface,
  },
  pillText: { fontFamily: fonts.bodyHeavy, fontSize: 14, color: colors.ink },
  chip: {
    alignSelf: 'flex-start',
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 1,
  },
  chipText: { fontFamily: fonts.bodyHeavy, fontSize: 11 },
  fieldLabel: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.inkSoft },
  field: {
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 14,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.ink,
  },
  button: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonText: { fontFamily: fonts.bodyHeavy, fontSize: 16 },
  error: {
    backgroundColor: colors.expired,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 14,
    padding: 12,
  },
  errorText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.expiredText },
  bar: { backgroundColor: colors.surface, borderTopWidth: 2, borderTopColor: colors.ink },
  barRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingTop: 8, paddingBottom: 4 },
  tab: { alignItems: 'center', justifyContent: 'center', gap: 2, minWidth: 64, minHeight: 48 },
  tabText: { fontFamily: fonts.bodyHeavy, fontSize: 11, color: colors.inkQuiet },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.tomato,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
  },
  choiceChip: {
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    minHeight: 36,
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  choiceChipText: { fontFamily: fonts.bodyHeavy, fontSize: 14, color: colors.ink },
  close: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
