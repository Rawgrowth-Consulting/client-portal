import Link from 'next/link';
import ResourcesGrid from '@/components/dashboard/ResourcesGrid';
import PageHeader from '@/components/dashboard/PageHeader';
import { DASHBOARD_MODULES } from '@/lib/dashboard-modules';

export default async function ResourcesPage() {
  const resources: any[] = [];

  return (
    <div>
      <PageHeader
        eyebrow="Resources"
        title="Resources & Updates"
        description="Global learning modules + team-pushed updates."
      />

      <section className="mb-10">
        <h2 className="mb-4 text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Global modules
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {DASHBOARD_MODULES.map((mod) => (
            <Link
              key={mod.slug}
              href={`/dashboard/resources/${mod.slug}`}
              className="group rounded-xl p-5 transition-all"
              style={{ background: '#0A1210', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <h3 className="mb-1 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
                {mod.title}
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {mod.summary}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Pushed to you
        </h2>
        <ResourcesGrid resources={resources} />
      </section>
    </div>
  );
}
