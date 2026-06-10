import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageHeader from '@/components/dashboard/PageHeader';
import { Response } from '@/components/ui/response';
import { getModuleBySlug } from '@/lib/dashboard-modules';

export default async function ModulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const mod = getModuleBySlug(slug);
  if (!mod) {
    notFound();
  }

  const body = mod.body_markdown ?? '';
  const hasBody = body.trim().length > 0 && body.trim() !== 'TBD';

  return (
    <div>
      <PageHeader eyebrow="Resources" title={mod.title} description={mod.summary} />

      <div className="mb-6">
        <Link
          href="/dashboard/resources"
          className="text-xs"
          style={{ color: 'rgba(255,255,255,0.45)' }}
        >
          ← All modules
        </Link>
      </div>

      {hasBody ? (
        <article
          className="rounded-xl p-8"
          style={{ background: '#0A1210', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Response>{body}</Response>
        </article>
      ) : (
        <div
          className="rounded-xl p-12 text-center"
          style={{ background: '#0A1210', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Content coming soon.
          </p>
          <p className="mt-2 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            The Rawgrowth team is finalizing this module. Check back shortly or ping us in Slack.
          </p>
        </div>
      )}
    </div>
  );
}
