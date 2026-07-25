import { useRouter } from 'expo-router';
import { ComplaintsList } from '@/features/ComplaintsList';

export default function ResidentHelpdesk() {
  const router = useRouter();
  return (
    <ComplaintsList
      scope="mine"
      onOpen={(id) => router.push(`/(resident)/helpdesk/${id}`)}
      onNew={() => router.push('/(resident)/helpdesk/new')}
    />
  );
}
