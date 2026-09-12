import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  changelogForVersion,
  currentAppVersion,
} from '@/services/appChangelog';
import { useSettingsStore } from '@/stores/settings';
import { Sheet, Typography } from '@/ui/components';
import { spacing } from '@/ui/theme';

/** Shows once after an update when changelog notes exist for this version. */
export function WhatsNewSheet() {
  const lastSeen = useSettingsStore((state) => state.lastSeenAppVersion);
  const setLastSeen = useSettingsStore((state) => state.setLastSeenAppVersion);
  const version = currentAppVersion();
  const section = changelogForVersion(version);
  const hasNotes = Boolean(section && section.bullets.length > 0);
  const [dismissed, setDismissed] = useState(false);
  const visible = hasNotes && lastSeen !== version && !dismissed;

  useEffect(() => {
    if (hasNotes || lastSeen === version) return;
    setLastSeen(version);
  }, [hasNotes, lastSeen, setLastSeen, version]);

  const close = () => {
    setDismissed(true);
    setLastSeen(version);
  };

  if (!section || !hasNotes) return null;

  return (
    <Sheet
      visible={visible}
      onClose={close}
      title="Nouveautés"
      subtitle={`Version ${section.version}`}
      maxHeightRatio={0.7}
    >
      <View style={styles.list}>
        {section.bullets.map((bullet) => (
          <Typography key={bullet} variant="body" color="secondary">
            • {bullet}
          </Typography>
        ))}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
});
