import { RawData } from './models';
import tickets from '../../../data/seed/tickets.json';
import suggestions from '../../../data/seed/ai_suggestions.json';
import messages from '../../../data/seed/messages.json';
import events from '../../../data/seed/events.json';
import assignments from '../../../data/seed/assignments.json';
import teams from '../../../data/reference/teams.json';
import agents from '../../../data/reference/agents.json';
import customers from '../../../data/reference/customers.json';
import sites from '../../../data/reference/sites.json';
import devices from '../../../data/reference/devices.json';
import products from '../../../data/reference/products.json';
import categories from '../../../data/reference/categories.json';
import knowledge from '../../../data/reference/knowledge_base.json';
import regions from '../../../data/reference/regions.json';
import partRequests from '../../../data/seed/part_requests.json';
import visits from '../../../data/seed/visits.json';
import duplicates from '../../../data/seed/duplicate_candidates.json';
import csat from '../../../data/seed/csat.json';
import workflow from '../../../data/reference/workflow.json';
import dashboardExpected from '../../../data/demo/dashboard_expected.json';

/** Tests exercise the actual demo data; every test gets an isolated copy. */
export function demoData(): RawData {
  return structuredClone({
    tickets, suggestions, messages, events, assignments, teams, agents, customers,
    sites, devices, products, categories, knowledge, regions, partRequests, visits,
    duplicates, csat, workflow, dashboardExpected,
  }) as unknown as RawData;
}
