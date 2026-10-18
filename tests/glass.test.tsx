/**
 * PHASE N-1 validation — Apple Material Foundation.
 *
 * Proves the N-1 material layer actually renders and behaves, instead of relying
 * on `tsc` + `expo export` alone. Covers:
 *   · src/theme/glass.ts token integrity (resolvers, intensity range, tints)
 *   · GlassSurface / GlassCard render their children
 *   · GlassButton visual states: default, pressed, disabled
 *
 * Nothing here touches existing screens. Safe to delete if a strictly
 * four-file N-1 delivery is wanted.
 */
import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { BlurView } from 'expo-blur';
import {
  glassBlur,
  glassMaterial,
  glassTint,
  resolveGlassPadding,
  resolveGlassRadius,
  glassRadius,
  glassSpacing,
  type GlassVariant,
} from '../src/theme/glass';
import { GlassSurface } from '../src/components/glass/GlassSurface';
import { GlassCard } from '../src/components/glass/GlassCard';
import { GlassButton } from '../src/components/glass/GlassButton';

const VARIANTS: GlassVariant[] = ['light', 'medium', 'strong'];

describe('glass tokens (src/theme/glass.ts)', () => {
  it('keeps every blur intensity inside expo-blur\'s documented 1..100 range', () => {
    VARIANTS.forEach((v) => {
      expect(glassBlur[v]).toBeGreaterThanOrEqual(1);
      expect(glassBlur[v]).toBeLessThanOrEqual(100);
    });
  });

  it('only uses tints from expo-blur\'s BlurTint union', () => {
    const LEGAL = [
      'light', 'dark', 'default', 'extraLight', 'regular', 'prominent',
      'systemUltraThinMaterial', 'systemThinMaterial', 'systemMaterial',
      'systemThickMaterial', 'systemChromeMaterial',
    ];
    VARIANTS.forEach((v) => expect(LEGAL).toContain(glassTint[v]));
  });

  it('gives each density a distinct, increasing material weight', () => {
    expect(glassBlur.light).toBeLessThan(glassBlur.medium);
    expect(glassBlur.medium).toBeLessThan(glassBlur.strong);
  });

  it('resolves padding from both token names and raw points', () => {
    expect(resolveGlassPadding('md')).toBe(glassSpacing.md);
    expect(resolveGlassPadding('none')).toBe(0);
    expect(resolveGlassPadding(23)).toBe(23);
    expect(resolveGlassPadding(undefined)).toBe(0);
    expect(resolveGlassPadding(undefined, 9)).toBe(9);
  });

  it('resolves radius from both token names and raw points', () => {
    expect(resolveGlassRadius('pill', 0)).toBe(glassRadius.pill);
    expect(resolveGlassRadius('sm', 0)).toBe(glassRadius.sm);
    expect(resolveGlassRadius(14, 0)).toBe(14);
    expect(resolveGlassRadius(undefined, glassRadius.lg)).toBe(glassRadius.lg);
  });

  it('defines a complete material for every density', () => {
    VARIANTS.forEach((v) => {
      const m = glassMaterial[v];
      expect(m.tint).toBeTruthy();
      expect(m.intensity).toBe(glassBlur[v]);
      expect(m.radius).toBeGreaterThan(0);
      // V2: colours are light/dark adaptive (DynamicColorIOS on iOS), so assert
      // on the light value when the token is a dynamic colour object.
      const light = (c: unknown) =>
        typeof c === 'string' ? c : (c as { dynamic: { light: string } }).dynamic.light;
      expect(light(m.fallbackBackground)).toMatch(/^rgba\(/);
      expect(light(m.fallbackBorder)).toMatch(/^rgba\(/);
      expect(m.shadow).toBeDefined();
    });
  });
});

describe('GlassSurface', () => {
  it('renders its children', () => {
    const { getByText } = render(
      <GlassSurface><Text>material-child</Text></GlassSurface>,
    );
    expect(getByText('material-child')).toBeTruthy();
  });

  it('renders every density without throwing', () => {
    VARIANTS.forEach((v) => {
      const { getByText } = render(
        <GlassSurface variant={v}><Text>{`child-${v}`}</Text></GlassSurface>,
      );
      expect(getByText(`child-${v}`)).toBeTruthy();
    });
  });

  it('falls back to a plain translucent View when blur={false}', () => {
    const { getByText, UNSAFE_queryAllByType } = render(
      <GlassSurface blur={false}><Text>fallback-child</Text></GlassSurface>,
    );
    expect(getByText('fallback-child')).toBeTruthy();
    // No BlurView should be mounted on the explicit-fallback path.
    expect(UNSAFE_queryAllByType(BlurView).length).toBe(0);
  });

  it('mounts a BlurView when blur is explicitly enabled', () => {
    const { getByText, UNSAFE_queryAllByType } = render(
      <GlassSurface blur><Text>blur-child</Text></GlassSurface>,
    );
    expect(getByText('blur-child')).toBeTruthy();
    // blur={true} bypasses platform detection, so the BlurView must mount and
    // carry the resolved token values (verified deterministically on any host).
    const blurs = UNSAFE_queryAllByType(BlurView);
    expect(blurs.length).toBe(1);
    expect(blurs[0].props.intensity).toBe(glassMaterial.medium.intensity);
    expect(blurs[0].props.tint).toBe(glassMaterial.medium.tint);
  });

  it('passes the variant tokens through to the BlurView', () => {
    const { UNSAFE_queryAllByType } = render(
      <GlassSurface variant="strong" blur><Text>strong-child</Text></GlassSurface>,
    );
    const blurs = UNSAFE_queryAllByType(BlurView);
    expect(blurs.length).toBe(1);
    expect(blurs[0].props.intensity).toBe(glassMaterial.strong.intensity);
    expect(blurs[0].props.tint).toBe(glassMaterial.strong.tint);
  });
});

describe('GlassCard', () => {
  it('renders its children', () => {
    const { getByText } = render(<GlassCard><Text>card-child</Text></GlassCard>);
    expect(getByText('card-child')).toBeTruthy();
  });

  it('renders every density without throwing', () => {
    VARIANTS.forEach((v) => {
      const { getByText } = render(
        <GlassCard variant={v}><Text>{`card-${v}`}</Text></GlassCard>,
      );
      expect(getByText(`card-${v}`)).toBeTruthy();
    });
  });
});

describe('GlassButton', () => {
  it('renders its label in the default state', () => {
    const { getByRole } = render(<GlassButton title="Buscar" onPress={jest.fn()} />);
    const btn = getByRole('button');
    expect(btn.props.accessibilityLabel).toBe('Buscar');
    expect(btn.props.accessibilityState).toEqual({ disabled: false });
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByRole } = render(<GlassButton title="Ir" onPress={onPress} />);
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('blocks interaction and exposes the disabled state', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <GlassButton title="Bloqueado" onPress={onPress} disabled />,
    );
    const btn = getByRole('button');
    expect(btn.props.accessibilityState).toEqual({ disabled: true });
    fireEvent.press(btn);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('honours a custom accessibilityLabel and icon', () => {
    const { getByRole, getByText } = render(
      <GlassButton
        title="Recargar"
        onPress={jest.fn()}
        accessibilityLabel="Recargar tarjeta Mugi"
        icon={<Text>icon-node</Text>}
      />,
    );
    expect(getByRole('button').props.accessibilityLabel).toBe('Recargar tarjeta Mugi');
    expect(getByText('icon-node')).toBeTruthy();
  });
});
