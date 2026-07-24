import { useRouter } from 'expo-router';
import { VisitorLog } from '@/features/VisitorLog';

export default function GuardHistory() {
  const router = useRouter();
  return (
    <VisitorLog
      title="History"
      subtitle="Visitors who have entered and left."
      onOpen={(id) => router.push(`/(guard)/visitor/${id}`)}
    />
  );
}
