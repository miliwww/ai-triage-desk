import { Component, computed, ElementRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '../../core/store';
import { I18n } from '../../core/i18n';
import { WorkflowGuideComponent } from '../../shared/workflow-guide';
import { EmptyComponent, LoadBarComponent, PriorityBadgeComponent, RiskBadgeComponent, StatusBadgeComponent } from '../../shared/badges';
import {
  CHANNEL_LABEL, fmtAgo, fmtDateTime, LANG_LABEL, overdueMinutes, PRIORITY_LABEL,
  slaFirstResponseOverdue, slaResolutionOverdue, STATUS_LABEL, duration,
} from '../../core/format';
import { Message, Priority, Status } from '../../core/models';

type Tab = 'overview' | 'conversation' | 'review' | 'dispatch' | 'handling' | 'timeline';

const EVENT_LABEL: Record<string, string> = {
  created: '受理建单', status_changed: '状态变更', ai_review_confirmed: '分诊复核',
  assigned: '确认派工', reassigned: '改派', customer_reply_recorded: '客户可见回复',
  internal_note_added: '内部备注', progress_started: '开始处理', resolved: '标记解决',
  closed: '关闭工单', reopened: '复发重开', risk_escalated: '风险升级',
  risk_taken_over: '人工接管', risk_mitigated: '风险缓解', merged: '合并工单',
};

@Component({
  selector: 'app-ticket-detail',
  imports: [RouterLink, WorkflowGuideComponent, StatusBadgeComponent, PriorityBadgeComponent, RiskBadgeComponent, LoadBarComponent, EmptyComponent],
  templateUrl: './ticket-detail.html',
  styleUrl: './ticket-detail.css',
})
export class TicketDetailPage {
  readonly store = inject(Store);
  readonly i18n = inject(I18n);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly id = signal('');
  readonly tab = signal<Tab>('overview');
  readonly showInternal = signal(true);
  readonly ticket = computed(() => this.store.view(this.id()));
  readonly ai = computed(() => {
    const t = this.ticket();
    return t ? this.store.presetSuggestion(t) : undefined;
  });
  readonly effectiveCategory = computed(() => this.ai()?.review.final_category_id ?? this.ai()?.proposal.category_id ?? '');
  readonly effectiveTeam = computed(() => this.ai()?.review.final_team_id ?? this.ai()?.proposal.team_id ?? '');

  readonly msgBody = signal('');
  readonly msgScope = signal<Message['visibility']>('internal');
  readonly rvCategory = signal('');
  readonly rvPriority = signal<Priority>('P2');
  readonly rvTeam = signal('');
  readonly rvMissing = signal<string[]>([]);
  readonly rvNote = signal('');
  readonly dispatchTeam = signal('');
  readonly dispatchAgent = signal('');
  readonly dispatchNote = signal('');
  readonly handlingNote = signal('');
  readonly resultText = signal('');
  readonly basisText = signal('');
  readonly closeBasis = signal('');
  readonly reopenEvidence = signal('');
  readonly escalateReason = signal('');
  readonly makeP0 = signal(true);
  readonly takeoverNote = signal('');
  readonly nextUpdateHours = signal(4);
  readonly mitigateNote = signal('');
  readonly mergeTarget = signal('');

  readonly STATUS_LABEL = STATUS_LABEL;
  readonly LANG_LABEL = LANG_LABEL;
  readonly CHANNEL_LABEL = CHANNEL_LABEL;
  readonly fmtDateTime = fmtDateTime;
  readonly fmtAgo = fmtAgo;
  readonly overdueMinutes = overdueMinutes;
  readonly duration = duration;
  readonly slaFirstResponseOverdue = slaFirstResponseOverdue;
  readonly slaResolutionOverdue = slaResolutionOverdue;

  readonly tabs: { id: Tab; labelKey: string }[] = [
    { id: 'overview', labelKey: 'detail.tabOverview' },
    { id: 'conversation', labelKey: 'detail.tabConversation' },
    { id: 'review', labelKey: 'detail.tabReview' },
    { id: 'dispatch', labelKey: 'detail.tabDispatch' },
    { id: 'handling', labelKey: 'detail.tabHandling' },
    { id: 'timeline', labelKey: 'detail.tabTimeline' },
  ];

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((pm) => {
      this.id.set(pm.get('id') ?? '');
      this.resetForms();
    });
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((pm) => {
      const tab = pm.get('tab') as Tab | null;
      if (tab && this.tabs.some((t) => t.id === tab)) this.tab.set(tab);
    });
  }

  readonly messages = computed(() => {
    const t = this.ticket();
    if (!t) return [];
    const list = this.store.messagesOf(t.id);
    return this.showInternal() ? list : list.filter((m) => m.visibility === 'customer');
  });
  readonly events = computed(() => {
    const t = this.ticket();
    return t ? this.store.eventsOf(t.id) : [];
  });
  readonly assignmentHistory = computed(() => {
    const t = this.ticket();
    return t ? this.store.assignmentsOf(t.id) : [];
  });
  readonly parts = computed(() => {
    const t = this.ticket();
    return t ? this.store.partRequests().filter((p) => p.ticket_id === t.id) : [];
  });
  readonly visits = computed(() => {
    const t = this.ticket();
    return t ? this.store.visits().filter((v) => v.ticket_id === t.id) : [];
  });
  readonly outcome = computed(() => {
    const t = this.ticket();
    return t ? this.store.outcomeOf(t.id) : undefined;
  });
  readonly candidateTeams = computed(() => {
    const t = this.ticket();
    if (!t) return [];
    return this.store.candidateTeams(t);
  });
  readonly teamAgents = computed(() => {
    const team = this.dispatchTeam();
    return team ? this.store.agentsOfTeam(team) : [];
  });
  readonly selectedAgent = computed(() => this.store.agents().find((a) => a.id === this.dispatchAgent()));
  readonly missingOptions = computed(() => {
    const t = this.ticket();
    if (!t) return [];
    const cat = this.store.categories().find((c) => c.id === this.rvCategory());
    return Array.from(new Set([...(cat?.required_intake_fields ?? []), ...t.missing_fields, ...this.rvMissing()]));
  });
  readonly reviewChanged = computed(() => {
    const ai = this.ai();
    if (!ai) return false;
    return this.rvCategory() !== ai.proposal.category_id
      || this.rvPriority() !== ai.proposal.priority
      || this.rvTeam() !== ai.proposal.team_id;
  });
  readonly reviewNoteRequired = computed(() => this.reviewChanged() && !this.rvNote().trim());
  readonly canStart = computed(() => {
    const t = this.ticket();
    return !!t && !!t.assigned_agent_id && ['assigned', 'reopened', 'escalated', 'awaiting_review'].includes(t.status);
  });
  readonly canWait = computed(() => {
    const t = this.ticket();
    return !!t && ['assigned', 'in_progress', 'waiting_customer', 'waiting_parts', 'waiting_visit', 'reopened'].includes(t.status);
  });
  readonly canResolve = computed(() => {
    const t = this.ticket();
    return !!t && !!t.assigned_agent_id && !['resolved', 'closed', 'cancelled', 'merged'].includes(t.status);
  });
  readonly canClose = computed(() => this.ticket()?.status === 'resolved');
  readonly isTerminal = computed(() => ['closed', 'cancelled', 'merged'].includes(this.ticket()?.status ?? ''));
  readonly canReopen = computed(() => {
    const s = this.ticket()?.status;
    return s === 'resolved' || s === 'closed';
  });
  readonly risk = computed(() => this.ticket()?.risk);
  readonly riskPending = computed(() => this.risk()?.status === 'queued');
  readonly riskTaken = computed(() => this.risk()?.status === 'taken_over');
  readonly duplicateCandidates = computed(() => {
    const t = this.ticket();
    if (!t) return [];
    return this.store.duplicateOf(t.id);
  });
  readonly mergeOptions = computed(() => {
    const t = this.ticket();
    if (!t) return [];
    const ids = new Set<string>();
    for (const d of this.duplicateCandidates()) {
      ids.add(d.ticket_id === t.id ? d.candidate_ticket_id : d.ticket_id);
    }
    for (const rel of t.related_ticket_ids) ids.add(rel);
    ids.delete(t.id);
    return Array.from(ids).map((id) => this.store.view(id)).filter((x) => !!x);
  });

  navigateGuide(tab: Tab): void {
    this.selectTab(tab);
    if (tab === 'handling' && this.risk()) {
      requestAnimationFrame(() => this.element.nativeElement.querySelector('#risk-actions')?.scrollIntoView({ block: 'center' }));
    }
  }

  selectTab(tab: Tab): void {
    this.tab.set(tab);
    this.router.navigate([], { relativeTo: this.route, queryParams: { tab }, queryParamsHandling: 'merge', replaceUrl: true });
    if (tab === 'review') this.prepareReview();
    if (tab === 'dispatch') this.prepareDispatch();
  }

  private resetForms(): void {
    this.tab.set('overview');
    this.msgBody.set('');
    this.msgScope.set('internal');
    this.handlingNote.set('');
    this.resultText.set('');
    this.basisText.set('');
    this.closeBasis.set('');
    this.reopenEvidence.set('');
    this.escalateReason.set('');
    this.makeP0.set(true);
    this.takeoverNote.set('');
    this.mitigateNote.set('');
    this.mergeTarget.set('');
    this.prepareReview();
    this.prepareDispatch();
  }

  prepareReview(): void {
    const ai = this.ai();
    const t = this.ticket();
    if (!ai || !t) return;
    this.rvCategory.set(ai.review.final_category_id ?? ai.proposal.category_id);
    this.rvPriority.set(ai.proposal.priority);
    this.rvTeam.set(ai.review.final_team_id ?? ai.proposal.team_id);
    this.rvMissing.set(t.missing_fields.slice());
    this.rvNote.set('');
  }

  prepareDispatch(): void {
    const t = this.ticket();
    if (!t) return;
    const ai = this.ai();
    const suggested = ai?.review.final_team_id ?? ai?.proposal.team_id ?? '';
    const team = this.store.teams().some((x) => x.id === suggested)
      ? suggested
      : this.store.candidateTeams(t)[0]?.id ?? '';
    this.dispatchTeam.set(team);
    this.dispatchAgent.set(t.assigned_agent_id ?? '');
    this.dispatchNote.set('');
  }

  onTeamChange(teamId: string): void {
    this.dispatchTeam.set(teamId);
    this.dispatchAgent.set('');
  }

  toggleMissing(field: string, checked: boolean): void {
    this.rvMissing.update((list) => checked ? Array.from(new Set([...list, field])) : list.filter((f) => f !== field));
  }

  saveReview(useProposal: boolean): void {
    const t = this.ticket();
    const ai = this.ai();
    if (!t || !ai) return;
    if (!useProposal && this.reviewNoteRequired()) {
      this.store.toast.set({ msg: '修改了建议，请填写更正原因', error: true });
      return;
    }
    const input = useProposal
      ? {
          categoryId: ai.proposal.category_id, priority: ai.proposal.priority,
          teamId: ai.proposal.team_id, missingFields: ai.proposal.missing_fields,
          note: this.rvNote().trim() || '人工确认预设演示建议，未修改关键结论。', mode: 'accepted' as const,
        }
      : {
          categoryId: this.rvCategory(), priority: this.rvPriority(), teamId: this.rvTeam(),
          missingFields: this.rvMissing(), note: this.rvNote().trim(), mode: 'corrected' as const,
        };
    const res = this.store.reviewSuggestion(t.id, input);
    if (res.ok) {
      this.rvNote.set('');
      this.prepareDispatch();
      this.selectTab('dispatch');
    }
  }

  confirmDispatch(): void {
    const t = this.ticket();
    if (!t) return;
    const res = this.store.dispatch(t.id, this.dispatchTeam(), this.dispatchAgent(), this.dispatchNote());
    if (res.ok) this.dispatchNote.set('');
  }

  sendMessage(): void {
    const t = this.ticket();
    if (!t) return;
    const res = this.store.addMessage(t.id, this.msgBody(), this.msgScope());
    if (res.ok) this.msgBody.set('');
  }

  start(): void {
    const t = this.ticket();
    if (!t) return;
    const res = this.store.startProgress(t.id, this.handlingNote());
    if (res.ok) this.handlingNote.set('');
  }

  wait(target: 'waiting_customer' | 'waiting_parts' | 'waiting_visit'): void {
    const t = this.ticket();
    if (!t) return;
    const res = this.store.setWaiting(t.id, target, this.handlingNote());
    if (res.ok) this.handlingNote.set('');
  }

  resolve(): void {
    const t = this.ticket();
    if (!t) return;
    const res = this.store.resolve(t.id, this.resultText(), this.basisText());
    if (res.ok) { this.resultText.set(''); this.basisText.set(''); }
  }

  close(): void {
    const t = this.ticket();
    if (!t) return;
    const res = this.store.close(t.id, this.closeBasis());
    if (res.ok) this.closeBasis.set('');
  }

  reopen(): void {
    const t = this.ticket();
    if (!t) return;
    const res = this.store.reopen(t.id, this.reopenEvidence());
    if (res.ok) this.reopenEvidence.set('');
  }

  escalate(): void {
    const t = this.ticket();
    if (!t) return;
    const res = this.store.escalate(t.id, this.escalateReason(), this.makeP0());
    if (res.ok) this.escalateReason.set('');
  }

  takeOver(): void {
    const t = this.ticket();
    if (!t) return;
    const res = this.store.takeOverRisk(t.id, this.takeoverNote(), this.nextUpdateHours());
    if (res.ok) this.takeoverNote.set('');
  }

  mitigate(): void {
    const t = this.ticket();
    if (!t) return;
    const res = this.store.mitigateRisk(t.id, this.mitigateNote());
    if (res.ok) this.mitigateNote.set('');
  }

  merge(): void {
    const t = this.ticket();
    if (!t || !this.mergeTarget()) return;
    const res = this.store.mergeTicket(t.id, this.mergeTarget());
    if (res.ok) this.mergeTarget.set('');
  }

  eventLabel(type: string): string { return EVENT_LABEL[type] ?? type; }
  eventTone(type: string): string {
    if (type.startsWith('risk')) return 'risk';
    return type === 'ai_review_confirmed' || type === 'assigned' || type === 'reassigned' || type.startsWith('customer') ? 'human' : '';
  }
  statusLabel(s: Status | null): string { return s ? this.i18n.status(s) : '—'; }
  missingLabel(field: string): string {
    return this.i18n.t(`field.${field}`);
  }
  categoryName(id: string | null | undefined): string { return id ? this.i18n.categoryName(id) : this.i18n.priority('none'); }
  teamName(id: string | null | undefined): string { return this.store.teamName(id); }
  agentName(id: string | null | undefined): string { return this.store.agentName(id); }
  confidenceTone(confidence: number): string { return confidence < 0.8 ? 'orange' : 'green'; }
  confidenceLabel(confidence: number): string {
    return confidence < 0.8 ? '需重点核对（演示阈值 0.8）' : '建议人工确认（分数不是准确率保证）';
  }
  trackMsg(_: number, m: Message): string { return m.id; }
}
