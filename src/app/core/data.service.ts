import { Injectable } from '@angular/core';
import { RawData } from './models';

const PATHS = {
  tickets: 'seed/tickets.json',
  suggestions: 'seed/ai_suggestions.json',
  messages: 'seed/messages.json',
  events: 'seed/events.json',
  assignments: 'seed/assignments.json',
  teams: 'reference/teams.json',
  agents: 'reference/agents.json',
  customers: 'reference/customers.json',
  sites: 'reference/sites.json',
  devices: 'reference/devices.json',
  products: 'reference/products.json',
  categories: 'reference/categories.json',
  knowledge: 'reference/knowledge_base.json',
  regions: 'reference/regions.json',
  partRequests: 'seed/part_requests.json',
  visits: 'seed/visits.json',
  duplicates: 'seed/duplicate_candidates.json',
  csat: 'seed/csat.json',
  workflow: 'reference/workflow.json',
  dashboardExpected: 'demo/dashboard_expected.json',
} as const;

@Injectable({ providedIn: 'root' })
export class DataService {
  private cached?: RawData;
  private loading?: Promise<RawData>;

  load(): Promise<RawData> {
    if (this.cached) return Promise.resolve(this.cached);
    if (this.loading) return this.loading;
    this.loading = this.fetchAll()
      .then((raw) => {
        this.cached = raw;
        return raw;
      })
      .catch((error: unknown) => {
        // A failed attempt must not become a permanently cached rejection.
        this.loading = undefined;
        throw error;
      });
    return this.loading;
  }

  private async fetchAll(): Promise<RawData> {
    const keys = Object.keys(PATHS) as (keyof typeof PATHS)[];
    const results = await Promise.all(
      keys.map(async (key) => {
        const res = await fetch(`data/${PATHS[key]}`);
        if (!res.ok) throw new Error(`读取 ${PATHS[key]} 失败（HTTP ${res.status}）`);
        return [key, await res.json()] as const;
      }),
    );
    const map = Object.fromEntries(results) as Record<keyof typeof PATHS, unknown>;
    return {
      tickets: map.tickets as RawData['tickets'],
      suggestions: map.suggestions as RawData['suggestions'],
      messages: map.messages as RawData['messages'],
      events: map.events as RawData['events'],
      assignments: map.assignments as RawData['assignments'],
      teams: map.teams as RawData['teams'],
      agents: map.agents as RawData['agents'],
      customers: map.customers as RawData['customers'],
      sites: map.sites as RawData['sites'],
      devices: map.devices as RawData['devices'],
      products: map.products as RawData['products'],
      categories: map.categories as RawData['categories'],
      knowledge: map.knowledge as RawData['knowledge'],
      regions: map.regions as RawData['regions'],
      partRequests: map.partRequests as RawData['partRequests'],
      visits: map.visits as RawData['visits'],
      duplicates: map.duplicates as RawData['duplicates'],
      csat: map.csat as RawData['csat'],
      workflow: map.workflow as RawData['workflow'],
      dashboardExpected: map.dashboardExpected as RawData['dashboardExpected'],
    };
  }
}
