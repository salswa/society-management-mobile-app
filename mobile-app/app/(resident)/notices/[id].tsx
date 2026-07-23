import { useLocalSearchParams } from 'expo-router';
import { NoticeDetail } from '@/features/NoticeDetail';

export default function ResidentNoticeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <NoticeDetail id={id} />;
}
