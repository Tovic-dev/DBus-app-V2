import { Text, View } from 'react-native';
import { routeColor } from '../design/routeColors';

/**
 * Transit line badge in the Apple Maps style: a rounded rectangle in the
 * line colour with the number in bold white. Same colour on every screen.
 */
export function LineBadge({ name, size = 'regular', color }: { name: string; size?: 'small' | 'regular' | 'large'; color?: string }) {
  const h = size === 'small' ? 20 : size === 'large' ? 34 : 26;
  const fs = size === 'small' ? 12 : size === 'large' ? 19 : 15;
  return (
    <View
      accessibilityLabel={name}
      style={{
        minWidth: h + 6,
        height: h,
        paddingHorizontal: size === 'small' ? 5 : 7,
        borderRadius: size === 'large' ? 9 : 6,
        borderCurve: 'continuous',
        backgroundColor: color ?? routeColor(name),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text allowFontScaling={false} style={{ color: '#fff', fontSize: fs, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
        {name}
      </Text>
    </View>
  );
}
