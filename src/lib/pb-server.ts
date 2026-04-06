import PocketBase from 'pocketbase';
import { cookies } from 'next/headers';

const PB_URL = process.env.NEXT_PUBLIC_PB_URL || 'https://pb.rawgrowth.ai';

export async function createServerClient(): Promise<PocketBase> {
  const pb = new PocketBase(PB_URL);

  const cookieStore = await cookies();
  const authCookie = cookieStore.get('pb_auth');

  if (authCookie?.value) {
    try {
      const { token, model } = JSON.parse(authCookie.value);
      pb.authStore.save(token, model);
    } catch {
      // invalid cookie
    }
  }

  return pb;
}

/**
 * Get the authenticated user's model from the cookie.
 * More reliable than pb.authStore.record because the admin token type
 * may not match the user model type in PocketBase SDK validation.
 */
export async function getAuthUser(): Promise<{ id: string; email: string; name: string; role: string } | null> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('pb_auth');

  if (!authCookie?.value) return null;

  try {
    const { token, model } = JSON.parse(authCookie.value);
    if (!token || !model?.id) return null;
    return model;
  } catch {
    return null;
  }
}

// Cache admin client per-request to avoid repeated auth calls
let _adminPbPromise: Promise<PocketBase> | null = null;
let _adminPbExpiry = 0;

export async function createAdminClient(): Promise<PocketBase> {
  const now = Date.now();

  // Reuse cached admin client if still valid (cache for 50 seconds)
  if (_adminPbPromise && now < _adminPbExpiry) {
    return _adminPbPromise;
  }

  _adminPbExpiry = now + 50000;
  _adminPbPromise = (async () => {
    const pb = new PocketBase(PB_URL);

    const email = process.env.PB_ADMIN_EMAIL;
    const password = process.env.PB_ADMIN_PASSWORD;

    if (!email || !password) {
      throw new Error('PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD env vars required');
    }

    await pb.collection('_superusers').authWithPassword(email, password);
    return pb;
  })();

  return _adminPbPromise;
}
