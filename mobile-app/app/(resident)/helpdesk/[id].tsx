import { useLocalSearchParams } from 'expo-router';
import { ComplaintDetail } from '@/features/ComplaintDetail';

export default function ResidentComplaint() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ComplaintDetail id={id} />;
}
