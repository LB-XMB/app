import { Directory, File, Paths } from 'expo-file-system';
import {
  ChevronLeft,
  Folder,
  HardDrive,
  RefreshCw,
  Upload,
  Wifi,
  WifiOff,
} from 'lucide-react-native';
import { useCallback, useState, type ComponentProps } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useScreenTracking } from '@/hooks/useScreenTracking';
import {
  FtpClient,
  FtpError,
  formatFtpSize,
  type FtpEntry,
} from '@/services/ftp';
import { useFtpStore } from '@/stores/ftp';
import { useHistoryStore } from '@/stores/history';
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

const DOWNLOAD_DIRECTORY = 'telechargements';

interface LocalFile {
  name: string;
  uri: string;
}

function listLocalDownloads(): LocalFile[] {
  try {
    const directory = new Directory(Paths.document, DOWNLOAD_DIRECTORY);
    if (!directory.exists) return [];
    return directory
      .list()
      .filter((entry): entry is File => entry instanceof File)
      .map((file) => ({ name: file.name, uri: file.uri }));
  } catch {
    return [];
  }
}

export default function FtpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  useScreenTracking('/ftp');

  const target = useFtpStore((state) => state.target);
  const setTarget = useFtpStore((state) => state.setTarget);
  const history = useHistoryStore((state) => state.downloads);

  const [client, setClient] = useState<FtpClient | null>(null);
  const [path, setPath] = useState(target.lastPath || '/');
  const [entries, setEntries] = useState<FtpEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const connected = client !== null;

  const refresh = useCallback(
    async (nextClient: FtpClient, nextPath: string) => {
      setBusy(true);
      setStatus('Lecture du dossier…');
      try {
        const listed = await nextClient.list(nextPath);
        setEntries(listed);
        setPath(nextPath);
        setTarget({ lastPath: nextPath });
        setStatus(`${listed.length} élément${listed.length > 1 ? 's' : ''}`);
      } finally {
        setBusy(false);
      }
    },
    [setTarget]
  );

  const connect = async () => {
    if (!target.host.trim()) {
      Alert.alert('IP manquante', 'Indique l’adresse IP de ta console sur le réseau local.');
      return;
    }

    setBusy(true);
    setStatus('Connexion…');
    const next = new FtpClient({
      host: target.host.trim(),
      port: target.port || (target.protocol === 'sftp' ? 22 : 21),
      user: target.user.trim(),
      password: target.password,
      protocol: target.protocol || 'ftp',
    });

    try {
      await next.connect();
      setClient(next);
      await refresh(next, target.lastPath || '/');
    } catch (error) {
      await next.disconnect().catch(() => undefined);
      setClient(null);
      Alert.alert(
        'Connexion impossible',
        error instanceof FtpError || error instanceof Error
          ? error.message
          : 'Vérifie l’IP, le port et que le serveur FTP de la console est démarré.'
      );
      setStatus(null);
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    try {
      await client?.disconnect();
    } finally {
      setClient(null);
      setEntries([]);
      setStatus(null);
      setBusy(false);
    }
  };

  const openEntry = async (entry: FtpEntry) => {
    if (!client || !entry.isDirectory) return;
    try {
      await refresh(client, entry.path);
    } catch (error) {
      Alert.alert(
        'Dossier inaccessible',
        error instanceof Error ? error.message : 'Impossible d’ouvrir ce dossier.'
      );
    }
  };

  const goUp = async () => {
    if (!client || path === '/') return;
    const parent = path.replace(/\/+$/, '').split('/').slice(0, -1).join('/') || '/';
    try {
      await refresh(client, parent);
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Retour impossible.');
    }
  };

  const uploadBytes = async (fileName: string, bytes: Uint8Array) => {
    if (!client) return;
    setBusy(true);
    setStatus(`Envoi de ${fileName}…`);
    try {
      const remote = path.endsWith('/') ? `${path}${fileName}` : `${path}/${fileName}`;
      await client.upload(remote, bytes);
      await refresh(client, path);
      Alert.alert('Envoi terminé', `${fileName} est sur la console.`);
    } catch (error) {
      Alert.alert(
        'Envoi refusé',
        error instanceof Error ? error.message : 'Le transfert a échoué.'
      );
      setStatus(null);
    } finally {
      setBusy(false);
    }
  };

  const pickFromHistory = () => {
    const local = listLocalDownloads();
    const choices: { label: string; run: () => void }[] = [
      ...local.map((file) => ({
        label: file.name,
        run: () => {
          void (async () => {
            const bytes = await new File(file.uri).bytes();
            await uploadBytes(file.name, bytes);
          })();
        },
      })),
      ...history
        .filter((item) => !local.some((file) => file.name === item.fileName))
        .slice(0, 4)
        .map((item) => ({
          label: `${item.fileName} (re-télécharger)`,
          run: () => {
            void (async () => {
              setBusy(true);
              setStatus(`Téléchargement de ${item.fileName}…`);
              try {
                const directory = new Directory(Paths.document, DOWNLOAD_DIRECTORY);
                if (!directory.exists) directory.create({ intermediates: true });
                const destination = new File(directory, item.fileName);
                const downloaded = await File.downloadFileAsync(item.url, destination, {
                  idempotent: true,
                });
                const bytes = await new File(downloaded.uri).bytes();
                await uploadBytes(item.fileName, bytes);
              } catch (error) {
                Alert.alert(
                  'Téléchargement impossible',
                  error instanceof Error ? error.message : 'Le fichier n’est plus disponible.'
                );
                setBusy(false);
                setStatus(null);
              }
            })();
          },
        })),
    ];

    if (choices.length === 0) {
      Alert.alert(
        'Aucun fichier local',
        'Télécharge d’abord une ressource depuis le catalogue pour pouvoir l’envoyer à la console.'
      );
      return;
    }

    Alert.alert('Choisir un fichier', 'Depuis les téléchargements de l’app :', [
      ...choices.slice(0, 5).map((choice) => ({
        text: choice.label,
        onPress: choice.run,
      })),
      { text: 'Annuler', style: 'cancel' as const },
    ]);
  };

  return (
    <Screen>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitles}>
            <Typography variant="h1">FTP / SFTP</Typography>
            <Typography variant="caption" color="secondary">
              {connected
                ? status ?? path
                : 'Envoie un PKG à ta console (FTP) ou vers un serveur SFTP'}
            </Typography>
          </View>
          {connected ? (
            <AnimatedPressable
              onPress={() => void disconnect()}
              scale={0.92}
              style={[styles.iconButton, { backgroundColor: colors.item, borderColor: colors.border }]}
              accessibilityLabel="Déconnecter"
            >
              <WifiOff size={18} color={colors.danger} strokeWidth={2.3} />
            </AnimatedPressable>
          ) : null}
        </View>
      </View>

      {!connected ? (
        <View
          style={[
            styles.form,
            { paddingBottom: insets.bottom + tabBarHeight + tabBarInset + spacing.xl },
          ]}
        >
          <View style={styles.protocolRow}>
            <ProtocolChip
              label="FTP"
              active={target.protocol !== 'sftp'}
              onPress={() => setTarget({ protocol: 'ftp' })}
            />
            <ProtocolChip
              label="SFTP"
              active={target.protocol === 'sftp'}
              onPress={() => setTarget({ protocol: 'sftp' })}
            />
          </View>

          <Field
            label="Adresse IP"
            value={target.host}
            onChangeText={(host) => setTarget({ host })}
            placeholder="192.168.1.42"
            autoCapitalize="none"
          />
          <Field
            label="Port"
            value={String(target.port)}
            onChangeText={(value) =>
              setTarget({
                port: Number(value) || (target.protocol === 'sftp' ? 22 : 21),
              })
            }
            placeholder={target.protocol === 'sftp' ? '22' : '21'}
            keyboardType="number-pad"
          />
          <Field
            label="Utilisateur"
            value={target.user}
            onChangeText={(user) => setTarget({ user })}
            placeholder="anonymous"
            autoCapitalize="none"
          />
          <Field
            label="Mot de passe"
            value={target.password}
            onChangeText={(password) => setTarget({ password })}
            placeholder="••••••••"
            secureTextEntry
          />

          <Button
            label={busy ? 'Connexion…' : 'Se connecter'}
            onPress={() => void connect()}
            loading={busy}
            disabled={busy}
            size="large"
            leading={<Wifi size={18} color={colors.onPrimary} strokeWidth={2.4} />}
          />

          <Typography variant="caption" color="tertiary">
            {target.protocol === 'sftp'
              ? 'SFTP s’appuie sur ssh2 — réservé aux serveurs SSH. Pour PS3/PS4 (Multiman, webMAN, GoldHEN), choisis FTP.'
              : 'La console et le téléphone doivent être sur le même Wi-Fi (pas de VPN / données mobiles). Démarre le serveur FTP sur la console avant de te connecter — le port 21 est le plus courant.'}
          </Typography>
        </View>
      ) : (
        <View style={styles.browser}>
          <View style={styles.toolbar}>
            <AnimatedPressable
              onPress={() => void goUp()}
              disabled={path === '/' || busy}
              scale={0.92}
              style={[styles.iconButton, { backgroundColor: colors.item, borderColor: colors.border }]}
            >
              <ChevronLeft size={18} color={colors.text} strokeWidth={2.4} />
            </AnimatedPressable>
            <Typography variant="captionStrong" numberOfLines={1} style={styles.path}>
              {path}
            </Typography>
            <AnimatedPressable
              onPress={() => client && void refresh(client, path)}
              disabled={busy}
              scale={0.92}
              style={[styles.iconButton, { backgroundColor: colors.item, borderColor: colors.border }]}
            >
              <RefreshCw size={16} color={colors.text} strokeWidth={2.4} />
            </AnimatedPressable>
            <AnimatedPressable
              onPress={pickFromHistory}
              disabled={busy}
              scale={0.92}
              style={[
                styles.iconButton,
                { backgroundColor: `${colors.primary}22`, borderColor: colors.primary },
              ]}
              accessibilityLabel="Envoyer un fichier"
            >
              <Upload size={16} color={colors.primary} strokeWidth={2.4} />
            </AnimatedPressable>
          </View>

          {busy && entries.length === 0 ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : (
            <FlatList
              data={entries}
              keyExtractor={(item) => item.path}
              contentContainerStyle={{
                paddingHorizontal: screenPadding,
                paddingBottom: insets.bottom + tabBarHeight + tabBarInset + spacing.xl,
                gap: spacing.sm,
              }}
              ListEmptyComponent={
                <EmptyState
                  icon={HardDrive}
                  title="Dossier vide"
                  description="Envoie un fichier depuis tes téléchargements avec le bouton d’upload."
                />
              }
              renderItem={({ item }) => (
                <AnimatedPressable
                  onPress={() => void openEntry(item)}
                  disabled={!item.isDirectory}
                  scale={0.98}
                  style={[
                    styles.entry,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <View
                    style={[
                      styles.entryIcon,
                      {
                        backgroundColor: item.isDirectory ? `${colors.warning}22` : colors.item,
                      },
                    ]}
                  >
                    {item.isDirectory ? (
                      <Folder size={18} color={colors.warning} strokeWidth={2.2} />
                    ) : (
                      <HardDrive size={18} color={colors.textSecondary} strokeWidth={2.2} />
                    )}
                  </View>
                  <View style={styles.entryText}>
                    <Typography variant="title" numberOfLines={1}>
                      {item.name}
                    </Typography>
                    <Typography variant="caption" color="tertiary">
                      {item.isDirectory ? 'Dossier' : formatFtpSize(item.size)}
                    </Typography>
                  </View>
                </AnimatedPressable>
              )}
            />
          )}
        </View>
      )}
    </Screen>
  );
}

function ProtocolChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <AnimatedPressable
      onPress={onPress}
      scale={0.96}
      style={[
        styles.protocolChip,
        {
          backgroundColor: active ? `${colors.primary}22` : colors.card,
          borderColor: active ? colors.primary : colors.border,
        },
      ]}
    >
      <Typography variant="captionStrong" color={active ? 'primary' : 'secondary'}>
        {label}
      </Typography>
    </AnimatedPressable>
  );
}

function Field({
  label,
  ...input
}: {
  label: string;
} & ComponentProps<typeof TextInput>) {
  const colors = useColors();
  return (
    <View style={styles.field}>
      <Typography variant="label" color="tertiary">
        {label}
      </Typography>
      <TextInput
        {...input}
        placeholderTextColor={colors.textTertiary}
        style={[
          styles.input,
          { color: colors.text, backgroundColor: colors.card, borderColor: colors.border },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: screenPadding,
    paddingBottom: spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerTitles: {
    flex: 1,
    gap: 2,
  },
  form: {
    paddingHorizontal: screenPadding,
    gap: spacing.lg,
  },
  protocolRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  protocolChip: {
    flex: 1,
    height: 40,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: {
    gap: spacing.sm,
  },
  input: {
    height: 48,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
  },
  browser: {
    flex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: screenPadding,
    paddingBottom: spacing.md,
  },
  path: {
    flex: 1,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  entryIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryText: {
    flex: 1,
    gap: 2,
  },
  loader: {
    marginTop: spacing['3xl'],
  },
});
