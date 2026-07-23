import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/auth/AuthContext';
import { Loading } from '@/components';
import { floatingTabScreenOptions } from '@/theme/navOptions';

export default function AdminLayout() {
  const { status, profile, viewMode } = useAuth();

  if (status === 'loading') return <Loading />;
  if (status === 'unauthenticated' || !profile) return <Redirect href="/(auth)/login" />;
  if (profile.role !== 'admin') return <Redirect href="/" />;
  if (viewMode === null) return <Redirect href="/choose-mode" />;
  if (viewMode === 'resident') return <Redirect href="/(resident)" />;

  return (
    <Tabs screenOptions={floatingTabScreenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Overview',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="visitors"
        options={{
          title: 'Visitors',
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="notices"
        options={{
          title: 'Notices',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="megaphone-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen name="visitor/[id]" options={{ href: null }} />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
