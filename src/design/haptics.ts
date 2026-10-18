/**
 * Haptics — centralized Apple-style selection feedback (Phase G).
 * Light, sparing: selection ticks only on intentional state changes.
 */
import * as ExpoHaptics from 'expo-haptics';
import { Platform } from 'react-native';

function selection() {
  if (Platform.OS === 'ios') {
    ExpoHaptics.selectionAsync().catch(() => {});
  }
}

/** Slightly stronger feedback for favorite toggles (add = success tick). */
function favorite(added: boolean) {
  if (Platform.OS === 'ios') {
    if (added) ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success).catch(() => {});
    else ExpoHaptics.selectionAsync().catch(() => {});
  }
}

export const haptics = { selection, favorite };