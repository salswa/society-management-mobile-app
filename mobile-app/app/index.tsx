import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { useAuth } from '@/auth/AuthContext';
import { Loading } from '@/components';
import { colors } from '@/theme/tokens';

/** Entry gate: routes to the right stack based on auth + role. */
export default function Index() {
  const { status, profile } = useAuth();

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Loading />
      </View>
    );
  }

  if (status === 'unauthenticated' || !profile) {
    return <Redirect href="/(auth)/login" />;
  }

  // Signed in but not yet activated / assigned to a society.
  if (profile.status !== 'active' || !profile.society_id) {
    return <Redirect href="/pending" />;
  }

  if (profile.role === 'guard') return <Redirect href="/(guard)" />;
  if (profile.role === 'admin') return <Redirect href="/(admin)" />;
  return <Redirect href="/(resident)" />;
}
