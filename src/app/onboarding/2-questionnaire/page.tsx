'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';

interface SectionConfig {
  id: string;
  title: string;
  fields: FieldConfig[];
}

interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'url' | 'email' | 'tel' | 'number';
  placeholder?: string;
  options?: string[];
  required?: boolean;
  helperText?: string;
}

const SECTIONS: SectionConfig[] = [
  {
    id: 'basicInfo',
    title: 'Basic Information',
    fields: [
      { name: 'full_name', label: 'Full Name', type: 'text', required: true },
      { name: 'business_name', label: 'Business/Brand Name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'phone', label: 'Phone Number', type: 'tel' },
      { name: 'timezone', label: 'Time Zone', type: 'text', placeholder: 'e.g. EST, PST, GMT+1' },
      { name: 'preferred_comms', label: 'Preferred Communication', type: 'select', options: ['Email', 'Discord', 'Slack', 'Text'] },
    ],
  },
  {
    id: 'socialPresence',
    title: 'Social Media & Digital Presence',
    fields: [
      { name: 'instagram', label: 'Instagram Handle', type: 'text', placeholder: '@handle' },
      { name: 'youtube', label: 'YouTube Channel URL', type: 'url' },
      { name: 'twitter', label: 'Twitter/X Handle', type: 'text', placeholder: '@handle' },
      { name: 'linkedin', label: 'LinkedIn Profile URL', type: 'url' },
      { name: 'website', label: 'Website URL', type: 'url' },
      { name: 'other_platforms', label: 'Other Platforms', type: 'textarea', placeholder: 'TikTok, Facebook, etc.' },
      { name: 'top_platform', label: 'Which platform drives the most business currently?', type: 'text' },
      { name: 'focus_platform', label: 'Which platform do you want to focus on for 90 days?', type: 'text' },
      { name: 'paid_ads', label: 'Running paid ads?', type: 'textarea', placeholder: 'If yes, where and what budget?' },
    ],
  },
  {
    id: 'originStory',
    title: 'Your Story & Background',
    fields: [
      { name: 'origin', label: 'Tell us your story. How did you get here?', type: 'textarea', helperText: 'What led you to start? Failures or pivots? Transferable skills? (300-500 words)', required: true },
      { name: 'proudest', label: 'What are you most proud of in your business?', type: 'textarea' },
      { name: 'unfair_advantage', label: 'What is your unfair advantage?', type: 'textarea', helperText: 'The thing you are uniquely positioned to do better than competitors' },
    ],
  },
  {
    id: 'businessModel',
    title: 'Business Model & Revenue',
    fields: [
      { name: 'what_you_sell', label: 'What do you sell?', type: 'textarea', required: true },
      { name: 'offer_pricing', label: 'Offer/pricing structure', type: 'textarea', helperText: 'Main offers, price points, delivery model' },
      { name: 'monthly_revenue', label: 'Current Monthly Revenue Range', type: 'select', options: ['$0-$2K', '$2K-$5K', '$5K-$10K', '$10K-$20K', '$20K-$50K', '$50K-$100K', '$100K+'] },
      { name: 'revenue_breakdown', label: 'Revenue breakdown by source', type: 'textarea', placeholder: '% organic, % paid, % referrals, % cold outreach' },
      { name: 'profit_margin', label: 'Current profit margin (roughly)', type: 'text' },
      { name: 'team_size', label: 'Team size & structure', type: 'textarea' },
    ],
  },
  {
    id: 'targetAudience',
    title: 'Target Audience & ICP',
    fields: [
      { name: 'ideal_client', label: 'Who is your ideal client?', type: 'textarea', helperText: 'Age, industry, revenue range, location, gender', required: true },
      { name: 'pain_points', label: 'Their TOP 3 problems/pain points', type: 'textarea', required: true },
      { name: 'dream_outcome', label: 'What is their dream outcome?', type: 'textarea' },
      { name: 'why_you', label: 'Why do they choose you over competitors?', type: 'textarea' },
      { name: 'audience_hangouts', label: 'Where does your audience hang out online?', type: 'textarea', helperText: 'Subreddits, Facebook groups, Discord servers, YouTube channels, influencers' },
    ],
  },
  {
    id: 'goals',
    title: 'Goals & Vision',
    fields: [
      { name: 'revenue_goal_90d', label: 'Revenue goal for the next 90 days', type: 'text', required: true },
      { name: 'massive_win', label: 'What would make the next 90 days a massive win?', type: 'textarea' },
      { name: 'top_metrics', label: 'Top 3 metrics you want to track/improve', type: 'textarea' },
      { name: 'twelve_month_vision', label: 'Where do you want to be in 12 months?', type: 'textarea', helperText: 'Revenue, team, lifestyle, market position' },
      { name: 'definition_of_winning', label: 'What does winning look like for your business?', type: 'textarea' },
    ],
  },
  {
    id: 'challenges',
    title: 'Current Challenges',
    fields: [
      { name: 'top_challenges', label: 'TOP 3 challenges right now', type: 'textarea', required: true },
      { name: 'area_ratings', label: 'Rate these areas (1-10)', type: 'textarea', helperText: 'Content consistency, lead gen, sales/closing, offer clarity, funnels/systems, fulfillment, data/tracking' },
      { name: 'tried_solutions', label: 'What have you already tried?', type: 'textarea', helperText: 'Tools, programs, coaches, agencies. What worked? What did not?' },
      { name: 'bottleneck', label: 'The #1 bottleneck in your business right now', type: 'textarea', required: true },
    ],
  },
  {
    id: 'brandVoice',
    title: 'Brand Voice & Style',
    fields: [
      { name: 'voice_description', label: 'How would you describe your brand voice?', type: 'textarea', placeholder: 'e.g. authoritative, friendly, no-BS, empathetic', required: true },
      { name: 'tone_avoid', label: 'What tone do you avoid?', type: 'textarea' },
      { name: 'favorite_phrases', label: 'Favorite words/phrases you use often', type: 'textarea' },
      { name: 'never_say', label: 'Words/phrases you never use', type: 'textarea' },
      { name: 'brand_personality', label: 'If your brand was a person, describe their personality', type: 'textarea', helperText: '3-5 traits' },
      { name: 'content_formats_enjoy', label: 'Content formats you enjoy creating', type: 'textarea', helperText: 'Long-form video, short-form, written, stories, live streams, podcasts' },
      { name: 'content_formats_chore', label: 'Content formats that feel like a chore', type: 'textarea' },
      { name: 'face_on_camera', label: 'Do you show your face on camera?', type: 'select', options: ['Yes, always', 'Sometimes', 'Prefer not to', 'Never'] },
    ],
  },
  {
    id: 'competitors',
    title: 'Competitive Landscape',
    fields: [
      { name: 'competitor_list', label: 'List 3-5 competitors', type: 'textarea', helperText: 'Include IG/YT handles if possible' },
      { name: 'competitor_admire', label: 'What do you admire about each?', type: 'textarea' },
      { name: 'how_different', label: 'How are you different from them?', type: 'textarea' },
      { name: 'content_inspirations', label: 'TOP 3 content inspirations', type: 'textarea', helperText: 'People you study for content strategy' },
      { name: 'admired_brands', label: 'Brands (any industry) you admire', type: 'textarea' },
    ],
  },
  {
    id: 'contentMessaging',
    title: 'Content & Messaging',
    fields: [
      { name: 'posting_frequency', label: 'How often are you posting currently?', type: 'textarea', placeholder: 'Instagram: X/week, YouTube: X/month, etc.' },
      { name: 'core_topics', label: 'Topics/themes you talk about most', type: 'textarea', helperText: 'List 3-5 core topics' },
      { name: 'best_content', label: 'Content that performed best', type: 'textarea', helperText: 'Include links to top 3 pieces' },
      { name: 'want_more_of', label: 'Content you want to create more of', type: 'textarea' },
      { name: 'one_thing', label: 'The ONE thing you want people to know about your brand', type: 'textarea' },
      { name: 'misconceptions', label: 'Misconceptions about your industry you want to correct', type: 'textarea' },
      { name: 'hot_take', label: 'Your hot take or contrarian belief', type: 'textarea' },
    ],
  },
  {
    id: 'sales',
    title: 'Sales & Conversion',
    fields: [
      { name: 'sales_process', label: 'Describe your current sales process', type: 'textarea', helperText: 'Content -> DM -> Call -> Close? Automated funnel?' },
      { name: 'takes_calls', label: 'Do you take sales calls?', type: 'select', options: ['Yes, I close all deals on calls', 'Sometimes', 'No, all self-serve/automated'] },
      { name: 'close_rate', label: 'Average close rate on calls', type: 'text', placeholder: 'e.g. 30%' },
      { name: 'objections', label: 'Biggest sales objections you face', type: 'textarea' },
      { name: 'ideal_vs_nightmare', label: 'What makes an ideal vs nightmare client?', type: 'textarea' },
    ],
  },
  {
    id: 'toolsSystems',
    title: 'Tools & Systems',
    fields: [
      { name: 'tech_stack', label: 'Current tools/platforms', type: 'textarea', helperText: 'CRM, email marketing, scheduling, payments, project management, content creation, analytics' },
      { name: 'tools_love', label: 'Tools you love', type: 'textarea' },
      { name: 'tools_frustrate', label: 'Tools that frustrate you', type: 'textarea' },
      { name: 'ai_comfort', label: 'How comfortable are you with AI tools?', type: 'select', options: ['Expert -- I use AI daily', 'Intermediate -- experimented', 'Beginner -- curious but limited', 'Skeptical -- not sure yet'] },
    ],
  },
  {
    id: 'additionalContext',
    title: 'Additional Context',
    fields: [
      { name: 'anything_else', label: 'Anything else we should know?', type: 'textarea', helperText: 'Learning style, communication preferences, concerns' },
      { name: 'most_excited', label: 'What are you most excited about working with Rawgrowth?', type: 'textarea' },
      { name: 'most_nervous', label: 'What are you most nervous about?', type: 'textarea' },
      { name: 'how_heard', label: 'How did you first hear about us?', type: 'select', options: ['Instagram', 'YouTube', 'Referral', 'Twitter', 'Other'] },
      { name: 'convincing_content', label: 'What content convinced you to join?', type: 'textarea', placeholder: 'Link if possible' },
    ],
  },
];

export default function QuestionnairePage() {
  const router = useRouter();
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savedSections, setSavedSections] = useState<Set<number>>(new Set());
  const [clientId, setClientId] = useState<string | null>(null);

  const saveSection = useMutation(api.brandIntake.saveSection);
  const submitIntake = useMutation(api.brandIntake.submit);
  const updateStep = useMutation(api.clients.updateOnboardingStep);

  // Load client ID and existing data
  useEffect(() => {
    const id = localStorage.getItem('rg_client_id');
    setClientId(id);
  }, []);

  const intake = useQuery(
    api.brandIntake.get,
    clientId ? { clientId: clientId as Id<'clients'> } : 'skip'
  );

  // Populate form with existing data when intake loads
  useEffect(() => {
    if (!intake) return;
    const loaded: Record<string, Record<string, string>> = {};
    SECTIONS.forEach((section, idx) => {
      const data = (intake as any)[section.id];
      if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        loaded[section.id] = data;
        setSavedSections(prev => new Set(prev).add(idx));
      }
    });
    if (Object.keys(loaded).length > 0) {
      setFormData(loaded);
    }
  }, [intake]);

  function updateField(sectionId: string, fieldName: string, value: string) {
    setFormData(prev => ({
      ...prev,
      [sectionId]: { ...prev[sectionId], [fieldName]: value },
    }));
  }

  async function handleSaveSection(sectionIndex: number) {
    if (!clientId) return;
    setSaving(true);
    try {
      const section = SECTIONS[sectionIndex];
      await saveSection({
        clientId: clientId as Id<'clients'>,
        section: section.id,
        data: formData[section.id] || {},
      });
      setSavedSections(prev => new Set(prev).add(sectionIndex));
      if (sectionIndex < SECTIONS.length - 1) {
        setCurrentSection(sectionIndex + 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    if (!clientId) return;
    setSubmitting(true);
    try {
      // Save last section first
      const section = SECTIONS[currentSection];
      await saveSection({
        clientId: clientId as Id<'clients'>,
        section: section.id,
        data: formData[section.id] || {},
      });

      // Submit intake (creates brand profile in "generating" state)
      await submitIntake({ clientId: clientId as Id<'clients'> });

      // Update step
      await updateStep({
        clientId: clientId as Id<'clients'>,
        step: 3,
      });

      router.push('/onboarding/3-brand-profile');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  const section = SECTIONS[currentSection];
  const progress = ((savedSections.size) / SECTIONS.length) * 100;

  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-widest text-[#0CBF6A]">Step 2</p>
      <h1 className="mb-2 text-2xl font-medium tracking-tight" style={{ color: 'rgba(255,255,255,0.92)' }}>Brand Questionnaire</h1>
      <p className="mb-6 text-[rgba(255,255,255,0.5)]">Tell us everything about your business. The more detail, the better your AI department will perform.</p>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-[rgba(255,255,255,0.5)]">Section {currentSection + 1} of {SECTIONS.length}</span>
          <span className="text-[#0CBF6A]">{Math.round(progress)}% complete</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
          <div className="h-full rounded-full bg-[#0CBF6A] transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Section tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto pb-2">
        {SECTIONS.map((s, idx) => (
          <button
            key={s.id}
            onClick={() => setCurrentSection(idx)}
            className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              idx === currentSection
                ? 'bg-[rgba(12,191,106,0.15)] text-[#0CBF6A]'
                : savedSections.has(idx)
                  ? 'bg-[rgba(255,255,255,0.03)] text-[rgba(255,255,255,0.6)]'
                  : 'text-[rgba(255,255,255,0.3)]'
            }`}
          >
            {savedSections.has(idx) && idx !== currentSection ? '+ ' : ''}{s.title}
          </button>
        ))}
      </div>

      {/* Current section form */}
      <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0A1210] p-6">
        <h2 className="mb-4 text-lg font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>{section.title}</h2>

        <div className="space-y-4">
          {section.fields.map((field) => (
            <div key={field.name}>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {field.label}
                {field.required && <span className="ml-1 text-[#0CBF6A]">*</span>}
              </label>
              {field.helperText && (
                <p className="mb-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{field.helperText}</p>
              )}

              {field.type === 'textarea' ? (
                <textarea
                  value={formData[section.id]?.[field.name] || ''}
                  onChange={(e) => updateField(section.id, field.name, e.target.value)}
                  placeholder={field.placeholder}
                  rows={4}
                  className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-4 py-3 text-sm text-white placeholder-[rgba(255,255,255,0.3)] outline-none focus:border-[#0CBF6A]/50"
                />
              ) : field.type === 'select' ? (
                <select
                  value={formData[section.id]?.[field.name] || ''}
                  onChange={(e) => updateField(section.id, field.name, e.target.value)}
                  className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-4 py-3 text-sm text-white outline-none focus:border-[#0CBF6A]/50"
                >
                  <option value="" className="bg-[#0A1210]">Select...</option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt} className="bg-[#0A1210]">{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  value={formData[section.id]?.[field.name] || ''}
                  onChange={(e) => updateField(section.id, field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-4 py-3 text-sm text-white placeholder-[rgba(255,255,255,0.3)] outline-none focus:border-[#0CBF6A]/50"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
          disabled={currentSection === 0}
          className="rounded-lg border border-[rgba(255,255,255,0.12)] bg-transparent px-6 py-2.5 text-sm font-medium text-[rgba(255,255,255,0.7)] transition-colors hover:border-[#0CBF6A]/40 hover:text-white disabled:opacity-30"
        >
          Previous
        </button>

        {currentSection === SECTIONS.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-shine rounded-xl bg-[#0CBF6A] px-8 py-3 text-sm font-bold text-white transition-transform duration-300 hover:-translate-y-0.5 disabled:opacity-50"
          >
            {submitting ? 'Generating Brand Profile...' : 'Submit & Generate Brand Profile'}
          </button>
        ) : (
          <button
            onClick={() => handleSaveSection(currentSection)}
            disabled={saving}
            className="btn-shine rounded-xl bg-[#0CBF6A] px-8 py-3 text-sm font-bold text-white transition-transform duration-300 hover:-translate-y-0.5 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save & Continue'}
          </button>
        )}
      </div>
    </div>
  );
}
