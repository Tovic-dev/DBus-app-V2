import { useState, useEffect } from 'react';
import { Text, View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SFSymbolIcon } from '../../src/components/SFSymbolIcon';
import { Squircle } from '../../src/design/squircle/Squircle';
import { GlassCard } from '../../src/components/glass/GlassCard';
import { glassShadow } from '../../src/theme/glass';
import { SQUIRCLE } from '../../src/design/squircle/squircleTokens';
import { RouteBadge } from '../../src/components/ui-badges';
import { colors, radius, spacing, control, layout, hig } from '../../src/design/tokens';
import { getFavorites, removeFavorite, subscribeFavorites, type Favorite } from '../../src/favorites';
import { useI18n } from '../../src/i18n';

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const [favs, setFavs] = useState<Favorite[]>([]);

  useEffect(() => {
    const sync = () => setFavs(getFavorites());
    sync();
    return subscribeFavorites(sync);
  }, []);

  const stops = favs.filter((f) => f.kind === 'stop');
  const routes = favs.filter((f) => f.kind === 'route');
  const empty = stops.length === 0 && routes.length === 0;

  return (
    <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingTop: insets.top + layout.tabTop }]} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>{t('saved_title')}</Text>
      <Text style={styles.sub}>{t('saved_sub')}</Text>

      {empty ? (
        <GlassCard variant="light" padding={spacing.xl} radius={SQUIRCLE.large} style={[styles.emptyCard, glassShadow.flat]}>
          <View style={styles.emptyCardInner}>
            <Squircle level="small" backgroundColor={`${colors.primary}14`} style={styles.emptyIcon}>
              <SFSymbolIcon name="heart" size={34} color={colors.primary} />
            </Squircle>
            <Text style={styles.emptyTitle}>{t('fav_empty_title')}</Text>
            <Text style={styles.emptyText}>{t('fav_empty_text')}</Text>
            <Pressable onPress={() => router.navigate('/(tabs)/map')} accessibilityRole="button" accessibilityLabel={t('explore_map')} style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>{t('explore_map')}</Text>
            </Pressable>
          </View>
        </GlassCard>
      ) : (
        <>
          {stops.length > 0 && (
            <View style={styles.group}>
              <Text style={styles.groupTitle}>{t('fav_stops')}</Text>
              {stops.map((f, i) => (
                <Pressable key={f.id} onPress={() => router.push(`/stops/${f.id}`)} accessibilityRole="button" accessibilityLabel={`Parada ${f.label}`}
                  style={[styles.row, i === 0 && styles.rowFirst, i === stops.length - 1 && styles.rowLast]}>
                  <View style={styles.rowIcon}>
                    <SFSymbolIcon name="bus.fill" size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle} numberOfLines={1}>{f.label}</Text>
                    <Text style={styles.rowSub}>{t('view_schedules_short')}</Text>
                  </View>
                  <Pressable onPress={() => removeFavorite(f.id)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`${t('remove_fav')} ${f.label}`}>
                    <SFSymbolIcon name="heart.fill" size={20} color={colors.primary} />
                  </Pressable>
                  <SFSymbolIcon name="chevron.forward" size={18} color={colors.muted48} />
                </Pressable>
              ))}
            </View>
          )}

          {routes.length > 0 && (
            <View style={styles.group}>
              <Text style={styles.groupTitle}>{t('fav_routes')}</Text>
              {routes.map((f, i) => (
                <Pressable key={f.id} onPress={() => router.push(`/routes/${f.id}`)} accessibilityRole="button" accessibilityLabel={`Línea ${f.label}`}
                  style={[styles.row, i === 0 && styles.rowFirst, i === routes.length - 1 && styles.rowLast]}>
                  <RouteBadge shortName={f.label} size={34} />
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text style={styles.rowTitle} numberOfLines={1}>{f.label}</Text>
                    <Text style={styles.rowSub} numberOfLines={1}>{f.sublabel ?? t('bus_line')}</Text>
                  </View>
                  <Pressable onPress={() => removeFavorite(f.id)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`${t('remove_fav')} ${f.label}`}>
                    <SFSymbolIcon name="heart.fill" size={20} color={colors.primary} />
                  </Pressable>
                  <SFSymbolIcon name="chevron.forward" size={18} color={colors.muted48} />
                </Pressable>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.parchment },
  content: { paddingBottom: layout.bottomScroll },
  title: { fontSize: hig('largeTitle').size, fontWeight: '700', letterSpacing: hig('largeTitle').ls, color: colors.ink, paddingHorizontal: layout.contentMargin, marginTop: spacing.sm },
  sub: { fontSize: hig('subheadline').size, color: colors.muted48, marginTop: control.groupTitleGap - 2, paddingHorizontal: layout.contentMargin, marginBottom: spacing.md },
  // Glass: the material layer must stretch to fill the card, so `alignItems`
  // moves off the container and centering is handled by `emptyCardInner`.
  // Padding must NOT live here either — GlassSurface paints its material at the
  // host's CONTENT box, so host padding would inset the visible glass and narrow
  // the card. The inner padding is passed via GlassCard's `padding` prop.
  emptyCard: { marginHorizontal: layout.contentMargin, marginTop: spacing.lg },
  emptyCardInner: { alignItems: 'center', width: '100%' },
  emptyIcon: { width: 68, height: 68, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  emptyTitle: { fontSize: hig('title3').size, fontWeight: '700', color: colors.ink, marginTop: spacing.md },
  emptyText: { fontSize: hig('footnote').size, color: colors.muted48, textAlign: 'center', marginTop: spacing.xs, lineHeight: 20 },
  emptyBtn: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: control.chipPaddingH + 8, paddingVertical: control.chipPaddingV + 1, marginTop: spacing.lg },
    emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: hig('subheadlineStrong').size },
  group: { paddingHorizontal: layout.contentMargin, marginTop: spacing.xs },
  groupTitle: { fontSize: hig('caption').size, fontWeight: '600', color: colors.muted48, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: control.groupTitleGap },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.canvas, paddingHorizontal: control.rowPaddingH + 4, paddingVertical: control.rowPaddingV + 2, gap: spacing.sm },
  rowFirst: { borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md },
  rowLast: { borderBottomLeftRadius: radius.md, borderBottomRightRadius: radius.md, borderBottomWidth: 0 },
  rowIcon: { width: control.rowIconSize + 4, height: control.rowIconSize + 4, borderRadius: (control.rowIconSize + 4) / 2, backgroundColor: `${colors.primary}14`, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: hig('callout').size, fontWeight: '600', color: colors.ink },
  rowSub: { fontSize: hig('caption').size, color: colors.muted48, marginTop: 1 },
});