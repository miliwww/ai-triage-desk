import { Injectable, signal } from '@angular/core';
import { ParamMap } from '@angular/router';

type SortKey = 'focus' | 'newest' | 'oldest' | 'priority' | 'due';

/** 工单中心的筛选状态；在 SPA 内返回列表时保留，刷新后回到默认。 */
@Injectable({ providedIn: 'root' })
export class TicketsFilterState {
  readonly q = signal('');
  readonly status = signal('');
  readonly priority = signal('');
  readonly category = signal('');
  readonly country = signal('');
  readonly language = signal('');
  readonly team = signal('');
  readonly risk = signal('');
  readonly overdue = signal('');
  readonly scope = signal('');
  readonly dispatch = signal('');
  readonly overview = signal('');
  readonly sort = signal<SortKey>('focus');
  readonly page = signal(1);
  readonly pageSize = signal(20);

  applyFromQuery(pm: ParamMap): void {
    if (pm.get('reset') === '1') {
      this.clear();
      return;
    }
    this.q.set(pm.get('q') ?? '');
    this.status.set(pm.get('status') ?? '');
    this.priority.set(pm.get('priority') ?? '');
    this.category.set(pm.get('category') ?? '');
    this.country.set(pm.get('country') ?? '');
    this.language.set(pm.get('language') ?? '');
    this.team.set(pm.get('team') ?? '');
    this.risk.set(pm.get('risk') ?? '');
    this.overdue.set(pm.get('overdue') ?? '');
    this.scope.set(pm.get('scope') ?? '');
    this.dispatch.set(pm.get('dispatch') ?? '');
    this.overview.set(pm.get('overview') ?? '');
    this.page.set(1);
  }

  clear(): void {
    this.q.set('');
    this.status.set('');
    this.priority.set('');
    this.category.set('');
    this.country.set('');
    this.language.set('');
    this.team.set('');
    this.risk.set('');
    this.overdue.set('');
    this.scope.set('');
    this.dispatch.set('');
    this.overview.set('');
    this.page.set(1);
  }
}
