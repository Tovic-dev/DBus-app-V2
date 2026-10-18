import { Text, View, Pressable, ScrollView, StyleSheet, Switch, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, control, layout, hig, gradient } from '../../src/design/tokens';
import { GlassCard } from '../../src/components/glass/GlassCard';
import { glassShadow } from '../../src/theme/glass';
import { SFSymbolIcon, type SFSymbolName } from '../../src/components/SFSymbolIcon';
import { useI18n } from '../../src/i18n';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { t, lang, setLang } = useI18n();
  return (
    <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingTop: insets.top }]} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={[styles.avatar, { backgroundColor: gradient.accent }]}>
          <SFSymbolIcon name="person.crop.circle.fill" size={40} color="#fff" />
        </View>
        <Text style={styles.name}>Mikel Azkona</Text>
        <Text style={styles.handle}>mikel.azkona@email.com</Text>
        <View style={styles.liveChip}>
          <View style={[styles.dot, { backgroundColor: colors.hairline }]} />
          <Text style={{ color: colors.muted48, fontSize: hig('caption').size }}>{t('live_not_available')}</Text>
        </View>
      </View>

      <Group title={t('settings')}>
        <Row icon="globe" iconColor={colors.ink} title={t('language')} value={lang === 'es' ? 'Español' : 'English'} onPress={() => setLang(lang === 'es' ? 'en' : 'es')} first />
        <Row icon="bell.badge.fill" iconColor={colors.ink} title={t('notifications')} sub={t('notif_sub')} trailing={<Switch value={true} onValueChange={() => undefined} />} />
        <Row icon="figure.roll" iconColor={colors.ink} title={t('accessibility')} sub={t('access_sub')} trailing={<Switch value={false} onValueChange={() => undefined} />} />
        <Row icon="arrow.left.arrow.right" iconColor={colors.ink} title={t('avoid_transfers')} trailing={<Switch value={false} onValueChange={() => undefined} />} last />
      </Group>

      <Group title={t('group_about')}>
        <Row icon="questionmark.circle" iconColor={colors.ink} title={t('help')} onPress={() => undefined} first />
        <Row icon="info.circle" iconColor={colors.ink} title={t('about')} sub={t('version')} onPress={() => undefined} last />
      </Group>

      <GlassCard variant="light" padding={0} style={[styles.signOut, glassShadow.flat]}>
        <View style={styles.signOutInner}>
          <Pressable onPress={() => undefined} accessibilityRole="button" accessibilityLabel={t('sign_out')}>
            <Text style={{ color: colors.danger, fontSize: hig('body').size, fontWeight: '600' }}>{t('sign_out')}</Text>
          </Pressable>
        </View>
      </GlassCard>
      <Text style={styles.fine}>{t('scheduled_only')}</Text>
    </ScrollView>
  );
}

function Row({ icon, iconColor, title, sub = '', value, onPress, trailing, first, last }: {
  icon: SFSymbolName; iconColor?: ColorValue; title: string; sub?: string; value?: string;
  onPress?: () => void; trailing?: React.ReactNode; first?: boolean; last?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole="button" accessibilityLabel={title}
      style={[styles.row, first && styles.rowFirst, last && styles.rowLast]}>
      <View style={[styles.rowIcon, { backgroundColor: typeof iconColor === 'string' ? `${iconColor}18` : iconColor ? colors.dividerSoft : colors.pearl }]}>
        <SFSymbolIcon name={icon} size={20} color={iconColor ?? colors.ink} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      {trailing}
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      {onPress ? <SFSymbolIcon name="chevron.forward" size={18} color={colors.muted48} /> : null}
    </Pressable>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.parchment },
  content: { paddingBottom: layout.bottomScroll },
  hero: { alignItems: 'center', backgroundColor: colors.canvas, paddingTop: spacing.xl, paddingBottom: spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.dividerSoft },
  avatar: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', elevation: 6 },
  name: { fontSize: hig('title').size, fontWeight: '700', color: colors.ink, marginTop: spacing.md, letterSpacing: hig('title').ls },
  handle: { fontSize: hig('footnote').size, color: colors.muted48, marginTop: 2 },
  liveChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.pearl, borderRadius: radius.pill, paddingHorizontal: control.chipPaddingV + 2, paddingVertical: control.groupTitleGap, marginTop: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: control.groupTitleGap },
  group: { paddingHorizontal: layout.contentMargin, marginTop: spacing.xs },
  groupTitle: { fontSize: hig('caption').size, fontWeight: '600', color: colors.muted48, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: control.groupTitleGap },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.canvas, paddingHorizontal: control.rowPaddingH + 4, paddingVertical: control.rowPaddingV + 2, gap: spacing.sm },
  rowFirst: { borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md },
  rowLast: { borderBottomLeftRadius: radius.md, borderBottomRightRadius: radius.md, borderBottomWidth: 0 },
  rowIcon: { width: control.rowIconSize, height: control.rowIconSize, borderRadius: control.rowIconSize / 2, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: hig('callout').size, color: colors.ink, fontWeight: '500' },
  rowSub: { fontSize: hig('caption').size, color: colors.muted48, marginTop: 1 },
  rowValue: { fontSize: hig('footnote').size, color: colors.muted48 },
  // Glass: the material layer must stretch to fill the card, so `alignItems`
  // moves off the container and centering is handled by `signOutInner`.
  signOut: { paddingVertical: layout.headerPaddingV, marginHorizontal: layout.contentMargin, marginTop: spacing.lg },
  signOutInner: { alignItems: 'center', width: '100%' },
  fine: { textAlign: 'center', fontSize: hig('caption').size, color: colors.muted48, marginTop: spacing.lg },
});