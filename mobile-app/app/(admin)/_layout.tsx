import { Redirect } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { useAuth } from '@/auth/AuthContext';
import { Loading } from '@/components';
import { AdminPanel } from '@/features/admin/AdminPanel';
import { AdminDrawerProvider, useAdminDrawer } from '@/features/admin/drawerContext';

export default function AdminLayout() {
  const { status, profile, viewMode } = useAuth();

  if (status === 'loading') return <Loading />;
  if (status === 'unauthenticated' || !profile) return <Redirect href="/(auth)/login" />;
  if (profile.role !== 'admin') return <Redirect href="/" />;
  if (viewMode === null) return <Redirect href="/choose-mode" />;
  if (viewMode === 'resident') return <Redirect href="/(resident)" />;

  return (
    <AdminDrawerProvider>
      <AdminDrawerNavigator />
    </AdminDrawerProvider>
  );
}

/** Right-side drawer whose content (Manage / Community) is driven by which tab
 *  was pressed. The bottom tabs live in the nested (tabs) group. */
function AdminDrawerNavigator() {
  const { panel } = useAdminDrawer();
  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerPosition: 'right',
        drawerType: 'front',
        swipeEnabled: false,
        drawerStyle: { width: '84%' },
      }}
      drawerContent={(props) => (
        <AdminPanel kind={panel} onClose={() => props.navigation.closeDrawer()} />
      )}
    >
      <Drawer.Screen name="(tabs)" />
    </Drawer>
  );
}
