import { useLocalSearchParams } from 'expo-router';
import { ComplaintDetail } from '@/features/ComplaintDetail';

export default function AdminComplaint() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ComplaintDetail id={id} />;
}
