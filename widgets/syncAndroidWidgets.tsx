import { Platform } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';

import { fetchWidgetPayloads, type WidgetPayloads } from '@/services/widgetData';

import { PopularWidget } from './PopularWidget';
import { StatsWidget } from './StatsWidget';

function updatedLabel(iso: string): string {
  try {
    return `MAJ ${new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  } catch {
    return '';
  }
}

/** Push latest public payloads to any installed Android home-screen widgets. */
export async function syncAndroidWidgets(payload?: WidgetPayloads): Promise<void> {
  if (Platform.OS !== 'android') return;

  const data = payload ?? (await fetchWidgetPayloads());
  const label = updatedLabel(data.fetchedAt);

  await Promise.all([
    requestWidgetUpdate({
      widgetName: 'Stats',
      renderWidget: () => <StatsWidget stats={data.stats} updatedLabel={label} />,
    }),
    requestWidgetUpdate({
      widgetName: 'Popular',
      renderWidget: () => <PopularWidget items={data.popular} updatedLabel={label} />,
    }),
  ]);
}
