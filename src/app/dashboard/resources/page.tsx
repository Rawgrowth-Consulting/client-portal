import ResourcesGrid from '@/components/dashboard/ResourcesGrid';
import PageHeader from '@/components/dashboard/PageHeader';

export default async function ResourcesPage() {
  const resources: any[] = [];

  return (
    <div>
      <PageHeader
        eyebrow="Resources"
        title="Resources & Updates"
        description="Skills, tools, and updates pushed by the Rawgrowth team."
      />

      <ResourcesGrid resources={resources} />
    </div>
  );
}
