import { FlexWidget, TextWidget } from 'react-native-android-widget';

import type { PopularWidgetItem } from '@/services/widgetData';

type Props = {
  items: PopularWidgetItem[];
  updatedLabel?: string;
};

/** Home-screen widget: top popular resources from `/api/home`. */
export function PopularWidget({ items, updatedLabel }: Props) {
  const rows = items.slice(0, 4);

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#07080B',
        borderRadius: 16,
        padding: 14,
        flexDirection: 'column',
        justifyContent: 'flex-start',
        flexGap: 6,
      }}
    >
      <TextWidget
        text="LB'XMB · Populaires"
        style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600' }}
      />
      {rows.length === 0 ? (
        <TextWidget
          text="Aucune ressource pour le moment"
          style={{ color: '#E2E8F0', fontSize: 13 }}
        />
      ) : (
        rows.map((item, index) => (
          <FlexWidget
            key={item.id}
            clickAction="OPEN_URI"
            clickActionData={{ uri: deepLinkForHref(item.href) }}
            style={{ flexDirection: 'row', alignItems: 'center', flexGap: 8 }}
          >
            <TextWidget
              text={`${index + 1}.`}
              style={{ color: '#3B82F6', fontSize: 13, fontWeight: '700' }}
            />
            <TextWidget
              text={item.title}
              truncate="END"
              maxLines={1}
              style={{ color: '#F8FAFC', fontSize: 13, fontWeight: '500' }}
            />
          </FlexWidget>
        ))
      )}
      {updatedLabel ? (
        <TextWidget text={updatedLabel} style={{ color: '#64748B', fontSize: 10 }} />
      ) : null}
    </FlexWidget>
  );
}

function deepLinkForHref(href: string): string {
  if (href.startsWith('http://') || href.startsWith('https://')) return href;
  if (href.startsWith('/')) return `https://lbxmb.fr${href}`;
  return `https://lbxmb.fr/${href}`;
}
