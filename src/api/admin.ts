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
  finance?: {
    open_after_sales: number;
    pending_withdrawals: number;
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

export type AdminRole =
  | "super_admin"
  | "admin_l1"
  | "admin_l2"
  | "admin_l3"
  | "tenant_owner"
  | "tenant_staff"
  | "tenant_viewer";
export type AdminScopeType = "global" | "circle";
export type AdminStatus = "active" | "disabled";

export type AdminUser = {
  id: string;
  username: string;
  display_name: string;
  role: AdminRole;
  legacy_role?: string;
  account_type: AdminRole;
  status: AdminStatus;
  scope_type: AdminScopeType;
  scope_circle_id: string;
  scope_circle_name: string;
  bound_user_id: string;
  bound_user_nickname: string;
  permissions: string[];
  permissions_json?: string[];
  must_change_password?: boolean;
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

export type AdminAccountGroup = {
  id: string;
  name: string;
  description: string;
  status: "active" | "disabled";
  can_view_main_room_messages: boolean;
  member_count: number;
  created_at: string;
  updated_at: string;
};

export type AdminAccountGroupMember = {
  id: string;
  group_id: string;
  admin_user_id: string;
  username: string;
  display_name: string;
  role: string;
  status: string;
  scope_type: AdminScopeType;
  scope_circle_id: string;
  scope_circle_name: string;
  bound_user_id: string;
  bound_user_nickname: string;
  tenant_bind_type?: string;
  wechat_openid_snapshot?: string;
  dxq_id_snapshot?: string;
  created_at: string;
};

export type MainRoomMessage = {
  id: string;
  circle_id: string;
  room_id: string;
  sender_id: string;
  sender_nickname: string;
  sender_avatar: string;
  sender_dxq_id: string;
  sender_circle_role: string;
  type: string;
  content: string;
  status: string;
  audit_status: string;
  audit_reason: string;
  reply_to_message_id: string;
  created_at: string;
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

export const adminAccountGroupsApi = {
  list: (params: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<PageResult<AdminAccountGroup>>>(
        "get",
        "/account-groups",
        { params }
      )
    ),
  detail: (id: string) =>
    unwrap(
      http.request<
        ApiResult<{
          group: AdminAccountGroup;
          members: AdminAccountGroupMember[];
        }>
      >("get", `/account-groups/${id}`)
    ),
  adminUsers: (params: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<{ items: AdminAccountGroupMember[] }>>(
        "get",
        "/account-groups/admin-users",
        { params }
      )
    ),
  create: (data: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<{ group: AdminAccountGroup }>>(
        "post",
        "/account-groups",
        { data }
      )
    ),
  update: (id: string, data: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<{ group: AdminAccountGroup }>>(
        "patch",
        `/account-groups/${id}`,
        { data }
      )
    ),
  remove: (id: string) =>
    unwrap(
      http.request<ApiResult<{ deleted: boolean }>>(
        "delete",
        `/account-groups/${id}`
      )
    ),
  addMembers: (id: string, data: { admin_user_ids: string[] }) =>
    unwrap(
      http.request<ApiResult<{ added: number; skipped: string[] }>>(
        "post",
        `/account-groups/${id}/members`,
        { data }
      )
    ),
  removeMember: (id: string, adminUserId: string) =>
    unwrap(
      http.request<ApiResult<{ removed: boolean }>>(
        "delete",
        `/account-groups/${id}/members/${adminUserId}`
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
    ),
  loginLogs: (params: Record<string, any>) =>
    unwrap(
      http.request<
        ApiResult<
          PageResult<{
            id: string;
            username: string;
            success: boolean;
            failure_reason: string;
            ip: string;
            user_agent: string;
            created_at: string;
          }> & {
            policy: {
              max_failed_attempts: number;
              lock_minutes: number;
            };
          }
        >
      >("get", "/auth/login-logs", { params })
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

export type ManualReviewTargetType = "user" | "circle" | "resource_card";

export type ManualReviewItem = {
  id: string;
  target_type: ManualReviewTargetType;
  target_id: string;
  title: string;
  summary: string;
  owner_name: string;
  owner_id: string;
  audit_status: string;
  audit_reason: string;
  source: string;
  report_count: number;
  created_at: string;
  updated_at: string;
  raw?: Record<string, any>;
};

export type ResourceAfterSaleStatus =
  | "open"
  | "buyer_withdrew"
  | "refunded"
  | "rejected"
  | "closed";

export type RefundStatus =
  | "none"
  | "local_refunded"
  | "wechat_pending"
  | "wechat_refunded"
  | "failed";

export type ResourceAfterSale = {
  id: string;
  order_id: string;
  purchase_id: string;
  resource_card_id: string;
  circle_id: string;
  buyer_user_id: string;
  creator_user_id: string;
  complaint_type: string;
  description: string;
  evidence_images: string[];
  contact_email: string;
  status: ResourceAfterSaleStatus;
  refund_amount: number;
  refund_status: RefundStatus;
  out_refund_no: string;
  wechat_refund_id: string;
  wechat_refund_status: string;
  refund_requested_at?: string | null;
  refund_notified_at?: string | null;
  refund_success_time?: string | null;
  refund_error: string;
  resolution_note: string;
  closed_by: string;
  order_amount: number;
  order_status: string;
  paid_at?: string | null;
  purchase_status: string;
  purchased_at?: string | null;
  resource_title: string;
  resource_summary: string;
  resource_cover_url: string;
  delivery_type: string;
  circle_name: string;
  buyer: {
    id: string;
    nickname: string;
    avatar: string;
    dxq_id?: string;
  };
  creator: {
    id: string;
    nickname: string;
    avatar: string;
    dxq_id?: string;
  };
  unread_count: number;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
};

export type AfterSaleMessage = {
  id: string;
  after_sale_id: string;
  sender_user_id: string;
  sender_role: string;
  sender_name: string;
  sender_avatar: string;
  message_type: "text" | "image" | "system";
  content: string;
  image_url: string;
  created_at: string;
};

export type WithdrawalStatus =
  | "requested"
  | "approved"
  | "wait_user_confirm"
  | "canceling"
  | "success"
  | "failed"
  | "cancelled"
  | "rejected";

export type CreatorWithdrawal = {
  id: string;
  user_id: string;
  user_dxq_id?: string;
  user_nickname?: string;
  user_avatar?: string;
  circle_id?: string;
  circle_name?: string;
  amount: number;
  status: WithdrawalStatus;
  out_bill_no: string;
  transfer_bill_no: string;
  package_info: string;
  failure_reason: string;
  remark: string;
  requested_at: string;
  approved_at?: string | null;
  submitted_at?: string | null;
  completed_at?: string | null;
  updated_at: string;
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

export const manualReviewsApi = {
  list: (params: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<PageResult<ManualReviewItem>>>(
        "get",
        "/manual-reviews",
        { params }
      )
    ),
  detail: (id: string) =>
    unwrap(
      http.request<
        ApiResult<{
          item: ManualReviewItem;
          logs: Array<Record<string, any>>;
        }>
      >("get", `/manual-reviews/${id}`)
    ),
  action: (
    id: string,
    data: { audit_status: string; audit_reason: string; target_status?: string }
  ) =>
    unwrap(
      http.request<ApiResult<{ item: ManualReviewItem }>>(
        "post",
        `/manual-reviews/${id}/actions`,
        { data }
      )
    )
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
    ),
  mainRoomMessages: (id: string, params: Record<string, any>) =>
    unwrap(
      http.request<
        ApiResult<
          PageResult<MainRoomMessage> & {
            circle: ManagedCircle;
            room: Record<string, any>;
          }
        >
      >("get", `/circles/${id}/main-room/messages`, { params })
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

export const afterSalesApi = {
  list: (params: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<PageResult<ResourceAfterSale>>>(
        "get",
        "/after-sales",
        { params }
      )
    ),
  detail: (id: string) =>
    unwrap(
      http.request<
        ApiResult<{
          after_sale: ResourceAfterSale;
          messages: AfterSaleMessage[];
        }>
      >("get", `/after-sales/${id}`)
    ),
  refund: (id: string, data: { note: string }) =>
    unwrap(
      http.request<
        ApiResult<{ after_sale: ResourceAfterSale; ambiguous?: boolean }>
      >("post", `/after-sales/${id}/refund`, { data })
    ),
  reject: (id: string, data: { note: string }) =>
    unwrap(
      http.request<ApiResult<{ after_sale: ResourceAfterSale }>>(
        "post",
        `/after-sales/${id}/reject`,
        { data }
      )
    ),
  syncRefund: (id: string) =>
    unwrap(
      http.request<ApiResult<{ after_sale: ResourceAfterSale }>>(
        "post",
        `/after-sales/${id}/refund/sync`
      )
    )
};

export const withdrawalsApi = {
  list: (params: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<PageResult<CreatorWithdrawal>>>(
        "get",
        "/withdrawals",
        { params }
      )
    ),
  detail: (id: string) =>
    unwrap(
      http.request<ApiResult<{ withdrawal: CreatorWithdrawal }>>(
        "get",
        `/withdrawals/${id}`
      )
    ),
  approve: (id: string, data: { note: string }) =>
    unwrap(
      http.request<ApiResult<{ withdrawal: CreatorWithdrawal }>>(
        "post",
        `/withdrawals/${id}/approve`,
        { data }
      )
    ),
  reject: (id: string, data: { note: string }) =>
    unwrap(
      http.request<ApiResult<{ withdrawal: CreatorWithdrawal }>>(
        "post",
        `/withdrawals/${id}/reject`,
        { data }
      )
    ),
  sync: (id: string) =>
    unwrap(
      http.request<ApiResult<{ withdrawal: CreatorWithdrawal }>>(
        "post",
        `/withdrawals/${id}/sync`
      )
    ),
  cancel: (id: string, data: { note: string }) =>
    unwrap(
      http.request<ApiResult<{ withdrawal: CreatorWithdrawal }>>(
        "post",
        `/withdrawals/${id}/cancel`,
        { data }
      )
    )
};
