import { useRouter } from 'expo-router';
import { PollsList } from '@/features/PollsList';

export default function AdminPolls() {
  const router = useRouter();
  return (
    <PollsList
      onOpen={(id) => router.push(`/(admin)/polls/${id}`)}
      onNew={() => router.push('/(admin)/polls/new')}
    />
  );
}
