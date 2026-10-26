import { Priority, Sla, Status } from './models';

export const DEMO_NOW_ISO = '2026-10-24T04:00:00Z';
export const DEMO_NOW = new Date(DEMO_NOW_ISO);
export const DEMO_NOW_MS = DEMO_NOW.getTime();

export const STATUS_LABEL: Record<Status, string> = {
  new: '新建',
  awaiting_review: '待人工复核',
  waiting_customer: '待客户补充',
  assigned: '已分派',
  in_progress: '处理中',
  waiting_parts: '待备件',
  waiting_visit: '待上门',
  escalated: '已升级',
  resolved: '已解决待确认',
  closed: '已关闭',
  cancelled: '已取消',
  merged: '已合并',
  reopened: '重新打开',
};

export const STATUS_TONE: Record<Status, string> = {
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

export const PRIORITY_LABEL: Record<Priority, string> = {
  P0: 'P0 安全紧急',
  P1: 'P1 高优先级',
  P2: 'P2 一般故障',
  P3: 'P3 普通咨询',
};

export const CATEGORY_LABEL_FALLBACK: Record<string, string> = {
  connectivity: '设备联网与离线',
  charging: '无法充电或放电',
  monitoring: '数据展示与统计异常',
  backup: '备用供电问题',
  commissioning: '安装与调试',
  alarm: '设备告警待排查',
  performance: '运行效果与收益疑问',
  account: '账号与授权',
  warranty: '保修与退换咨询',
  cooling: '工商业温控问题',
  dispatch: '项目通信与调度',
  ev: '充电桩问题',
  safety: '安全风险报告',
  unknown: '无法判断，需要人工',
};

export const LANG_LABEL: Record<string, string> = {
  de: '德语',
  nl: '荷兰语',
  es: '西班牙语',
  en: '英语',
  zh: '中文',
  fr: '法语',
  it: '意大利语',
};

export const CHANNEL_LABEL: Record<string, string> = {
  email: '邮件',
  phone_transcript: '电话转写',
  installer_portal: '安装商门户',
  app_feedback: 'App 反馈',
  online_service_center: '在线服务中心',
};

export const ROLE_LABEL: Record<string, string> = {
  service_agent: '客服',
  technical_support: '技术支持',
  dispatcher: '服务调度',
  supervisor: '售后主管',
};

export const TAKEOVER_LABEL: Record<string, string> = {
  queued: '待人工接管',
  taken_over: '人工已接管',
  mitigated: '风险已记录缓解',
};

const dtf = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return dtf.format(d).replace(/\//g, '-');
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return fmtDateTime(iso).slice(0, 5);
}

export function fmtAgo(iso: string | null | undefined, nowMs = DEMO_NOW_MS): string {
  if (!iso) return '—';
  const diff = nowMs - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 0) return `未来 ${duration(-mins)}`;
  if (mins < 60) return `${mins} 分钟前`;
  if (mins < 1440) return `${Math.floor(mins / 60)} 小时前`;
  return `${Math.floor(mins / 1440)} 天前`;
}

export function duration(mins: number): string {
  const m = Math.max(0, Math.round(mins));
  if (m < 60) return `${m} 分钟`;
  if (m < 1440) return `${Math.floor(m / 60)} 小时 ${m % 60} 分`;
  return `${Math.floor(m / 1440)} 天 ${Math.floor((m % 1440) / 60)} 小时`;
}

/** 严格大于到期时间才算超时（恰好到期不算） */
export function overdueMinutes(dueIso: string | null, nowMs = DEMO_NOW_MS): number {
  if (!dueIso) return 0;
  const diff = nowMs - new Date(dueIso).getTime();
  return diff > 0 ? Math.floor(diff / 60000) : 0;
}

export function slaFirstResponseOverdue(sla: Sla, nowMs = DEMO_NOW_MS): boolean {
  if (sla.excluded || sla.first_response_at) return false;
  return nowMs > new Date(sla.first_response_due_at).getTime();
}

export function slaResolutionOverdue(sla: Sla, nowMs = DEMO_NOW_MS): boolean {
  if (sla.excluded || sla.resolved_at) return false;
  return nowMs > new Date(sla.resolution_due_at).getTime();
}

export const UNRESOLVED_EXCLUDED: Status[] = ['resolved', 'closed', 'cancelled', 'merged'];

export function isUnresolved(status: Status): boolean {
  return !UNRESOLVED_EXCLUDED.includes(status);
}

export function priorityTone(p: Priority | null): string {
  return p ?? 'none';
}

export function initials(name: string | undefined | null): string {
  if (!name) return '—';
  return name.replace('演示', '').slice(0, 4);
}

export function pct(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}
