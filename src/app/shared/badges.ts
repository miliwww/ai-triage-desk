import { Component, Input, inject } from '@angular/core';
import { Priority, Status } from '../core/models';
import { STATUS_TONE } from '../core/format';
import { I18n } from '../core/i18n';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `<span class="badge" [class]="tone"><i class="dot"></i>{{ label }}</span>`,
})
export class StatusBadgeComponent {
  @Input({ required: true }) status!: Status;
  private readonly i18n = inject(I18n);
  get label(): string { return this.i18n.status(this.status); }
  get tone(): string { return STATUS_TONE[this.status] ?? 'grey'; }
}

@Component({
  selector: 'app-priority-badge',
  standalone: true,
  template: `<span class="prio" [class]="priority ?? 'none'" [title]="title">{{ priority ?? '待判定' }}</span>`,
})
export class PriorityBadgeComponent {
  @Input() priority: Priority | null = null;
  private readonly i18n = inject(I18n);
  get title(): string { return this.i18n.priority(this.priority); }
}

@Component({
  selector: 'app-risk-badge',
  standalone: true,
  template: `<span class="badge" [class]="tone"><i class="dot"></i>{{ label }}</span>`,
})
export class RiskBadgeComponent {
  @Input({ required: true }) status!: 'queued' | 'taken_over' | 'mitigated';
  private readonly i18n = inject(I18n);
  get label(): string { return this.i18n.risk(this.status); }
  get tone(): string { return this.status === 'queued' ? 'red' : this.status === 'taken_over' ? 'orange' : 'green'; }
}

@Component({
  selector: 'app-load-bar',
  standalone: true,
  template: `<span class="load" [class.high]="ratio > 0.8" [class.full]="ratio >= 1" [title]="current + ' / ' + capacity">
    <span [style.width.%]="ratio * 100"></span></span>`,
})
export class LoadBarComponent {
  @Input({ required: true }) current!: number;
  @Input({ required: true }) capacity!: number;
  get ratio(): number { return this.capacity > 0 ? Math.min(1, this.current / this.capacity) : 1; }
}

@Component({
  selector: 'app-empty',
  standalone: true,
  template: `<div class="empty"><b>{{ title }}</b><span>{{ hint }}</span></div>`,
})
export class EmptyComponent {
  @Input({ required: true }) title!: string;
  @Input() hint = '';
}
