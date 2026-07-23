import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/auth/AuthContext';
import { Loading } from '@/components';
import { floatingTabScreenOptions } from '@/theme/navOptions';

export default function GuardLayout() {
  const { status, profile } = useAuth();

  if (status === 'loading') return <Loading />;
  if (status === 'unauthenticated' || !profile) return <Redirect href="/(auth)/login" />;
  if (profile.role !== 'guard') return <Redirect href="/" />;

  return (
    <Tabs screenOptions={floatingTabScreenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Gate',
          tabBarIcon: ({ color, size }) => <Ionicons name="shield-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="register"
        options={{
          title: 'Register',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="approvals"
        options={{
          title: 'Approvals',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkmark-done-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" color={color} size={size} />,
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
