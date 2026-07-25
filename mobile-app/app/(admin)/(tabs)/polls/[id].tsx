import { useLocalSearchParams } from 'expo-router';
import { PollDetail } from '@/features/PollDetail';

export default function AdminPoll() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PollDetail id={id} />;
}
