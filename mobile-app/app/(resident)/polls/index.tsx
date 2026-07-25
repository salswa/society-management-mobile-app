import { useRouter } from 'expo-router';
import { PollsList } from '@/features/PollsList';

export default function ResidentPolls() {
  const router = useRouter();
  return <PollsList onOpen={(id) => router.push(`/(resident)/polls/${id}`)} />;
}
