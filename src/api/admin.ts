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
  return promise.then(res => {
    if (res?.code !== 0) {
      throw new Error(res?.message || "请求失败");
    }
    return res.data;
  });
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

export type AdminRole = "super_admin" | "operator" | "viewer";
export type AdminScopeType = "global" | "circle";
export type AdminStatus = "active" | "disabled";

export type AdminUser = {
  id: string;
  username: string;
  display_name: string;
  role: AdminRole;
  status: AdminStatus;
  scope_type: AdminScopeType;
  scope_circle_id: string;
  scope_circle_name: string;
  bound_user_id: string;
  bound_user_nickname: string;
  permissions: string[];
  permissions_json?: string[];
  created_by_admin_id?: string;
  last_login_at?: string | null;
  password_changed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type PermissionCatalog = {
  permissions: Array<{
    code: string;
    label: string;
    description: string;
    group: string;
  }>;
  role_options: Array<{
    value: AdminRole;
    label: string;
    description: string;
    permissions: string[];
  }>;
  scope_options: Array<{
    value: AdminScopeType;
    label: string;
    description: string;
    default_permissions?: string[];
  }>;
};

export type AdminCircleOption = {
  id: string;
  name: string;
  owner_user_id: string;
  owner_nickname: string;
  owner_dxq_id: string;
  status: string;
  member_count: number;
};

export type AdminUserOption = {
  id: string;
  dxq_id: string;
  nickname: string;
  avatar: string;
  status: string;
};

export const adminUsersApi = {
  permissions: () =>
    unwrap(
      http.request<ApiResult<PermissionCatalog>>(
        "get",
        "/admin-users/permissions"
      )
    ),
  list: (params: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<PageResult<AdminUser>>>("get", "/admin-users", {
        params
      })
    ),
  circles: (params: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<{ items: AdminCircleOption[] }>>(
        "get",
        "/admin-users/circles",
        { params }
      )
    ),
  users: (params: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<{ items: AdminUserOption[] }>>(
        "get",
        "/admin-users/users",
        { params }
      )
    ),
  create: (data: Record<string, any>) =>
    unwrap(http.request<ApiResult<AdminUser>>("post", "/admin-users", { data })),
  update: (id: string, data: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<AdminUser>>("patch", `/admin-users/${id}`, {
        data
      })
    ),
  resetPassword: (id: string, data: { password?: string }) =>
    unwrap(
      http.request<ApiResult<{ id: string; username: string; password: string }>>(
        "post",
        `/admin-users/${id}/reset-password`,
        { data }
      )
    )
};

export const accountApi = {
  changePassword: (data: {
    old_password: string;
    new_password: string;
  }) =>
    unwrap(
      http.request<ApiResult<{ changed: boolean }>>(
        "post",
        "/auth/change-password",
        { data }
      )
    )
};

export type ManagedUser = {
  id: string;
  dxq_id: string;
  nickname: string;
  avatar: string;
  phone: string;
  intro: string;
  gender: string;
  birthday: string;
  location: string;
  email: string;
  wechat_bound: boolean;
  verified: boolean;
  status: "active" | "banned";
  audit_status: string;
  audit_reason: string;
  circle_count: number;
  owned_circle_count: number;
  resource_card_count: number;
  report_count: number;
  scoped_circle_role?: string;
  scoped_joined_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type ManagedCircle = {
  id: string;
  owner_user_id: string;
  owner_dxq_id: string;
  owner_nickname: string;
  owner_avatar: string;
  name: string;
  description: string;
  cover_image: string;
  is_private: boolean;
  is_public_square: boolean;
  max_members: number;
  is_paid_entry: boolean;
  circle_code: string;
  member_count: number;
  room_count: number;
  resource_count: number;
  report_count: number;
  status: "active" | "dismissed";
  audit_status: string;
  audit_reason: string;
  created_at: string;
  updated_at: string;
};

export type ManagedResourceCard = {
  id: string;
  circle_id: string;
  circle_name: string;
  creator_id: string;
  creator_dxq_id: string;
  creator_nickname: string;
  title: string;
  summary: string;
  cover_url: string;
  delivery_type: string;
  price: number;
  currency: string;
  resource_type: string;
  sales_count: number;
  comment_count: number;
  is_pinned: boolean;
  status: "draft" | "published" | "offline" | "disabled" | "deleted";
  audit_status: string;
  purchase_count: number;
  refund_count: number;
  code_stock_total: number;
  code_stock_available: number;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
};

export const managedUsersApi = {
  list: (params: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<PageResult<ManagedUser>>>("get", "/users", {
        params
      })
    ),
  detail: (id: string) =>
    unwrap(
      http.request<
        ApiResult<{
          user: ManagedUser;
          circles: Array<Record<string, any>>;
        }>
      >("get", `/users/${id}`)
    ),
  update: (id: string, data: Record<string, any>) =>
    unwrap(http.request<ApiResult<ManagedUser>>("patch", `/users/${id}`, { data }))
};

export const managedCirclesApi = {
  list: (params: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<PageResult<ManagedCircle>>>("get", "/circles", {
        params
      })
    ),
  detail: (id: string) =>
    unwrap(
      http.request<
        ApiResult<{
          circle: ManagedCircle;
          rooms: Array<Record<string, any>>;
        }>
      >("get", `/circles/${id}`)
    ),
  update: (id: string, data: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<ManagedCircle>>("patch", `/circles/${id}`, { data })
    ),
  members: (id: string, params: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<PageResult<Record<string, any>>>>(
        "get",
        `/circles/${id}/members`,
        { params }
      )
    )
};

export const managedResourceCardsApi = {
  list: (params: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<PageResult<ManagedResourceCard>>>(
        "get",
        "/resource-cards",
        { params }
      )
    ),
  detail: (id: string) =>
    unwrap(
      http.request<
        ApiResult<{
          resource_card: ManagedResourceCard;
          recent_purchases: Array<Record<string, any>>;
        }>
      >("get", `/resource-cards/${id}`)
    ),
  update: (id: string, data: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<ManagedResourceCard>>(
        "patch",
        `/resource-cards/${id}`,
        { data }
      )
    )
};
