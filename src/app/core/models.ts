export type Priority = 'P0' | 'P1' | 'P2' | 'P3';
export type Status =
  | 'new' | 'awaiting_review' | 'waiting_customer' | 'assigned' | 'in_progress'
  | 'waiting_parts' | 'waiting_visit' | 'escalated' | 'resolved' | 'closed'
  | 'cancelled' | 'merged' | 'reopened';
export type MessageVisibility = 'customer' | 'internal';
export type RiskStatus = 'queued' | 'taken_over' | 'mitigated';

export interface Sla {
  policy_id: string;
  applied_priority: Priority;
  clock_start_at: string;
  cycle: number;
  first_response_due_at: string;
  resolution_due_at: string;
  first_response_at: string | null;
  resolved_at: string | null;
  first_response_breached: boolean;
  resolution_breached: boolean;
  excluded: boolean;
  as_of: string;
  previous_cycle: null | {
    first_response_at: string | null;
    resolved_at: string | null;
    first_response_breached: boolean;
    resolution_breached: boolean;
  };
}

export interface Ticket {
  is_synthetic: boolean;
  id: string;
  external_reference: string;
  title: string;
  customer_id: string;
  tenant_id: string;
  site_id: string;
  device_id: string;
  product_id: string;
  country_code: string;
  language: string;
  channel: string;
  created_at: string;
  updated_at: string;
  reported: {
    serial_number: string | null;
    model: string | null;
    occurred_at: string | null;
    symptom_description: string;
    error_code_literal: string | null;
    purchase_proof: string | null;
  };
  summary_zh: string;
  category_id: string | null;
  priority: Priority | null;
  status: Status;
  assigned_team_id: string | null;
  assigned_agent_id: string | null;
  missing_fields: string[];
  related_ticket_ids: string[];
  duplicate_of_ticket_id: string | null;
  safety_flag: string;
  warranty_status: string;
  tags: string[];
  sla: Sla;
  quality: { case_origin: string; human_root_cause_confirmed: boolean };
  source_context_ids: string[];
}

export interface Suggestion {
  is_synthetic: boolean;
  id: string;
  ticket_id: string;
  generated_at: string;
  proposal: {
    category_id: string;
    priority: Priority;
    team_id: string;
    confidence: number;
    missing_fields: string[];
    escalation_required: boolean;
    summary_zh: string;
    evidence_spans: string[];
    knowledge_ids: string[];
    rationale_zh: string;
  };
  review: {
    status: 'pending' | 'accepted' | 'corrected' | 'returned';
    reviewer_id: string | null;
    reviewed_at: string | null;
    final_category_id: string | null;
    final_team_id: string | null;
    note_zh: string;
  };
}

export interface Message {
  is_synthetic: boolean;
  id: string;
  ticket_id: string;
  at: string;
  sender_type: 'customer' | 'service_agent' | 'system' | 'installer';
  sender_id: string | null;
  language: string;
  body: string;
  body_zh: string | null;
  translation_status: string;
  visibility: MessageVisibility;
  attachment_ids: string[];
}

export interface TicketEvent {
  is_synthetic?: boolean;
  id: string;
  ticket_id: string;
  at: string;
  type: string;
  from_status: Status | null;
  to_status: Status | null;
  actor_type: 'system' | 'human';
  actor_id: string | null;
  reason_zh: string;
  correlation_id: string;
  seq?: number;
}

export interface Assignment {
  is_synthetic?: boolean;
  id: string;
  ticket_id: string;
  team_id: string;
  assignee_id: string;
  assigned_at: string;
  approved_by: string | null;
  decision: string;
  rule_version: string;
  note_zh?: string;
}

export interface Team {
  is_synthetic: boolean;
  id: string;
  name_zh: string;
  country_codes: string[];
  skills: string[];
  languages: string[];
  supported_segments: string[];
  coverage: string;
  requires_human_assignment_approval: boolean;
}

export interface Agent {
  is_synthetic: boolean;
  id: string;
  display_name: string;
  team_id: string;
  role: string;
  languages: string[];
  skills: string[];
  availability: 'online' | 'busy' | 'offline' | 'leave';
  capacity: number;
  current_open_ticket_count: number;
  email: string;
}

export interface Customer {
  is_synthetic: boolean;
  id: string;
  name: string;
  type: string;
  country_code: string;
  preferred_language: string;
  contact_name: string;
  email: string;
  phone: string | null;
  preferred_contact: string;
  consent_to_service_contact: boolean;
  tenant_id: string;
}

export interface Site {
  is_synthetic: boolean;
  id: string;
  customer_id: string;
  country_code: string;
  name: string;
  timezone: string;
  address_label: string;
  segment: string;
  installer_customer_id: string | null;
  tenant_id: string;
}

export interface Device {
  is_synthetic: boolean;
  id: string;
  site_id: string;
  customer_id: string;
  product_id: string;
  serial_number: string;
  serial_format: string;
  installed_on: string;
  firmware_version: string;
  warranty_status: string;
  model_market_pairing: string;
}

export interface Product {
  id: string;
  brand: string;
  model: string;
  segment: string;
  nominal_power_kw: number | null;
  nominal_capacity_kwh: number | null;
  source_ids: string[];
  fact_status: string;
  warranty_policy: string;
  caution: string;
}

export interface Category {
  is_synthetic: boolean;
  id: string;
  name_zh: string;
  required_skill: string;
  required_intake_fields: string[];
  unknown_code_policy: string;
}

export interface Knowledge {
  id: string;
  title_zh: string;
  content_type: string;
  source_ids: string[];
  content_zh: string;
  recommended_actions_zh: string[];
  version: string;
  approved_for: string;
  applies_to: string;
  not_a_repair_manual: boolean;
}

export interface PartRequest {
  is_synthetic: boolean;
  id: string;
  ticket_id: string;
  part_id: string;
  quantity: number;
  status: string;
  requested_at: string;
  approved_by: string | null;
  note_zh?: string;
}

export interface Visit {
  is_synthetic: boolean;
  id: string;
  ticket_id: string;
  site_id: string;
  status: string;
  proposed_start: string;
  timezone: string;
  technician_id: string;
  approved_by: string | null;
  notice: string;
  note_zh?: string;
}

export interface DuplicateCandidate {
  is_synthetic: boolean;
  id: string;
  ticket_id: string;
  candidate_ticket_id: string;
  match_reasons: string[];
  similarity_score: number;
  decision: string;
  approved_by: string | null;
}

export interface Csat {
  is_synthetic: boolean;
  id: string;
  ticket_id: string;
  customer_id: string;
  score_1_to_5: number;
  comment_zh: string;
  submitted_at: string;
  is_simulated_metric: boolean;
}

export interface Region {
  is_synthetic: boolean;
  id: string;
  country_zh: string;
  default_language: string;
  timezone: string;
  city_zh: string;
  service_area: string;
  coverage_status: string;
  clock_policy: string;
}

export interface RiskRecord {
  id: string;
  ticket_id: string;
  status: RiskStatus;
  detected_at: string;
  detected_by: 'system' | 'human';
  reason_zh: string;
  queued_at: string | null;
  taken_over_by: string | null;
  taken_over_at: string | null;
  takeover_note_zh: string;
  next_update_at: string | null;
  mitigated_at: string | null;
  mitigation_note_zh: string;
  source: 'seed_flag' | 'manual_escalation';
}

export interface WorkflowConfig {
  statuses: { id: Status; label_zh: string }[];
  transitions: { from_status: Status; to_status: Status; requires_human: boolean }[];
  terminal_statuses: Status[];
}

export interface RawData {
  tickets: Ticket[];
  suggestions: Suggestion[];
  messages: Message[];
  events: TicketEvent[];
  assignments: Assignment[];
  teams: Team[];
  agents: Agent[];
  customers: Customer[];
  sites: Site[];
  devices: Device[];
  products: Product[];
  categories: Category[];
  knowledge: Knowledge[];
  regions: Region[];
  partRequests: PartRequest[];
  visits: Visit[];
  duplicates: DuplicateCandidate[];
  csat: Csat[];
  workflow: WorkflowConfig;
  dashboardExpected: { total_tickets: number; open_count: number; unresolved_response_overdue_count: number; as_of: string };
}

export interface TicketView extends Ticket {
  ai?: Suggestion;
  risk?: RiskRecord;
  customer?: Customer;
  site?: Site;
  device?: Device;
  product?: Product;
  team?: Team;
  agent?: Agent;
  category?: Category;
  assignment?: Assignment;
  msgCount: number;
  isUnresolved: boolean;
  firstResponseOverdue: boolean;
  resolutionOverdue: boolean;
  waitingMinutes: number;
  riskPending: boolean;
  nextActionZh: string;
}

export interface ReviewInput {
  categoryId: string;
  priority: Priority;
  teamId: string;
  missingFields: string[];
  note: string;
  mode: 'accepted' | 'corrected';
}

export interface ActionResult {
  ok: boolean;
  message: string;
  error?: boolean;
}
