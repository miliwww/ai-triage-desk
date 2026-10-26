import { Component, computed, inject, input, output } from '@angular/core';
import { TicketView } from '../core/models';
import { I18n } from '../core/i18n';

type GuideTab = 'review' | 'dispatch' | 'handling' | 'timeline';

@Component({
  selector: 'app-workflow-guide',
  template: `
    <section class="workflow-guide" [class.risk-guide]="isRisk()" aria-label="Workflow guide">
      <div class="guide-caption">
        <b>{{ i18n.t(isRisk() ? 'guide.riskTitle' : 'guide.title') }}</b>
        <span>{{ i18n.t(hint()) }}</span>
      </div>
      <ol class="guide-steps">
        @for (step of steps(); track step.key; let index = $index) {
          <li [class.completed]="index < stage()" [class.current]="index === stage()">
            <button type="button" (click)="navigate.emit(step.tab)" [attr.aria-current]="index === stage() ? 'step' : null">
              <span class="step-index" aria-hidden="true">{{ index < stage() ? '✓' : index + 1 }}</span>
              {{ i18n.t(step.key) }}
            </button>
          </li>
        }
      </ol>
    </section>
  `,
})
export class WorkflowGuideComponent {
  readonly ticket = input.required<TicketView>();
  readonly navigate = output<GuideTab>();
  readonly i18n = inject(I18n);
  readonly isRisk = computed(() => !!this.ticket().risk);
  readonly steps = computed<{ key: string; tab: GuideTab }[]>(() => this.isRisk() ? [
    { key: 'guide.takeover', tab: 'handling' },
    { key: 'guide.mitigate', tab: 'handling' },
    { key: 'guide.timeline', tab: 'timeline' },
  ] : [
    { key: 'guide.review', tab: 'review' },
    { key: 'guide.dispatch', tab: 'dispatch' },
    { key: 'guide.handle', tab: 'handling' },
    { key: 'guide.close', tab: 'handling' },
  ]);
  readonly stage = computed(() => {
    const t = this.ticket();
    if (t.risk) return t.risk.status === 'queued' ? 0 : t.risk.status === 'taken_over' ? 1 : 2;
    if (t.status === 'closed') return 4;
    if (t.status === 'resolved') return 3;
    if (t.assigned_agent_id) return 2;
    if (t.ai && t.ai.review.status !== 'pending') return 1;
    return 0;
  });
  readonly hint = computed(() => this.isRisk()
    ? ['guide.nextTakeover', 'guide.nextMitigate', 'guide.riskComplete'][this.stage()]
    : ['guide.nextReview', 'guide.nextDispatch', 'guide.nextHandle', 'guide.nextClose', 'guide.complete'][this.stage()]);
}
