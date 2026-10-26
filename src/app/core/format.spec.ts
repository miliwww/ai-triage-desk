import { demoData } from './test-data';
import { DEMO_NOW_MS, slaFirstResponseOverdue, slaResolutionOverdue } from './format';

describe('SLA boundary policy', () => {
  const sla = {
    ...demoData().tickets[0].sla,
    first_response_at: null,
    resolved_at: null,
    excluded: false,
    first_response_due_at: new Date(DEMO_NOW_MS).toISOString(),
    resolution_due_at: new Date(DEMO_NOW_MS).toISOString(),
  };

  it('is not overdue exactly at the deadline and is overdue one millisecond later', () => {
    expect(slaFirstResponseOverdue(sla, DEMO_NOW_MS)).toBe(false);
    expect(slaResolutionOverdue(sla, DEMO_NOW_MS)).toBe(false);
    expect(slaFirstResponseOverdue(sla, DEMO_NOW_MS + 1)).toBe(true);
    expect(slaResolutionOverdue(sla, DEMO_NOW_MS + 1)).toBe(true);
  });

  it('excludes terminal-cycle clocks and recorded responses', () => {
    expect(slaFirstResponseOverdue({ ...sla, excluded: true }, DEMO_NOW_MS + 1)).toBe(false);
    expect(slaResolutionOverdue({ ...sla, excluded: true }, DEMO_NOW_MS + 1)).toBe(false);
    expect(
      slaFirstResponseOverdue(
        { ...sla, first_response_at: sla.first_response_due_at },
        DEMO_NOW_MS + 1,
      ),
    ).toBe(false);
    expect(
      slaResolutionOverdue({ ...sla, resolved_at: sla.resolution_due_at }, DEMO_NOW_MS + 1),
    ).toBe(false);
  });
});
