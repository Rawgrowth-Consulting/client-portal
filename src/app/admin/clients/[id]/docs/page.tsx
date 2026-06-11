import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { type DocType } from '@/lib/docs/types';
import DocsAdmin, { type DocRow } from './DocsAdmin';

// Admin doc review grid (FC-03). Layout-level requireAdmin enforces auth (FC-07).
export default async function AdminDocsPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const { data: rows } = await supabaseAdmin
    .from('client_profile_documents')
    .select('type, title, content_markdown, version, generated_at, approved_at')
    .eq('client_id', id)
    .order('version', { ascending: false });

  // Keep only the latest version per type (rows are version-desc).
  const latest = new Map<DocType, DocRow>();
  for (const r of rows ?? []) {
    if (!latest.has(r.type as DocType)) latest.set(r.type as DocType, r as DocRow);
  }

  return <DocsAdmin clientId={id} initial={Array.from(latest.values())} />;
}
