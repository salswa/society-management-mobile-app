import { useRouter } from 'expo-router';
import { VisitorLog } from '@/features/VisitorLog';

export default function AdminVisitorLog() {
  const router = useRouter();
  return (
    <VisitorLog
      title="Visitor log"
      subtitle="Every visitor who has entered and left the society."
      onOpen={(id) => router.push(`/(admin)/visitor/${id}`)}
    />
  );
}
