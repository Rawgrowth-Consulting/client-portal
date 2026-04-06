'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface ClientOption {
  id: string;
  name: string;
  company: string;
}

const RESOURCE_TYPES = [
  { value: 'skill', label: 'Skill', desc: 'New capability or workflow' },
  { value: 'update', label: 'Update', desc: 'Product or service update' },
  { value: 'doc', label: 'Doc', desc: 'Documentation or guide' },
  { value: 'tool', label: 'Tool', desc: 'Tool or integration' },
] as const;

export default function NewResourcePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClient = searchParams.get('client');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'skill' | 'update' | 'doc' | 'tool'>('update');
  const [file, setFile] = useState<File | null>(null);
  const [externalUrl, setExternalUrl] = useState('');
  const [targetAll, setTargetAll] = useState(!preselectedClient);
  const [selectedClients, setSelectedClients] = useState<string[]>(
    preselectedClient ? [preselectedClient] : []
  );
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchClients() {
      try {
        const res = await fetch('/api/admin/clients');
        if (res.ok) {
          const data = await res.json();
          setClients(data.clients || []);
        }
      } catch {}
      setLoadingClients(false);
    }
    fetchClients();
  }, []);

  function toggleClient(clientId: string) {
    setSelectedClients((prev) =>
      prev.includes(clientId) ? prev.filter((id) => id !== clientId) : [...prev, clientId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!file && !externalUrl.trim()) {
      setError('Provide a file or external URL.');
      return;
    }
    if (!targetAll && selectedClients.length === 0) {
      setError('Select at least one client or toggle All Clients.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('type', type);
      formData.append('target_all', String(targetAll));
      formData.append('external_url', externalUrl.trim());
      if (file) {
        formData.append('file', file);
      }
      if (!targetAll) {
        formData.append('client_ids', JSON.stringify(selectedClients));
      }

      const res = await fetch('/api/admin/resources', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to publish resource.');
      }

      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    }
    setLoading(false);
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-widest" style={{ color: '#0CBF6A' }}>
          Resources
        </p>
        <h1 className="mt-1 text-2xl font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
          Push New Resource
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl">
        <div
          className="overflow-hidden rounded-xl"
          style={{ background: '#0A1210', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div
            className="h-px w-full"
            style={{ background: 'linear-gradient(to right, transparent, rgba(12,191,106,0.3), transparent)' }}
          />

          <div className="p-6">
            {/* Title */}
            <div className="mb-5">
              <label
                className="mb-1.5 block text-xs font-medium uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.6)' }}
              >
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Resource title"
                className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-colors focus:border-[rgba(12,191,106,0.4)]"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.92)',
                }}
              />
            </div>

            {/* Description */}
            <div className="mb-5">
              <label
                className="mb-1.5 block text-xs font-medium uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.6)' }}
              >
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this resource about?"
                rows={3}
                className="w-full resize-none rounded-lg px-4 py-2.5 text-sm outline-none transition-colors focus:border-[rgba(12,191,106,0.4)]"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.92)',
                }}
              />
            </div>

            {/* Type selector */}
            <div className="mb-5">
              <label
                className="mb-1.5 block text-xs font-medium uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.6)' }}
              >
                Type
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {RESOURCE_TYPES.map((rt) => (
                  <button
                    key={rt.value}
                    type="button"
                    onClick={() => setType(rt.value)}
                    className="rounded-lg px-3 py-3 text-left transition-colors"
                    style={{
                      background: type === rt.value ? 'rgba(12,191,106,0.08)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${type === rt.value ? 'rgba(12,191,106,0.3)' : 'rgba(255,255,255,0.06)'}`,
                    }}
                  >
                    <span
                      className="block text-sm font-medium"
                      style={{ color: type === rt.value ? '#0CBF6A' : 'rgba(255,255,255,0.6)' }}
                    >
                      {rt.label}
                    </span>
                    <span className="block text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {rt.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* File upload */}
            <div className="mb-5">
              <label
                className="mb-1.5 block text-xs font-medium uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.6)' }}
              >
                File Upload
              </label>
              <div
                className="relative rounded-lg px-4 py-4"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px dashed rgba(255,255,255,0.1)',
                }}
              >
                {file ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="text-xs transition-colors hover:text-white"
                      style={{ color: 'rgba(255,255,255,0.35)' }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center gap-1">
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      Click to upload or drag a file
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) setFile(e.target.files[0]);
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* External URL */}
            <div className="mb-5">
              <label
                className="mb-1.5 block text-xs font-medium uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.6)' }}
              >
                Or External URL
              </label>
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-colors focus:border-[rgba(12,191,106,0.4)]"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.92)',
                }}
              />
            </div>

            {/* Target */}
            <div className="mb-5">
              <label
                className="mb-1.5 block text-xs font-medium uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.6)' }}
              >
                Target
              </label>

              {/* All Clients toggle */}
              <button
                type="button"
                onClick={() => {
                  setTargetAll(!targetAll);
                  if (!targetAll) setSelectedClients([]);
                }}
                className="mb-3 flex items-center gap-3 rounded-lg px-4 py-3 transition-colors"
                style={{
                  background: targetAll ? 'rgba(12,191,106,0.08)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${targetAll ? 'rgba(12,191,106,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  width: '100%',
                }}
              >
                <div
                  className="flex h-5 w-9 items-center rounded-full px-0.5 transition-colors"
                  style={{ background: targetAll ? '#0CBF6A' : 'rgba(255,255,255,0.1)' }}
                >
                  <div
                    className="h-4 w-4 rounded-full bg-white transition-transform"
                    style={{ transform: targetAll ? 'translateX(16px)' : 'translateX(0)' }}
                  />
                </div>
                <span
                  className="text-sm font-medium"
                  style={{ color: targetAll ? '#0CBF6A' : 'rgba(255,255,255,0.6)' }}
                >
                  All Clients
                </span>
              </button>

              {/* Client multi-select */}
              {!targetAll && (
                <div
                  className="max-h-48 overflow-y-auto rounded-lg p-2"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {loadingClients ? (
                    <p className="py-4 text-center text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      Loading clients...
                    </p>
                  ) : clients.length === 0 ? (
                    <p className="py-4 text-center text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      No clients found.
                    </p>
                  ) : (
                    clients.map((c) => {
                      const selected = selectedClients.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleClient(c.id)}
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-[rgba(255,255,255,0.02)]"
                        >
                          <div
                            className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors"
                            style={{
                              borderColor: selected ? '#0CBF6A' : 'rgba(255,255,255,0.15)',
                              background: selected ? '#0CBF6A' : 'transparent',
                            }}
                          >
                            {selected && <span className="text-[8px] font-bold text-white">{'\u2713'}</span>}
                          </div>
                          <div>
                            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
                              {c.name}
                            </span>
                            <span className="ml-2 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                              {c.company}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div
                className="mb-4 rounded-lg px-4 py-2.5 text-sm"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-shine w-full rounded-xl bg-[#0CBF6A] px-6 py-3.5 text-sm font-bold text-white transition-transform duration-300 hover:-translate-y-0.5 disabled:opacity-50"
            >
              {loading ? 'Publishing...' : 'Publish Resource'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
