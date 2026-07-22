import { supabaseAdmin } from '../../lib/supabase';
import { badRequest, conflict, notFound } from '../../lib/errors';
import { unwrap } from '../../lib/db';
import type { Poll, PollOption } from '../../types/database.types';

/** Casts (or replaces) a member's vote on a poll. */
export async function vote(input: {
  pollId: string;
  societyId: string;
  profileId: string;
  optionIds: string[];
}): Promise<void> {
  const poll: Poll = unwrap(
    await supabaseAdmin.from('polls').select('*').eq('id', input.pollId).single()
  );
  if (poll.society_id !== input.societyId) throw notFound('Poll not found');
  if (poll.status === 'closed') throw conflict('This poll is closed');
  if (poll.closes_at && new Date(poll.closes_at) < new Date()) {
    throw conflict('This poll has ended');
  }
  if (!poll.is_multi && input.optionIds.length !== 1) {
    throw badRequest('This poll accepts exactly one option');
  }
  if (poll.is_multi && input.optionIds.length < 1) {
    throw badRequest('Select at least one option');
  }

  // Options must belong to this poll.
  const options = unwrap(
    await supabaseAdmin.from('poll_options').select('id').eq('poll_id', input.pollId)
  );
  const valid = new Set(options.map((o) => o.id));
  if (!input.optionIds.every((id) => valid.has(id))) {
    throw badRequest('One or more options do not belong to this poll');
  }

  // Replace any prior votes by this member on this poll.
  unwrap(
    await supabaseAdmin
      .from('poll_votes')
      .delete()
      .eq('poll_id', input.pollId)
      .eq('profile_id', input.profileId)
      .select('id')
  );

  unwrap(
    await supabaseAdmin
      .from('poll_votes')
      .insert(
        input.optionIds.map((option_id) => ({
          poll_id: input.pollId,
          option_id,
          profile_id: input.profileId,
        }))
      )
      .select('id')
  );
}

/** Aggregates per-option vote counts for a poll. */
export async function results(pollId: string, societyId: string) {
  const poll: Poll & { options: PollOption[] } = unwrap(
    await supabaseAdmin
      .from('polls')
      .select('*, options:poll_options(id, text, position)')
      .eq('id', pollId)
      .eq('society_id', societyId)
      .single()
  );

  const votes: Array<{ option_id: string }> = unwrap(
    await supabaseAdmin.from('poll_votes').select('option_id').eq('poll_id', pollId)
  );

  const counts = new Map<string, number>();
  for (const v of votes) counts.set(v.option_id, (counts.get(v.option_id) ?? 0) + 1);

  const options = (poll.options ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((o) => ({ id: o.id, text: o.text, votes: counts.get(o.id) ?? 0 }));

  return { poll: { id: poll.id, question: poll.question, status: poll.status }, options, total: votes.length };
}
