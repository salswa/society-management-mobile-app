import { Stack } from 'expo-router';
import { stackScreenOptions } from '@/theme/navOptions';

export default function AdminPollsStack() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="index" />
      <Stack.Screen name="new" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
