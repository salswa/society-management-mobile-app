import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ApiError } from '@/api/client';
import { useCreatePoll } from '@/query/hooks';
import { Button, Input, Screen, Text, TopBar } from '@/components';
import { colors, radius, spacing } from '@/theme/tokens';

export default function NewPoll() {
  const router = useRouter();
  const createPoll = useCreatePoll();

  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [isMulti, setIsMulti] = useState(false);
  const [options, setOptions] = useState<string[]>(['', '']);
  const [closes, setCloses] = useState('');
  const [error, setError] = useState<string | null>(null);

  const setOption = (i: number, val: string) =>
    setOptions((prev) => prev.map((o, idx) => (idx === i ? val : o)));
  const addOption = () => setOptions((prev) => (prev.length >= 10 ? prev : [...prev, '']));
  const removeOption = (i: number) =>
    setOptions((prev) => (prev.length <= 2 ? prev : prev.filter((_, idx) => idx !== i)));

  const onSubmit = () => {
    setError(null);
    if (!question.trim()) return setError('Enter a question.');
    const cleaned = options.map((o) => o.trim()).filter(Boolean);
    if (cleaned.length < 2) return setError('Add at least two options.');

    let closes_at: string | undefined;
    if (closes.trim()) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(closes.trim())) return setError('Close date must be YYYY-MM-DD.');
      const d = new Date(`${closes.trim()}T23:59:59`);
      if (Number.isNaN(d.getTime())) return setError('Invalid close date.');
      closes_at = d.toISOString();
    }

    createPoll.mutate(
      {
        question: question.trim(),
        description: description.trim() || undefined,
        is_multi: isMulti,
        options: cleaned,
        closes_at,
      },
      {
        onSuccess: () => router.back(),
        onError: (e) =>
          setError(e instanceof ApiError ? e.message : 'Could not create poll. Try again.'),
      }
    );
  };

  return (
    <Screen scroll tabbarSpace header={<TopBar title="Create a poll" />}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.form}>
          <Input
            label="Question"
            value={question}
            onChangeText={setQuestion}
            placeholder="e.g. Should we repaint the lobby?"
          />
          <Input
            label="Description (optional)"
            value={description}
            onChangeText={setDescription}
            placeholder="Add context…"
          />

          <View style={styles.field}>
            <Text variant="label" color={colors.textMuted}>
              TYPE
            </Text>
            <View style={styles.chips}>
              {[
                { label: 'Single choice', value: false },
                { label: 'Multiple choice', value: true },
              ].map((t) => {
                const active = isMulti === t.value;
                return (
                  <Pressable
                    key={t.label}
                    onPress={() => setIsMulti(t.value)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text variant="small" color={active ? colors.textInverse : colors.ink}>
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.field}>
            <Text variant="label" color={colors.textMuted}>
              OPTIONS
            </Text>
            {options.map((o, i) => (
              <View key={i} style={styles.optionRow}>
                <View style={styles.optionInput}>
                  <Input value={o} onChangeText={(v) => setOption(i, v)} placeholder={`Option ${i + 1}`} />
                </View>
                {options.length > 2 ? (
                  <Pressable onPress={() => removeOption(i)} hitSlop={8} style={styles.remove}>
                    <Ionicons name="close-circle" size={22} color={colors.textMuted} />
                  </Pressable>
                ) : null}
              </View>
            ))}
            {options.length < 10 ? (
              <Button title="Add option" size="sm" fullWidth={false} variant="outline" icon="add" onPress={addOption} />
            ) : null}
          </View>

          <Input
            label="Closes on (optional, YYYY-MM-DD)"
            value={closes}
            onChangeText={setCloses}
            placeholder="2026-08-15"
            autoCapitalize="none"
          />

          {error ? (
            <Text variant="small" color={colors.danger}>
              {error}
            </Text>
          ) : null}

          <Button title="Create poll" loading={createPoll.isPending} onPress={onSubmit} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg, paddingTop: spacing.sm },
  field: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.ink,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  optionInput: { flex: 1 },
  remove: { padding: 2 },
});
