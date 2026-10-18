/**
 * PHASE N-2 — Glass material sandbox (dev-only visual harness).
 *
 * Renders every material created in Phase N-1 so blur, translucency, contrast,
 * legibility, shadows and dark-mode behaviour can be inspected on a real device
 * (iPhone 15 + Expo Go SDK 57) before any production component is migrated.
 *
 * ── ROUTE ──
 *   Reachable ONLY at `/dev/glass` (deep link, Expo Go URL, or manual
 *   `router.push('/dev/glass')`). Nothing links to it: no tab, no screen and no
 *   layout was modified. expo-router registers file-based routes automatically —
 *   the same mechanism `app/live/[routeId].tsx` relies on while remaining absent
 *   from app/_layout.tsx — so this file adds a route WITHOUT editing navigation.
 *   It inherits the root Stack's default header (title + back button).
 *
 * ── COMPATIBILITY (audited before writing any code) ──
 *   Expo SDK 57.0.16 · React Native 0.86.3 · React 19.2.3 · expo-blur 57.0.2
 *   (`npm ls expo-blur` → single clean version) · Expo Go.
 *   Imports ONLY: React Native core (ScrollView/View/Text/StyleSheet),
 *   react-native-safe-area-context (already used by every screen; ships in Expo
 *   Go), and the N-1 glass components + tokens.
 *   NOT used: react-native-reanimated, react-native-gesture-handler,
 *   @gorhom/bottom-sheet, @shopify/react-native-skia, react-native-maps.
 *   None are installed (`node_modules` check → all absent). No dependency added.
 *
 * ── NO ANIMATIONS ──
 *   Per the N-2 spec this screen adds no animation of its own. No Animated value
 *   is created here; the only motion anywhere is GlassButton's own N-1 press
 *   spring, which is intrinsic to that component. The map backdrop is a static
 *   composition — static `rotate` transforms are style, not animation.
 *
 * ── NO GLOBAL CHANGES ──
 *   app.json stays `userInterfaceStyle: "light"`, so all materials resolve to
 *   their light variants. The dark section therefore paints a dark BACKDROP to
 *   test the material's translucency and contrast against darkness — it does not
 *   (and must not) switch the app into dark mode. Labels stay `colors.ink`
 *   because a light-mode material renders as a light panel; white text on it
 *   would be illegible by design, not a material defect.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassSurface } from '../../src/components/glass/GlassSurface';
import { GlassCard } from '../../src/components/glass/GlassCard';
import { GlassButton } from '../../src/components/glass/GlassButton';
import { glassMaterial, type GlassVariant } from '../../src/theme/glass';
import { colors, hig, layout, radius, spacing } from '../../src/design/tokens';

const VARIANTS: GlassVariant[] = ['light', 'medium', 'strong'];

/** No-op handler: the sandbox must never navigate anywhere. */
const noop = () => {};

/**
 * Sample content placed inside a material so contrast and legibility can be
 * judged. Shows the resolved N-1 token values, which makes the visual inspection
 * self-documenting on device (tint / intensity / radius actually in use).
 */
function MaterialSample({ variant }: { variant: GlassVariant }) {
  const m = glassMaterial[variant];
  return (
    <>
      <Text style={styles.sampleTitle}>Glass {variant}</Text>
      <Text style={styles.sampleMeta}>
        {m.tint} · intensity {m.intensity} · radius {m.radius}
      </Text>
      <Text style={styles.sampleBody}>
        Texto de prueba para verificar contraste y legibilidad sobre el material.
      </Text>
    </>
  );
}

/** Section heading (numbered, per the N-2 spec layout). */
function Heading({ index, title, note }: { index: number; title: string; note?: string }) {
  return (
    <View style={styles.heading}>
      <Text style={styles.headingTitle}>{index}. {title}</Text>
      {note ? <Text style={styles.headingNote}>{note}</Text> : null}
    </View>
  );
}

/**
 * Static composition simulating a map view (the spec explicitly allows this
 * instead of react-native-maps).
 *
 * Built from plain `View`s: a land base, a river/bay, city blocks, roads (static
 * `rotate` transforms — style, not animation) and two stop pins. Its purpose is
 * to give the glass a BUSY, multi-coloured backdrop, because a blur is only
 * visible when there is something underneath it worth blurring. A flat colour
 * would make every variant look identical and prove nothing.
 *
 * Touch handling: the stage and the foreground wrapper use `box-none`, while each
 * decorative layer is `none`. That combination keeps the decorations
 * non-interactive without disabling the materials nested inside the foreground —
 * see the inline note on the stage for why `none` would be wrong there.
 */
function MapBackdrop({ children }: { children: React.ReactNode }) {
  return (
    // box-none (NOT none): `none` would disable touches on every descendant,
    // making the GlassButton inside unresponsive. box-none keeps this container
    // non-touchable while letting the foreground children stay interactive.
    <View style={map.backdrop} pointerEvents="box-none">
      {/* Water: the bay on the left / river diagonal. */}
      <View style={map.water} pointerEvents="none" />
      <View style={map.river} pointerEvents="none" />

      {/* City blocks — irregular so the blur has real edges to soften. */}
      <View style={[map.block, map.blockA]} pointerEvents="none" />
      <View style={[map.block, map.blockB]} pointerEvents="none" />
      <View style={[map.block, map.blockC]} pointerEvents="none" />
      <View style={[map.block, map.blockD]} pointerEvents="none" />
      <View style={[map.block, map.blockE]} pointerEvents="none" />
      <View style={[map.block, map.blockF]} pointerEvents="none" />
      <View style={[map.block, map.blockG]} pointerEvents="none" />

      {/* Green areas (Alderdi Eder / Parque de Aiete feel). */}
      <View style={[map.park, map.parkA]} pointerEvents="none" />
      <View style={[map.park, map.parkB]} pointerEvents="none" />

      {/* Roads: one avenue, one diagonal, two cross streets. */}
      <View style={[map.road, map.roadMain]} pointerEvents="none" />
      <View style={[map.road, map.roadDiag]} pointerEvents="none" />
      <View style={[map.road, map.roadCross1]} pointerEvents="none" />
      <View style={[map.road, map.roadCross2]} pointerEvents="none" />

      {/* Stop pins — the DBus brand green gives a high-saturation blur test. */}
      <View style={[map.pin, map.pinA]} pointerEvents="none">
        <Text style={map.pinText}>5</Text>
      </View>
      <View style={[map.pin, map.pinB]} pointerEvents="none">
        <Text style={map.pinText}>28</Text>
      </View>

      {/* Foreground content is re-enabled for touch (materials are interactive). */}
      <View style={map.foreground} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
}

export default function GlassSandboxScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + layout.bottomScroll }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Glass Material Sandbox</Text>
      <Text style={styles.subtitle}>
        Phase N-2 · ruta de desarrollo aislada. No enlazada desde ninguna pantalla.
      </Text>

      {/* ── 1. GlassSurface ───────────────────────────────────────────────── */}
      <Heading index={1} title="GlassSurface" note="light · medium · strong" />
      <View style={styles.stack}>
        {VARIANTS.map((v) => (
          <GlassSurface key={v} variant={v}>
            <MaterialSample variant={v} />
          </GlassSurface>
        ))}
      </View>

      {/* ── 2. GlassCard ──────────────────────────────────────────────────── */}
      <Heading index={2} title="GlassCard" note="light · medium · strong" />
      <View style={styles.stack}>
        {VARIANTS.map((v) => (
          <GlassCard key={v} variant={v}>
            <MaterialSample variant={v} />
          </GlassCard>
        ))}
      </View>

      {/* ── 3. GlassButton ────────────────────────────────────────────────── */}
      <Heading index={3} title="GlassButton" note="estado normal · estado disabled" />
      <View style={styles.stack}>
        <GlassButton title="Estado normal" onPress={noop} />
        <GlassButton title="Estado normal (medium)" onPress={noop} variant="medium" />
        <GlassButton title="Estado normal (light)" onPress={noop} variant="light" />
        <GlassButton title="Estado disabled" onPress={noop} disabled />
      </View>

      {/* ── 4. Fondo claro ────────────────────────────────────────────────── */}
      <Heading
        index={4}
        title="Fondo claro"
        note="materials over a light canvas (colors.parchment)"
      />
      <View style={[styles.backdropBox, styles.backdropLight]}>
        {VARIANTS.map((v) => (
          <GlassCard key={v} variant={v}>
            <MaterialSample variant={v} />
          </GlassCard>
        ))}
        <GlassButton title="Sobre fondo claro" onPress={noop} />
      </View>

      {/* ── 5. Fondo oscuro ───────────────────────────────────────────────── */}
      <Heading
        index={5}
        title="Fondo oscuro"
        note="translucency + contrast against darkness"
      />
      <View style={[styles.backdropBox, styles.backdropDark]}>
        <Text style={styles.darkNote}>
          app.json sigue en userInterfaceStyle: "light", así que los materiales
          usan su variante clara. Se prueba aquí su transparencia y contraste
          sobre un fondo oscuro, no el modo oscuro del sistema.
        </Text>
        {VARIANTS.map((v) => (
          <GlassCard key={v} variant={v}>
            <MaterialSample variant={v} />
          </GlassCard>
        ))}
        <GlassButton title="Sobre fondo oscuro" onPress={noop} />
      </View>

      {/* ── 6. Fondo mapa ─────────────────────────────────────────────────── */}
      <Heading
        index={6}
        title="Fondo mapa"
        note="static composition — no react-native-maps"
      />
      <MapBackdrop>
        {VARIANTS.map((v) => (
          <GlassCard key={v} variant={v}>
            <MaterialSample variant={v} />
          </GlassCard>
        ))}
        <GlassSurface variant="strong">
          <Text style={styles.sampleTitle}>Panel flotante (strong)</Text>
          <Text style={styles.sampleMeta}>
            Simula una hoja / toolbar sobre el mapa.
          </Text>
        </GlassSurface>
        <GlassButton title="Sobre fondo mapa" onPress={noop} />
      </MapBackdrop>

      <Text style={styles.footnote}>
        Inspección visual: blur real, transparencias, contraste, legibilidad,
        sombras y rendimiento en iPhone 15 + Expo Go SDK 57.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingBottom: layout.bottomScroll },
  title: {
    fontSize: hig('largeTitle').size,
    fontWeight: '700',
    letterSpacing: hig('largeTitle').ls,
    color: colors.ink,
    paddingHorizontal: layout.contentMargin,
    marginTop: spacing.sm,
  },
  subtitle: {
    fontSize: hig('footnote').size,
    color: colors.muted48,
    paddingHorizontal: layout.contentMargin,
    marginTop: spacing.xxs,
    marginBottom: spacing.md,
  },
  heading: {
    paddingHorizontal: layout.contentMargin,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  headingTitle: {
    fontSize: hig('title3').size,
    fontWeight: '700',
    letterSpacing: hig('title3').ls,
    color: colors.ink,
  },
  headingNote: {
    fontSize: hig('caption').size,
    color: colors.muted48,
    marginTop: 2,
  },
  // Vertical stack of materials with the product's standard card gap.
  stack: {
    gap: layout.cardGap,
    paddingHorizontal: layout.contentMargin,
  },
  // Backdrop sections 4 and 5: a coloured canvas with its own inner padding so
  // the materials have something of a different tone underneath them.
  backdropBox: {
    gap: layout.cardGap,
    marginHorizontal: layout.contentMargin,
    padding: spacing.sm,
    borderRadius: radius.lg,
  },
  backdropLight: { backgroundColor: colors.parchment },
  backdropDark: { backgroundColor: colors.tile1 },
  darkNote: {
    fontSize: hig('caption').size,
    // Light text here is correct: this label sits directly on the DARK backdrop,
    // not on a material. (Labels inside materials stay dark by design.)
    color: colors.bodyOnDark,
    lineHeight: 18,
    marginBottom: spacing.xxs,
  },
  footnote: {
    textAlign: 'center',
    fontSize: hig('caption').size,
    color: colors.muted48,
    marginTop: spacing.xl,
    paddingHorizontal: layout.contentMargin,
    lineHeight: 18,
  },
  // Sample content INSIDE a material. Colour is always colors.ink: the app is
  // locked to light mode, so every material resolves to a light panel and dark
  // text is the legible combination. White text would be illegible by design.
  sampleTitle: {
    fontSize: hig('headline').size,
    fontWeight: '700',
    letterSpacing: hig('headline').ls,
    color: colors.ink,
  },
  sampleMeta: {
    fontSize: hig('caption').size,
    color: colors.bodyMuted,
    marginTop: 2,
  },
  sampleBody: {
    fontSize: hig('subheadline').size,
    color: colors.ink,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
});

/**
 * Static map composition styles.
 *
 * ── SIZING (deliberate) ──
 *   The stage has NO fixed height: it carries only a `minHeight`. The foreground
 *   content stays in NORMAL FLOW (not absolutely positioned), so it drives the
 *   stage height and can never be clipped, while the decorative layers are
 *   absolutely positioned behind it. Because React Native paints later siblings
 *   on top, the in-flow foreground naturally sits ABOVE the decorations — which
 *   is exactly what makes the blur observable (a blur samples what is behind it).
 *
 *   An earlier draft used a fixed 420pt stage with an `absoluteFillObject`
 *   foreground; the content (~520pt: 3 cards + surface + button + gaps) would
 *   have overflowed and been clipped by `overflow: 'hidden'`. Flow layout removes
 *   the magic number entirely.
 *
 * Rotations are static `transform` style values, not animations.
 */
const map = StyleSheet.create({
  backdrop: {
    minHeight: 480,
    marginHorizontal: layout.contentMargin,
    borderRadius: radius.lg,
    overflow: 'hidden',
    // Land base (Apple Maps light land tone).
    backgroundColor: '#e8e6df',
  },
  foreground: {
    // Normal flow: drives the stage height and renders above the decorations.
    gap: layout.cardGap,
    padding: spacing.sm,
    justifyContent: 'center',
  },
  // Water: bay strip + a diagonal river.
  water: {
    position: 'absolute',
    left: -30,
    top: -40,
    bottom: -40,
    width: 130,
    backgroundColor: '#a9cbe3',
    transform: [{ rotate: '-8deg' }],
  },
  river: {
    position: 'absolute',
    left: 120,
    top: 250,
    width: 340,
    height: 26,
    backgroundColor: '#b8d4e8',
    transform: [{ rotate: '-14deg' }],
  },
  // City blocks.
  block: { position: 'absolute', backgroundColor: '#dcd9d0', borderRadius: 3 },
  blockA: { left: 150, top: 40, width: 90, height: 70 },
  blockB: { left: 258, top: 30, width: 120, height: 54 },
  blockC: { left: 160, top: 130, width: 70, height: 84 },
  blockD: { left: 248, top: 108, width: 104, height: 62 },
  blockE: { left: 300, top: 196, width: 96, height: 74 },
  blockF: { left: 96, top: 300, width: 88, height: 60 },
  blockG: { left: 210, top: 310, width: 130, height: 66 },
  // Parks.
  park: { position: 'absolute', backgroundColor: '#c3d9b4', borderRadius: 6 },
  parkA: { left: 196, top: 208, width: 86, height: 62 },
  parkB: { left: 356, top: 96, width: 70, height: 88 },
  // Roads: white strokes over the land. Percentage/full-span lengths so they
  // still cover the stage whatever height the content resolves to.
  road: { position: 'absolute', backgroundColor: '#ffffff' },
  roadMain: { left: 0, top: 118, width: '100%', height: 10 },
  roadDiag: { left: 40, top: 60, width: 420, height: 8, transform: [{ rotate: '22deg' }] },
  roadCross1: { left: 146, top: 0, width: 8, height: '100%' },
  roadCross2: { left: 368, top: 0, width: 8, height: '100%' },
  // Stop pins (DBus brand green).
  pin: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  pinA: { left: 176, top: 152 },
  pinB: { left: 300, top: 250 },
  pinText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
});



