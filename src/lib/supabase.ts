import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.PORTAL_SUPABASE_URL || 'https://civhzxrnfmqkxpmdhwwp.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.PORTAL_SUPABASE_SERVICE_KEY || '';

export function createSupabaseClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

export interface ActivityEvent {
  id: string;
  client_id: string;
  event_type: 'appointment_booked' | 'ticket_resolved' | 'task_completed' | 'anomaly_flagged' | 'content_published' | 'report_generated' | 'system_update' | 'milestone_reached' | 'email_sent' | 'workflow_triggered';
  title: string;
  description: string | null;
  agent_name: string;
  metadata: Record<string, any>;
  severity: 'info' | 'success' | 'warning' | 'error';
  created_at: string;
  read_at: string | null;
}
