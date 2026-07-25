import { useRouter } from 'expo-router';
import { ComplaintsList } from '@/features/ComplaintsList';

export default function AdminHelpdesk() {
  const router = useRouter();
  return (
    <ComplaintsList
      scope="all"
      showAuthor
      onOpen={(id) => router.push(`/(admin)/helpdesk/${id}`)}
    />
  );
}
