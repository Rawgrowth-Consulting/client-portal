import Link from 'next/link';
import { Plus } from 'lucide-react';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { ClientsTable } from './clients-table';
import PageHeader from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/button';

export default async function AdminPage() {
  await requireAdmin();

  let clients: any[] = [];
  try {
    const { data, error } = await supabaseAdmin
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Map Supabase rows → the `Client` shape the table expects
    clients = (data || []).map((c: any) => ({
      ...c,
      health_score: c.health_score ?? 0,
      current_month: c.current_month ?? 1,
      onboarding_step: c.onboarding_step ?? 1,
      onboarding_completed_at: c.onboarding_completed ? c.updated_at : null,
      updated: c.updated_at,
    }));
  } catch (err) {
    console.error('Failed to fetch clients:', err);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="All Clients"
        description={`${clients.length} total`}
      >
        <Button asChild size="lg">
          <Link href="/admin/clients/new">
            <Plus className="h-4 w-4" />
            Add New Client
          </Link>
        </Button>
      </PageHeader>
      <ClientsTable clients={clients as any} />
    </div>
  );
}
