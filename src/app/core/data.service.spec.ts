import { TestBed } from '@angular/core/testing';
import { DataService } from './data.service';

describe('Data loading and recovery', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('shares in-flight requests and reuses a successful dataset', async () => {
    const service = TestBed.inject(DataService);
    const first = service.load();
    expect(service.load()).toBe(first);
    const result = await first;
    expect(await service.load()).toBe(result);
    expect(fetchMock).toHaveBeenCalledTimes(20);
  });

  it('allows a fresh attempt after a network error', async () => {
    const service = TestBed.inject(DataService);
    fetchMock.mockRejectedValue(new Error('Network unavailable'));
    await expect(service.load()).rejects.toThrow('Network unavailable');
    fetchMock.mockClear().mockResolvedValue({ ok: true, json: async () => [] });
    await expect(service.load()).resolves.toHaveProperty('tickets');
    expect(fetchMock).toHaveBeenCalledTimes(20);
  });

  it('reports the failing resource instead of silently returning an empty dashboard', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404 });
    await expect(TestBed.inject(DataService).load()).rejects.toThrow('tickets.json');
  });
});
