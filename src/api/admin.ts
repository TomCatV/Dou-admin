import { http } from "@/utils/http";

export type ApiResult<T> = {
  code: number;
  message: string;
  data: T;
};

export type PageResult<T> = {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  has_more: boolean;
};

export type ReportStatus = "pending" | "processed" | "rejected";

export type ReportItem = {
  id: string;
  reporter?: {
    id: string;
    dxq_id: string;
    nickname: string;
    avatar: string;
    status: string;
  } | null;
  target_type: string;
  target_id: string;
  target?: Record<string, any> | null;
  reason_type: string;
  description: string;
  evidence_urls: string[];
  status: ReportStatus;
  handled_by_admin_username?: string;
  handled_at?: string | null;
  handle_note?: string;
  handle_action?: string;
  created_at: string;
  updated_at: string;
};

export type ReportDetail = {
  report: ReportItem;
  audit_logs: Array<{
    id: string;
    admin_username: string;
    action: string;
    summary: string;
    detail: Record<string, any>;
    created_at: string;
  }>;
};

export type DashboardSummary = {
  reports: {
    pending: number;
    processed: number;
    rejected: number;
    total: number;
  };
  content: {
    users: number;
    banned_users: number;
    active_circles: number;
    hidden_messages: number;
    published_resource_cards: number;
  };
};

export function unwrap<T>(promise: Promise<ApiResult<T>>) {
  return promise.then(res => res.data);
}

export const dashboardApi = {
  summary: () =>
    unwrap(http.request<ApiResult<DashboardSummary>>("get", "/dashboard/summary"))
};

export const reportsApi = {
  list: (params: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<PageResult<ReportItem>>>("get", "/reports", {
        params
      })
    ),
  detail: (id: string) =>
    unwrap(http.request<ApiResult<ReportDetail>>("get", `/reports/${id}`)),
  action: (
    id: string,
    data: { action: string; target_action: string; note: string }
  ) =>
    unwrap(
      http.request<
        ApiResult<{ report: ReportItem; target_action_result: Record<string, any> }>
      >("post", `/reports/${id}/actions`, { data })
    )
};

export const auditLogsApi = {
  list: (params: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<PageResult<Record<string, any>>>>(
        "get",
        "/audit-logs",
        { params }
      )
    )
};
