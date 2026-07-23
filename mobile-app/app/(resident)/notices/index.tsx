import { useRouter } from 'expo-router';
import { NoticesList } from '@/features/NoticesList';

export default function ResidentNotices() {
  const router = useRouter();
  return <NoticesList onOpen={(id) => router.push(`/(resident)/notices/${id}`)} />;
}
