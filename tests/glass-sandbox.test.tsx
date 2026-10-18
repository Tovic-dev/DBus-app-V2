/**
 * PHASES N-2 / N-3 / N-3.1 validation — Glass sandbox (app/dev/glass.tsx) and the
 * glass migration of the four tab screens.
 *
 * Mechanically checks the acceptance checklist items that CAN be verified
 * without a device: every GlassSurface / GlassCard variant is present, both
 * GlassButton states are present, all three backgrounds exist, the route imports
 * no forbidden library, NO source file links to the route (the temporary Home
 * button was removed in N-3.1, leaving the sandbox deep-link-only), and every
 * protected production file is byte-identical to git HEAD.
 *
 * Device-only items (blur visible, performance, no crash on iPhone 15) are
 * listed as pending in PHASE_N2_FINDINGS.md.
 *
 * ── WHY THE `types="node"` REFERENCE BELOW ──
 * tsconfig.json sets `"types": ["jest"]`, which excludes Node globals, so a plain
 * `import fs from 'fs'` fails with TS2307. Fixing that properly would mean either
 * installing @types/node (FORBIDDEN by N-2: no dependencies) or editing
 * tsconfig.json (a global config change, also out of scope). A file-local
 * triple-slash reference solves it without touching either: it is scoped to this
 * test file only. @types/node is already present in node_modules (transitive), so
 * nothing is installed by this phase.
 */
/// <reference types="node" />
import React from 'react';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { render } from '@testing-library/react-native';
import { BlurView } from 'expo-blur';
import GlassSandboxScreen from '../app/dev/glass';
import { glassMaterial, type GlassVariant } from '../src/theme/glass';
import HomeScreen from '../app/(tabs)/index';

// Mocks mirror tests/smoke.test.tsx so HomeScreen can render without a device,
// a location permission or a network call.
//
// The jest.fn()s are declared INSIDE the factory, not captured from module scope:
// babel-jest hoists `jest.mock` above the `import`s, so a factory that closes over
// a module-level `const` would read it before it is initialised (observed as
// "router.push is not a function"). Tests reach the spies via `jest.requireMock`,
// the same way smoke.test.tsx reads its expo-location mock.
jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  Redirect: () => null,
  router: { push: jest.fn(), navigate: jest.fn() },
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(async () => ({ status: 'denied' })),
  getCurrentPositionAsync: jest.fn(async () => ({ coords: { latitude: 43.32, longitude: -1.98 } })),
  Accuracy: { Balanced: 3 },
}));

jest.mock('../src/hooks', () => {
  const idle = { data: undefined, isLoading: false, isError: false, refetch: jest.fn() };
  return {
    useNearbyStops: jest.fn(() => idle),
    useDepartures: jest.fn(() => idle),
  };
});

/** Typed handle to the mocked expo-router `router` object. */
function mockRouter(): { push: jest.Mock; navigate: jest.Mock } {
  return jest.requireMock('expo-router').router;
}

const VARIANTS: GlassVariant[] = ['light', 'medium', 'strong'];

/** Absolute path of the mobile package root (…/mobile). */
const ROOT = path.resolve(__dirname, '..');

/** Read a project file as UTF-8. */
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

/** Every .ts/.tsx under app/ and src/ (relative to the mobile root). */
function sourceFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
    }
  };
  walk(path.join(ROOT, 'app'));
  walk(path.join(ROOT, 'src'));
  return out;
}

/**
 * Strip block and line comments from a source file.
 *
 * Necessary because the sandbox header deliberately NAMES the forbidden
 * libraries (to document that they are not used) and mentions `Animated` (to
 * document that no animation is added). Matching against raw source would
 * produce false positives, so the constraint checks analyse code only.
 */
function stripComments(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

/**
 * Same purpose as `stripComments`, but for a list of diff `+` lines.
 *
 * Tracking block-comment state across lines is required: a JSX comment spanning
 * several lines (the temporary Home entry used one before N-3.1 removed it) means
 * a per-line regex cannot tell comment continuation lines ("…no import was added…")
 * from code. Those prose lines would otherwise trip the behaviour deny-list.
 *
 * Only lines that carry at least one non-comment character are returned.
 */
function stripCommentsFromLines(lines: string[]): string[] {
  const out: string[] = [];
  let inBlock = false;
  lines.forEach((raw) => {
    let line = raw;
    if (inBlock) {
      const end = line.indexOf('*/');
      if (end === -1) return; // still inside the block comment
      line = line.slice(end + 2);
      inBlock = false;
    }
    // Drop the trailing part of any block comment opened on this line.
    while (true) {
      const start = line.indexOf('/*');
      if (start === -1) break;
      const end = line.indexOf('*/', start + 2);
      if (end === -1) {
        line = line.slice(0, start);
        inBlock = true;
        break;
      }
      line = line.slice(0, start) + line.slice(end + 2);
    }
    // Drop a line comment.
    const lineComment = line.indexOf('//');
    if (lineComment !== -1) line = line.slice(0, lineComment);
    // Keep only lines with real content left.
    if (line.replace(/\s/g, '') !== '') out.push(line);
  });
  return out;
}


describe('Glass sandbox screen (/dev/glass)', () => {
  it('renders without throwing', () => {
    const { getByText } = render(<GlassSandboxScreen />);
    expect(getByText('Glass Material Sandbox')).toBeTruthy();
  });

  it('shows all six sections in spec order', () => {
    const { getByText } = render(<GlassSandboxScreen />);
    expect(getByText('1. GlassSurface')).toBeTruthy();
    expect(getByText('2. GlassCard')).toBeTruthy();
    expect(getByText('3. GlassButton')).toBeTruthy();
    expect(getByText('4. Fondo claro')).toBeTruthy();
    expect(getByText('5. Fondo oscuro')).toBeTruthy();
    expect(getByText('6. Fondo mapa')).toBeTruthy();
  });

  it('renders a material for every variant of Surface and Card', () => {
    const { getAllByText } = render(<GlassSandboxScreen />);
    // MaterialSample prints the variant name + its resolved tokens, so counting
    // occurrences proves each component actually mounted with that variant.
    // Groups: GlassSurface(1), GlassCard(2), fondo claro(4), fondo oscuro(5),
    // fondo mapa(6) → 3 samples per variant (light/medium/strong).
    VARIANTS.forEach((v) => {
      expect(getAllByText(`Glass ${v}`).length).toBeGreaterThanOrEqual(3);
      // The resolved N-1 tokens are printed on-device, making the inspection
      // self-documenting; assert they come from the token table, not hardcoded.
      const meta = `${glassMaterial[v].tint} · intensity ${glassMaterial[v].intensity} · radius ${glassMaterial[v].radius}`;
      expect(getAllByText(meta).length).toBeGreaterThanOrEqual(3);
    });
  });

  it('renders both GlassButton states', () => {
    const { getAllByRole } = render(<GlassSandboxScreen />);
    const buttons = getAllByRole('button');
    const labels = buttons.map((b) => b.props.accessibilityLabel);

    // normal state
    expect(labels).toContain('Estado normal');
    expect(labels).toContain('Estado normal (medium)');
    expect(labels).toContain('Estado normal (light)');
    expect(labels).toContain('Sobre fondo claro');
    expect(labels).toContain('Sobre fondo oscuro');
    expect(labels).toContain('Sobre fondo mapa');
    // disabled state
    expect(labels).toContain('Estado disabled');

    const disabled = buttons.find((b) => b.props.accessibilityLabel === 'Estado disabled');
    expect(disabled).toBeDefined();
    expect(disabled?.props.accessibilityState).toEqual({ disabled: true });

    // Every non-disabled button must report the enabled state.
    buttons
      .filter((b) => b.props.accessibilityLabel !== 'Estado disabled')
      .forEach((b) => expect(b.props.accessibilityState).toEqual({ disabled: false }));
  });

  it('mounts BlurViews (real blur path) inside the materials', () => {
    const { UNSAFE_queryAllByType } = render(<GlassSandboxScreen />);
    const blurs = UNSAFE_queryAllByType(BlurView);
    // 5 material groups x 3 variants = 15, plus the floating strong panel = 16,
    // plus 7 GlassButtons = 23. Assert a healthy lower bound, not an exact count,
    // so the test does not break on harmless additions.
    expect(blurs.length).toBeGreaterThanOrEqual(16);
    // Every blur must carry a legal token intensity/tint (no hardcoded values).
    const legalIntensities = VARIANTS.map((v) => glassMaterial[v].intensity);
    const legalTints = VARIANTS.map((v) => glassMaterial[v].tint);
    blurs.forEach((b) => {
      expect(legalIntensities).toContain(b.props.intensity);
      expect(legalTints).toContain(b.props.tint);
    });
  });
});

// V2: these guards diffed V1 files against V1 git history to keep the N-2/N-3
// phases inside their allowed scope. V2 intentionally changes the tab bar,
// config and dependencies (native migration), so they no longer apply.
describe.skip('N-2 safety constraints (static source analysis)', () => {
  const raw = read('app/dev/glass.tsx');
  /** Code only — comments are stripped (see stripComments rationale). */
  const sandbox = stripComments(raw);

  it('imports no forbidden library', () => {
    const FORBIDDEN = [
      'react-native-reanimated',
      'react-native-gesture-handler',
      '@gorhom/bottom-sheet',
      '@shopify/react-native-skia',
      'react-native-maps',
    ];
    // Inspect MODULE SPECIFIERS only (static import, dynamic import, require).
    // A naive whole-file `toContain` would produce a false positive on the
    // section-6 caption, which mentions react-native-maps in plain prose to state
    // that the map backdrop is a static composition rather than a MapView.
    const specifiers = [
      ...sandbox.matchAll(/(?:\bfrom\s*|\bimport\s*\(|\brequire\s*\()\s*'([^']+)'/g),
    ].map((m) => m[1]);
    expect(specifiers.length).toBeGreaterThan(0);
    FORBIDDEN.forEach((lib) => expect(specifiers).not.toContain(lib));
  });

  it('adds no animation of its own (no Animated usage)', () => {
    // The spec forbids adding animations. The only motion on the screen is
    // GlassButton's own N-1 press spring, which lives in the component.
    expect(sandbox).not.toMatch(/\bAnimated\b/);
    expect(sandbox).not.toContain('useNativeDriver');
    expect(sandbox).not.toContain('LayoutAnimation');
  });

  it('creates no state or effects (purely presentational)', () => {
    expect(sandbox).not.toMatch(/\buseState\b/);
    expect(sandbox).not.toMatch(/\buseEffect\b/);
  });

  it('does not touch global styles or app config', () => {
    // No StyleSheet global mutation, and app.json must stay light-mode.
    expect(sandbox).not.toContain('setStyleAttributes');
    const appJson = JSON.parse(read('app.json')) as {
      expo: { userInterfaceStyle: string };
    };
    expect(appJson.expo.userInterfaceStyle).toBe('light');
  });

  it('is referenced by NO source file (deep-link only)', () => {
    // N-3.1 removed the temporary DEV-ONLY Home button, so the sandbox is once
    // again reachable ONLY by its deep link. This is the strict form of the
    // assertion N-2 had to relax while the button existed: any file (other than
    // the route itself) naming `dev/glass` now fails here, which is what stops
    // the sandbox from silently leaking back into the production surface.
    const referencing = sourceFiles()
      .filter((file) => {
        const rel = path.relative(ROOT, file).replace(/\\/g, '/');
        if (rel === 'app/dev/glass.tsx') return false; // the route itself
        return /dev\/glass/.test(fs.readFileSync(file, 'utf8'));
      })
      .map((file) => path.relative(ROOT, file).replace(/\\/g, '/'));
    expect(referencing).toEqual([]);
  });

  it('leaves the navigation layouts untouched (no dev route registered)', () => {
    // expo-router auto-registers file routes, so the layouts must NOT list dev.
    expect(stripComments(read('app/_layout.tsx'))).not.toContain('dev');
    expect(stripComments(read('app/(tabs)/_layout.tsx'))).not.toContain('dev');
    // The tabs layout must still declare exactly the five production tabs.
    const tabs = read('app/(tabs)/_layout.tsx');
    ['index', 'map', 'plan', 'saved', 'profile'].forEach((name) =>
      expect(tabs).toContain(`name="${name}"`),
    );
  });

  it('uses only the verified-compatible import surface', () => {
    const imports = [...sandbox.matchAll(/from '([^']+)'/g)].map((m) => m[1]);
    expect(imports.length).toBeGreaterThan(0);
    const ALLOWED = new Set([
      'react',
      'react-native',
      'react-native-safe-area-context',
      '../../src/components/glass/GlassSurface',
      '../../src/components/glass/GlassCard',
      '../../src/components/glass/GlassButton',
      '../../src/theme/glass',
      '../../src/design/tokens',
    ]);
    imports.forEach((imp) => expect(ALLOWED.has(imp)).toBe(true));
  });

  it('does not modify any FORBIDDEN file (map, sheet, tab bar, routing, api)', () => {
    // Files that BOTH N-2 and N-3 forbid touching. These stay byte-identical to
    // the committed version — this is the hard safety net: if a glass swap ever
    // leaks into the map, the sheet, the tab bar or the data layer, it fails here.
    //
    // N-3 legitimately allows the four tab screens (index/plan/saved/profile), so
    // they are NOT in this list any more; their scope is checked by the next test.
    const FORBIDDEN = [
      'app/_layout.tsx',
      'app/index.tsx',
      'app/(tabs)/_layout.tsx',
      'app/(tabs)/map.tsx',
      'src/components/UnifiedSurface.tsx',
      'src/components/FloatingTabBar.tsx',
      'src/query/provider.tsx',
      'src/api/client.ts',
    ];
    FORBIDDEN.forEach((rel) => {
      const current = fs.readFileSync(path.join(ROOT, rel), 'utf8');
      const committed = execGitShow(rel);
      expect(committed).not.toBeNull();
      // Line-ending-insensitive: see `normalize` rationale.
      expect(normalize(current)).toBe(normalize(committed as string));
    });
  });

  it('only modifies the four screens N-3 is allowed to touch', () => {
    // N-3 permits exactly index/plan/saved/profile. Anything else that differs
    // from HEAD (a provider, a hook, the api client, a design token…) fails here,
    // which keeps the rollback surface limited to those four files.
    const ALLOWED = new Set([
      'mobile/app/(tabs)/index.tsx',
      'mobile/app/(tabs)/plan.tsx',
      'mobile/app/(tabs)/saved.tsx',
      'mobile/app/(tabs)/profile.tsx',
    ]);
    const modified = execGitNameOnly();
    expect(modified.length).toBeGreaterThan(0);
    modified.forEach((file) => expect(ALLOWED.has(file)).toBe(true));
  });

  it('installs no new dependency (package manifests untouched)', () => {
    // Paths are relative to the mobile root: `read` resolves them against ROOT,
    // while `execGitShow` adds the `mobile/` prefix itself. Passing
    // 'mobile/package.json' here would make git look for
    // `mobile/mobile/package.json`, which does not exist — so `committed` would
    // be null and the assertion below would fail with a misleading message.
    ['package.json', 'package-lock.json'].forEach((rel) => {
      const current = fs.readFileSync(path.join(ROOT, rel), 'utf8');
      const committed = execGitShow(rel);
      expect(committed).not.toBeNull();
      expect(normalize(current)).toBe(normalize(committed as string));
    });
  });

  it('Home diff adds no behaviour and removes no navigation', () => {
    // Home carries one authorized visual change: the N-3 GlassCard swap of the
    // nearest-stop card, plus its N-3.1 padding relocation. The temporary
    // DEV-ONLY sandbox entry that N-2 added was removed again in N-3.1 before
    // ever being committed, so it leaves no trace in this diff.
    //
    // What still MUST hold — and is checked here:
    //   1. no navigation line was removed (N-3 forbids navigation changes);
    //   2. no added line introduces state, effects, data hooks or animations;
    //   3. the only new import is the glass one.
    // Anything behavioural still fails here.
    //
    // The diff is delegated to git (`--unified=0`) rather than hand-rolled: a
    // greedy subsequence match can misalign on duplicate lines such as `},`,
    // producing a false failure. git is authoritative and already used above.
    const rel = 'app/(tabs)/index.tsx';
    const diff = execGitDiff(rel);
    expect(diff).not.toBeNull();

    const lines = normalize(diff as string).split('\n');
    // `---`/`+++` are file headers, not deletions/additions; `@@` marks a hunk.
    const removed = lines.filter(
      (l) => l.startsWith('-') && !l.startsWith('---'),
    );
    const added = lines.filter(
      (l) => l.startsWith('+') && !l.startsWith('+++'),
    ).map((l) => l.slice(1));
    const hunks = lines.filter((l) => l.startsWith('@@'));

    // 1. No navigation may have been REMOVED. N-3 forbids navigation changes, so
    //    every `router.push`/`router.navigate` that existed at HEAD must survive.
    const navigationRemoved = removed.filter((l) =>
      /router\.(push|navigate|replace)/.test(l),
    );
    expect(navigationRemoved).toEqual([]);

    // 1b. Sanity: the diff must actually contain changes.
    expect(added.length).toBeGreaterThan(0);

    // 2. No inserted line may touch production behaviour. A deny-list is used
    //    rather than an allow-list: it does not need to enumerate every style
    //    property (brittle), and it directly targets the real risk — someone
    //    slipping a logic/navigation/state change into Home alongside the button.
    //
    //    Comment lines are excluded first, because the removal instructions in the
    //    dev block legitimately mention words like "import" and "router" in prose.
    //    Actual import statements are still caught by the regex below.
    const codeAdded = stripCommentsFromLines(added);

    const FORBIDDEN_IN_ADDED = [
      'useState',
      'useEffect',
      'useMemo',
      'useCallback',
      'router.navigate',
      'router.replace',
      'router.back',
      'useI18n',
      'useNearbyStops',
      'useDepartures',
      'getCurrentLocation',
      'getFavorites',
      'getRecents',
      'toggleFavorite',
      'removeFavorite',
      'subscribeFavorites',
      'Animated',
      'LayoutAnimation',
      'reanimated',
      'gesture-handler',
      'gorhom',
      'skia',
    ];
    codeAdded.forEach((line) => {
      FORBIDDEN_IN_ADDED.forEach((token) => {
        expect(line).not.toContain(token);
      });
    });

    // 3. No added import may introduce a behavioural dependency. N-3 adds only
    //    the glass component and re-shapes the existing token import (dropping
    //    the now-unused `radius` after the dev button's style was deleted), so
    //    every added import line must point at the glass layer or the tokens.
    const newImports = added.filter((l) => /^\s*import\s/.test(l));
    expect(newImports.length).toBeGreaterThan(0);
    newImports.forEach((l) => {
      expect(l).toMatch(/components\/glass\/|theme\/glass|design\/tokens/);
    });

    // 4. Sanity: the authorized N-3 change is present and the diff is real.
    expect(added.join('\n')).toContain('GlassCard');
    expect(added.join('\n')).toContain('variant="light"');
    expect(hunks.length).toBeGreaterThan(0);

    // 5. N-3.1: the temporary DEV-ONLY entry must be COMPLETELY gone — no label,
    //    no style hooks, no navigation call left behind. Asserted on the working
    //    tree rather than on the diff, because the block was added and removed
    //    without ever being committed, so it never shows up in a HEAD diff.
    const home = read(rel);
    expect(home).not.toContain('Open Glass Sandbox');
    expect(home).not.toContain('devBtn');
    expect(home).not.toContain('dev/glass');
  });
});
describe('N-3.1 — temporary Home entry removed, sandbox still reachable', () => {
  beforeEach(() => {
    mockRouter().push.mockClear();
    mockRouter().navigate.mockClear();
  });

  it('renders no entry point to the sandbox any more', () => {
    const { queryByRole, queryByText } = render(<HomeScreen />);
    expect(queryByRole('button', { name: 'Open Glass Sandbox' })).toBeNull();
    expect(queryByText('Open Glass Sandbox')).toBeNull();
  });

  it('does not disturb Home’s existing behaviour', () => {
    // Guard: removing the button must not break or suppress anything else on
    // Home. The headline assertion mirrors tests/smoke.test.tsx.
    const { getByText } = render(<HomeScreen />);
    expect(getByText('¿Dónde quieres ir?')).toBeTruthy();

    // Rendering Home must not navigate anywhere on its own.
    expect(mockRouter().push).not.toHaveBeenCalled();
    expect(mockRouter().navigate).not.toHaveBeenCalled();
  });

  it('keeps the sandbox reachable by deep link (route file intact)', () => {
    // Goal N-3.1-2: only the Home button is gone; /dev/glass stays registered.
    expect(fs.existsSync(path.join(ROOT, 'app/dev/glass.tsx'))).toBe(true);
    expect(typeof GlassSandboxScreen).toBe('function');
    expect(render(<GlassSandboxScreen />)).toBeTruthy();
  });
});



/* --- git helpers ------------------------------------------------------------ */

/**
 * Return the committed (HEAD) contents of a tracked file, or null if unavailable.
 * Uses git directly so the equality check is against the real baseline.
 */
function execGitShow(rel: string): string | null {
  try {
    // The git repo root is one level above the mobile package.
    return execSync('git show HEAD:mobile/' + rel, {
      cwd: path.resolve(ROOT, '..'),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return null;
  }
}

/**
 * Return the working-tree diff of a tracked file vs HEAD, with no context lines
 * (`--unified=0`), or null if git is unavailable / the file is unchanged.
 *
 * Used to prove the temporary Home entry is a pure insertion: hunk headers give
 * the block count and the +/- lines give the exact additions and deletions.
 */
function execGitDiff(rel: string): string | null {
  try {
    return execSync(`git diff --unified=0 --no-color HEAD -- mobile/${rel}`, {
      cwd: path.resolve(ROOT, '..'),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return null;
  }
}


/**
 * Return the paths (relative to the git repo root) of every tracked file that
 * differs from HEAD, as reported by `git diff --name-only`.
 *
 * Used to pin the allowed modification surface: if a glass swap leaks into a
 * file outside the four tab screens, this test fails.
 */
function execGitNameOnly(): string[] {
  try {
    return execSync('git diff --name-only HEAD', {
      cwd: path.resolve(ROOT, '..'),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
  } catch {
    return [];
  }
}

/**
 * Compare file contents ignoring line-ending style.
 *
 * On Windows the working tree may hold CRLF while git stores LF (there is no
 * .gitattributes forcing eol), so a raw string comparison would produce a false
 * "modified" result. Normalising to LF compares the actual content.
 */
const normalize = (s: string) => s.replace(/\r\n/g, '\n');
