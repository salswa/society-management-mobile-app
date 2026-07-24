import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { useAdminDrawer } from '@/features/admin/drawerContext';
import { floatingTabScreenOptions } from '@/theme/navOptions';

export default function AdminTabs() {
  const { openPanel } = useAdminDrawer();

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
        name="manage"
        options={{
          title: 'Manage',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="briefcase-outline" color={color} size={size} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            openPanel('manage');
            navigation.getParent()?.dispatch(DrawerActions.openDrawer());
          },
        })}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" color={color} size={size} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            openPanel('community');
            navigation.getParent()?.dispatch(DrawerActions.openDrawer());
          },
        })}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: 'Visitor log',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" color={color} size={size} />
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

      {/* Reached from the drawer / row taps — hidden from the tab bar. */}
      <Tabs.Screen name="residents" options={{ href: null }} />
      <Tabs.Screen name="notices" options={{ href: null }} />
      <Tabs.Screen name="visitor/[id]" options={{ href: null }} />
    </Tabs>
  );
}
