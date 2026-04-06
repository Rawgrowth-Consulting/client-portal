import { createServerClient, createAdminClient } from '@/lib/pb-server';
import { redirect } from 'next/navigation';
import ResourcesGrid from '@/components/dashboard/ResourcesGrid';

export default async function ResourcesPage() {
  const pb = await createServerClient();
  if (!pb.authStore.isValid) redirect('/login');

  const userId = pb.authStore.record?.id;
  const adminPb = await createAdminClient();
  const clients = await adminPb.collection('clients').getFullList({ filter: `user_id = "${userId}"` });
  if (clients.length === 0) redirect('/login');

  const clientId = clients[0].id;

  // Get all resources assigned to this client
  let resources: any[] = [];
  try {
    const assignments = await adminPb.collection('resource_assignments').getFullList({
      filter: `client_id = "${clientId}"`,
    });

    const resourceIds = assignments.map(a => a.resource_id);
    if (resourceIds.length > 0) {
      const allResources = await adminPb.collection('portal_resources').getFullList();
      resources = allResources
        .filter(r => resourceIds.includes(r.id) || r.target_all)
        .map(r => {
          const assignment = assignments.find(a => a.resource_id === r.id);
          return { ...r, seen_at: assignment?.seen_at || null, assignment_id: assignment?.id };
        });
    } else {
      // Also get target_all resources
      resources = (await adminPb.collection('portal_resources').getFullList({ filter: 'target_all = true' }))
        .map(r => ({ ...r, seen_at: null, assignment_id: null }));
    }
  } catch {}

  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-widest text-[#0CBF6A]">Resources</p>
      <h1 className="mb-2 text-2xl font-medium tracking-tight" style={{ color: 'rgba(255,255,255,0.92)' }}>Resources & Updates</h1>
      <p className="mb-8 text-[rgba(255,255,255,0.5)]">Skills, tools, and updates pushed by the Rawgrowth team.</p>

      <ResourcesGrid resources={resources} />
    </div>
  );
}
