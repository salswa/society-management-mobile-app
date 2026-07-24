import { useLocalSearchParams } from 'expo-router';
import { NoticeDetail } from '@/features/NoticeDetail';

export default function AdminNoticeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <NoticeDetail id={id} />;
}
