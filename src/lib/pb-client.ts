import PocketBase from 'pocketbase';

let pb: PocketBase | null = null;

export function getPocketBase(): PocketBase {
  if (!pb) {
    const url = process.env.NEXT_PUBLIC_PB_URL || 'https://pb.rawgrowth.ai';
    pb = new PocketBase(url);
  }
  return pb;
}
