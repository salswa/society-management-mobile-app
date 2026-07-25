import { useLocalSearchParams } from 'expo-router';
import { PollDetail } from '@/features/PollDetail';

export default function ResidentPoll() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PollDetail id={id} />;
}
