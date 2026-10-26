import { TestBed } from '@angular/core/testing';
import { DataService } from './data.service';
import { Store } from './store';
import { demoData } from './test-data';

describe('Service workflow with the shipped dataset', () => {
  let store: Store;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: DataService, useValue: { load: vi.fn().mockResolvedValue(demoData()) } }],
    });
    store = TestBed.inject(Store);
    // Reading derived reference data before loading must not cache empty arrays forever.
    expect(store.teams()).toEqual([]);
    await store.init();
  });

  afterEach(() => vi.clearAllTimers());

  function review(id = 'WO-0047') {
    const suggestion = store.presetSuggestion(store.view(id)!);
    return store.reviewSuggestion(id, {
      categoryId: suggestion.proposal.category_id,
      priority: suggestion.proposal.priority,
      teamId: suggestion.proposal.team_id,
      missingFields: suggestion.proposal.missing_fields,
      note: '已核对客户原话与建议证据。',
      mode: 'accepted',
    });
  }

  function assign() {
    expect(review().ok).toBe(true);
    return store.dispatch('WO-0047', 'TEAM-ES-TECHNICAL', 'USR-013', '由西班牙技术支持跟进。');
  }

  it('matches the published baseline and resolves reference relationships', () => {
    expect(store.ready()).toBe(true);
    expect(store.loading()).toBe(false);
    expect(store.stats()).toMatchObject({ total: 492, unresolved: 397, overdueFirstResponse: 87, riskOpen: 30 });
    expect(store.teams()).toHaveLength(27);
    expect(store.view('WO-0047')?.customer?.id).toBeTruthy();
    expect(store.view('WO-0047')?.product?.id).toBeTruthy();
  });

  it('requires review before the first dispatch', () => {
    expect(store.dispatch('WO-0047', 'TEAM-ES-TECHNICAL', 'USR-013', '').ok).toBe(false);
    expect(store.view('WO-0047')?.assigned_agent_id).toBeNull();
  });

  it('requires a reason for a correction and preserves the original proposal', () => {
    const before = structuredClone(store.suggestionOf('WO-0047')!);
    const input = { categoryId: before.proposal.category_id, priority: 'P2' as const,
      teamId: before.proposal.team_id, missingFields: [], note: '', mode: 'corrected' as const };
    expect(store.reviewSuggestion('WO-0047', input).ok).toBe(false);
    expect(store.suggestionOf('WO-0047')).toEqual(before);
    expect(store.reviewSuggestion('WO-0047', { ...input, note: '客户已恢复供电，调整跟进优先级。' }).ok).toBe(true);
    expect(store.suggestionOf('WO-0047')?.proposal).toEqual(before.proposal);
    expect(store.suggestionOf('WO-0047')?.review.status).toBe('corrected');
    expect(store.view('WO-0047')?.priority).toBe('P2');
  });

  it('rejects unavailable agents and assignments across team membership', () => {
    review();
    expect(store.dispatch('WO-0047', 'TEAM-ES-TECHNICAL', 'USR-014', '').ok).toBe(false);
    expect(store.dispatch('WO-0047', 'TEAM-ES-CLOUD', 'USR-013', '').ok).toBe(false);
    expect(store.view('WO-0047')?.assigned_agent_id).toBeNull();
  });

  it('completes review → dispatch → handling → resolution → confirmed closure', () => {
    const original = structuredClone(store.suggestionOf('WO-0047')?.proposal);
    expect(assign().ok).toBe(true);
    expect(store.startProgress('WO-0047', '核对客户提供的运行记录。').ok).toBe(true);
    expect(store.resolve('WO-0047', '演示处理结果：客户确认备用照明恢复。', '客户回访记录。').ok).toBe(true);
    expect(store.close('WO-0047', '').ok).toBe(false);
    expect(store.close('WO-0047', '客户回访确认，无新增问题。').ok).toBe(true);
    expect(store.view('WO-0047')?.status).toBe('closed');
    expect(store.suggestionOf('WO-0047')?.proposal).toEqual(original);
    expect(store.outcomeOf('WO-0047')?.closeBasisZh).toContain('客户回访');
    expect(store.eventsOf('WO-0047').map((event) => event.type)).toEqual(expect.arrayContaining([
      'ai_review_confirmed', 'assigned', 'progress_started', 'resolved', 'closed',
    ]));
  });

  it('keeps risk queued until takeover and mitigation are explicitly recorded', () => {
    expect(store.mitigateRisk('WO-0150', '尚未接管。').ok).toBe(false);
    expect(store.takeOverRisk('WO-0150', '', 4).ok).toBe(false);
    expect(store.takeOverRisk('WO-0150', '已安排人工跟进。', NaN).ok).toBe(false);
    expect(store.riskOf('WO-0150')?.status).toBe('queued');
    expect(store.takeOverRisk('WO-0150', '已联系当地应急负责人，持续跟进。', 4).ok).toBe(true);
    expect(store.stats().riskPending).toBe(29);
    expect(store.stats().riskOpen).toBe(30);
    expect(store.view('WO-0150')?.nextActionZh).not.toContain('确认接管');
    expect(store.resolve('WO-0150', '直接结案。', '').ok).toBe(false);
    expect(store.takeOverRisk('WO-0150', '重复接管。', 4).ok).toBe(false);
    expect(store.mitigateRisk('WO-0150', '已记录现场负责人提供的缓解依据，继续服务跟进。').ok).toBe(true);
    expect(store.stats().riskOpen).toBe(29);
    expect(store.view('WO-0150')?.status).toBe('escalated');
    expect(store.view('WO-0150')?.nextActionZh).toContain('继续服务处理');
  });

  it('does not count internal notes as a first customer response', () => {
    const ticket = store.firstResponseOverdueViews()[0];
    expect(store.addMessage(ticket.id, '内部交接记录。', 'internal').ok).toBe(true);
    expect(store.view(ticket.id)?.firstResponseOverdue).toBe(true);
    expect(store.addMessage(ticket.id, '已收到您的反馈，将由专员跟进。', 'customer').ok).toBe(true);
    expect(store.view(ticket.id)?.firstResponseOverdue).toBe(false);
    expect(store.view(ticket.id)?.sla.first_response_breached).toBe(true);
  });

  it('preserves the old SLA cycle when a closed request is reopened', () => {
    const before = structuredClone(store.view('WO-0006')!);
    expect(store.reopen('WO-0006', '').ok).toBe(false);
    expect(store.reopen('WO-0006', '客户补充同一问题再次发生的时间记录。').ok).toBe(true);
    const after = store.view('WO-0006')!;
    expect(after.status).toBe('reopened');
    expect(after.sla.cycle).toBe(before.sla.cycle + 1);
    expect(after.sla.previous_cycle?.resolved_at).toBe(before.sla.resolved_at);
    expect(after.sla.first_response_at).toBeNull();
  });

  it('restores the original seed data after actions without mutating the source', () => {
    assign();
    store.takeOverRisk('WO-0150', '人工接管。', 4);
    store.resetDemo();
    expect(store.view('WO-0047')?.status).toBe('awaiting_review');
    expect(store.view('WO-0047')?.assigned_agent_id).toBeNull();
    expect(store.suggestionOf('WO-0047')?.review.status).toBe('pending');
    expect(store.riskOf('WO-0150')?.status).toBe('queued');
    expect(store.stats().riskOpen).toBe(30);
  });
});
