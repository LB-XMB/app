import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/layout/TabBar';
import { useColors } from '@/ui/theme';

export default function TabsLayout() {
  const colors = useColors();

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Accueil' }} />
      <Tabs.Screen name="catalogue" options={{ title: 'Catalogue' }} />
      <Tabs.Screen name="ftp" options={{ title: 'FTP' }} />
      <Tabs.Screen name="recherche" options={{ title: 'Recherche' }} />
      <Tabs.Screen name="profil" options={{ title: 'Profil' }} />
    </Tabs>
  );
}
