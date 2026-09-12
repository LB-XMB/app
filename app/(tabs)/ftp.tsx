import { Directory, File, Paths } from 'expo-file-system';
import {
  ChevronLeft,
  Folder,
  HardDrive,
  Plus,
  RefreshCw,
  Upload,
  Wifi,
  WifiOff,
} from 'lucide-react-native';
import { useCallback, useEffect, useState, type ComponentProps } from 'react';
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
import { enqueueFtpUpload, pumpFtpUploadQueue } from '@/services/ftpUploadQueue';
import {
  resolveFtpPassword,
  saveFtpPassword,
  useActiveFtpProfile,
  useFtpStore,
  type FtpProfile,
} from '@/stores/ftp';
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

function newProfile(): FtpProfile {
  return {
    id: `ftp-${Date.now()}`,
    name: `Console ${useFtpStore.getState().profiles.length + 1}`,
    host: '',
    port: 21,
    user: 'anonymous',
    protocol: 'ftp',
    lastPath: '/',
  };
}

export default function FtpScreen() {
  const active = useActiveFtpProfile();
  useEffect(() => {
    void pumpFtpUploadQueue();
  }, []);

  return <FtpScreenBody key={active?.id ?? 'none'} />;
}

function FtpScreenBody() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  useScreenTracking('/ftp');

  const profiles = useFtpStore((state) => state.profiles);
  const active = useActiveFtpProfile();
  const patchActive = useFtpStore((state) => state.patchActive);
  const setActiveProfileId = useFtpStore((state) => state.setActiveProfileId);
  const upsertProfile = useFtpStore((state) => state.upsertProfile);
  const setPasswordDraft = useFtpStore((state) => state.setPasswordDraft);
  const uploadQueue = useFtpStore((state) => state.uploadQueue);
  const history = useHistoryStore((state) => state.downloads);

  const [client, setClient] = useState<FtpClient | null>(null);
  const [path, setPath] = useState(active?.lastPath || '/');
  const [entries, setEntries] = useState<FtpEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [password, setPassword] = useState('');

  const connected = client !== null;
  const profileId = active?.id;

  useEffect(() => {
    if (!profileId) return;
    let cancelled = false;
    void (async () => {
      const draft = useFtpStore.getState().passwordDrafts[profileId];
      const stored = draft ?? (await resolveFtpPassword(profileId));
      if (!cancelled) setPassword(stored);
    })();
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  const refresh = useCallback(
    async (nextClient: FtpClient, nextPath: string) => {
      setBusy(true);
      setStatus('Lecture du dossier…');
      try {
        const listed = await nextClient.list(nextPath);
        setEntries(listed);
        setPath(nextPath);
        patchActive({ lastPath: nextPath });
        setStatus(`${listed.length} élément${listed.length > 1 ? 's' : ''}`);
      } finally {
        setBusy(false);
      }
    },
    [patchActive]
  );

  const connect = async () => {
    if (!active?.host.trim()) {
      Alert.alert('IP manquante', 'Indique l’adresse IP de ta console sur le réseau local.');
      return;
    }

    setBusy(true);
    setStatus('Connexion…');
    await saveFtpPassword(active.id, password);
    setPasswordDraft(active.id, password);

    const next = new FtpClient({
      host: active.host.trim(),
      port: active.port || (active.protocol === 'sftp' ? 22 : 21),
      user: active.user.trim(),
      password,
      protocol: active.protocol || 'ftp',
    });

    try {
      await next.connect();
      setClient(next);
      await refresh(next, active.lastPath || '/');
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

  const queueLocalFile = (fileName: string, uri: string) => {
    if (!active) return;
    const remote = path.endsWith('/') ? `${path}${fileName}` : `${path}/${fileName}`;
    enqueueFtpUpload({
      profileId: active.id,
      fileName,
      localUri: uri,
      remotePath: remote,
    });
    setStatus(`Ajouté à la file : ${fileName}`);
  };

  const pickFromHistory = () => {
    if (!active) return;
    const local = listLocalDownloads();
    const choices: { label: string; run: () => void }[] = [
      ...local.map((file) => ({
        label: file.name,
        run: () => queueLocalFile(file.name, file.uri),
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
                queueLocalFile(item.fileName, downloaded.uri);
              } catch (error) {
                Alert.alert(
                  'Téléchargement impossible',
                  error instanceof Error ? error.message : 'Le fichier n’est plus disponible.'
                );
              } finally {
                setBusy(false);
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

    Alert.alert('Choisir un fichier', 'Ajoute à la file d’envoi FTP :', [
      ...choices.slice(0, 5).map((choice) => ({
        text: choice.label,
        onPress: choice.run,
      })),
      { text: 'Annuler', style: 'cancel' as const },
    ]);
  };

  const pendingUploads = uploadQueue.filter(
    (job) => job.status === 'pending' || job.status === 'running' || job.status === 'error'
  );

  if (!active) {
    return (
      <Screen>
        <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
          <Typography variant="h1">FTP / SFTP</Typography>
        </View>
        <EmptyState
          icon={HardDrive}
          title="Aucun profil"
          description="Crée un profil console pour commencer."
          actionLabel="Nouveau profil"
          onAction={() => upsertProfile(newProfile())}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitles}>
            <Typography variant="h1">FTP / SFTP</Typography>
            <Typography variant="caption" color="secondary">
              {connected
                ? status ?? path
                : 'Profils console + file d’envoi multi-fichiers'}
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
          ) : (
            <AnimatedPressable
              onPress={() => upsertProfile(newProfile())}
              scale={0.92}
              style={[styles.iconButton, { backgroundColor: colors.item, borderColor: colors.border }]}
              accessibilityLabel="Nouveau profil"
            >
              <Plus size={18} color={colors.primary} strokeWidth={2.3} />
            </AnimatedPressable>
          )}
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
            {profiles.map((profile) => (
              <ProtocolChip
                key={profile.id}
                label={profile.name}
                active={profile.id === active.id}
                onPress={() => setActiveProfileId(profile.id)}
              />
            ))}
          </View>

          <Field
            label="Nom du profil"
            value={active.name}
            onChangeText={(name) => patchActive({ name })}
            placeholder="PS4 salon"
          />

          <View style={styles.protocolRow}>
            <ProtocolChip
              label="FTP"
              active={active.protocol !== 'sftp'}
              onPress={() => patchActive({ protocol: 'ftp' })}
            />
            <ProtocolChip
              label="SFTP"
              active={active.protocol === 'sftp'}
              onPress={() => patchActive({ protocol: 'sftp' })}
            />
          </View>

          <Field
            label="Adresse IP"
            value={active.host}
            onChangeText={(host) => patchActive({ host })}
            placeholder="192.168.1.42"
            autoCapitalize="none"
          />
          <Field
            label="Port"
            value={String(active.port)}
            onChangeText={(value) =>
              patchActive({
                port: Number(value) || (active.protocol === 'sftp' ? 22 : 21),
              })
            }
            placeholder={active.protocol === 'sftp' ? '22' : '21'}
            keyboardType="number-pad"
          />
          <Field
            label="Utilisateur"
            value={active.user}
            onChangeText={(user) => patchActive({ user })}
            placeholder="anonymous"
            autoCapitalize="none"
          />
          <Field
            label="Mot de passe"
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setPasswordDraft(active.id, value);
            }}
            placeholder="Stocké dans le coffre appareil"
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

          {pendingUploads.length > 0 ? (
            <Typography variant="caption" color="secondary">
              File d’envoi : {pendingUploads.length} fichier
              {pendingUploads.length > 1 ? 's' : ''} en attente / en cours.
            </Typography>
          ) : null}

          <Typography variant="caption" color="tertiary">
            Les mots de passe sont enregistrés dans le coffre sécurisé de l’appareil (pas en
            clair dans MMKV). Pour PS3/PS4, utilise FTP (Multiman / webMAN / GoldHEN).
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

          {pendingUploads.length > 0 ? (
            <Typography
              variant="caption"
              color="secondary"
              style={{ paddingHorizontal: screenPadding, paddingBottom: spacing.sm }}
            >
              File : {pendingUploads.map((job) => job.fileName).join(', ')}
            </Typography>
          ) : null}

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
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  protocolChip: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
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
