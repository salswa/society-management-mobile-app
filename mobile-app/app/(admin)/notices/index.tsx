import { useRouter } from 'expo-router';
import { NoticesList } from '@/features/NoticesList';

export default function AdminNotices() {
  const router = useRouter();
  return (
    <NoticesList
      onOpen={(id) => router.push(`/(admin)/notices/${id}`)}
      onCreate={() => router.push('/(admin)/notices/new')}
    />
  );
}
