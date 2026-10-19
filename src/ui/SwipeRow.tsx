/**
 * Swipe-to-delete without a gesture library: the row is a horizontal,
 * snapping UIScrollView (native physics and rubber-banding) that reveals a
 * red "Eliminar" action, the same affordance as Mail or Reminders.
 */
import { useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { C, T } from './theme';

const ACTION_W = 88;

export function SwipeRow({ children, onDelete, deleteLabel }: { children: ReactNode; onDelete: () => void; deleteLabel: string }) {
  const [width, setWidth] = useState(0);
  const ref = useRef<ScrollView>(null);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  return (
    <View onLayout={onLayout}>
      {width > 0 ? (
        <ScrollView
          ref={ref}
          horizontal
          bounces={false}
          showsHorizontalScrollIndicator={false}
          snapToOffsets={[0, ACTION_W]}
          decelerationRate="fast"
          disableIntervalMomentum
          directionalLockEnabled
        >
          <View style={{ width }}>{children}</View>
          <Pressable
            onPress={() => { ref.current?.scrollTo({ x: 0, animated: false }); onDelete(); }}
            accessibilityRole="button"
            accessibilityLabel={deleteLabel}
            style={styles.action}
          >
            <Text style={styles.actionText}>{deleteLabel}</Text>
          </Pressable>
        </ScrollView>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  action: { width: ACTION_W, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center' },
  actionText: { ...T.subhead, fontWeight: '600', color: '#fff' },
});
