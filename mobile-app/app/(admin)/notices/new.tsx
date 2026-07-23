import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ApiError } from '@/api/client';
import { useCreateNotice } from '@/query/hooks';
import { Button, Card, Input, Screen, Text, TopBar } from '@/components';
import { colors, spacing } from '@/theme/tokens';

export default function NewNotice() {
  const router = useRouter();
  const createNotice = useCreateNotice();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('general');
  const [pinned, setPinned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = () => {
    setError(null);
    if (!title.trim() || !body.trim()) {
      setError('Add a title and message.');
      return;
    }
    createNotice.mutate(
      { title: title.trim(), body: body.trim(), category: category.trim() || 'general', is_pinned: pinned },
      {
        onSuccess: () => {
          Alert.alert('Notice posted', 'Residents can see it now.');
          router.back();
        },
        onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not post the notice.'),
      }
    );
  };

  return (
    <Screen scroll tabbarSpace header={<TopBar title="Post a notice" />}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.form}>
          <Input label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Water shutdown" />
          <Input
            label="Message"
            value={body}
            onChangeText={setBody}
            placeholder="Write the details…"
            multiline
            numberOfLines={5}
            style={styles.textarea}
          />
          <Input
            label="Category"
            value={category}
            onChangeText={setCategory}
            placeholder="general"
            autoCapitalize="none"
          />

          <Card onPress={() => setPinned((p) => !p)} style={styles.pinRow}>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">Pin to top</Text>
              <Text variant="small" color={colors.textMuted}>
                Keep this notice above others.
              </Text>
            </View>
            <View style={[styles.toggle, pinned && styles.toggleOn]}>
              <View style={[styles.knob, pinned && styles.knobOn]} />
            </View>
          </Card>

          {error ? (
            <Text variant="small" color={colors.danger}>
              {error}
            </Text>
          ) : null}

          <Button title="Post notice" loading={createNotice.isPending} onPress={onSubmit} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg, paddingTop: spacing.sm },
  textarea: { minHeight: 120, paddingTop: spacing.md, textAlignVertical: 'top' },
  pinRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  toggle: {
    width: 46,
    height: 28,
    borderRadius: 999,
    backgroundColor: colors.border,
    padding: 3,
    justifyContent: 'center',
  },
  toggleOn: { backgroundColor: colors.primary },
  knob: { width: 22, height: 22, borderRadius: 999, backgroundColor: colors.surface },
  knobOn: { alignSelf: 'flex-end' },
});
