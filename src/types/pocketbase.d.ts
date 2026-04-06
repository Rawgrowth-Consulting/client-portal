import 'pocketbase';

declare module 'pocketbase' {
  interface BaseAuthStore {
    record: Record<string, any> | null;
  }
}
