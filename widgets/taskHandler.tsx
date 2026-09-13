import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { fetchWidgetPayloads } from '@/services/widgetData';

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

export async function widgetTaskHandler(props: WidgetTaskHandlerProps): Promise<void> {
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      try {
        const data = await fetchWidgetPayloads();
        const label = updatedLabel(data.fetchedAt);
        if (props.widgetInfo.widgetName === 'Stats') {
          props.renderWidget(<StatsWidget stats={data.stats} updatedLabel={label} />);
        } else if (props.widgetInfo.widgetName === 'Popular') {
          props.renderWidget(<PopularWidget items={data.popular} updatedLabel={label} />);
        }
      } catch {
        if (props.widgetInfo.widgetName === 'Stats') {
          props.renderWidget(
            <StatsWidget stats={{ resources: 0, users: 0, guides: 0 }} updatedLabel="Hors ligne" />,
          );
        } else if (props.widgetInfo.widgetName === 'Popular') {
          props.renderWidget(<PopularWidget items={[]} updatedLabel="Hors ligne" />);
        }
      }
      break;
    }
    case 'WIDGET_DELETED':
    case 'WIDGET_CLICK':
    default:
      break;
  }
}
