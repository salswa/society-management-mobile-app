/**
 * Expo push notifications. Sends are best-effort: every helper swallows its own
 * errors so a failed push never breaks the request that triggered it. Recipients
 * are resolved from `profiles.expo_push_token` (stored via POST /profile/push-token).
 */
import { supabaseAdmin } from './supabase';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

type PushPayload = { title: string; body: string; data?: Record<string, unknown> };

function isExpoToken(t: unknown): t is string {
  return (
    typeof t === 'string' &&
    (t.startsWith('ExponentPushToken[') || t.startsWith('ExpoPushToken['))
  );
}

/** POST the messages to Expo in chunks of 100. Never throws. */
async function send(tokens: string[], payload: PushPayload): Promise<void> {
  const valid = Array.from(new Set(tokens.filter(isExpoToken)));
  if (valid.length === 0) return;

  const messages = valid.map((to) => ({
    to,
    sound: 'default',
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
  }));

  for (let i = 0; i < messages.length; i += 100) {
    try {
      await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(messages.slice(i, i + 100)),
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[push] send failed', err);
    }
  }
}

// --- recipient token lookups ------------------------------------------------

async function tokensForProfiles(profileIds: string[]): Promise<string[]> {
  if (profileIds.length === 0) return [];
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('expo_push_token')
    .in('id', profileIds);
  return (data ?? []).map((r) => r.expo_push_token).filter(isExpoToken);
}

/** Residents linked to any of the given flats. */
async function tokensForFlats(flatIds: string[]): Promise<string[]> {
  if (flatIds.length === 0) return [];
  const { data } = await supabaseAdmin
    .from('flat_residents')
    .select('profile_id')
    .in('flat_id', flatIds);
  return tokensForProfiles((data ?? []).map((r) => r.profile_id));
}

/** Active members of a society with a given role. */
async function tokensForSocietyRole(
  societyId: string,
  role: 'resident' | 'admin'
): Promise<string[]> {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('expo_push_token')
    .eq('society_id', societyId)
    .eq('role', role)
    .eq('status', 'active');
  return (data ?? []).map((r) => r.expo_push_token).filter(isExpoToken);
}

// --- event notifications (call from services/controllers) -------------------

/** Resident: a guard registered a visitor for their flat → approve/deny. */
export async function notifyVisitorApproval(
  flatId: string,
  visitorName: string,
  visitorId: string
): Promise<void> {
  try {
    await send(await tokensForFlats([flatId]), {
      title: 'Visitor at the gate',
      body: `${visitorName} wants to visit. Tap to approve or deny.`,
      data: { type: 'visitor', id: visitorId },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[push] visitor approval', err);
  }
}

/** Residents: a new notice was posted. */
export async function notifyNewNotice(
  societyId: string,
  title: string,
  noticeId: string
): Promise<void> {
  try {
    await send(await tokensForSocietyRole(societyId, 'resident'), {
      title: 'New notice',
      body: title,
      data: { type: 'notice', id: noticeId },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[push] new notice', err);
  }
}

/** Residents: a new poll is open. */
export async function notifyNewPoll(
  societyId: string,
  question: string,
  pollId: string
): Promise<void> {
  try {
    await send(await tokensForSocietyRole(societyId, 'resident'), {
      title: 'New poll',
      body: question,
      data: { type: 'poll', id: pollId },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[push] new poll', err);
  }
}

/** Resident(s) of a flat: maintenance dues raised or updated. */
export async function notifyDues(
  flatId: string,
  amount: number,
  period: string,
  invoiceId: string,
  paid = false
): Promise<void> {
  try {
    await send(await tokensForFlats([flatId]), {
      title: paid ? 'Payment recorded' : 'Maintenance due',
      body: paid
        ? `Your ${period} maintenance of ₹${amount} is marked paid.`
        : `₹${amount} maintenance is due for ${period}.`,
      data: { type: 'dues', id: invoiceId },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[push] dues', err);
  }
}

/** Admins: a new self-service sign-up is awaiting approval. */
export async function notifyNewSignup(
  societyId: string,
  name: string,
  profileId: string
): Promise<void> {
  try {
    await send(await tokensForSocietyRole(societyId, 'admin'), {
      title: 'New sign-up request',
      body: `${name} wants to join the society. Tap to review.`,
      data: { type: 'signup', id: profileId },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[push] new signup', err);
  }
}
