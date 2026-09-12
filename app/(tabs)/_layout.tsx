import { Tabs } from 'expo-router/js-tabs';
import { useTranslation } from 'react-i18next';

import { TabBar } from '@/components/layout/TabBar';
import { useColors } from '@/ui/theme';

export default function TabsLayout() {
  const colors = useColors();
  const { t } = useTranslation();

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.home') }} />
      <Tabs.Screen name="catalogue" options={{ title: t('tabs.catalogue') }} />
      <Tabs.Screen name="ftp" options={{ title: t('tabs.ftp') }} />
      <Tabs.Screen name="recherche" options={{ title: t('tabs.search') }} />
      <Tabs.Screen name="profil" options={{ title: t('tabs.profile') }} />
    </Tabs>
  );
}
