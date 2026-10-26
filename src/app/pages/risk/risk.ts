import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '../../core/store';
import { I18n } from '../../core/i18n';
import {
  EmptyComponent,
  PriorityBadgeComponent,
  RiskBadgeComponent,
  StatusBadgeComponent,
} from '../../shared/badges';
import { fmtAgo, fmtDateTime, overdueMinutes, LANG_LABEL, STATUS_LABEL } from '../../core/format';

type RiskView = 'risk' | 'pending' | 'first' | 'resolution';

@Component({
  selector: 'app-risk',
  imports: [
    RouterLink,
    StatusBadgeComponent,
    PriorityBadgeComponent,
    RiskBadgeComponent,
    EmptyComponent,
  ],
  templateUrl: './risk.html',
  styleUrl: './risk.css',
})
export class RiskPage {
  readonly store = inject(Store);
  readonly i18n = inject(I18n);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly view = signal<RiskView>('risk');
  readonly selectedId = signal<string>('');
  readonly takeoverNote = signal('');
  readonly nextUpdateHours = signal(4);
  readonly mitigateNote = signal('');
  readonly showEscalate = signal(false);
  readonly escalateId = signal('');
  readonly escalateReason = signal('');
  readonly escalateP0 = signal(true);

  readonly STATUS_LABEL = STATUS_LABEL;
  readonly LANG_LABEL = LANG_LABEL;
  readonly fmtDateTime = fmtDateTime;
  readonly fmtAgo = fmtAgo;
  readonly overdueMinutes = overdueMinutes;

  readonly risks = this.store.currentRisks;
  readonly pending = this.store.pendingRisks;
  readonly firstOverdue = this.store.firstResponseOverdueViews;
  readonly resolutionOverdue = this.store.resolutionOverdueViews;
  readonly selected = computed(() => {
    const id = this.selectedId();
    return this.risks().find((r) => r.ticket.id === id) ?? this.pending()[0] ?? this.risks()[0];
  });

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((pm) => {
      const v = pm.get('view') as RiskView | null;
      if (v && ['risk', 'pending', 'first', 'resolution'].includes(v)) this.view.set(v);
    });
  }

  setView(v: RiskView): void {
    this.view.set(v);
    this.selectedId.set('');
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { view: v },
      replaceUrl: true,
    });
  }

  select(id: string): void {
    this.selectedId.set(id);
    this.takeoverNote.set('');
    this.mitigateNote.set('');
  }

  takeOver(): void {
    const r = this.selected();
    if (!r) return;
    const res = this.store.takeOverRisk(r.ticket.id, this.takeoverNote(), this.nextUpdateHours());
    if (res.ok) this.takeoverNote.set('');
  }

  mitigate(): void {
    const r = this.selected();
    if (!r) return;
    const res = this.store.mitigateRisk(r.ticket.id, this.mitigateNote());
    if (res.ok) this.mitigateNote.set('');
  }

  escalate(): void {
    const id = this.escalateId().trim().toUpperCase();
    if (!id) {
      this.store.toast.set({ msg: '请输入工单编号，例如 WO-0251', error: true });
      return;
    }
    if (!this.store.view(id)) {
      this.store.toast.set({ msg: `未找到工单 ${id}`, error: true });
      return;
    }
    const res = this.store.escalate(id, this.escalateReason(), this.escalateP0());
    if (res.ok) {
      this.escalateReason.set('');
      this.escalateId.set('');
      this.showEscalate.set(false);
      this.view.set('pending');
    }
  }

  evidence(ticketId: string): string {
    const t = this.store.view(ticketId);
    const first = this.store.messagesOf(ticketId)[0];
    return (
      first?.body_zh ||
      first?.body ||
      t?.reported.symptom_description?.split('\n')[0] ||
      t?.summary_zh ||
      ''
    );
  }

  open(id: string): void {
    this.router.navigate(['/tickets', id]);
  }
}
