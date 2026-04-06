export interface Client {
  id: string;
  user_id: string;
  company: string;
  name: string;
  email: string;
  status: 'onboarding' | 'active' | 'churned';
  onboarding_step: number;
  onboarding_completed_at: string | null;
  current_month: number;
  slack_channel_id: string;
  health_score: number;
  role: 'client' | 'admin';
  created: string;
  updated: string;
}

export interface OnboardingStep {
  id: string;
  client_id: string;
  step_number: number;
  step_name: string;
  completed: boolean;
  completed_at: string | null;
  data: Record<string, any>;
}

export interface BrandIntake {
  id: string;
  client_id: string;
  basic_info: Record<string, any>;
  social_presence: Record<string, any>;
  origin_story: Record<string, any>;
  business_model: Record<string, any>;
  target_audience: Record<string, any>;
  goals: Record<string, any>;
  challenges: Record<string, any>;
  brand_voice: Record<string, any>;
  competitors: Record<string, any>;
  content_messaging: Record<string, any>;
  sales: Record<string, any>;
  tools_systems: Record<string, any>;
  additional_context: Record<string, any>;
  call_data: Record<string, any>;
  submitted_at: string | null;
}

export interface BrandProfile {
  id: string;
  client_id: string;
  version: number;
  content: string;
  status: 'generating' | 'ready' | 'approved';
  generated_at: string;
  approved_at: string | null;
  approved_by: string | null;
}

export interface Document {
  id: string;
  client_id: string;
  type: 'logo' | 'guideline' | 'asset' | 'other';
  file: string;
  filename: string;
  size: number;
  uploaded_at: string;
}

export interface ApiIntegration {
  id: string;
  client_id: string;
  platform: string;
  key_name: string;
  key_hint: string;
  submitted_at: string;
  notes: string;
}

export interface SoftwareAccess {
  id: string;
  client_id: string;
  platform: string;
  access_type: string;
  confirmed: boolean;
  notes: string;
  updated_at: string;
}

export interface ScheduledCall {
  id: string;
  client_id: string;
  title: string;
  month: number;
  week: number;
  calendly_url: string;
  scheduled_at: string | null;
  completed: boolean;
  notes: string;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'skill' | 'update' | 'doc' | 'tool';
  file: string;
  external_url: string;
  pushed_by: string;
  pushed_at: string;
  target_all: boolean;
}

export interface ResourceAssignment {
  id: string;
  resource_id: string;
  client_id: string;
  notified: boolean;
  seen_at: string | null;
  downloaded_at: string | null;
}

export interface MagicLink {
  id: string;
  email: string;
  token: string;
  expires_at: string;
  used: boolean;
}

export interface Deliverable {
  id: string;
  client_id: string;
  month: number;
  week: number;
  title: string;
  description: string;
  completed: boolean;
  completed_at: string | null;
}
