import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Store } from '../../core/store';
import { I18n } from '../../core/i18n';
import {
  EmptyComponent,
  PriorityBadgeComponent,
  RiskBadgeComponent,
  StatusBadgeComponent,
} from '../../shared/badges';
import { duration, fmtAgo, fmtDateTime, LANG_LABEL, pct, STATUS_LABEL } from '../../core/format';

@Component({
  selector: 'app-dashboard',
  imports: [
    RouterLink,
    StatusBadgeComponent,
    PriorityBadgeComponent,
    RiskBadgeComponent,
    EmptyComponent,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardPage {
  readonly store = inject(Store);
  readonly i18n = inject(I18n);
  private readonly router = inject(Router);
  readonly stats = this.store.stats;
  readonly risks = computed(() => this.store.currentRisks().slice(0, 6));
  readonly todo = computed(() => this.store.myTodo().slice(0, 8));
  readonly oldest = computed(() =>
    this.store
      .views()
      .filter((v) => v.isUnresolved)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .slice(0, 6),
  );
  readonly maxCountry = computed(() => Math.max(1, ...this.stats().byCountry.map((c) => c.count)));
  readonly maxCategory = computed(() =>
    Math.max(
      1,
      ...this.stats()
        .byCategory.slice(0, 9)
        .map((c) => c.count),
    ),
  );
  readonly maxStatus = computed(() => Math.max(1, ...this.stats().byStatus.map((c) => c.count)));
  readonly priorityTotal = computed(() => this.stats().byPriority.reduce((s, p) => s + p.count, 0));
  readonly seedDrift = computed(() => {
    const e = this.store.dashboardExpected();
    return e ? this.stats().total - e.total_tickets : 0;
  });

  readonly STATUS_LABEL = STATUS_LABEL;
  readonly LANG_LABEL = LANG_LABEL;
  readonly fmtAgo = fmtAgo;
  readonly fmtDateTime = fmtDateTime;
  readonly pct = pct;
  readonly duration = duration;

  go(query: Record<string, string>): void {
    this.router.navigate(['/tickets'], { queryParams: query });
  }

  open(id: string): void {
    this.router.navigate(['/tickets', id]);
  }

  priorityTone(p: string): string {
    return p === 'P0'
      ? 'red'
      : p === 'P1'
        ? 'orange'
        : p === 'P2'
          ? 'blue'
          : p === 'P3'
            ? 'teal'
            : 'grey';
  }

  statusTone(status: string): string {
    const map: Record<string, string> = {
      new: 'blue',
      awaiting_review: 'orange',
      waiting_customer: 'grey',
      assigned: 'blue',
      in_progress: 'teal',
      waiting_parts: 'orange',
      waiting_visit: 'orange',
      escalated: 'red',
      resolved: 'green',
      closed: 'grey',
      cancelled: 'grey',
      merged: 'grey',
      reopened: 'orange',
    };
    return map[status] ?? 'grey';
  }

  barWidth(count: number, max: number): number {
    return Math.max(2, Math.round((count / max) * 100));
  }

  stackedWidth(count: number): number {
    return (count / Math.max(1, this.priorityTotal())) * 100;
  }

  priorityColor(p: string): string {
    return p === 'P0'
      ? 'var(--red)'
      : p === 'P1'
        ? 'var(--orange)'
        : p === 'P2'
          ? 'var(--blue)'
          : p === 'P3'
            ? 'var(--teal)'
            : 'var(--line-strong)';
  }
}
