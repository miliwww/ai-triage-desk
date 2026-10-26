import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    title: '服务总览 · 沃太售后服务工作台',
    loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.DashboardPage),
  },
  {
    path: 'tickets',
    title: '工单中心 · 沃太售后服务工作台',
    loadComponent: () => import('./pages/tickets/tickets').then((m) => m.TicketsPage),
  },
  {
    path: 'tickets/:id',
    title: '工单详情 · 沃太售后服务工作台',
    loadComponent: () => import('./pages/ticket-detail/ticket-detail').then((m) => m.TicketDetailPage),
  },
  {
    path: 'risk',
    title: '风险与超时 · 沃太售后服务工作台',
    loadComponent: () => import('./pages/risk/risk').then((m) => m.RiskPage),
  },
  { path: '**', redirectTo: 'dashboard' },
];
