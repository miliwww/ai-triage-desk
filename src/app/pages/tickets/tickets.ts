import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '../../core/store';
import { I18n } from '../../core/i18n';
import { EmptyComponent, PriorityBadgeComponent, RiskBadgeComponent, StatusBadgeComponent } from '../../shared/badges';
import { TicketView } from '../../core/models';
import { CHANNEL_LABEL, fmtAgo, fmtDateTime, LANG_LABEL, overdueMinutes, STATUS_LABEL } from '../../core/format';
import { TicketsFilterState } from './tickets-filter';

@Component({
  selector: 'app-tickets',
  imports: [RouterLink, StatusBadgeComponent, PriorityBadgeComponent, RiskBadgeComponent, EmptyComponent],
  templateUrl: './tickets.html',
  styleUrl: './tickets.css',
})
export class TicketsPage {
  readonly store = inject(Store);
  readonly i18n = inject(I18n);
  private readonly fs = inject(TicketsFilterState);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly q = this.fs.q;
  readonly status = this.fs.status;
  readonly priority = this.fs.priority;
  readonly category = this.fs.category;
  readonly country = this.fs.country;
  readonly language = this.fs.language;
  readonly team = this.fs.team;
  readonly risk = this.fs.risk;
  readonly overdue = this.fs.overdue;
  readonly scope = this.fs.scope;
  readonly dispatch = this.fs.dispatch;
  readonly overview = this.fs.overview;
  readonly sort = this.fs.sort;
  readonly page = this.fs.page;
  readonly pageSize = this.fs.pageSize;
  readonly expanded = signal(false);

  readonly STATUS_LABEL = STATUS_LABEL;
  readonly LANG_LABEL = LANG_LABEL;
  readonly CHANNEL_LABEL = CHANNEL_LABEL;
  readonly fmtAgo = fmtAgo;
  readonly fmtDateTime = fmtDateTime;
  readonly overdueMinutes = overdueMinutes;
  readonly statuses = this.store.workflowStatuses;
  readonly languageOptions = computed(() => Object.keys(LANG_LABEL).map((code) => ({ code, label: this.i18n.languageName(code) })));

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((pm) => {
      if (pm.keys.length) this.fs.applyFromQuery(pm);
    });
  }

  readonly filtered = computed<TicketView[]>(() => {
    const q = this.q().trim().toLowerCase();
    const status = this.status();
    const priority = this.priority();
    const category = this.category();
    const country = this.country();
    const language = this.language();
    const team = this.team();
    const risk = this.risk();
    const overdue = this.overdue();
    const scope = this.scope();
    const dispatch = this.dispatch();
    const overview = this.overview();
    return this.store.views().filter((t) => {
      if (q) {
        const hay = [
          t.id, t.external_reference, t.reported.serial_number ?? '', t.title, t.summary_zh,
          t.customer?.name ?? '', t.site?.name ?? '', t.device?.serial_number ?? '',
        ].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (status && t.status !== status) return false;
      if (priority === 'none' && t.priority) return false;
      if (priority && priority !== 'none' && t.priority !== priority) return false;
      if (category === 'unconfirmed' && t.category_id) return false;
      if (category && category !== 'unconfirmed' && t.category_id !== category) return false;
      if (country && t.country_code !== country) return false;
      if (language && t.language !== language) return false;
      if (team === 'none' && t.assigned_team_id) return false;
      if (team && team !== 'none' && t.assigned_team_id !== team) return false;
      if (risk === 'open' && !(t.risk && t.risk.status !== 'mitigated' && t.isUnresolved)) return false;
      if (risk === 'pending' && !t.riskPending) return false;
      if (overdue === 'first' && !t.firstResponseOverdue) return false;
      if (overdue === 'resolution' && !t.resolutionOverdue) return false;
      if (scope === 'unresolved' && !t.isUnresolved) return false;
      if (dispatch === 'pending' && !(t.ai && t.ai.review.status !== 'pending' && !t.assigned_agent_id && ['awaiting_review', 'reopened'].includes(t.status))) return false;
      if (overview === 'unassigned' && !(t.isUnresolved && !t.assigned_agent_id)) return false;
      return true;
    });
  });

  readonly sorted = computed<TicketView[]>(() => {
    const list = this.filtered().slice();
    const rank: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };
    const focus = (a: TicketView, b: TicketView) =>
      Number(b.riskPending) - Number(a.riskPending) ||
      Number(b.firstResponseOverdue) - Number(a.firstResponseOverdue) ||
      (rank[a.priority ?? 'P9'] ?? 4) - (rank[b.priority ?? 'P9'] ?? 4) ||
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    switch (this.sort()) {
      case 'newest': return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'oldest': return list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case 'priority': return list.sort((a, b) => (rank[a.priority ?? 'P9'] ?? 4) - (rank[b.priority ?? 'P9'] ?? 4) || focus(a, b));
      case 'due': return list.sort((a, b) => new Date(a.sla.first_response_due_at).getTime() - new Date(b.sla.first_response_due_at).getTime());
      default: return list.sort(focus);
    }
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.sorted().length / this.pageSize())));
  readonly paged = computed(() => {
    const p = Math.min(this.page(), this.totalPages());
    return this.sorted().slice((p - 1) * this.pageSize(), p * this.pageSize());
  });
  readonly pageNumbers = computed(() => {
    const total = this.totalPages();
    const cur = Math.min(this.page(), total);
    const start = Math.max(1, Math.min(cur - 2, total - 4));
    return Array.from({ length: Math.min(5, total) }, (_, i) => start + i);
  });
  readonly activeChips = computed(() => {
    const chips: { key: string; label: string; clear: () => void }[] = [];
    if (this.q()) chips.push({ key: 'q', label: `关键词：${this.q()}`, clear: () => this.q.set('') });
    if (this.status()) chips.push({ key: 'status', label: `${this.i18n.t('common.status')}: ${this.i18n.status(this.status())}`, clear: () => this.status.set('') });
    if (this.priority()) chips.push({ key: 'priority', label: `${this.i18n.t('common.priority')}: ${this.priority() === 'none' ? this.i18n.priority('none') : this.priority()}`, clear: () => this.priority.set('') });
    if (this.category()) chips.push({ key: 'category', label: `${this.i18n.t('common.category')}: ${this.category() === 'unconfirmed' ? this.i18n.priority('none') : this.i18n.categoryName(this.category())}`, clear: () => this.category.set('') });
    if (this.country()) chips.push({ key: 'country', label: `${this.i18n.t('common.country')}: ${this.i18n.countryName(this.country())}`, clear: () => this.country.set('') });
    if (this.language()) chips.push({ key: 'language', label: `${this.i18n.t('common.language')}: ${this.i18n.languageName(this.language())}`, clear: () => this.language.set('') });
    if (this.team()) chips.push({ key: 'team', label: `团队：${this.team() === 'none' ? '未分配' : this.store.teamName(this.team())}`, clear: () => this.team.set('') });
    if (this.risk()) chips.push({ key: 'risk', label: `${this.i18n.t('col.takeover')}: ${this.risk() === 'pending' ? this.i18n.t('risk.queued') : this.i18n.t('dash.riskOpen')}`, clear: () => this.risk.set('') });
    if (this.overdue()) chips.push({ key: 'overdue', label: this.overdue() === 'first' ? this.i18n.t('nav.firstOverdue') : this.i18n.t('riskPage.viewResolution'), clear: () => this.overdue.set('') });
    if (this.scope()) chips.push({ key: 'scope', label: '仅未解决', clear: () => this.scope.set('') });
    if (this.dispatch()) chips.push({ key: 'dispatch', label: this.i18n.t('nav.dispatch'), clear: () => this.dispatch.set('') });
    if (this.overview() === 'unassigned') chips.push({ key: 'overview', label: this.i18n.t('dash.unassigned'), clear: () => this.overview.set('') });
    return chips;
  });

  private syncUrl(): void {
    const params: Record<string, string> = {};
    if (this.q().trim()) params['q'] = this.q().trim();
    if (this.status()) params['status'] = this.status();
    if (this.priority()) params['priority'] = this.priority();
    if (this.category()) params['category'] = this.category();
    if (this.country()) params['country'] = this.country();
    if (this.language()) params['language'] = this.language();
    if (this.team()) params['team'] = this.team();
    if (this.risk()) params['risk'] = this.risk();
    if (this.overdue()) params['overdue'] = this.overdue();
    if (this.scope()) params['scope'] = this.scope();
    if (this.dispatch()) params['dispatch'] = this.dispatch();
    if (this.overview()) params['overview'] = this.overview();
    this.router.navigate(['/tickets'], { queryParams: params, replaceUrl: true });
  }

  onSearch(value: string): void { this.q.set(value); this.page.set(1); this.syncUrl(); }
  set(sig: import('@angular/core').WritableSignal<string>, value: string): void { sig.set(value); this.page.set(1); this.syncUrl(); }
  sortBy(value: string): void { this.sort.set(value as 'focus' | 'newest' | 'oldest' | 'priority' | 'due'); this.page.set(1); }
  size(value: string): void { this.pageSize.set(Number(value)); this.page.set(1); }
  pageTo(n: number): void { this.page.set(Math.min(this.totalPages(), Math.max(1, n))); }
  clearAll(): void { this.fs.clear(); this.router.navigate(['/tickets'], { replaceUrl: true }); }
  open(id: string): void { this.router.navigate(['/tickets', id]); }
  missingLabel(field: string): string {
    return this.i18n.t(`field.${field}`);
  }
  trackId(_: number, item: TicketView): string { return item.id; }
}
