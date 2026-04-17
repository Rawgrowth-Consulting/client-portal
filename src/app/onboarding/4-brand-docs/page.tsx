'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabase';

const UPLOAD_ZONES = [
  { type: 'logo' as const, label: 'Logo Files', accept: '.png,.svg,.ai,.eps,.jpg,.jpeg,.pdf', description: 'PNG, SVG, AI, EPS formats' },
  { type: 'guideline' as const, label: 'Brand Guidelines', accept: '.pdf,.doc,.docx,.txt', description: 'PDF, DOC, or text files' },
  { type: 'asset' as const, label: 'Other Brand Assets', accept: '*', description: 'Colors, fonts, templates, anything else' },
];

export default function BrandDocsStep() {
  const router = useRouter();
  const { data: session } = useSession();
  const [uploading, setUploading] = useState<string | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (!session?.user?.id) return;

    async function loadDocs() {
      const { data } = await supabase
        .from('documents')
        .select('*')
        .eq('client_id', session!.user.id);
      if (data) setDocuments(data);
    }

    loadDocs();
  }, [session?.user?.id]);

  async function handleUpload(type: 'logo' | 'guideline' | 'asset', fileList: FileList) {
    if (!session?.user?.id) return;
    setUploading(type);

    for (const file of Array.from(fileList)) {
      try {
        const filePath = `${session.user.id}/${type}/${Date.now()}-${file.name}`;

        // Upload to Supabase Storage
        const { error: uploadErr } = await supabase.storage
          .from('brand-docs')
          .upload(filePath, file);

        if (uploadErr) throw uploadErr;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('brand-docs')
          .getPublicUrl(filePath);

        // Save metadata to documents table
        const { data: doc } = await supabase
          .from('documents')
          .insert({
            client_id: session.user.id,
            type,
            storage_url: urlData.publicUrl,
            filename: file.name,
            size: file.size,
          })
          .select()
          .single();

        if (doc) setDocuments(prev => [...prev, doc]);
      } catch (err) {
        console.error(err);
      }
    }

    setUploading(null);
  }

  function handleDrop(type: 'logo' | 'guideline' | 'asset', e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      handleUpload(type, e.dataTransfer.files);
    }
  }

  async function handleContinue() {
    if (!session?.user?.id) return;
    await supabase.from('clients').update({ onboarding_step: 5 }).eq('id', session.user.id);
    router.push('/onboarding/5-api-keys');
  }

  async function handleSkip() {
    if (!session?.user?.id) return;
    await supabase.from('clients').update({ onboarding_step: 5 }).eq('id', session.user.id);
    router.push('/onboarding/5-api-keys');
  }

  const filesByType = (type: string) => documents.filter((d) => d.type === type);
  const totalFiles = documents.length;

  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-widest text-[#0CBF6A]">Step 4</p>
      <h1 className="mb-2 text-2xl font-medium tracking-tight" style={{ color: 'rgba(255,255,255,0.92)' }}>Brand Documents</h1>
      <p className="mb-8 text-[rgba(255,255,255,0.5)]">Upload your brand assets so our AI agents can match your visual identity.</p>

      <div className="space-y-6">
        {UPLOAD_ZONES.map((zone) => (
          <div key={zone.type} className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0A1210] p-6">
            <h3 className="mb-1 text-base font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>{zone.label}</h3>
            <p className="mb-4 text-xs text-[rgba(255,255,255,0.35)]">{zone.description}</p>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(zone.type, e)}
              onClick={() => fileInputRefs.current[zone.type]?.click()}
              className="cursor-pointer rounded-lg border-2 border-dashed border-[rgba(255,255,255,0.1)] p-8 text-center transition-colors hover:border-[#0CBF6A]/30"
            >
              {uploading === zone.type ? (
                <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-[#0CBF6A] border-t-transparent" />
              ) : (
                <>
                  <svg className="mx-auto mb-2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <p className="text-sm text-[rgba(255,255,255,0.4)]">Drag & drop or click to upload</p>
                </>
              )}
            </div>

            <input
              ref={(el) => { fileInputRefs.current[zone.type] = el; }}
              type="file"
              multiple
              accept={zone.accept}
              onChange={(e) => e.target.files && handleUpload(zone.type, e.target.files)}
              className="hidden"
            />

            {filesByType(zone.type).length > 0 && (
              <div className="mt-3 space-y-1">
                {filesByType(zone.type).map((f) => (
                  <div key={f.id} className="flex items-center gap-2 rounded-lg bg-[rgba(255,255,255,0.03)] px-3 py-2 text-sm">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0CBF6A" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <span className="text-[rgba(255,255,255,0.7)]">{f.filename}</span>
                    <span className="text-[rgba(255,255,255,0.3)]">{(f.size / 1024).toFixed(0)}KB</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button onClick={handleSkip} className="text-sm text-[rgba(255,255,255,0.4)] hover:text-[rgba(255,255,255,0.7)]">
          Skip for now
        </button>
        <button
          onClick={handleContinue}
          className="btn-shine rounded-xl bg-[#0CBF6A] px-8 py-3.5 text-sm font-bold text-white transition-transform duration-300 hover:-translate-y-0.5"
        >
          {totalFiles > 0 ? `Continue (${totalFiles} files)` : 'Continue'}
        </button>
      </div>
    </div>
  );
}
