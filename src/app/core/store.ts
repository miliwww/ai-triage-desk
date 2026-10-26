import { Injectable, computed, inject, signal } from '@angular/core';
import { DataService } from './data.service';
import {
  ActionResult,
  Agent,
  Assignment,
  Category,
  Csat,
  DuplicateCandidate,
  Knowledge,
  Message,
  PartRequest,
  Priority,
  ReviewInput,
  RiskRecord,
  RiskStatus,
  Sla,
  Status,
  Suggestion,
  Team,
  Ticket,
  TicketEvent,
  TicketView,
  Visit,
  RawData,
} from './models';
import {
  CATEGORY_LABEL_FALLBACK,
  DEMO_NOW_ISO,
  DEMO_NOW_MS,
  fmtDateTime,
  isUnresolved,
  slaFirstResponseOverdue,
  slaResolutionOverdue,
  STATUS_LABEL,
} from './format';

export interface OutcomeRecord {
  ticketId: string;
  resultZh: string;
  basisZh: string;
  resolvedAt: string | null;
  closedAt: string | null;
  closeBasisZh: string;
  by: string;
}

export interface RiskView {
  risk: RiskRecord;
  ticket: TicketView;
  team: Team | undefined;
  agent: Agent | undefined;
}

export interface Stats {
  total: number;
  unresolved: number;
  riskOpen: number;
  riskPending: number;
  riskTakenOver: number;
  awaitingReview: number;
  pendingDispatch: number;
  unassigned: number;
  escalated: number;
  overdueFirstResponse: number;
  overdueResolution: number;
  waitingCustomer: number;
  byStatus: { status: Status; count: number }[];
  byPriority: { priority: Priority | 'none'; count: number }[];
  byCountry: { key: string; count: number }[];
  byCategory: { id: string; name: string; count: number }[];
  byLanguage: { key: string; count: number }[];
  byRisk: { queued: number; takenOver: number; mitigated: number };
}

const TERMINAL: Status[] = ['closed', 'cancelled', 'merged'];
const TAKEOVER_USER = { id: 'USR-051', name: '演示值班主管 051', role: '售后主管 / 应急接管' };
const SLA_TARGETS: Record<Priority, [number, number]> = {
  P0: [15, 30],
  P1: [60, 240],
  P2: [240, 1440],
  P3: [1440, 4320],
};

function isoPlusMinutes(baseMs: number, minutes: number): string {
  return new Date(baseMs + minutes * 60000).toISOString();
}

@Injectable({ providedIn: 'root' })
export class Store {
  private readonly dataSvc = inject(DataService);
  private readonly raw = signal<RawData | undefined>(undefined);
  private localSeq = 0;
  private toastTimer?: ReturnType<typeof setTimeout>;

  readonly ready = signal(false);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly lastAction = signal<string>('');
  readonly toast = signal<{ msg: string; error: boolean } | null>(null);
  readonly currentUser = TAKEOVER_USER;

  readonly tickets = signal<Ticket[]>([]);
  readonly suggestions = signal<Suggestion[]>([]);
  readonly messages = signal<Message[]>([]);
  readonly events = signal<TicketEvent[]>([]);
  readonly assignments = signal<Assignment[]>([]);
  readonly risks = signal<RiskRecord[]>([]);
  readonly partRequests = signal<PartRequest[]>([]);
  readonly visits = signal<Visit[]>([]);
  readonly duplicates = signal<DuplicateCandidate[]>([]);
  readonly csat = signal<Csat[]>([]);
  readonly outcomes = signal<OutcomeRecord[]>([]);
  readonly agents = signal<Agent[]>([]);

  readonly teams = computed(() => this.raw()?.teams ?? []);
  readonly customers = computed(() => this.raw()?.customers ?? []);
  readonly sites = computed(() => this.raw()?.sites ?? []);
  readonly devices = computed(() => this.raw()?.devices ?? []);
  readonly products = computed(() => this.raw()?.products ?? []);
  readonly categories = computed(() => this.raw()?.categories ?? []);
  readonly knowledge = computed(() => this.raw()?.knowledge ?? []);
  readonly regions = computed(() => this.raw()?.regions ?? []);
  readonly workflowStatuses = computed(() => this.raw()?.workflow?.statuses ?? []);
  readonly dashboardExpected = computed(() => this.raw()?.dashboardExpected);

  private readonly ticketById = computed(() => new Map(this.tickets().map((t) => [t.id, t])));
  private readonly teamById = computed(() => new Map(this.teams().map((t) => [t.id, t])));
  private readonly agentById = computed(() => new Map(this.agents().map((a) => [a.id, a])));
  private readonly customerById = computed(() => new Map(this.customers().map((c) => [c.id, c])));
  private readonly siteById = computed(() => new Map(this.sites().map((s) => [s.id, s])));
  private readonly deviceById = computed(() => new Map(this.devices().map((d) => [d.id, d])));
  private readonly productById = computed(() => new Map(this.products().map((p) => [p.id, p])));
  private readonly categoryById = computed(() => new Map(this.categories().map((c) => [c.id, c])));
  private readonly suggestionByTicket = computed(
    () => new Map(this.suggestions().map((s) => [s.ticket_id, s])),
  );
  private readonly riskByTicket = computed(
    () => new Map(this.risks().map((r) => [r.ticket_id, r])),
  );
  private readonly outcomeByTicket = computed(
    () => new Map(this.outcomes().map((o) => [o.ticketId, o])),
  );
  private readonly messagesByTicket = computed(() => this.group(this.messages()));
  private readonly eventsByTicket = computed(() => this.group(this.events()));

  readonly views = computed<TicketView[]>(() => {
    const now = DEMO_NOW_MS;
    return this.tickets().map((t) => this.toView(t, now));
  });
  readonly viewsById = computed(() => new Map(this.views().map((v) => [v.id, v])));

  readonly stats = computed<Stats>(() => this.computeStats(this.views()));

  readonly riskViews = computed<RiskView[]>(() => {
    const viewMap = this.viewsById();
    return this.risks()
      .map((risk) => {
        const ticket = viewMap.get(risk.ticket_id);
        return ticket ? { risk, ticket, team: ticket.team, agent: ticket.agent } : null;
      })
      .filter((x): x is RiskView => !!x)
      .sort((a, b) => {
        const rank = (s: RiskStatus) => (s === 'queued' ? 0 : s === 'taken_over' ? 1 : 2);
        return (
          rank(a.risk.status) - rank(b.risk.status) ||
          new Date(b.risk.detected_at).getTime() - new Date(a.risk.detected_at).getTime()
        );
      });
  });

  readonly currentRisks = computed(() =>
    this.riskViews().filter((r) => r.risk.status !== 'mitigated' && isUnresolved(r.ticket.status)),
  );
  readonly pendingRisks = computed(() =>
    this.currentRisks().filter((r) => r.risk.status === 'queued'),
  );

  readonly firstResponseOverdueViews = computed(() =>
    this.views()
      .filter((v) => v.isUnresolved && v.firstResponseOverdue)
      .sort(
        (a, b) =>
          new Date(a.sla.first_response_due_at).getTime() -
          new Date(b.sla.first_response_due_at).getTime(),
      ),
  );
  readonly resolutionOverdueViews = computed(() =>
    this.views()
      .filter((v) => v.isUnresolved && v.resolutionOverdue)
      .sort(
        (a, b) =>
          new Date(a.sla.resolution_due_at).getTime() - new Date(b.sla.resolution_due_at).getTime(),
      ),
  );
  readonly myTodo = computed(() => {
    const set = new Set<string>();
    const out: TicketView[] = [];
    for (const v of this.views()) {
      if (!v.isUnresolved) continue;
      const needReview = v.status === 'awaiting_review';
      const needDispatch =
        v.ai &&
        v.ai.review.status !== 'pending' &&
        !v.assigned_agent_id &&
        ['awaiting_review', 'reopened'].includes(v.status);
      const risk = v.riskPending;
      if (needReview || needDispatch || risk) {
        if (!set.has(v.id)) {
          set.add(v.id);
          out.push(v);
        }
      }
    }
    return out.sort((a, b) => {
      const rank = (v: TicketView) =>
        v.riskPending ? 0 : v.status === 'escalated' ? 1 : v.priority === 'P0' ? 2 : 3;
      return (
        rank(a) - rank(b) || new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });
  });

  readonly statsMeta = computed(() => ({
    asOf: DEMO_NOW_ISO,
    expected: this.dashboardExpected(),
    totalSeed: 492,
    openSeed: 397,
    overdueSeed: 87,
  }));

  async init(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    try {
      const raw = await this.dataSvc.load();
      this.raw.set(raw);
      this.resetState(raw);
      this.ready.set(true);
    } catch (err) {
      this.loadError.set(err instanceof Error ? err.message : '数据读取失败');
      this.ready.set(false);
    } finally {
      this.loading.set(false);
    }
  }

  resetDemo(): void {
    const raw = this.raw();
    if (!raw) return;
    this.resetState(raw);
    this.notify(`已重置为种子数据：${this.tickets().length} 条工单`);
  }

  private resetState(raw: RawData): void {
    this.localSeq = 0;
    this.tickets.set(raw.tickets.slice());
    this.suggestions.set(raw.suggestions.slice());
    this.messages.set(raw.messages.slice());
    this.events.set(raw.events.slice());
    this.assignments.set(raw.assignments.slice());
    this.agents.set(raw.agents.slice());
    this.partRequests.set(raw.partRequests.slice());
    this.visits.set(raw.visits.slice());
    this.duplicates.set(raw.duplicates.slice());
    this.csat.set(raw.csat.slice());
    this.outcomes.set([]);
    this.risks.set(this.seedRisks(raw));
    this.lastAction.set('');
    this.toast.set(null);
  }

  private seedRisks(raw: RawData): RiskRecord[] {
    const escalatedAt = new Map<string, string>();
    for (const e of raw.events) {
      if (e.to_status === 'escalated' && !escalatedAt.has(e.ticket_id))
        escalatedAt.set(e.ticket_id, e.at);
    }
    return raw.tickets
      .filter((t) => t.safety_flag === 'reported_risk')
      .map((t) => ({
        id: `RISK-SEED-${t.id}`,
        ticket_id: t.id,
        status: 'queued' as RiskStatus,
        detected_at: escalatedAt.get(t.id) ?? t.created_at,
        detected_by: 'system',
        reason_zh: `${t.summary_zh}；需由人工核实风险并记录后续处置。`,
        queued_at: escalatedAt.get(t.id) ?? t.created_at,
        taken_over_by: null,
        taken_over_at: null,
        takeover_note_zh: '',
        next_update_at: null,
        mitigated_at: null,
        mitigation_note_zh: '',
        source: 'seed_flag' as const,
      }));
  }

  // ---------- 查询辅助 ----------
  view(id: string | null | undefined): TicketView | undefined {
    return id ? this.viewsById().get(id) : undefined;
  }
  teamName(id: string | null | undefined): string {
    return id ? (this.teamById().get(id)?.name_zh ?? id) : '待确认';
  }
  agentName(id: string | null | undefined): string {
    return id ? (this.agentById().get(id)?.display_name ?? id) : '待确认';
  }
  categoryName(id: string | null | undefined): string {
    if (!id) return '待判定';
    return this.categoryById().get(id)?.name_zh ?? CATEGORY_LABEL_FALLBACK[id] ?? id;
  }
  messagesOf(ticketId: string): Message[] {
    return (this.messagesByTicket().get(ticketId) ?? [])
      .slice()
      .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  }
  eventsOf(ticketId: string): TicketEvent[] {
    return (this.eventsByTicket().get(ticketId) ?? [])
      .slice()
      .sort(
        (a, b) =>
          new Date(a.at).getTime() - new Date(b.at).getTime() || (a.seq ?? 0) - (b.seq ?? 0),
      );
  }
  assignmentsOf(ticketId: string): Assignment[] {
    return this.assignments()
      .filter((a) => a.ticket_id === ticketId)
      .sort((a, b) => new Date(a.assigned_at).getTime() - new Date(b.assigned_at).getTime());
  }
  suggestionOf(ticketId: string): Suggestion | undefined {
    return this.suggestionByTicket().get(ticketId);
  }
  /** 没有种子建议时生成“预设演示建议”，不写入存储，明确标识 */
  presetSuggestion(ticket: Ticket): Suggestion {
    const existing = this.suggestionOf(ticket.id);
    if (existing) return existing;
    const category: Category | undefined =
      this.categoryById().get(ticket.category_id ?? '') ??
      this.categoryById().get(ticket.tags[0] ?? '');
    const team = this.recommendTeam(ticket, category?.id ?? 'unknown');
    const text = ticket.reported.symptom_description ?? '';
    return {
      is_synthetic: true,
      id: `AI-PRESET-${ticket.id}`,
      ticket_id: ticket.id,
      generated_at: DEMO_NOW_ISO,
      proposal: {
        category_id: category?.id ?? 'unknown',
        priority: ticket.priority ?? (ticket.safety_flag === 'reported_risk' ? 'P0' : 'P2'),
        team_id: team?.id ?? 'TEAM-GLOBAL-GLOBAL',
        confidence: ticket.safety_flag === 'reported_risk' ? 0.72 : 0.86,
        missing_fields: ticket.missing_fields.slice(),
        escalation_required: ticket.safety_flag === 'reported_risk',
        summary_zh: ticket.summary_zh,
        evidence_spans: text ? [text.split('\n')[0]] : [],
        knowledge_ids: ['KB-01', 'KB-03'],
        rationale_zh:
          '预设演示建议：依据客户原话、类别必要字段与演示路由规则生成；根因与保修资格须人工确认。',
      },
      review: {
        status: 'pending',
        reviewer_id: null,
        reviewed_at: null,
        final_category_id: null,
        final_team_id: null,
        note_zh: '',
      },
    };
  }
  outcomeOf(ticketId: string): OutcomeRecord | undefined {
    return this.outcomeByTicket().get(ticketId);
  }
  riskOf(ticketId: string): RiskRecord | undefined {
    return this.riskByTicket().get(ticketId);
  }
  duplicateOf(ticketId: string): DuplicateCandidate[] {
    return this.duplicates().filter(
      (d) => d.ticket_id === ticketId || d.candidate_ticket_id === ticketId,
    );
  }
  knowledgeOf(ids: string[]): Knowledge[] {
    const map = new Map(this.knowledge().map((k) => [k.id, k]));
    return ids.map((id) => map.get(id)).filter((k): k is Knowledge => !!k);
  }
  regionName(code: string): string {
    return this.regions().find((r) => r.id === code)?.country_zh ?? code;
  }
  recommendTeam(ticket: Ticket, categoryId: string): Team | undefined {
    const skill = this.categoryById().get(categoryId)?.required_skill;
    const country = ticket.country_code;
    const teams = this.teams();
    return (
      teams.find((t) => t.country_codes.includes(country) && t.skills.includes(skill ?? '')) ??
      teams.find((t) => t.country_codes.includes(country) && t.skills.includes('global')) ??
      teams.find((t) => t.skills.includes('global')) ??
      teams.find((t) => t.country_codes.includes(country))
    );
  }
  agentsOfTeam(teamId: string): Agent[] {
    return this.agents()
      .filter((a) => a.team_id === teamId)
      .sort((a, b) => this.agentRank(a) - this.agentRank(b));
  }
  agentRank(a: Agent): number {
    const avail =
      a.availability === 'online'
        ? 0
        : a.availability === 'busy'
          ? 1
          : a.availability === 'leave'
            ? 2
            : 3;
    return avail * 100 + (a.capacity ? a.current_open_ticket_count / a.capacity : 1) * 10;
  }
  agentAvailable(a: Agent): boolean {
    return a.availability === 'online' && a.current_open_ticket_count < a.capacity;
  }
  agentReason(a: Agent): string {
    if (a.availability === 'offline') return '当前离线';
    if (a.availability === 'leave') return '休假中';
    if (a.availability === 'busy') return '忙碌';
    if (a.current_open_ticket_count >= a.capacity) return '容量已满';
    return '可用';
  }
  candidateTeams(ticket: Ticket): Team[] {
    const skill = ticket.category_id
      ? this.categoryById().get(ticket.category_id)?.required_skill
      : undefined;
    const list = this.teams().filter(
      (t) => t.country_codes.includes(ticket.country_code) && (!skill || t.skills.includes(skill)),
    );
    if (!list.some((t) => t.id === 'TEAM-GLOBAL-GLOBAL')) {
      const global = this.teams().find((t) => t.skills.includes('global'));
      if (global) list.push(global);
    }
    return list;
  }
  nextAction(t: Ticket, aiReview?: string, riskPending = false, riskStatus?: RiskStatus): string {
    if (riskPending && t.status !== 'resolved') return '风险待人工接管，优先处理';
    switch (t.status) {
      case 'new':
        return '整理来件并复核 AI 建议';
      case 'awaiting_review':
        return aiReview === 'pending' ? '核对并确认分诊建议' : '确认派工';
      case 'waiting_customer':
        return '等待客户补充资料';
      case 'assigned':
        return '开始处理，并记录进展';
      case 'in_progress':
        return '记录处理进展与客户回复';
      case 'waiting_parts':
        return '跟进备件申请';
      case 'waiting_visit':
        return '跟进上门预约提案';
      case 'escalated':
        return riskStatus === 'taken_over'
          ? '记录风险处置与后续进展'
          : riskStatus === 'mitigated'
            ? '继续服务处理，记录结果'
            : '核对应急处理并记录进展';
      case 'resolved':
        return '等待客户确认后关闭';
      case 'reopened':
        return '按新周期重新分诊 / 处理';
      case 'closed':
        return '已关闭，复发可重开';
      case 'cancelled':
        return '已取消，不参与当前 SLA';
      case 'merged':
        return '已合并至原单';
      default:
        return '核对工单状态';
    }
  }

  // ---------- 动作 ----------
  reviewSuggestion(ticketId: string, input: ReviewInput): ActionResult {
    const ticket = this.ticketById().get(ticketId);
    if (!ticket) return this.fail('工单不存在');
    if (TERMINAL.includes(ticket.status))
      return this.fail(`工单已${STATUS_LABEL[ticket.status]}，需先重开再复核`);
    if (!input.categoryId || !input.teamId) return this.fail('请选择问题类别与建议团队');
    const base = this.presetSuggestion(ticket);
    const previousCategory = base.proposal.category_id;
    const previousPriority = base.proposal.priority;
    const previousTeam = base.proposal.team_id;
    const finalCategory = input.categoryId;
    const finalTeam = input.teamId;
    const changed =
      finalCategory !== previousCategory ||
      input.priority !== previousPriority ||
      finalTeam !== previousTeam;
    if (
      !this.categories().some((category) => category.id === finalCategory) ||
      !this.teams().some((team) => team.id === finalTeam)
    ) {
      return this.fail('问题类别或建议团队不存在，请重新选择');
    }
    if (changed && !input.note.trim()) return this.fail('更正分诊建议时，请填写更正原因');
    const review: Suggestion['review'] = {
      status: changed ? 'corrected' : 'accepted',
      reviewer_id: TAKEOVER_USER.id,
      reviewed_at: DEMO_NOW_ISO,
      final_category_id: finalCategory,
      final_team_id: finalTeam,
      note_zh:
        input.note.trim() ||
        (changed ? '人工更正预设建议（演示记录）。' : '人工确认预设建议（演示记录）。'),
    };
    const stored: Suggestion = {
      ...base,
      review,
      proposal: { ...base.proposal, missing_fields: input.missingFields.slice() },
    };
    this.suggestions.update((list) => {
      const rest = list.filter((s) => s.ticket_id !== ticketId);
      return [...rest, stored];
    });
    const from = ticket.status;
    this.tickets.update((list) =>
      list.map((t) =>
        t.id !== ticketId
          ? t
          : {
              ...t,
              category_id: finalCategory,
              priority: input.priority,
              missing_fields: input.missingFields.slice(),
              status: ['new', 'awaiting_review', 'waiting_customer', 'reopened'].includes(t.status)
                ? 'awaiting_review'
                : t.status,
              updated_at: DEMO_NOW_ISO,
            },
      ),
    );
    this.appendEvent(
      ticketId,
      'ai_review_confirmed',
      from,
      ['new', 'awaiting_review', 'waiting_customer', 'reopened'].includes(from)
        ? 'awaiting_review'
        : from,
      'human',
      changed
        ? `人工更正分诊建议：${this.categoryName(previousCategory)} → ${this.categoryName(finalCategory)}；${previousPriority} → ${input.priority}`
        : '人工确认分诊建议，进入待派工',
    );
    this.appendMessage(
      ticketId,
      `复核记录：${changed ? '更正' : '确认'}分诊建议。类别 ${this.categoryName(finalCategory)}，优先级 ${input.priority}，建议团队 ${this.teamName(finalTeam)}。${review.note_zh}`,
      'internal',
    );
    this.notify(changed ? '分诊建议已更正并留痕' : '分诊建议已确认，下一步为确认派工');
    return this.ok(changed ? '已保存更正，原始建议保留可追溯' : '已确认建议，等待确认派工');
  }

  dispatch(ticketId: string, teamId: string, agentId: string, note: string): ActionResult {
    const ticket = this.ticketById().get(ticketId);
    if (!ticket) return this.fail('工单不存在');
    if (['resolved', 'closed', 'cancelled', 'merged'].includes(ticket.status))
      return this.fail('当前状态不可派工');
    if (!ticket.assigned_agent_id && this.presetSuggestion(ticket).review.status === 'pending') {
      return this.fail('请先完成人工分诊复核，再确认派工');
    }
    const agent = this.agentById().get(agentId);
    const team = this.teamById().get(teamId);
    if (!team || !agent) return this.fail('请选择负责团队与负责人');
    if (agent.team_id !== teamId) return this.fail('负责人不属于所选团队');
    if (ticket.assigned_team_id === teamId && ticket.assigned_agent_id === agentId) {
      return this.fail('该工单已由该负责人处理，无需重复派工');
    }
    if (!this.agentAvailable(agent))
      return this.fail(`负责人当前不可用：${this.agentReason(agent)}，请改选或进入调度队列`);
    if (ticket.assigned_agent_id) {
      this.tickets.update((list) =>
        list.map((t) =>
          t.id !== ticketId
            ? t
            : {
                ...t,
                assigned_team_id: teamId,
                assigned_agent_id: agentId,
                status:
                  t.status === 'reopened'
                    ? 'reopened'
                    : t.status === 'in_progress'
                      ? 'in_progress'
                      : 'assigned',
                updated_at: DEMO_NOW_ISO,
              },
        ),
      );
    } else {
      this.tickets.update((list) =>
        list.map((t) =>
          t.id !== ticketId
            ? t
            : {
                ...t,
                assigned_team_id: teamId,
                assigned_agent_id: agentId,
                status: ['escalated'].includes(t.status) ? t.status : 'assigned',
                updated_at: DEMO_NOW_ISO,
              },
        ),
      );
    }
    const assignment: Assignment = {
      is_synthetic: true,
      id: `ASN-L-${this.pad(++this.localSeq)}`,
      ticket_id: ticketId,
      team_id: teamId,
      assignee_id: agentId,
      assigned_at: DEMO_NOW_ISO,
      approved_by: TAKEOVER_USER.id,
      decision: ticket.assigned_agent_id ? 'human_reassigned' : 'human_confirmed',
      rule_version: 'ROUTE-DEMO-V1',
      note_zh: note.trim() || '人工确认派工（演示记录）。',
    };
    this.assignments.update((list) => [...list, assignment]);
    this.agents.update((list) =>
      list.map((a) =>
        a.id !== agentId
          ? a
          : {
              ...a,
              current_open_ticket_count: Math.min(
                a.capacity,
                a.current_open_ticket_count + (ticket.assigned_agent_id === agentId ? 0 : 1),
              ),
            },
      ),
    );
    const from = ticket.status;
    this.appendEvent(
      ticketId,
      ticket.assigned_agent_id ? 'reassigned' : 'assigned',
      from,
      ['escalated'].includes(from) ? from : 'assigned',
      'human',
      `确认负责人：${team.name_zh} / ${agent.display_name}${note.trim() ? `；备注：${note.trim()}` : ''}`,
    );
    this.appendMessage(
      ticketId,
      `派工已确认：${team.name_zh} · ${agent.display_name}。承接事项：核对设备现象、记录处理动作并向客户更新进展。${note.trim() ? '交接说明：' + note.trim() : ''}`,
      'internal',
    );
    this.notify(`已确认派工给 ${agent.display_name}`);
    return this.ok('派工已确认，负责人与分派记录已写入');
  }

  addMessage(ticketId: string, body: string, visibility: Message['visibility']): ActionResult {
    const ticket = this.ticketById().get(ticketId);
    if (!ticket) return this.fail('工单不存在');
    if (!body.trim()) return this.fail('内容不能为空');
    if (['cancelled', 'merged'].includes(ticket.status))
      return this.fail('已取消或已合并工单不可继续沟通');
    const msg: Message = {
      is_synthetic: true,
      id: `MSG-L-${this.pad(++this.localSeq)}`,
      ticket_id: ticketId,
      at: DEMO_NOW_ISO,
      sender_type: 'service_agent',
      sender_id: TAKEOVER_USER.id,
      language: visibility === 'customer' ? ticket.language : 'zh',
      body: body.trim(),
      body_zh: visibility === 'customer' ? body.trim() : null,
      translation_status: 'local_demo_not_sent',
      visibility,
      attachment_ids: [],
    };
    this.messages.update((list) => [...list, msg]);
    let firstResponse = false;
    this.tickets.update((list) =>
      list.map((t) => {
        if (t.id !== ticketId) return t;
        const countsAsResponse = visibility === 'customer' && !t.sla.first_response_at;
        if (countsAsResponse) firstResponse = true;
        return {
          ...t,
          updated_at: DEMO_NOW_ISO,
          sla: countsAsResponse
            ? {
                ...t.sla,
                first_response_at: DEMO_NOW_ISO,
                first_response_breached:
                  DEMO_NOW_MS > new Date(t.sla.first_response_due_at).getTime(),
              }
            : t.sla,
        };
      }),
    );
    this.appendEvent(
      ticketId,
      visibility === 'customer' ? 'customer_reply_recorded' : 'internal_note_added',
      ticket.status,
      ticket.status,
      'human',
      visibility === 'customer' ? '人工记录一条客户可见回复（演示环境未实际外发）' : '记录内部备注',
    );
    this.notify(
      visibility === 'customer'
        ? firstResponse
          ? '已记录客户可见回复，并计入首次人工响应'
          : '已记录客户可见回复'
        : '内部备注已保存，客户视图不可见',
    );
    return this.ok(
      visibility === 'customer' ? '客户可见回复已记录（演示环境未实际发送）' : '内部备注已保存',
    );
  }

  startProgress(ticketId: string, note: string): ActionResult {
    const t = this.ticketById().get(ticketId);
    if (!t) return this.fail('工单不存在');
    if (!t.assigned_agent_id) return this.fail('尚无确认负责人，请先完成派工');
    if (!['assigned', 'reopened', 'escalated', 'awaiting_review'].includes(t.status))
      return this.fail(`当前状态为 ${STATUS_LABEL[t.status]}，不能开始处理`);
    this.tickets.update((list) =>
      list.map((x) =>
        x.id !== ticketId ? x : { ...x, status: 'in_progress', updated_at: DEMO_NOW_ISO },
      ),
    );
    this.appendEvent(
      ticketId,
      'progress_started',
      t.status,
      'in_progress',
      'human',
      note.trim() || '负责人开始处理',
    );
    this.notify('已进入处理中');
    return this.ok('状态已更新为处理中');
  }

  setWaiting(
    ticketId: string,
    target: 'waiting_customer' | 'waiting_parts' | 'waiting_visit',
    note: string,
  ): ActionResult {
    const t = this.ticketById().get(ticketId);
    if (!t) return this.fail('工单不存在');
    if (!note.trim()) return this.fail('请填写等待原因或下一步说明');
    if (
      ![
        'assigned',
        'in_progress',
        'waiting_customer',
        'waiting_parts',
        'waiting_visit',
        'reopened',
      ].includes(t.status)
    ) {
      return this.fail(`当前状态为 ${STATUS_LABEL[t.status]}，不能进入等待状态`);
    }
    this.tickets.update((list) =>
      list.map((x) => (x.id !== ticketId ? x : { ...x, status: target, updated_at: DEMO_NOW_ISO })),
    );
    let extra = '';
    if (target === 'waiting_parts') {
      const req: PartRequest = {
        is_synthetic: true,
        id: `PREQ-L-${this.pad(++this.localSeq)}`,
        ticket_id: ticketId,
        part_id: 'PART-01',
        quantity: 1,
        status: 'pending_human_confirmation',
        requested_at: DEMO_NOW_ISO,
        approved_by: null,
        note_zh: note.trim(),
      };
      this.partRequests.update((list) => [...list, req]);
      extra = '；备件需求为待人工确认提案，不代表已批准或已发货';
    }
    if (target === 'waiting_visit') {
      const visit: Visit = {
        is_synthetic: true,
        id: `VISIT-L-${this.pad(++this.localSeq)}`,
        ticket_id: ticketId,
        site_id: t.site_id,
        status: 'proposal_pending_confirmation',
        proposed_start: isoPlusMinutes(DEMO_NOW_MS, 3 * 1440),
        timezone: this.siteById().get(t.site_id)?.timezone ?? 'UTC',
        technician_id: t.assigned_agent_id ?? '',
        approved_by: null,
        notice: '未来预约提案，不是已发生事件，也不是已确认服务承诺。',
        note_zh: note.trim(),
      };
      this.visits.update((list) => [...list, visit]);
      extra = '；上门时间为预约提案，尚未确认';
    }
    this.appendEvent(ticketId, 'status_changed', t.status, target, 'human', note.trim());
    this.notify(`已更新为${STATUS_LABEL[target]}`);
    return this.ok(`状态已更新为${STATUS_LABEL[target]}${extra}`);
  }

  resolve(ticketId: string, result: string, basis: string): ActionResult {
    const t = this.ticketById().get(ticketId);
    if (!t) return this.fail('工单不存在');
    if (!result.trim()) return this.fail('请填写处理结果');
    if (['resolved', 'closed', 'cancelled', 'merged'].includes(t.status))
      return this.fail('当前状态不能再次标记解决');
    if (!t.assigned_agent_id) return this.fail('尚无确认负责人，不能标记解决');
    const risk = this.riskOf(ticketId);
    if (risk && risk.status !== 'mitigated')
      return this.fail('风险尚未记录缓解，请先完成人工接管与风险处置');
    this.tickets.update((list) =>
      list.map((x) =>
        x.id !== ticketId
          ? x
          : {
              ...x,
              status: 'resolved',
              sla: {
                ...x.sla,
                resolved_at: DEMO_NOW_ISO,
                resolution_breached: DEMO_NOW_MS > new Date(x.sla.resolution_due_at).getTime(),
              },
              updated_at: DEMO_NOW_ISO,
            },
      ),
    );
    this.outcomes.update((list) => {
      const rest = list.filter((o) => o.ticketId !== ticketId);
      return [
        ...rest,
        {
          ticketId,
          resultZh: result.trim(),
          basisZh: basis.trim(),
          resolvedAt: DEMO_NOW_ISO,
          closedAt: null,
          closeBasisZh: '',
          by: TAKEOVER_USER.name,
        },
      ];
    });
    this.appendEvent(ticketId, 'resolved', t.status, 'resolved', 'human', result.trim());
    this.appendMessage(
      ticketId,
      `处理结果已记录：${result.trim()}${basis.trim() ? '；验证依据：' + basis.trim() : '；客户确认依据待补充。'}`,
      'internal',
    );
    this.notify('已标记为已解决待确认，尚未关闭');
    return this.ok('已标记为解决待确认；关闭需要客户确认依据');
  }

  close(ticketId: string, basis: string): ActionResult {
    const t = this.ticketById().get(ticketId);
    if (!t) return this.fail('工单不存在');
    if (t.status !== 'resolved') return this.fail('只有“已解决待确认”的工单可以关闭');
    if (!basis.trim()) return this.fail('请填写客户确认依据后再关闭');
    const risk = this.riskOf(ticketId);
    if (risk && risk.status !== 'mitigated') return this.fail('风险尚未记录缓解，不能关闭工单');
    this.tickets.update((list) =>
      list.map((x) =>
        x.id !== ticketId ? x : { ...x, status: 'closed', updated_at: DEMO_NOW_ISO },
      ),
    );
    this.outcomes.update((list) =>
      list.map((o) =>
        o.ticketId === ticketId
          ? {
              ...o,
              closedAt: DEMO_NOW_ISO,
              closeBasisZh: basis.trim(),
              by: TAKEOVER_USER.name,
            }
          : o,
      ),
    );
    this.appendEvent(
      ticketId,
      'closed',
      'resolved',
      'closed',
      'human',
      `关闭依据：${basis.trim()}`,
    );
    this.notify('工单已关闭，关闭依据已留痕');
    return this.ok('已关闭；历史周期与超时记录保留');
  }

  reopen(ticketId: string, evidence: string): ActionResult {
    const t = this.ticketById().get(ticketId);
    if (!t) return this.fail('工单不存在');
    if (!['closed', 'resolved'].includes(t.status))
      return this.fail('只有已解决或已关闭工单可以重开');
    if (!evidence.trim()) return this.fail('请填写复发证据');
    const [fr, res] = SLA_TARGETS[t.priority ?? 'P2'];
    const prev: Sla['previous_cycle'] = {
      first_response_at: t.sla.first_response_at,
      resolved_at: t.sla.resolved_at,
      first_response_breached: t.sla.first_response_breached || slaFirstResponseOverdue(t.sla),
      resolution_breached: t.sla.resolution_breached || slaResolutionOverdue(t.sla),
    };
    this.tickets.update((list) =>
      list.map((x) =>
        x.id !== ticketId
          ? x
          : {
              ...x,
              status: 'reopened',
              updated_at: DEMO_NOW_ISO,
              sla: {
                ...x.sla,
                cycle: x.sla.cycle + 1,
                clock_start_at: DEMO_NOW_ISO,
                first_response_due_at: isoPlusMinutes(DEMO_NOW_MS, fr),
                resolution_due_at: isoPlusMinutes(DEMO_NOW_MS, res),
                first_response_at: null,
                resolved_at: null,
                first_response_breached: false,
                resolution_breached: false,
                excluded: false,
                previous_cycle: prev,
              },
            },
      ),
    );
    this.outcomes.update((list) =>
      list.map((o) => (o.ticketId === ticketId ? { ...o, closedAt: o.closedAt } : o)),
    );
    this.appendEvent(ticketId, 'reopened', t.status, 'reopened', 'human', evidence.trim());
    this.appendMessage(
      ticketId,
      `复发重开：${evidence.trim()}。旧周期结果与超时记录保留，新周期从此刻重新计时。`,
      'internal',
    );
    this.notify('已重开，新周期开始计时');
    return this.ok('已重开并建立新周期，旧周期保留');
  }

  escalate(ticketId: string, reason: string, makeP0: boolean): ActionResult {
    const t = this.ticketById().get(ticketId);
    if (!t) return this.fail('工单不存在');
    if (!reason.trim()) return this.fail('请填写风险或升级原因');
    if (TERMINAL.includes(t.status)) return this.fail('已终止工单不能直接升级，请先重开');
    const existing = this.riskOf(ticketId);
    if (existing && existing.status !== 'mitigated') {
      return this.fail('该工单已在风险队列中，请由应急负责人确认接管');
    }
    const risk: RiskRecord = existing
      ? {
          ...existing,
          status: 'queued',
          detected_at: DEMO_NOW_ISO,
          queued_at: DEMO_NOW_ISO,
          detected_by: 'human',
          reason_zh: reason.trim(),
          taken_over_by: null,
          taken_over_at: null,
          takeover_note_zh: '',
          mitigated_at: null,
          mitigation_note_zh: '',
          next_update_at: null,
          source: 'manual_escalation',
        }
      : {
          id: `RISK-L-${this.pad(++this.localSeq)}`,
          ticket_id: ticketId,
          status: 'queued',
          detected_at: DEMO_NOW_ISO,
          detected_by: 'human',
          reason_zh: reason.trim(),
          queued_at: DEMO_NOW_ISO,
          taken_over_by: null,
          taken_over_at: null,
          takeover_note_zh: '',
          next_update_at: null,
          mitigated_at: null,
          mitigation_note_zh: '',
          source: 'manual_escalation',
        };
    this.risks.update((list) => [...list.filter((r) => r.ticket_id !== ticketId), risk]);
    const safetyTeam = this.teams().find((tm) => tm.skills.includes('safety'));
    this.tickets.update((list) =>
      list.map((x) =>
        x.id !== ticketId
          ? x
          : {
              ...x,
              status: 'escalated',
              priority: makeP0 ? 'P0' : x.priority,
              category_id: makeP0 ? 'safety' : x.category_id,
              assigned_team_id: x.assigned_team_id ?? (makeP0 ? (safetyTeam?.id ?? null) : null),
              updated_at: DEMO_NOW_ISO,
            },
      ),
    );
    this.appendEvent(
      ticketId,
      'risk_escalated',
      t.status,
      'escalated',
      'human',
      `转人工风险处理：${reason.trim()}${makeP0 ? '；按 P0 安全紧急处理' : ''}`,
    );
    this.appendMessage(
      ticketId,
      `已转人工风险队列，等待应急负责人接管。${makeP0 ? '按 P0 安全紧急处理，缺资料不阻塞。' : ''}本记录不等于事故已排除。`,
      'internal',
    );
    this.notify('已进入人工风险队列，等待接管确认');
    return this.ok('已进入人工风险队列；需应急负责人确认接管');
  }

  takeOverRisk(ticketId: string, note: string, nextUpdateHours: number): ActionResult {
    const risk = this.riskOf(ticketId);
    if (!risk) return this.fail('该工单没有风险记录');
    if (risk.status === 'taken_over') return this.fail('该风险已由人工接管，无需重复操作');
    if (risk.status === 'mitigated') return this.fail('风险已记录缓解，不能重复接管');
    if (!note.trim()) return this.fail('请填写接管说明与后续处置');
    if (!Number.isFinite(nextUpdateHours) || nextUpdateHours < 1 || nextUpdateHours > 72) {
      return this.fail('下次更新时间须为 1—72 小时');
    }
    const next = isoPlusMinutes(DEMO_NOW_MS, Math.max(1, nextUpdateHours) * 60);
    this.risks.update((list) =>
      list.map((r) =>
        r.ticket_id !== ticketId
          ? r
          : {
              ...r,
              status: 'taken_over',
              taken_over_by: TAKEOVER_USER.id,
              taken_over_at: DEMO_NOW_ISO,
              takeover_note_zh: note.trim(),
              next_update_at: next,
            },
      ),
    );
    const t = this.ticketById().get(ticketId);
    if (t && t.status !== 'escalated') {
      this.tickets.update((list) =>
        list.map((x) =>
          x.id !== ticketId ? x : { ...x, status: 'escalated', updated_at: DEMO_NOW_ISO },
        ),
      );
    }
    this.appendEvent(
      ticketId,
      'risk_taken_over',
      t?.status ?? null,
      'escalated',
      'human',
      `应急接管：${note.trim()}；下次更新预期 ${fmtDateTime(next)}（UTC+8）`,
    );
    this.appendMessage(
      ticketId,
      `应急接管已记录：${TAKEOVER_USER.name}。接管说明：${note.trim()}。下次更新预期：${next}。接管不等于事故已排除。`,
      'internal',
    );
    this.notify('已确认接管，接管记录与时间已写入');
    return this.ok('已记录人工接管；风险未解除，仍保留在风险清单');
  }

  mitigateRisk(ticketId: string, note: string): ActionResult {
    const risk = this.riskOf(ticketId);
    if (!risk) return this.fail('该工单没有风险记录');
    if (risk.status !== 'taken_over')
      return this.fail('需先由应急负责人确认接管，才能记录风险缓解');
    if (!note.trim()) return this.fail('请填写风险缓解依据');
    this.risks.update((list) =>
      list.map((r) =>
        r.ticket_id !== ticketId
          ? r
          : {
              ...r,
              status: 'mitigated',
              mitigated_at: DEMO_NOW_ISO,
              mitigation_note_zh: note.trim(),
            },
      ),
    );
    this.appendEvent(
      ticketId,
      'risk_mitigated',
      null,
      null,
      'human',
      `记录风险缓解：${note.trim()}`,
    );
    this.notify('已记录风险缓解依据，工单仍需按流程处理');
    return this.ok('已记录风险缓解；这是服务记录，不等于设备已修复');
  }

  mergeTicket(ticketId: string, candidateId: string): ActionResult {
    const t = this.ticketById().get(ticketId);
    const candidate = this.ticketById().get(candidateId);
    if (!t || !candidate) return this.fail('工单或候选原单不存在');
    if (t.id === candidate.id) return this.fail('不能合并到自身');
    if (t.status === 'merged') return this.fail('该工单已合并');
    if (TERMINAL.includes(candidate.status) && !['resolved', 'closed'].includes(candidate.status)) {
      return this.fail('候选原单已终止，不能作为合并目标');
    }
    this.tickets.update((list) =>
      list.map((x) =>
        x.id !== ticketId
          ? x
          : {
              ...x,
              status: 'merged',
              duplicate_of_ticket_id: candidateId,
              related_ticket_ids: Array.from(new Set([...x.related_ticket_ids, candidateId])),
              sla: { ...x.sla, excluded: true },
              updated_at: DEMO_NOW_ISO,
            },
      ),
    );
    this.duplicates.update((list) => {
      const exists = list.some(
        (d) => d.ticket_id === ticketId && d.candidate_ticket_id === candidateId,
      );
      if (exists) {
        return list.map((d) =>
          d.ticket_id === ticketId
            ? { ...d, decision: 'human_confirmed_merge', approved_by: TAKEOVER_USER.id }
            : d,
        );
      }
      return [
        ...list,
        {
          is_synthetic: true,
          id: `DUP-L-${this.pad(++this.localSeq)}`,
          ticket_id: ticketId,
          candidate_ticket_id: candidateId,
          match_reasons: ['manual_confirmed'],
          similarity_score: 0,
          decision: 'human_confirmed_merge',
          approved_by: TAKEOVER_USER.id,
        },
      ];
    });
    this.appendEvent(
      ticketId,
      'merged',
      t.status,
      'merged',
      'human',
      `人工确认合并到原单 ${candidateId}；两条来件与编号均保留`,
    );
    this.notify(`已合并到原单 ${candidateId}，原文与编号保留`);
    return this.ok(`已合并至 ${candidateId}；该单不再单独计 SLA`);
  }

  // ---------- 内部 ----------
  private toView(t: Ticket, now: number): TicketView {
    const ai = this.suggestionByTicket().get(t.id);
    const risk = this.riskByTicket().get(t.id);
    const riskPending = !!risk && risk.status === 'queued' && isUnresolved(t.status);
    const customer = this.customerById().get(t.customer_id);
    const site = this.siteById().get(t.site_id);
    const device = this.deviceById().get(t.device_id);
    const product = this.productById().get(t.product_id);
    const team = this.teamById().get(t.assigned_team_id ?? '');
    const agent = this.agentById().get(t.assigned_agent_id ?? '');
    const category = this.categoryById().get(t.category_id ?? '');
    const assignment = this.assignments()
      .filter((a) => a.ticket_id === t.id)
      .sort((a, b) => new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime())[0];
    const unresolved = isUnresolved(t.status);
    const waitingMinutes = Math.max(
      0,
      Math.floor((now - new Date(t.sla.clock_start_at).getTime()) / 60000),
    );
    return {
      ...t,
      ai,
      risk,
      customer,
      site,
      device,
      product,
      team,
      agent,
      category,
      assignment,
      msgCount: this.messagesByTicket().get(t.id)?.length ?? 0,
      isUnresolved: unresolved,
      firstResponseOverdue: unresolved && slaFirstResponseOverdue(t.sla, now),
      resolutionOverdue: unresolved && slaResolutionOverdue(t.sla, now),
      waitingMinutes,
      riskPending,
      nextActionZh: this.nextAction(t, ai?.review.status, riskPending, risk?.status),
    };
  }

  private computeStats(views: TicketView[]): Stats {
    const now = DEMO_NOW_MS;
    const unresolvedViews = views.filter((v) => v.isUnresolved);
    const byStatusMap = new Map<Status, number>();
    for (const v of views) byStatusMap.set(v.status, (byStatusMap.get(v.status) ?? 0) + 1);
    const statusOrder: Status[] = [
      'new',
      'awaiting_review',
      'waiting_customer',
      'assigned',
      'in_progress',
      'waiting_parts',
      'waiting_visit',
      'escalated',
      'resolved',
      'closed',
      'cancelled',
      'merged',
      'reopened',
    ];
    const byPriorityMap = new Map<Priority | 'none', number>();
    for (const v of views) {
      const key = v.priority ?? 'none';
      byPriorityMap.set(key, (byPriorityMap.get(key) ?? 0) + 1);
    }
    const byCountryMap = new Map<string, number>();
    const byCategoryMap = new Map<string, number>();
    const byLangMap = new Map<string, number>();
    for (const v of views) {
      byCountryMap.set(v.country_code, (byCountryMap.get(v.country_code) ?? 0) + 1);
      const cid = v.category_id ?? 'unconfirmed';
      byCategoryMap.set(cid, (byCategoryMap.get(cid) ?? 0) + 1);
      byLangMap.set(v.language, (byLangMap.get(v.language) ?? 0) + 1);
    }
    const risks = this.risks();
    const riskOpenViews = this.currentRisks();
    return {
      total: views.length,
      unresolved: unresolvedViews.length,
      riskOpen: riskOpenViews.length,
      riskPending: riskOpenViews.filter((r) => r.risk.status === 'queued').length,
      riskTakenOver: riskOpenViews.filter((r) => r.risk.status === 'taken_over').length,
      awaitingReview: views.filter((v) => v.status === 'awaiting_review').length,
      pendingDispatch: unresolvedViews.filter(
        (v) =>
          v.ai &&
          v.ai.review.status !== 'pending' &&
          !v.assigned_agent_id &&
          ['awaiting_review', 'reopened'].includes(v.status),
      ).length,
      unassigned: unresolvedViews.filter((v) => !v.assigned_agent_id).length,
      escalated: views.filter((v) => v.status === 'escalated').length,
      overdueFirstResponse: unresolvedViews.filter((v) => v.firstResponseOverdue).length,
      overdueResolution: unresolvedViews.filter((v) => v.resolutionOverdue).length,
      waitingCustomer: views.filter((v) => v.status === 'waiting_customer').length,
      byStatus: statusOrder.map((status) => ({ status, count: byStatusMap.get(status) ?? 0 })),
      byPriority: (['P0', 'P1', 'P2', 'P3', 'none'] as const).map((priority) => ({
        priority,
        count: byPriorityMap.get(priority) ?? 0,
      })),
      byCountry: Array.from(byCountryMap, ([key, count]) => ({ key, count })).sort(
        (a, b) => b.count - a.count,
      ),
      byCategory: Array.from(byCategoryMap, ([id, count]) => ({
        id,
        name: id === 'unconfirmed' ? '待判定类别' : this.categoryName(id),
        count,
      })).sort((a, b) => b.count - a.count),
      byLanguage: Array.from(byLangMap, ([key, count]) => ({ key, count })).sort(
        (a, b) => b.count - a.count,
      ),
      byRisk: {
        queued: risks.filter((r) => r.status === 'queued').length,
        takenOver: risks.filter((r) => r.status === 'taken_over').length,
        mitigated: risks.filter((r) => r.status === 'mitigated').length,
      },
    };
  }

  private group<T extends { ticket_id: string }>(items: T[]): Map<string, T[]> {
    const map = new Map<string, T[]>();
    for (const item of items) {
      const list = map.get(item.ticket_id);
      if (list) list.push(item);
      else map.set(item.ticket_id, [item]);
    }
    return map;
  }

  private appendEvent(
    ticketId: string,
    type: string,
    from: Status | null,
    to: Status | null,
    actor: 'system' | 'human',
    reason: string,
  ): void {
    const ev: TicketEvent = {
      is_synthetic: true,
      id: `EVT-L-${this.pad(++this.localSeq)}`,
      ticket_id: ticketId,
      at: DEMO_NOW_ISO,
      type,
      from_status: from,
      to_status: to,
      actor_type: actor,
      actor_id: actor === 'human' ? TAKEOVER_USER.id : null,
      reason_zh: reason,
      correlation_id: 'LOCAL-DEMO',
      seq: this.localSeq,
    };
    this.events.update((list) => [...list, ev]);
    this.lastAction.set(`${type} · ${ticketId}`);
  }

  private appendMessage(ticketId: string, body: string, visibility: Message['visibility']): void {
    const msg: Message = {
      is_synthetic: true,
      id: `MSG-L-${this.pad(++this.localSeq)}`,
      ticket_id: ticketId,
      at: DEMO_NOW_ISO,
      sender_type: 'system',
      sender_id: null,
      language: 'zh',
      body,
      body_zh: null,
      translation_status: 'local_demo_record',
      visibility,
      attachment_ids: [],
    };
    this.messages.update((list) => [...list, msg]);
  }

  private ok(message: string): ActionResult {
    return { ok: true, message };
  }
  private fail(message: string): ActionResult {
    this.notify(message, true);
    return { ok: false, message, error: true };
  }
  private notify(msg: string, error = false): void {
    this.toast.set({ msg, error });
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 3600);
  }
  private pad(n: number): string {
    return String(n).padStart(4, '0');
  }
}
