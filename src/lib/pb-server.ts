import PocketBase from 'pocketbase';
import { cookies } from 'next/headers';

export async function createServerClient(): Promise<PocketBase> {
  const url = process.env.NEXT_PUBLIC_PB_URL || 'https://pb.rawgrowth.ai';
  const pb = new PocketBase(url);

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

export async function createAdminClient(): Promise<PocketBase> {
  const url = process.env.NEXT_PUBLIC_PB_URL || 'https://pb.rawgrowth.ai';
  const pb = new PocketBase(url);

  const email = process.env.PB_ADMIN_EMAIL;
  const password = process.env.PB_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD env vars required');
  }

  await pb.collection('_superusers').authWithPassword(email, password);
  return pb;
}
