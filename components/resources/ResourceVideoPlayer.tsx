import { useVideoPlayer, VideoView } from 'expo-video';
import { useMemo } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { useColors } from '@/ui/theme';

import type { MediaItem } from './mediaItems';

/**
 * Lecteur vidéo embarqué.
 *
 * - Fichiers hébergés : `expo-video` (contrôles natifs).
 * - YouTube : WebView + [Plyr](https://plyr.io/) (même stack que le site).
 */

export type ResourceVideoPlayerProps = {
  item: Extract<MediaItem, { kind: 'video' | 'youtube' }>;
};

export function ResourceVideoPlayer({ item }: ResourceVideoPlayerProps) {
  if (item.kind === 'youtube') {
    return <YoutubePlyrPlayer videoId={item.videoId} />;
  }
  return <HostedVideoPlayer uri={item.uri} />;
}

function HostedVideoPlayer({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = false;
    instance.play();
  });

  return (
    <VideoView
      style={styles.fill}
      player={player}
      fullscreenOptions={{ enable: true }}
      allowsPictureInPicture={Platform.OS === 'ios'}
      contentFit="contain"
      nativeControls
    />
  );
}

function YoutubePlyrPlayer({ videoId }: { videoId: string }) {
  const colors = useColors();
  const html = useMemo(() => buildPlyrHtml(videoId), [videoId]);

  return (
    <View style={[styles.fill, { backgroundColor: '#000' }]}>
      <WebView
        originWhitelist={['*']}
        source={{ html, baseUrl: 'https://lbxmb.fr' }}
        style={styles.fill}
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}
      />
    </View>
  );
}

function buildPlyrHtml(videoId: string): string {
  // HTML minimal inspiré de la doc Plyr YouTube : https://plyr.io/
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/plyr@3.7.8/dist/plyr.css" />
  <style>
    html, body { margin: 0; height: 100%; background: #000; overflow: hidden; }
    .plyr, .plyr__video-embed { height: 100%; width: 100%; }
    .plyr--full-ui input[type=range] { color: #38bdf8; }
    .plyr__control--overlaid { background: rgba(56, 189, 248, 0.9); }
  </style>
</head>
<body>
  <div class="plyr__video-embed" id="player">
    <iframe
      src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?origin=https://lbxmb.fr&amp;iv_load_policy=3&amp;modestbranding=1&amp;playsinline=1&amp;showinfo=0&amp;rel=0&amp;enablejsapi=1"
      allowfullscreen
      allow="autoplay; encrypted-media; picture-in-picture"
      allowtransparency="true"
      title="YouTube"
    ></iframe>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/plyr@3.7.8/dist/plyr.polyfilled.min.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', function () {
      var player = new Plyr('#player', {
        autoplay: true,
        controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'pip', 'fullscreen'],
        youtube: { noCookie: true, rel: 0, showinfo: 0, iv_load_policy: 3, modestbranding: 1 }
      });
      player.on('ready', function () { try { player.play(); } catch (e) {} });
    });
  </script>
</body>
</html>`;
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  loading: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
});
