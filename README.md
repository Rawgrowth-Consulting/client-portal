# app-starter

Next.js 15 + PocketBase starter for Rawgrowth mini apps. Clone it, set your APP_ID, have a working full-stack app in 60 seconds.

## Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS v4
- PocketBase JS SDK

## Setup

```bash
git clone https://github.com/scanbott/app-starter.git my-app
cd my-app
cp .env.example .env.local
# edit .env.local: set NEXT_PUBLIC_APP_ID to something unique for your app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## PocketBase

PocketBase runs at:
- **Production:** `https://pb.rawgrowth.ai`
- **Local dev:** `http://127.0.0.1:8090`

Admin panel: `http://127.0.0.1:8090/_/` (local) or `https://pb.rawgrowth.ai/_/` (prod)

## Collections

These collections already exist on pb.rawgrowth.ai:

| Collection | Purpose |
|---|---|
| `users` | Auth -- built-in PocketBase users |
| `documents` | General-purpose docs with tags, status, app_id |
| `training_data` | AI training examples with input/output pairs |
| `app_config` | Key-value config store per app |

All collections are scoped by `app_id`. Set `NEXT_PUBLIC_APP_ID` to isolate your app's data.

## DB Helpers (`src/lib/db.ts`)

```typescript
import { getDocuments, createDocument, searchDocuments } from '@/lib/db'
import { getTrainingData, createTrainingData } from '@/lib/db'
import { getConfig, setConfig } from '@/lib/db'

// Documents
const docs = await getDocuments()
const doc = await createDocument({ title: 'My Doc', content: '...', tags: [], app_id: 'myapp', owner_id: userId, status: 'draft' })
const results = await searchDocuments(undefined, 'search term')

// Training data
const examples = await getTrainingData(undefined, 'qa')
await createTrainingData({ app_id: 'myapp', category: 'qa', input: '...', output: '...', tags: [], quality: 5, active: true })

// Config
const value = await getConfig(undefined, 'my_key')
await setConfig(undefined, 'my_key', { some: 'value' })
```

## Auth Helpers (`src/lib/auth.ts`)

```typescript
import { login, logout, getCurrentUser, isAuthenticated } from '@/lib/auth'

await login('user@example.com', 'password')
logout()
const user = getCurrentUser()
const authed = isAuthenticated()
```

## Protected Routes

Wrap any page with `<AuthGuard>` to redirect unauthenticated users to `/login`:

```tsx
import AuthGuard from '@/components/AuthGuard'

export default function MyPage() {
  return <AuthGuard><div>Protected content</div></AuthGuard>
}
```

## Deploy to Vercel

```bash
vercel
```

Set environment variables in Vercel dashboard:
- `NEXT_PUBLIC_PB_URL=https://pb.rawgrowth.ai`
- `NEXT_PUBLIC_APP_ID=your-app-id`

## Design System

Dark theme. Background `#060B08`. Accent `#0CBF6A`. No light mode. No emojis.

See `src/app/globals.css` for full token set and `.btn-shine` component CSS.
