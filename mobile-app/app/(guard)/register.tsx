import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { VisitorType } from '@/api/types';
import { ApiError } from '@/api/client';
import { useCreateVisitor, useResidentSearch } from '@/query/hooks';
import {
  Button,
  Card,
  ChoiceChips,
  Input,
  Loading,
  Screen,
  SearchBar,
  Text,
} from '@/components';
import { flatLabel, visitorTypeMeta } from '@/lib/format';
import { colors, radius, spacing } from '@/theme/tokens';

const TYPES: VisitorType[] = ['guest', 'delivery', 'cab', 'service'];
const TYPE_OPTIONS = TYPES.map((t) => ({
  label: visitorTypeMeta(t).label,
  value: t,
  icon: visitorTypeMeta(t).icon as keyof typeof Ionicons.glyphMap,
}));

type FlatOption = { id: string; label: string; residents: string };

export default function GuardRegister() {
  const [query, setQuery] = useState('');
  const search = useResidentSearch(query);
  const createVisitor = useCreateVisitor();

  const [flat, setFlat] = useState<FlatOption | null>(null);
  const [type, setType] = useState<VisitorType>('guest');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [purpose, setPurpose] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Merge flats found directly + flats attached to matched residents, deduped.
  const flatOptions = useMemo<FlatOption[]>(() => {
    const map = new Map<string, FlatOption>();
    for (const f of search.data?.flats ?? []) {
      const residents = f.residents.map((r) => r.profile?.name).filter(Boolean).join(', ');
      map.set(f.id, { id: f.id, label: flatLabel(f), residents });
    }
    for (const r of search.data?.residents ?? []) {
      for (const fr of r.flat_residents) {
        if (fr.flat && !map.has(fr.flat.id)) {
          map.set(fr.flat.id, { id: fr.flat.id, label: flatLabel(fr.flat), residents: r.name });
        }
      }
    }
    return Array.from(map.values());
  }, [search.data]);

  const reset = () => {
    setFlat(null);
    setName('');
    setPhone('');
    setPurpose('');
    setType('guest');
    setQuery('');
    setError(null);
  };

  const onSubmit = () => {
    setError(null);
    if (!flat) return;
    if (!name.trim()) return setError('Enter the visitor name.');

    createVisitor.mutate(
      {
        flat_id: flat.id,
        name: name.trim(),
        type,
        phone: phone.trim() || undefined,
        purpose: purpose.trim() || undefined,
      },
      {
        onSuccess: () => {
          Alert.alert('Request sent', `${name.trim()} is awaiting approval from ${flat.label}.`);
          reset();
        },
        onError: (e) =>
          setError(e instanceof ApiError ? e.message : 'Could not register the visitor.'),
      }
    );
  };

  // --- Step 2: flat chosen → visitor form ----------------------------------
  if (flat) {
    return (
      <Screen scroll tabbarSpace>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.visiting}>
            <View style={styles.visitingIcon}>
              <Ionicons name="home" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="label" color={colors.primary}>
                Visiting
              </Text>
              <Text variant="bodyStrong">{flat.label}</Text>
            </View>
            <Text variant="bodyStrong" color={colors.primary} onPress={() => setFlat(null)}>
              Change
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text variant="label" color={colors.textMuted}>
                Visitor type
              </Text>
              <ChoiceChips options={TYPE_OPTIONS} value={type} onChange={setType} />
            </View>

            <Input label="Visitor name" value={name} onChangeText={setName} placeholder="Name" />
            <Input
              label="Phone (optional)"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+91…"
            />
            <Input
              label="Purpose (optional)"
              value={purpose}
              onChangeText={setPurpose}
              placeholder="e.g. Food delivery"
            />

            {error ? (
              <Text variant="small" color={colors.danger}>
                {error}
              </Text>
            ) : null}

            <Button
              title="Send approval request"
              loading={createVisitor.isPending}
              onPress={onSubmit}
            />
          </View>
        </KeyboardAvoidingView>
      </Screen>
    );
  }

  // --- Step 1: search + pick a flat ----------------------------------------
  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text variant="h1">Register visitor</Text>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search flat, name or phone"
        />
      </View>

      <View style={styles.results}>
        {query.trim().length === 0 ? (
          <View style={styles.hint}>
            <Ionicons name="search-outline" size={40} color={colors.textMuted} />
            <Text variant="body" color={colors.textMuted} center>
              Search for the resident or flat the visitor is here to see.
            </Text>
          </View>
        ) : search.isLoading ? (
          <Loading />
        ) : flatOptions.length === 0 ? (
          <View style={styles.hint}>
            <Text variant="body" color={colors.textMuted} center>
              No matches for “{query}”.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            <Text variant="label" color={colors.textMuted} style={styles.resultsLabel}>
              {flatOptions.length} flat{flatOptions.length > 1 ? 's' : ''} found
            </Text>
            {flatOptions.map((f) => (
              <Card key={f.id} onPress={() => setFlat(f)} style={styles.flatCard}>
                <View style={styles.flatIcon}>
                  <Ionicons name="home-outline" size={20} color={colors.ink} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong">{f.label}</Text>
                  <Text variant="small" color={colors.textMuted} numberOfLines={1}>
                    {f.residents || 'No resident linked'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Card>
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md },
  results: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: 24 },
  hint: { alignItems: 'center', gap: spacing.md, paddingTop: spacing.xxl },
  list: { gap: spacing.sm },
  resultsLabel: { marginLeft: spacing.xs, marginBottom: spacing.xs },
  flatCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flatIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visiting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  visitingIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: { gap: spacing.lg },
  field: { gap: spacing.sm },
});
