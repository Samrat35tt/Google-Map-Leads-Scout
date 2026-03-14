/**
 * dataService.ts
 * All Supabase database read/write operations, grouped by entity.
 * Every function requires a `userId` so data is always scoped to the authenticated user.
 */

import { supabase } from './supabase';
import type {
  Lead,
  Workflow,
  Conversation,
  Message,
  KnowledgeDocument,
  Meeting,
  SearchLog,
  AppUser,
  LLMSettings,
} from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert a Lead (frontend) → contacts table row */
const leadToRow = (lead: Lead, userId: string) => ({
  id: lead.id,
  user_id: userId,
  name: lead.name,
  address: lead.address,
  phone: lead.phone ?? null,
  email: lead.email ?? null,
  email_status: lead.emailStatus ?? null,
  email_source: lead.emailSource ?? null,
  website: lead.website ?? null,
  socials: lead.socials ?? null,
  category: lead.category,
  rating: lead.rating ?? null,
  review_count: lead.reviewCount ?? null,
  maps_url: lead.mapsUrl ?? null,
  pipeline_stage: lead.pipelineStage ?? null,
  outreach: lead.outreach ?? null,
  workflow_status: lead.workflowStatus ?? null,
  current_step_id: lead.currentStepId ?? null,
  updated_at: new Date().toISOString(),
});

/** Convert a contacts row → Lead (frontend) */
const rowToLead = (row: any): Lead => ({
  id: row.id,
  name: row.name,
  address: row.address,
  phone: row.phone,
  email: row.email,
  emailStatus: row.email_status,
  emailSource: row.email_source,
  website: row.website,
  socials: row.socials,
  category: row.category,
  rating: row.rating,
  reviewCount: row.review_count,
  mapsUrl: row.maps_url,
  pipelineStage: row.pipeline_stage,
  outreach: row.outreach,
  workflowStatus: row.workflow_status,
  currentStepId: row.current_step_id,
});

// ---------------------------------------------------------------------------
// PROFILES
// ---------------------------------------------------------------------------

export async function getProfile(userId: string): Promise<AppUser | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    email: data.email,
    name: data.name ?? undefined,
    plan: data.plan,
    credits: data.credits,
    isAdmin: data.is_admin,
    suspended: data.suspended,
    complianceAccepted: data.compliance_accepted,
    settings: (data.settings as LLMSettings) ?? undefined,
    created_at: data.created_at,
  };
}

export async function upsertProfile(user: AppUser): Promise<void> {
  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    email: user.email,
    name: user.name ?? null,
    plan: user.plan,
    credits: user.credits ?? 0,
    is_admin: user.isAdmin ?? false,
    suspended: user.suspended ?? false,
    compliance_accepted: user.complianceAccepted ?? false,
    settings: (user.settings as any) ?? null,
    updated_at: new Date().toISOString(),
  });

  if (error) console.error('[Supabase] upsertProfile error:', error.message);
}

export async function updateProfileCredits(userId: string, credits: number): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ credits, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) console.error('[Supabase] updateProfileCredits error:', error.message);
}

export async function updateProfileSettings(userId: string, settings: LLMSettings): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ settings: settings as any, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) console.error('[Supabase] updateProfileSettings error:', error.message);
}

export async function acceptCompliance(userId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ compliance_accepted: true, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) console.error('[Supabase] acceptCompliance error:', error.message);
}

// ---------------------------------------------------------------------------
// CONTACTS
// ---------------------------------------------------------------------------

export async function getContacts(userId: string): Promise<Lead[]> {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase] getContacts error:', error.message);
    return [];
  }
  return (data ?? []).map(rowToLead);
}

export async function upsertContact(lead: Lead, userId: string): Promise<void> {
  const { error } = await supabase.from('contacts').upsert(leadToRow(lead, userId));
  if (error) console.error('[Supabase] upsertContact error:', error.message);
}

export async function upsertContacts(leads: Lead[], userId: string): Promise<void> {
  if (!leads.length) return;
  const rows = leads.map((l) => leadToRow(l, userId));
  const { error } = await supabase.from('contacts').upsert(rows);
  if (error) console.error('[Supabase] upsertContacts error:', error.message);
}

export async function deleteContact(contactId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', contactId)
    .eq('user_id', userId);

  if (error) console.error('[Supabase] deleteContact error:', error.message);
}

// ---------------------------------------------------------------------------
// WORKFLOWS
// ---------------------------------------------------------------------------

export async function getWorkflows(userId: string): Promise<Workflow[]> {
  const { data, error } = await supabase
    .from('workflows')
    .select('*, workflow_leads(contact_id)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase] getWorkflows error:', error.message);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    isActive: row.is_active,
    steps: row.steps ?? [],
    settings: row.settings ?? {},
    logs: row.logs ?? [],
    leads: [], // Populated separately if needed
  }));
}

export async function upsertWorkflow(wf: Workflow, userId: string): Promise<void> {
  const { error } = await supabase.from('workflows').upsert({
    id: wf.id,
    user_id: userId,
    name: wf.name,
    is_active: wf.isActive,
    steps: wf.steps as any,
    settings: wf.settings as any,
    logs: wf.logs as any,
    updated_at: new Date().toISOString(),
  });

  if (error) console.error('[Supabase] upsertWorkflow error:', error.message);
}

export async function deleteWorkflow(workflowId: string, userId: string): Promise<void> {
  // workflow_leads rows deleted by CASCADE
  const { error } = await supabase
    .from('workflows')
    .delete()
    .eq('id', workflowId)
    .eq('user_id', userId);

  if (error) console.error('[Supabase] deleteWorkflow error:', error.message);
}

// ---------------------------------------------------------------------------
// CONVERSATIONS & MESSAGES
// ---------------------------------------------------------------------------

export async function getConversations(userId: string): Promise<Conversation[]> {
  const { data: convRows, error: convErr } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('last_message_time', { ascending: false });

  if (convErr) {
    console.error('[Supabase] getConversations error:', convErr.message);
    return [];
  }

  const convIds = (convRows ?? []).map((c: any) => c.id);
  if (!convIds.length) return [];

  const { data: msgRows, error: msgErr } = await supabase
    .from('messages')
    .select('*')
    .in('conversation_id', convIds)
    .order('timestamp', { ascending: true });

  if (msgErr) console.error('[Supabase] getMessages error:', msgErr.message);

  const messagesByConv: Record<string, Message[]> = {};
  for (const m of msgRows ?? []) {
    if (!messagesByConv[m.conversation_id]) messagesByConv[m.conversation_id] = [];
    messagesByConv[m.conversation_id].push({
      id: m.id,
      sender: m.sender,
      content: m.content,
      timestamp: m.timestamp,
      channel: m.channel,
    });
  }

  return (convRows ?? []).map((row: any) => ({
    id: row.id,
    leadId: row.contact_id,
    leadName: row.lead_name,
    leadEmail: row.lead_email,
    lastMessage: row.last_message,
    lastMessageTime: row.last_message_time,
    unreadCount: row.unread_count,
    channel: row.channel,
    messages: messagesByConv[row.id] ?? [],
  }));
}

export async function upsertConversation(conv: Conversation, userId: string): Promise<void> {
  const { error } = await supabase.from('conversations').upsert({
    id: conv.id,
    user_id: userId,
    contact_id: conv.leadId,
    lead_name: conv.leadName,
    lead_email: conv.leadEmail ?? null,
    last_message: conv.lastMessage,
    last_message_time: conv.lastMessageTime,
    unread_count: conv.unreadCount,
    channel: conv.channel,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error('[Supabase] upsertConversation error:', error.message);
    return;
  }

  // Upsert messages
  const messages = conv.messages.map((m) => ({
    id: m.id,
    conversation_id: conv.id,
    user_id: userId,
    sender: m.sender,
    content: m.content,
    channel: m.channel,
    timestamp: m.timestamp,
  }));

  if (messages.length) {
    const { error: msgErr } = await supabase.from('messages').upsert(messages);
    if (msgErr) console.error('[Supabase] upsertMessages error:', msgErr.message);
  }
}

// ---------------------------------------------------------------------------
// KNOWLEDGE DOCUMENTS
// ---------------------------------------------------------------------------

export async function getKnowledgeDocs(userId: string): Promise<KnowledgeDocument[]> {
  const { data, error } = await supabase
    .from('knowledge_documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase] getKnowledgeDocs error:', error.message);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    type: row.type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function upsertKnowledgeDoc(doc: KnowledgeDocument, userId: string): Promise<void> {
  const { error } = await supabase.from('knowledge_documents').upsert({
    id: doc.id,
    user_id: userId,
    title: doc.title,
    content: doc.content,
    type: doc.type,
    updated_at: new Date().toISOString(),
  });

  if (error) console.error('[Supabase] upsertKnowledgeDoc error:', error.message);
}

export async function deleteKnowledgeDoc(docId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('knowledge_documents')
    .delete()
    .eq('id', docId)
    .eq('user_id', userId);

  if (error) console.error('[Supabase] deleteKnowledgeDoc error:', error.message);
}

// ---------------------------------------------------------------------------
// MEETINGS
// ---------------------------------------------------------------------------

export async function getMeetings(userId: string): Promise<Meeting[]> {
  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) {
    console.error('[Supabase] getMeetings error:', error.message);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    title: row.title,
    date: row.date,
    provider: row.provider,
    status: row.status,
    summary: row.summary,
    transcript: row.transcript,
    proposal: row.proposal,
    leadId: row.contact_id,
  }));
}

export async function upsertMeeting(meeting: Meeting, userId: string): Promise<void> {
  const { error } = await supabase.from('meetings').upsert({
    id: meeting.id,
    user_id: userId,
    title: meeting.title,
    date: meeting.date,
    provider: meeting.provider,
    status: meeting.status,
    summary: meeting.summary ?? null,
    transcript: meeting.transcript ?? null,
    proposal: meeting.proposal ?? null,
    contact_id: meeting.leadId ?? null,
  });

  if (error) console.error('[Supabase] upsertMeeting error:', error.message);
}

export async function deleteMeeting(meetingId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('meetings')
    .delete()
    .eq('id', meetingId)
    .eq('user_id', userId);

  if (error) console.error('[Supabase] deleteMeeting error:', error.message);
}

// ---------------------------------------------------------------------------
// SEARCH LOGS
// ---------------------------------------------------------------------------

export async function getSearchLogs(userId: string): Promise<SearchLog[]> {
  const { data, error } = await supabase
    .from('search_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[Supabase] getSearchLogs error:', error.message);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    industry: row.industry,
    country: row.country,
    location: row.location,
    date: row.created_at,
    resultsCount: row.results_count,
  }));
}

export async function insertSearchLog(
  log: Omit<SearchLog, 'id'>,
  userId: string
): Promise<void> {
  const { error } = await supabase.from('search_logs').insert({
    user_id: userId,
    industry: log.industry,
    country: log.country,
    location: log.location,
    results_count: log.resultsCount,
  });

  if (error) console.error('[Supabase] insertSearchLog error:', error.message);
}

// ---------------------------------------------------------------------------
// ADMIN — all users
// ---------------------------------------------------------------------------

export async function getAllProfiles(): Promise<AppUser[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase] getAllProfiles error:', error.message);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    plan: row.plan,
    credits: row.credits,
    isAdmin: row.is_admin,
    suspended: row.suspended,
    complianceAccepted: row.compliance_accepted,
    created_at: row.created_at,
  }));
}

export async function updateUserPlan(
  userId: string,
  plan: AppUser['plan'],
  credits: number
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ plan, credits, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) console.error('[Supabase] updateUserPlan error:', error.message);
}

export async function suspendUser(userId: string, suspended: boolean): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ suspended, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) console.error('[Supabase] suspendUser error:', error.message);
}
