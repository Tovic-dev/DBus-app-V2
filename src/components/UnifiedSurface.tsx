/**
 * UnifiedSurface — Apple Maps "one physical object" bottom surface (Phase F).
 *
 * Rebuilt in Phase I-30 with RN CORE Animated + PanResponder:
 *   - NO react-native-reanimated, NO @gorhom/bottom-sheet, NO RNGH.
 *   - Bisection (Phases I-24…29) proved the Expo Go SDK 57 binary on the
 *     test device crashes with the SDK-recommended JS of both
 *     react-native-gesture-handler (2.32.0) and react-native-reanimated
 *     (4.5.1): the Software Mansion natives embedded in Go lag behind the
 *     JS versions the SDK requires. Core Animated is part of RN itself and
 *     is always present in Expo Go.
 *   - Drag: PanResponder (vertical-only claim so taps/map keep working).
 *   - Snapping: Animated.spring (velocity aware, interruptible via stop).
 *
 * Same public API as previous versions:
 *   <UnifiedSurface visible snap onSnapChange>{(snap) => …}</UnifiedSurface>
 */
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type ReactNode } from 'react';
import { View, StyleSheet, Dimensions, PanResponder, Animated, Easing } from 'react-native';
import { radius, productShadow, colors } from '../design/tokens';
import { GlassSurface } from '../design/surfaces';
import { isLiquidGlassAvailable } from 'expo-glass-effect';

/** V2 · On iOS 26 the sheet is real Liquid Glass, so the opaque base behind it
 *  is dropped and the map reads through the material (Apple Maps). */
const SHEET_BASE = isLiquidGlassAvailable() ? 'transparent' : colors.pearl;
import { sheetSpring } from '../design/motion';

export type Snap = 0 | 1 | 2; // collapsed (peek) | medium | expanded

/** Imperative API: lets the consumer start the hide animation synchronously in
    the tap handler, before any state update / re-render round-trip. */
export interface UnifiedSurfaceHandle {
  dismiss: () => void;
}

/** Apple Maps-inspired snap points (fraction of screen height). */
const SNAP_FRACTIONS = [0.16, 0.46, 0.82];
export const SURFACE_SEAM = 4; // visual seam between sheet and tab capsule (pt) -- tightened so sheet + tab bar read as one continuous material (Apple Maps), not two stacked capsules

/** Height reserved for the grabber strip above the content. */
const GRABBER_AREA = 20;

const readValue = (v: Animated.Value): number =>
  (v as unknown as { __getValue?: () => number }).__getValue?.() ?? 0;

export const UnifiedSurface = forwardRef<UnifiedSurfaceHandle, {
  visible: boolean;
  snap: Snap;
  onSnapChange: (s: Snap) => void;
  /** Called when the user drags the sheet fully down: the consumer must clear
      its selection so `visible` becomes false and state stays in sync. */
  onDismiss?: () => void;
  /**
   * Bottom offset of the resting surface the sheet morphs OUT of (Apple Maps
   * "the bottom pill extends upward" behaviour). While open, the sheet starts
   * anchored at the tab-bar capsule (bottom = restInset, fully rounded) and
   * springs down to the screen edge (bottom = 0, square bottom corners) as it
   * rises — so the navigation pill itself reads as growing into the card.
   */
  restInset?: number;
  children: (snap: Snap) => ReactNode;
}>(function UnifiedSurface({ visible, snap, onSnapChange, onDismiss, restInset = 0, children }, ref) {
  const [current, setCurrent] = useState<Snap>(snap);
  // The sheet anchors to the BOTTOM EDGE of the screen (full width), covering
  // the floating tab bar while it is open — Apple Maps place-card behaviour.
  // The tab bar hides itself via tabBarVisibility; the consumer's content
  // bottom padding (sheetBody) clears the home-indicator safe area. The entry
  // morph starts from the tab-bar capsule via the `restInset` prop.

  const { height: screenH } = Dimensions.get('window');

  const heights = useMemo(() => SNAP_FRACTIONS.map((f) => Math.round(screenH * f)), [screenH]);
  const maxH = heights[2] + GRABBER_AREA;
  const hiddenTy = maxH + 16;
  const tyFor = (s: number) => (s < 0 ? hiddenTy : maxH - heights[s]);

  // Downward translation of the (always max-height) sheet container.
  const ty = useRef(new Animated.Value(hiddenTy)).current;
  const dragFrom = useRef(0);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const cbRef = useRef(onSnapChange);
  cbRef.current = onSnapChange;
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  const springTo = (target: number, velocity?: number) => {
    animRef.current?.stop();
    const anim = Animated.spring(ty, {
      toValue: target,
      // JS driver: the native animated module on Expo Go (Fabric) silently
      // fails to run this spring (sheet never leaves the hidden position).
      // The morph layer is already JS-driven; one consistent JS-driven sheet
      // is correct and fast enough for a bottom card.
      useNativeDriver: false,
      // Apple Maps feel: centralized preset (design/motion.ts sheetSpring).
      ...sheetSpring,
      ...(velocity !== undefined ? { velocity } : {}),
    });
    animRef.current = anim;
    anim.start();
  };

  // Fast, deterministic hide: a short ease-out timing starts moving on the
  // very first frame (a spring "winds up" before visibly moving, which reads
  // as input lag when dismissing).
  const hideFast = useCallback(() => {
    animRef.current?.stop();
    const anim = Animated.timing(ty, {
      toValue: hiddenTy,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animRef.current = anim;
    anim.start();
  }, [hiddenTy, ty]);

  useImperativeHandle(ref, () => ({ dismiss: hideFast }), [hideFast]);

  const commitSnap = (s: Snap) => {
    setCurrent(s);
    cbRef.current(s);
  };

  // Open/close/snap from props.
  useEffect(() => {
    if (visible) {
      springTo(tyFor(snap));
      setCurrent(snap);
    } else {
      hideFast();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, snap, hideFast]);

  // ── Pill→sheet morph ────────────────────────────────────────────────────
  // JS-driven (layout props `bottom`/borderRadius are not native-driver
  // friendly). While the sheet is open these rest at 0; the entry animation
  // starts them at the tab-bar capsule geometry so the sheet visually grows
  // out of the pill. `pillR` must match geometry.squircleLarge (tab capsule).
  const PILL_R = 28;
  const restVal = useRef(new Animated.Value(0)).current;
  const radiusVal = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) {
      // Start the entry morph AT the pill geometry, then spring to the sheet.
      restVal.setValue(restInset);
      radiusVal.setValue(PILL_R);
      Animated.spring(restVal, { toValue: 0, ...sheetSpring, useNativeDriver: false }).start();
      Animated.spring(radiusVal, { toValue: 0, ...sheetSpring, useNativeDriver: false }).start();
    } else {
      // Fully neutral while hidden: any non-zero `bottom` here lifts the
      // off-screen sheet back into view (the "always visible" bug).
      restVal.setValue(0);
      radiusVal.setValue(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, restInset]);


  // Core RN gesture: claim the responder only for clear vertical drags so
  // taps/Pressables and the map keep working.
  // Two-state sheet (product decision): HIDDEN or EXTENDED (snap 1). Dragging
  // past the dismiss threshold (or flinging down) hides the sheet completely
  // and fires onDismiss so the consumer clears its selection.
  const settle = (tyNow: number, vy?: number) => {
    const openTy = tyFor(1);
    const dismissThreshold = openTy + (hiddenTy - openTy) * 0.2;
    const projected = tyNow + (vy ?? 0) * 160;
    const velocity = vy !== undefined ? Math.max(-2.5, Math.min(2.5, vy)) : undefined;
    if (projected > dismissThreshold) {
      springTo(hiddenTy, velocity);
      cbRef.current(0);
      dismissRef.current?.();
    } else {
      springTo(openTy, velocity);
      commitSnap(1);
    }
  };

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 8 && Math.abs(g.dy) > 1.2 * Math.abs(g.dx),
        onPanResponderGrant: () => {
          animRef.current?.stop();
          dragFrom.current = readValue(ty);
        },
        onPanResponderMove: (_e, g) => {
          // Clamp to the [extended, hidden] range — no intermediate snaps.
          ty.setValue(Math.min(Math.max(dragFrom.current + g.dy, tyFor(1)), hiddenTy));
        },
        onPanResponderRelease: (_e, g) => settle(readValue(ty), g.vy),
        onPanResponderTerminate: () => settle(readValue(ty)),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [maxH, hiddenTy, heights[1]],
  );

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        styles.sheet,
        { height: maxH },
        // Native-driven transform MUST live on its own layer: mixing it with
        // JS-driven layout props (bottom/radius) in one style makes the native
        // animated module try to animate `bottom`, which it does not support.
        { transform: [{ translateY: ty }] },
      ]}
    >
      {/* JS-driven morph layer (bottom + bottom radii), nested so the native
          transform above is never serialised together with these props. */}
      <Animated.View
        {...pan.panHandlers}
        style={{
          flex: 1,
          overflow: 'hidden',
          backgroundColor: SHEET_BASE,
          bottom: restVal,
          borderBottomLeftRadius: radiusVal,
          borderBottomRightRadius: radiusVal,
        }}
      >
      {/* Material: reuse the M-1 GlassSurface ('sheet' variant) instead of
          duplicating a translucent background. safeAreaTop=false because the
          sheet already owns its geometry (bottomInset + snap progress); adding
          the top safe-area here would shift the grabber under the status bar. */}
      <GlassSurface
        variant="sheet"
        safeAreaTop={false}
        style={[styles.material, styles.shadowReset]}
      >
        <View style={styles.grabberArea} pointerEvents="box-none">
          <View style={sheetStyles.grabber} />
        </View>
        <View style={styles.content}>{children(current)}</View>
      </GlassSurface>
      </Animated.View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    // Anchor to the screen BOTTOM: `ty` is computed as (maxH - snapHeight),
    // which is only correct when the resting top of the sheet is at
    // (screenH - maxH). Without this, Yoga places the un-anchored absolute
    // view at top: 0 and the "hidden" translate leaves a visible strip at
    // the bottom (the sheet-reads-always-open bug).
    bottom: 0,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    // Near-opaque base moved to the inner morph layer so rounded bottom corners
    // render correctly during the pill→sheet morph; the outer layer carries the
    // shadow only. The GlassSurface material covers it fully.
    ...productShadow,
  },
  material: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  // The GlassSurface 'sheet' variant bakes in softShadow; the outer container
  // already provides productShadow, so neutralise the redundant inner shadow.
  shadowReset: {
    elevation: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  // Ergonomic touch strip around the grabber (comfortably tappable while the
  // collapsed sheet is used to peek). Balanced so the grabber sits ~10pt from
  // the sheet top and content begins ~12pt below it — Apple Maps proportions.
  grabberArea: { paddingVertical: 4 },
  content: { paddingHorizontal: 0, paddingBottom: 16 },
});

// Apple Maps-style grabber: short, thin, softly rounded, centred with balanced
// spacing so the collapsed peek reads as a single premium handle.
const sheetStyles = StyleSheet.create({
  grabber: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(127,127,127,0.4)', // reads in light and dark
    alignSelf: 'center',
    marginTop: 6,
    marginBottom: 8,
  },
});
