import { View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { colors } from '../theme';

// Placeholder art in the cartoon sticker style. The AI-generated picture library
// will replace these, one picture per item type.
const INK = colors.ink;

const art = {
  milk: (
    <>
      <Path d="M20 24 L32 10 L44 24 V56 H20 Z" fill="#fff" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M20 24 H44" stroke={INK} strokeWidth={3} />
      <Rect x={20} y={33} width={24} height={13} fill="#5AA9E6" stroke={INK} strokeWidth={3} />
    </>
  ),
  eggs: (
    <>
      <Ellipse cx={20} cy={30} rx={8} ry={10} fill="#FFF6E5" stroke={INK} strokeWidth={3} />
      <Ellipse cx={32} cy={28} rx={8} ry={10} fill="#FFF6E5" stroke={INK} strokeWidth={3} />
      <Ellipse cx={44} cy={30} rx={8} ry={10} fill="#FFF6E5" stroke={INK} strokeWidth={3} />
      <Path d="M8 36 H56 L52 52 H12 Z" fill="#C9A27A" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    </>
  ),
  cheese: (
    <>
      <Path d="M8 46 L52 22 L56 46 Z" fill="#FFC845" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <Circle cx={40} cy={38} r={3.5} fill="#E9A800" />
      <Circle cx={28} cy={42} r={2.5} fill="#E9A800" />
      <Circle cx={48} cy={31} r={2} fill="#E9A800" />
    </>
  ),
  yogurt: (
    <>
      <Path d="M16 22 H48 L44 54 H20 Z" fill="#FFB3C7" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <Rect x={13} y={15} width={38} height={8} rx={3} fill="#fff" stroke={INK} strokeWidth={3} />
      <Circle cx={32} cy={38} r={6} fill="#fff" stroke={INK} strokeWidth={2.5} />
    </>
  ),
  butter: (
    <>
      <Ellipse cx={32} cy={46} rx={26} ry={8} fill="#fff" stroke={INK} strokeWidth={3} />
      <Path d="M14 42 V30 L22 22 H50 V36 L44 42 Z" fill="#FFE27A" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M14 30 H42 L50 22 M42 30 V42" fill="none" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    </>
  ),
  sourCream: (
    <>
      <Path d="M12 28 H52 L48 52 H16 Z" fill="#fff" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <Rect x={9} y={20} width={46} height={9} rx={4} fill="#5AA9E6" stroke={INK} strokeWidth={3} />
      <Path d="M22 38 H42" stroke="#5AA9E6" strokeWidth={4} strokeLinecap="round" />
    </>
  ),
  drumstick: (
    <>
      <Path d="M38 26 L50 46" stroke={INK} strokeWidth={9} strokeLinecap="round" />
      <Path d="M38 26 L50 46" stroke="#fff" strokeWidth={4} strokeLinecap="round" />
      <G rotation={-30} origin="28, 24">
        <Ellipse cx={28} cy={24} rx={16} ry={13} fill="#E07A3F" stroke={INK} strokeWidth={3} />
      </G>
    </>
  ),
  leftovers: (
    <>
      <Rect x={10} y={28} width={44} height={24} rx={5} fill="#BFE3D0" stroke={INK} strokeWidth={3} />
      <Rect x={7} y={20} width={50} height={10} rx={4} fill="#2E9E5B" stroke={INK} strokeWidth={3} />
    </>
  ),
  juice: (
    <>
      <Rect x={27} y={6} width={10} height={7} rx={2} fill="#2E9E5B" stroke={INK} strokeWidth={3} />
      <Path d="M27 13 H37 L44 24 V56 H20 V24 Z" fill="#FFB547" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <Circle cx={32} cy={38} r={7} fill="#fff" stroke={INK} strokeWidth={2.5} />
    </>
  ),
  carrot: (
    <>
      <Path d="M30 14 C26 6 20 8 22 14 M34 14 C36 5 44 7 40 15 M32 14 V8" fill="none" stroke="#2E9E5B" strokeWidth={4} strokeLinecap="round" />
      <Path d="M20 18 H44 L33 58 Z" fill="#FF8A3D" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    </>
  ),
  spinach: (
    <>
      <Path d="M32 8 C50 16 54 40 32 56 C10 40 14 16 32 8 Z" fill="#4CAF6A" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M32 14 V50 M32 28 L42 22 M32 38 L22 32" fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
    </>
  ),
  ketchup: (
    <>
      <Path d="M28 6 H36 V14 H28 Z" fill="#fff" stroke={INK} strokeWidth={3} />
      <Path d="M24 14 H40 L44 26 V56 H20 V26 Z" fill="#E8483B" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <Rect x={24} y={32} width={16} height={10} rx={2} fill="#fff" stroke={INK} strokeWidth={2.5} />
    </>
  ),
  peas: (
    <>
      <Path d="M14 12 H50 L46 56 H18 Z" fill="#7BC67E" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M14 18 H50" stroke={INK} strokeWidth={3} />
      <Circle cx={26} cy={34} r={5} fill="#2E9E5B" stroke={INK} strokeWidth={2} />
      <Circle cx={38} cy={30} r={5} fill="#2E9E5B" stroke={INK} strokeWidth={2} />
      <Circle cx={34} cy={42} r={5} fill="#2E9E5B" stroke={INK} strokeWidth={2} />
    </>
  ),
  frozenMeal: (
    <>
      <Rect x={8} y={18} width={48} height={32} rx={5} fill="#9FD3F5" stroke={INK} strokeWidth={3} />
      <Rect x={14} y={24} width={20} height={20} rx={3} fill="#FFC845" stroke={INK} strokeWidth={2.5} />
      <Rect x={38} y={24} width={12} height={20} rx={3} fill="#E07A3F" stroke={INK} strokeWidth={2.5} />
    </>
  ),
  iceCream: (
    <>
      <Path d="M22 30 L32 58 L42 30 Z" fill="#E9B872" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <Circle cx={32} cy={22} r={12} fill="#FFB3C7" stroke={INK} strokeWidth={3} />
    </>
  ),
  can: (
    <>
      <Rect x={16} y={14} width={32} height={40} rx={4} fill="#E8483B" stroke={INK} strokeWidth={3} />
      <Rect x={16} y={24} width={32} height={20} fill="#fff" stroke={INK} strokeWidth={3} />
    </>
  ),
  pasta: (
    <>
      <Rect x={16} y={10} width={32} height={46} rx={3} fill="#5AA9E6" stroke={INK} strokeWidth={3} />
      <Rect x={22} y={20} width={20} height={16} rx={2} fill="#FFE27A" stroke={INK} strokeWidth={2.5} />
    </>
  ),
  chips: (
    <>
      <Path d="M16 10 H48 L44 32 L48 54 H16 L20 32 Z" fill="#FFC845" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <Circle cx={32} cy={32} r={7} fill="#E8483B" stroke={INK} strokeWidth={2.5} />
    </>
  ),
  jar: (
    <>
      <Rect x={18} y={10} width={28} height={9} rx={3} fill="#E8483B" stroke={INK} strokeWidth={3} />
      <Rect x={14} y={19} width={36} height={37} rx={8} fill="#C98B4A" stroke={INK} strokeWidth={3} />
      <Rect x={20} y={30} width={24} height={14} rx={3} fill="#fff" stroke={INK} strokeWidth={2.5} />
    </>
  ),
  flour: (
    <>
      <Path d="M18 16 L22 10 H42 L46 16 V54 H18 Z" fill="#FFF6E5" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M26 30 C30 24 34 24 38 30 C34 36 30 36 26 30 Z" fill="#E9B872" stroke={INK} strokeWidth={2} />
    </>
  ),
  spices: (
    <>
      <Rect x={22} y={8} width={20} height={10} rx={2} fill="#E07A3F" stroke={INK} strokeWidth={3} />
      <Rect x={18} y={18} width={28} height={38} rx={5} fill="#fff" stroke={INK} strokeWidth={3} />
      <Path d="M24 38 C28 30 36 30 40 38" fill="none" stroke="#2E9E5B" strokeWidth={4} strokeLinecap="round" />
    </>
  ),
};

export type StickerName = keyof typeof art;

export const stickerNames = Object.keys(art) as StickerName[];

export function isStickerName(value: string): value is StickerName {
  return value in art;
}

type StickerProps = {
  name: StickerName;
  size?: number;
  background?: string;
};

export function Sticker({ name, size = 40, background = colors.surface }: StickerProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: background,
        borderWidth: size >= 100 ? 3 : 2,
        borderColor: colors.ink,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={size * 0.72} height={size * 0.72} viewBox="0 0 64 64">
        {art[name]}
      </Svg>
    </View>
  );
}
