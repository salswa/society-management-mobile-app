import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/auth/AuthContext';
import { Loading } from '@/components';
import { floatingTabScreenOptions } from '@/theme/navOptions';

export default function ResidentLayout() {
  const { status, profile, viewMode } = useAuth();

  if (status === 'loading') return <Loading />;
  if (status === 'unauthenticated' || !profile) return <Redirect href="/(auth)/login" />;
  // Residents always; admins only while viewing the resident experience.
  const allowed =
    profile.role === 'resident' || (profile.role === 'admin' && viewMode === 'resident');
  if (!allowed) return <Redirect href="/" />;

  return (
    <Tabs screenOptions={floatingTabScreenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} />,
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
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
      {/* Reached from the home quick-actions — hidden from the tab bar. */}
      <Tabs.Screen name="pre-approve" options={{ href: null }} />
      <Tabs.Screen name="helpdesk" options={{ href: null }} />
      <Tabs.Screen name="dues" options={{ href: null }} />
      <Tabs.Screen name="polls" options={{ href: null }} />
      <Tabs.Screen name="amenities" options={{ href: null }} />
    </Tabs>
  );
}
