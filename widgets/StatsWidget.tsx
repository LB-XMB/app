import { FlexWidget, TextWidget } from 'react-native-android-widget';

import type { CommunityStatsWidget } from '@/services/widgetData';

type Props = {
  stats: CommunityStatsWidget;
  updatedLabel?: string;
};

/** Home-screen widget: community counters from `/api/stats/home`. */
export function StatsWidget({ stats, updatedLabel }: Props) {
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
        justifyContent: 'space-between',
      }}
    >
      <TextWidget
        text="LB'XMB · Stats"
        style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600' }}
      />
      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', flexGap: 8 }}>
        <StatCell label="Ressources" value={stats.resources} />
        <StatCell label="Guides" value={stats.guides} />
        <StatCell label="Membres" value={stats.users} />
      </FlexWidget>
      {updatedLabel ? (
        <TextWidget text={updatedLabel} style={{ color: '#64748B', fontSize: 10 }} />
      ) : null}
    </FlexWidget>
  );
}

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <FlexWidget style={{ flex: 1, flexDirection: 'column', alignItems: 'center' }}>
      <TextWidget
        text={formatCount(value)}
        style={{ color: '#3B82F6', fontSize: 22, fontWeight: '700' }}
      />
      <TextWidget text={label} style={{ color: '#E2E8F0', fontSize: 11 }} />
    </FlexWidget>
  );
}

function formatCount(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('fr-FR').format(value);
}
