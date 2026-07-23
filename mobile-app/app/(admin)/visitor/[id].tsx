import { useLocalSearchParams } from 'expo-router';
import { VisitorDetail } from '@/features/VisitorDetail';

export default function AdminVisitorDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <VisitorDetail id={id} />;
}
