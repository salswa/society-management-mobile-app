import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { ComplaintPriority } from '@/api/types';
import { ApiError } from '@/api/client';
import { useCreateComplaint, useMyProfile } from '@/query/hooks';
import { Button, ChoiceChips, Input, Screen, Text, TopBar } from '@/components';
import { colors, spacing } from '@/theme/tokens';

const PRIORITIES: { label: string; value: ComplaintPriority }[] = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
];

export default function NewComplaint() {
  const router = useRouter();
  const me = useMyProfile();
  const createComplaint = useCreateComplaint();

  const flats = me.data?.flats ?? [];
  const flatId = useMemo(
    () => (flats.find((f) => f.is_primary) ?? flats[0])?.flat?.id,
    [flats]
  );

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<ComplaintPriority>('medium');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = () => {
    setError(null);
    if (!title.trim()) return setError('Enter a short title.');

    createComplaint.mutate(
      {
        title: title.trim(),
        category: category.trim() || undefined,
        priority,
        description: description.trim() || undefined,
        flat_id: flatId,
      },
      {
        onSuccess: () => {
          Alert.alert('Complaint raised', 'The admin will look into it.');
          router.back();
        },
        onError: (e) =>
          setError(e instanceof ApiError ? e.message : 'Could not submit. Try again.'),
      }
    );
  };

  return (
    <Screen scroll tabbarSpace header={<TopBar title="Raise a complaint" />}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.form}>
          <Input
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Water leakage in bathroom"
          />
          <Input
            label="Category (optional)"
            value={category}
            onChangeText={setCategory}
            placeholder="e.g. plumbing, electrical"
          />

          <View style={styles.field}>
            <Text variant="label" color={colors.textMuted}>
              PRIORITY
            </Text>
            <ChoiceChips options={PRIORITIES} value={priority} onChange={setPriority} />
          </View>

          <Input
            label="Description (optional)"
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the issue…"
            multiline
            numberOfLines={4}
            style={styles.textarea}
          />

          {error ? (
            <Text variant="small" color={colors.danger}>
              {error}
            </Text>
          ) : null}

          <Button title="Submit complaint" loading={createComplaint.isPending} onPress={onSubmit} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg, paddingTop: spacing.sm },
  field: { gap: spacing.sm },
  textarea: { minHeight: 110, textAlignVertical: 'top', paddingTop: spacing.md },
});
