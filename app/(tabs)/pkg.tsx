import * as WebBrowser from 'expo-web-browser';
import {
  FolderOpen,
  Package,
  Radar,
  RefreshCw,
  Send,
  Trash2,
} from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useScreenTracking } from '@/hooks/useScreenTracking';
import { formatFtpSize } from '@/services/ftp';
import {
  PKG_SENDER_CREDIT,
  clearPkgDebug,
  detectConsoleMode,
  diagnoseConsole,
  enqueuePkgSend,
  getLanIp,
  listenForBeacons,
  listLocalPkgFiles,
  pumpPkgSendQueue,
  retryPkgSend,
  subscribePkgDebug,
  usePkgSenderStore,
  type PkgLocalFile,
} from '@/services/pkgSender';
import { isPkgOrDiscImage, pickDeviceFiles } from '@/services/pickDeviceFiles';
import {
  AnimatedPressable,
  Button,
  EmptyState,
  Screen,
  Typography,
} from '@/ui/components';
import {
  radius,
  screenPadding,
  spacing,
  tabBarHeight,
  tabBarInset,
  useColors,
} from '@/ui/theme';

export default function PkgSenderScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  useScreenTracking('/pkg');

  const consoleIp = usePkgSenderStore((s) => s.consoleIp);
  const setConsoleIp = usePkgSenderStore((s) => s.setConsoleIp);
  const lanIpOverride = usePkgSenderStore((s) => s.lanIpOverride);
  const setLanIpOverride = usePkgSenderStore((s) => s.setLanIpOverride);
  const lastMode = usePkgSenderStore((s) => s.lastMode);
  const setLastMode = usePkgSenderStore((s) => s.setLastMode);
  const ps4Mode = usePkgSenderStore((s) => s.ps4Mode);
  const setPs4Mode = usePkgSenderStore((s) => s.setPs4Mode);
  const queue = usePkgSenderStore((s) => s.queue);
  const clearFinished = usePkgSenderStore((s) => s.clearFinished);

  const [files, setFiles] = useState<PkgLocalFile[]>([]);
  const [extraFiles, setExtraFiles] = useState<PkgLocalFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [detectedLanIp, setDetectedLanIp] = useState<string | null>(null);
  const [debugLines, setDebugLines] = useState<string[]>([]);

  const refreshFiles = useCallback(() => {
    setFiles(listLocalPkgFiles());
  }, []);

  useEffect(() => {
    refreshFiles();
    void pumpPkgSendQueue();
    void getLanIp().then(setDetectedLanIp);
    return subscribePkgDebug(setDebugLines);
  }, [refreshFiles]);

  const visibleFiles = (() => {
    const byId = new Map<string, PkgLocalFile>();
    for (const file of [...files, ...extraFiles]) {
      byId.set(`${file.uri}::${file.name}`, file);
    }
    return [...byId.values()];
  })();

  const testConsole = async () => {
    const ip = consoleIp.trim();
    if (!ip) {
      Alert.alert(t('pkg.ipMissingTitle'), t('pkg.ipMissingBody'));
      return;
    }
    setBusy(true);
    setStatus(t('pkg.testing'));
    try {
      const mode = await detectConsoleMode(ip);
      setLastMode(mode);
      const diag = await diagnoseConsole(ip);
      setStatus(`${mode} · ${diag}`);
      if (mode === 'offline') {
        Alert.alert(t('pkg.offlineTitle'), t('pkg.offlineBody'));
      }
    } catch (error) {
      Alert.alert(
        t('pkg.testFailed'),
        error instanceof Error ? error.message : t('pkg.testFailed'),
      );
    } finally {
      setBusy(false);
    }
  };

  const detect = async () => {
    setBusy(true);
    setStatus(t('pkg.scanning'));
    try {
      const found = await listenForBeacons(4500);
      if (found.length === 0) {
        setStatus(t('pkg.scanEmpty'));
        Alert.alert(t('pkg.scanEmptyTitle'), t('pkg.scanEmptyBody'));
        return;
      }
      const ip = found[0]!.ip;
      setConsoleIp(ip);
      setStatus(t('pkg.scanFound', { ip, count: found.length }));
      const mode = await detectConsoleMode(ip);
      setLastMode(mode);
    } finally {
      setBusy(false);
    }
  };

  const sendFile = (file: PkgLocalFile) => {
    if (!consoleIp.trim()) {
      Alert.alert(t('pkg.ipMissingTitle'), t('pkg.ipMissingBody'));
      return;
    }
    enqueuePkgSend(file);
    setStatus(t('pkg.queued', { name: file.name }));
  };

  const pickFromPhone = async () => {
    try {
      setBusy(true);
      setStatus(t('pkg.picking'));
      // Never copy multi‑GB PKG into cache — that black-screens the app.
      const picked = await pickDeviceFiles({
        multiple: true,
        type: '*/*',
      });
      if (picked.length === 0) {
        setStatus(null);
        return;
      }

      const accepted: PkgLocalFile[] = [];
      let rejected = 0;
      for (const file of picked) {
        const kind = isPkgOrDiscImage(file.name);
        if (!kind) {
          rejected += 1;
          continue;
        }
        accepted.push({
          id: `device-${file.uri}-${file.name}`,
          name: file.name,
          uri: file.uri,
          size: file.size,
          kind,
        });
      }

      if (accepted.length === 0) {
        Alert.alert(t('pkg.pickInvalidTitle'), t('pkg.pickInvalidBody'));
        setStatus(null);
        return;
      }

      setExtraFiles((prev) => [...accepted, ...prev]);

      if (!consoleIp.trim()) {
        setStatus(t('pkg.pickAdded', { count: accepted.length }));
        if (rejected > 0) {
          Alert.alert(t('pkg.pickPartialTitle'), t('pkg.pickPartialBody', { count: rejected }));
        }
        return;
      }

      for (const file of accepted) {
        enqueuePkgSend(file);
      }
      setStatus(t('pkg.queuedMany', { count: accepted.length }));
      if (rejected > 0) {
        Alert.alert(t('pkg.pickPartialTitle'), t('pkg.pickPartialBody', { count: rejected }));
      }
    } catch (error) {
      Alert.alert(
        t('pkg.pickFailedTitle'),
        error instanceof Error ? error.message : t('pkg.pickFailedBody'),
      );
    } finally {
      setBusy(false);
    }
  };

  const bottomPad = insets.bottom + tabBarHeight + tabBarInset + spacing.xl;

  return (
    <Screen>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Typography variant="h1">{t('pkg.title')}</Typography>
        <Typography variant="caption" color="secondary">
          {status ?? t('pkg.subtitle')}
        </Typography>
      </View>

      <FlatList
        data={visibleFiles}
        keyExtractor={(item) => `${item.uri}::${item.name}`}
        contentContainerStyle={[styles.list, { paddingBottom: bottomPad }]}
        ListHeaderComponent={
          <View style={styles.form}>
            <View style={styles.row}>
              <TextInput
                value={consoleIp}
                onChangeText={setConsoleIp}
                placeholder="192.168.1.42"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="none"
                keyboardType="numbers-and-punctuation"
                style={[
                  styles.input,
                  {
                    flex: 1,
                    color: colors.text,
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              />
              <AnimatedPressable
                onPress={() => void detect()}
                scale={0.92}
                style={[styles.iconBtn, { backgroundColor: colors.item, borderColor: colors.border }]}
                accessibilityLabel={t('pkg.detect')}
              >
                <Radar size={18} color={colors.primary} strokeWidth={2.3} />
              </AnimatedPressable>
            </View>

            <TextInput
              value={lanIpOverride}
              onChangeText={setLanIpOverride}
              placeholder={
                detectedLanIp
                  ? `IP téléphone (auto ${detectedLanIp})`
                  : 'IP LAN du téléphone (si auto incorrecte)'
              }
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              keyboardType="numbers-and-punctuation"
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            />
            <Typography variant="caption" color="tertiary">
              La PS4 télécharge depuis cette IP sur le port 9898. Laisse vide pour l’auto-détection
              {detectedLanIp ? ` (${detectedLanIp})` : ''}.
            </Typography>

            <View style={styles.actions}>
              <Button
                label={busy ? t('pkg.testing') : t('pkg.test')}
                onPress={() => void testConsole()}
                loading={busy}
                disabled={busy}
                size="medium"
              />
              <Button
                label={t('pkg.browse')}
                onPress={() => void pickFromPhone()}
                variant="secondary"
                size="medium"
                disabled={busy}
                leading={<FolderOpen size={16} color={colors.primary} strokeWidth={2.3} />}
              />
            </View>

            <View style={styles.actions}>
              <Button
                label={t('pkg.refresh')}
                onPress={refreshFiles}
                variant="secondary"
                size="medium"
                leading={<RefreshCw size={16} color={colors.primary} strokeWidth={2.3} />}
              />
            </View>

            <View style={styles.switchRow}>
              <Typography variant="body">{t('pkg.ps4Mode')}</Typography>
              <Switch value={ps4Mode} onValueChange={setPs4Mode} />
            </View>

            {lastMode ? (
              <Typography variant="caption" color="secondary">
                {t('pkg.mode', { mode: lastMode })}
              </Typography>
            ) : null}

            <Pressable
              onPress={() => void WebBrowser.openBrowserAsync(PKG_SENDER_CREDIT.url)}
            >
              <Typography variant="caption" color="tertiary">
                {t('pkg.credit', {
                  name: PKG_SENDER_CREDIT.name,
                  author: PKG_SENDER_CREDIT.author,
                })}
              </Typography>
            </Pressable>

            {queue.length > 0 ? (
              <View style={styles.queueBlock}>
                <View style={styles.queueHead}>
                  <Typography variant="title">{t('pkg.queue')}</Typography>
                  <Pressable onPress={clearFinished}>
                    <Trash2 size={16} color={colors.textSecondary} strokeWidth={2.2} />
                  </Pressable>
                </View>
                {queue.slice(0, 8).map((job) => (
                  <View
                    key={job.id}
                    style={[styles.queueRow, { borderColor: colors.border }]}
                  >
                    <View style={{ flex: 1, gap: 2 }}>
                      <Typography variant="body" numberOfLines={1}>
                        {job.fileName}
                      </Typography>
                      <Typography variant="caption" color="secondary">
                        {job.status}
                        {job.size > 0
                          ? ` · ${formatFtpSize(job.served)} / ${formatFtpSize(job.size)}`
                          : ''}
                        {job.error ? ` · ${job.error}` : ''}
                      </Typography>
                    </View>
                    {job.status === 'error' ? (
                      <Pressable onPress={() => retryPkgSend(job.id)}>
                        <RefreshCw size={16} color={colors.primary} strokeWidth={2.2} />
                      </Pressable>
                    ) : job.status === 'running' ? (
                      <ActivityIndicator color={colors.primary} />
                    ) : null}
                  </View>
                ))}
              </View>
            ) : null}

            <View style={[styles.debugBox, { backgroundColor: colors.item, borderColor: colors.border }]}>
              <View style={styles.queueHead}>
                <Typography variant="captionStrong">Debug PKG (temporaire)</Typography>
                <Pressable onPress={clearPkgDebug}>
                  <Typography variant="caption" color="primary">
                    Effacer
                  </Typography>
                </Pressable>
              </View>
              <ScrollView style={styles.debugScroll} nestedScrollEnabled>
                {debugLines.length === 0 ? (
                  <Typography variant="caption" color="tertiary">
                    Les étapes GoldHEN / HTTP apparaissent ici à l’envoi.
                  </Typography>
                ) : (
                  debugLines
                    .slice()
                    .reverse()
                    .map((line, index) => (
                      <Typography
                        key={`${index}-${line.slice(0, 12)}`}
                        variant="caption"
                        color="secondary"
                        style={styles.debugLine}
                      >
                        {line}
                      </Typography>
                    ))
                )}
              </ScrollView>
            </View>

            <Typography variant="title" style={{ marginTop: spacing.md }}>
              {t('pkg.localFiles')}
            </Typography>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon={Package}
            title={t('pkg.emptyTitle')}
            description={t('pkg.emptyBody')}
            actionLabel={t('pkg.browse')}
            onAction={() => void pickFromPhone()}
          />
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.fileRow,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Typography variant="body" numberOfLines={1}>
                {item.name}
              </Typography>
              <Typography variant="caption" color="secondary">
                {item.kind === 'image' ? t('pkg.kindImage') : t('pkg.kindPkg')} ·{' '}
                {formatFtpSize(item.size)}
              </Typography>
            </View>
            <AnimatedPressable
              onPress={() => sendFile(item)}
              scale={0.92}
              style={[styles.sendBtn, { backgroundColor: colors.primary }]}
            >
              <Send size={16} color={colors.onPrimary} strokeWidth={2.4} />
            </AnimatedPressable>
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: screenPadding,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  list: {
    paddingHorizontal: screenPadding,
    gap: spacing.sm,
  },
  form: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  queueBlock: {
    gap: spacing.sm,
  },
  queueHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  debugBox: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    padding: spacing.md,
    gap: spacing.sm,
    maxHeight: 220,
  },
  debugScroll: {
    maxHeight: 160,
  },
  debugLine: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontSize: 11,
    marginBottom: 2,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
