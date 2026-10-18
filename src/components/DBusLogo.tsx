/**
 * DBus frog logo — dependency-free reproduction of the d·bus brand mark
 * (green frog with blue eye over the blue "d·bus" wordmark), drawn with
 * plain React Native views so it needs no native modules.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const GREEN = '#7ABA0A';
const BLUE = '#1B5FAB';

export function DBusLogo({ size = 240 }: { size?: number }) {
  const frog = size * 0.62;
  return (
    <View style={{ width: size, alignItems: 'center' }}>
      {/* ---- Frog ---- */}
      <View style={{ width: frog, height: frog * 0.62 }}>
        {/* rear folded leg */}
        <View style={[styles.rearLeg, { backgroundColor: GREEN }]} />
        {/* body */}
        <View style={[styles.body, { backgroundColor: GREEN, width: frog * 0.78, height: frog * 0.42, borderRadius: frog * 0.21 }]} />
        {/* head */}
        <View style={[styles.head, { backgroundColor: GREEN, width: frog * 0.34, height: frog * 0.34, borderRadius: frog * 0.17 }]} />
        {/* blue eye stripe */}
        <View style={[styles.stripe, { backgroundColor: BLUE }]} />
        {/* eye */}
        <View style={[styles.eye, { backgroundColor: BLUE, width: frog * 0.13, height: frog * 0.13, borderRadius: frog * 0.065 }]}>
          <View style={[styles.pupil, { width: frog * 0.05, height: frog * 0.05, borderRadius: frog * 0.025 }]} />
        </View>
        {/* front leg + toes */}
        <View style={[styles.frontLeg, { backgroundColor: GREEN }]} />
        <View style={styles.toesRow}>
          <View style={[styles.toe, { backgroundColor: GREEN }]} />
          <View style={[styles.toe, { backgroundColor: GREEN }]} />
          <View style={[styles.toe, { backgroundColor: GREEN }]} />
        </View>
        {/* rear toes */}
        <View style={[styles.toesRow, styles.rearToes]}>
          <View style={[styles.toe, { backgroundColor: GREEN }]} />
          <View style={[styles.toe, { backgroundColor: GREEN }]} />
          <View style={[styles.toe, { backgroundColor: GREEN }]} />
        </View>
      </View>

      {/* ---- d·bus wordmark ---- */}
      <Text style={[styles.wordmark, { fontSize: size * 0.22, color: BLUE }]}>d·bus</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { position: 'absolute', left: 0, top: '28%' },
  head: { position: 'absolute', right: 0, top: 0 },
  rearLeg: { position: 'absolute', left: '4%', top: '52%', width: '30%', height: '26%', borderRadius: 12, transform: [{ rotate: '-18deg' }] },
  stripe: { position: 'absolute', right: '18%', top: '18%', width: '22%', height: 5, borderRadius: 3, transform: [{ rotate: '-24deg' }] },
  eye: { position: 'absolute', right: '6%', top: '8%', alignItems: 'center', justifyContent: 'center' },
  pupil: { backgroundColor: '#000', marginLeft: 3, marginTop: -3 },
  frontLeg: { position: 'absolute', right: '16%', bottom: '4%', width: '20%', height: 8, borderRadius: 4, transform: [{ rotate: '28deg' }] },
  toesRow: { position: 'absolute', right: '2%', bottom: '2%', flexDirection: 'row', gap: 4 },
  rearToes: { right: 'auto', left: '2%', bottom: 0 },
  toe: { width: 7, height: 7, borderRadius: 3.5 },
  wordmark: { fontWeight: '700', letterSpacing: -1, marginTop: 10 },
});
