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

export type TenantOwnerCircle = {
  id: string;
  name: string;
  circle_code: string;
  member_count: number;
  resource_count: number;
  status: string;
  audit_status: string;
};

export type TenantOwnerResourceCategory = {
  category_id: string;
  category_name: string;
  delivery_type: string;
  delivery_label: string;
  status: string;
  resource_count: number;
  published_count: number;
  paid_orders: number;
  revenue_amount: number;
};

export type TenantOwnerPaidUser = {
  user_id: string;
  nickname: string;
  dxq_id: string;
  paid_orders: number;
  paid_amount: number;
  last_paid_at: string;
};

export type TenantOwnerIncomeType = {
  key: string;
  label: string;
  pay_channel: string;
  pay_channel_label: string;
  settlement_status: string;
  settlement_label: string;
  delivery_type: string;
  delivery_label: string;
  order_count: number;
  gross_amount: number;
  creator_amount: number;
  platform_fee_amount: number;
  channel_cost_amount: number;
};

export type TenantOwnerRevenueTrend = {
  date: string;
  paid_orders: number;
  revenue_amount: number;
};

export type TenantOwnerSuggestion = {
  key: string;
  title: string;
  description: string;
  action_label: string;
  route_path: string;
  priority: "high" | "medium" | "low" | string;
};

export type TenantOwnerOverview = {
  owner_user_id: string;
  circles: TenantOwnerCircle[];
  metrics: Record<string, number>;
  resource_categories: TenantOwnerResourceCategory[];
  paid_user_leaderboard: TenantOwnerPaidUser[];
  income_types: TenantOwnerIncomeType[];
  revenue_trend: TenantOwnerRevenueTrend[];
  suggestions: TenantOwnerSuggestion[];
};

export type TenantContext = {
  can_enter: boolean;
  message: string;
  selected_circle_id: string;
  current_circle: TenantOwnerCircle | null;
  circles: TenantOwnerCircle[];
};

export type TenantDashboard = {
  circle: ManagedCircle;
  main_room: { id: string; name: string } | null;
  metrics: Record<string, number>;
  wallet: Record<string, number>;
  settlement: Record<string, any>;
  subscription?: Record<string, any> | null;
  subscription_status?: Record<string, any>;
  usage?: Record<string, number>;
  limits?: Record<string, number>;
  features?: Record<string, boolean>;
  writable?: boolean;
  fee_policy?: TenantFeePolicy | null;
  fee_policy_upgrade?: TenantFeeUpgradeOption | null;
  fee_policy_options?: TenantFeeUpgradeOption[];
  owner_overview?: TenantOwnerOverview | null;
};

export type TenantFeePolicy = {
  id: string;
  scope_type: string;
  scope_id: string;
  name: string;
  fee_bps: number;
  min_fee_amount: number;
  max_fee_amount: number | null;
  status: string;
  source: string;
  note?: string;
  created_at?: string;
  updated_at?: string;
};

export type TenantFeeUpgradeOption = {
  plan: {
    id: string;
    code: string;
    name: string;
    price_monthly: number;
    price_yearly: number;
  };
  fee_policy: TenantFeePolicy;
  save_bps: number;
  monthly_price_gap: number;
  yearly_price_gap: number;
  action?: "open" | "renew" | "upgrade" | string;
  action_label?: string;
};

export type AdminNotificationItem = {
  id: string;
  category: "todo" | "finance" | "expiry" | string;
  title: string;
  description: string;
  count: number;
  severity: "primary" | "success" | "warning" | "info" | "danger";
  route_path: string;
  latest_at: string;
};

export type AdminNotificationSummary = {
  items: AdminNotificationItem[];
  total: number;
  unread_like_count: number;
  generated_at: string;
};

export type TenantMember = {
  id: string;
  user_id: string;
  dxq_id: string;
  nickname: string;
  avatar: string;
  user_status: string;
  role: string;
  mute_until?: string | null;
  joined_at: string;
};

export type TenantOrder = {
  id: string;
  user_id: string;
  buyer_nickname: string;
  buyer_dxq_id: string;
  order_type: string;
  resource_card_id: string;
  resource_title: string;
  room_id: string;
  room_name: string;
  amount: number;
  currency: string;
  status: string;
  settlement_status?: string;
  platform_fee_amount?: number;
  creator_amount?: number;
  fee_rate_bps?: number;
  channel_cost_amount?: number;
  platform_net_amount?: number;
  original_amount?: number;
  discount_amount?: number;
  coupon_code?: string;
  invite_code?: string;
  campaign_name?: string;
  attribution_source?: string;
  source_channel?: string;
  paid_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type TenantAfterSale = {
  id: string;
  order_id: string;
  purchase_id?: string;
  resource_card_id: string;
  circle_id?: string;
  resource_title: string;
  buyer_user_id: string;
  buyer_nickname: string;
  creator_user_id?: string;
  complaint_type: string;
  description: string;
  evidence_images?: string[];
  contact_email?: string;
  status: string;
  refund_amount: number;
  refund_status: string;
  out_refund_no?: string;
  wechat_refund_id?: string;
  wechat_refund_status?: string;
  refund_requested_at?: string | null;
  refund_notified_at?: string | null;
  refund_success_time?: string | null;
  refund_error?: string;
  resolution_note: string;
  closed_by?: string;
  order_amount?: number;
  order_status?: string;
  paid_at?: string | null;
  purchase_status?: string;
  purchased_at?: string | null;
  resource_summary?: string;
  resource_cover_url?: string;
  delivery_type?: string;
  circle_name?: string;
  buyer?: {
    id: string;
    nickname: string;
    avatar: string;
  };
  creator?: {
    id: string;
    nickname: string;
    avatar: string;
  };
  unread_count?: number;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
};

export type TenantLead = {
  id: string;
  circle_id: string;
  user_id: string;
  name: string;
  phone: string;
  wechat_id: string;
  source: string;
  intent_level: "low" | "medium" | "high";
  status: "new" | "contacted" | "converted" | "lost";
  tags: string[];
  note: string;
  created_at: string;
  updated_at: string;
};

export type TenantConversionSummary = {
  leads: Record<string, number>;
  tools: Record<string, number>;
  funnel: Record<string, number>;
  attribution?: Record<string, number>;
};

export type TenantAiUsage = {
  used: number;
  limit: number;
  remaining: number;
  plan_code: string;
  ai_available: boolean;
  model: string;
};

export type TenantAiReport = {
  id: string;
  circle_id: string;
  scene: "daily_report" | "campaign_copy" | string;
  model: string;
  prompt_version_id: string;
  input_digest: Record<string, any>;
  output: Record<string, any>;
  status: "generated" | "accepted" | "dismissed" | "failed" | string;
  failure_reason: string;
  response_id: string;
  usage: Record<string, any>;
  created_by_admin_id: string;
  created_at: string;
  updated_at: string;
};

export function unwrap<T>(promise: Promise<ApiResult<T>>) {
  return promise.then(res => {
    if (res?.code !== 0) {
      throw new Error(res?.message || "请求失败");
    }
    return res.data;
  });
}

function unwrapAiGeneration(
  promise: Promise<ApiResult<{ report: TenantAiReport }>>
) {
  return promise
    .then(res => {
      if (res?.data?.report) return res.data;
      if (res?.code !== 0) throw new Error(res?.message || "AI 生成失败");
      return res.data;
    })
    .catch(error => {
      const report = error?.response?.data?.data?.report;
      if (report) return { report } as { report: TenantAiReport };
      throw error;
    });
}

export const dashboardApi = {
  summary: () =>
    unwrap(
      http.request<ApiResult<DashboardSummary>>("get", "/dashboard/summary")
    )
};

export type ProductCategory = {
  id: string;
  circle_id: string;
  name: string;
  sort_order: number;
  status: "active" | "hidden";
  product_count: number;
  created_at: string;
  updated_at: string;
};

export type ResourceImportBatch = {
  id: string;
  circle_id: string;
  admin_id: string;
  source_filename: string;
  source_type: "xlsx" | "xls" | "csv" | string;
  status: "parsed" | "failed" | string;
  total_count: number;
  candidate_count: number;
  isolated_count: number;
  converted_count: number;
  duplicate_count: number;
  error_message: string;
  created_at: string;
  updated_at: string;
};

export type ResourceImportItem = {
  id: string;
  batch_id: string;
  circle_id: string;
  row_index: number;
  sheet_name: string;
  title: string;
  link: string;
  note: string;
  platform: string;
  target_audience: string;
  risk_level: "low" | "medium" | "high" | string;
  risk_reason: string;
  resource_pool: string;
  commercial_action: string;
  snake_judgement: string;
  commercial_score: number;
  display_value: number;
  conversion_value: number;
  reuse_value: number;
  private_domain_value: number;
  risk_penalty: number;
  status: "candidate" | "isolated" | "converted" | "ignored" | string;
  converted_resource_card_id: string;
  created_at: string;
  updated_at: string;
};

export type ResourceImportStats = {
  risk_distribution: Array<{ risk_level: string; count: number }>;
  pool_distribution: Array<{ resource_pool: string; count: number }>;
};

export const notificationsApi = {
  summary: () =>
    unwrap(
      http.request<ApiResult<AdminNotificationSummary>>(
        "get",
        "/notifications/summary"
      )
    )
};

export const tenantApi = {
  context: () =>
    unwrap(http.request<ApiResult<TenantContext>>("get", "/tenant/context")),
  dashboard: () =>
    unwrap(
      http.request<ApiResult<TenantDashboard>>("get", "/tenant/dashboard")
    ),
  circle: () =>
    unwrap(
      http.request<
        ApiResult<{
          circle: ManagedCircle;
          rooms: Array<Record<string, any>>;
          subscription?: Record<string, any> | null;
          subscription_status?: Record<string, any>;
          usage?: Record<string, number>;
          limits?: Record<string, number>;
          features?: Record<string, boolean>;
          writable?: boolean;
        }>
      >("get", "/tenant/circle")
    ),
  updateCircle: (data: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<{ circle: ManagedCircle }>>(
        "patch",
        "/tenant/circle",
        { data }
      )
    ),
  members: (params: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<PageResult<TenantMember>>>(
        "get",
        "/tenant/members",
        { params }
      )
    ),
  resourceCards: (params: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<PageResult<ManagedResourceCard>>>(
        "get",
        "/tenant/resource-cards",
        { params }
      )
    ),
  productCategories: (params: Record<string, any> = {}) =>
    unwrap(
      http.request<ApiResult<{ items: ProductCategory[] }>>(
        "get",
        "/tenant/product-categories",
        { params }
      )
    ),
  createProductCategory: (data: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<{ category: ProductCategory }>>(
        "post",
        "/tenant/product-categories",
        { data }
      )
    ),
  updateProductCategory: (id: string, data: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<{ category: ProductCategory }>>(
        "patch",
        `/tenant/product-categories/${id}`,
        { data }
      )
    ),
  deleteProductCategory: (id: string) =>
    unwrap(
      http.request<ApiResult<{ hidden: boolean; category_id: string }>>(
        "delete",
        `/tenant/product-categories/${id}`
      )
    ),
  resourceImportBatches: (params: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<PageResult<ResourceImportBatch>>>(
        "get",
        "/tenant/resource-imports",
        { params }
      )
    ),
  uploadResourceImport: (file: File) => {
    const data = new FormData();
    data.append("file", file);
    return unwrap(
      http.request<
        ApiResult<{
          batch: ResourceImportBatch;
          preview_items: ResourceImportItem[];
          truncated: boolean;
        }>
      >("post", "/tenant/resource-imports/upload", {
        data,
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000
      })
    );
  },
  resourceImportDetail: (batchId: string) =>
    unwrap(
      http.request<
        ApiResult<{ batch: ResourceImportBatch; stats: ResourceImportStats }>
      >("get", `/tenant/resource-imports/${batchId}`)
    ),
  resourceImportItems: (batchId: string, params: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<PageResult<ResourceImportItem>>>(
        "get",
        `/tenant/resource-imports/${batchId}/items`,
        { params }
      )
    ),
  convertResourceImportItem: (itemId: string, data: Record<string, any>) =>
    unwrap(
      http.request<
        ApiResult<{
          item: ResourceImportItem;
          resource_card: Pick<
            ManagedResourceCard,
            "id" | "title" | "status" | "h5_status"
          >;
        }>
      >("post", `/tenant/resource-imports/items/${itemId}/convert`, { data })
    ),
  resourceCardPublicLink: (id: string) =>
    unwrap(
      http.request<
        ApiResult<{
          product_key: string;
          store_key: string;
          public_path: string;
          public_url: string;
          pretty_path: string;
          store_path: string;
          store_url: string;
          qr_payload: Record<string, any>;
        }>
      >("get", `/tenant/resource-cards/${id}/public-link`)
    ),
  resourceCardDetail: (id: string) =>
    unwrap(
      http.request<ApiResult<{ resource_card: ManagedResourceCard }>>(
        "get",
        `/tenant/resource-cards/${id}`
      )
    ),
  createResourceCard: (data: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<{ resource_card: ManagedResourceCard }>>(
        "post",
        "/tenant/resource-cards",
        { data }
      )
    ),
  updateResourceCard: (id: string, data: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<{ resource_card: ManagedResourceCard }>>(
        "patch",
        `/tenant/resource-cards/${id}`,
        { data }
      )
    ),
  publishResourceCard: (id: string) =>
    unwrap(
      http.request<ApiResult<{ resource_card: ManagedResourceCard }>>(
        "post",
        `/tenant/resource-cards/${id}/publish`
      )
    ),
  offlineResourceCard: (id: string) =>
    unwrap(
      http.request<ApiResult<{ resource_card: ManagedResourceCard }>>(
        "post",
        `/tenant/resource-cards/${id}/offline`
      )
    ),
  deleteResourceCard: (id: string) =>
    unwrap(
      http.request<ApiResult<{ deleted: boolean; resource_card_id: string }>>(
        "delete",
        `/tenant/resource-cards/${id}`
      )
    ),
  orders: (params: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<PageResult<TenantOrder>>>(
        "get",
        "/tenant/orders",
        { params }
      )
    ),
  afterSales: (params: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<PageResult<TenantAfterSale>>>(
        "get",
        "/tenant/after-sales",
        { params }
      )
    ),
  afterSaleDetail: (id: string) =>
    unwrap(
      http.request<
        ApiResult<{
          after_sale: TenantAfterSale;
          messages: AfterSaleMessage[];
          actions: AfterSaleAction[];
        }>
      >("get", `/tenant/after-sales/${id}`)
    ),
  replyAfterSale: (
    id: string,
    data: {
      content: string;
      message_type?: "text" | "image";
      image_url?: string;
    }
  ) =>
    unwrap(
      http.request<
        ApiResult<{
          after_sale: TenantAfterSale;
          messages: AfterSaleMessage[];
          actions: AfterSaleAction[];
        }>
      >("post", `/tenant/after-sales/${id}/messages`, { data })
    ),
  resendAfterSale: (id: string, data: { note: string }) =>
    unwrap(
      http.request<
        ApiResult<{
          after_sale: TenantAfterSale;
          messages: AfterSaleMessage[];
          actions: AfterSaleAction[];
        }>
      >("post", `/tenant/after-sales/${id}/resend`, { data })
    ),
  replaceAfterSaleCode: (id: string, data: { note: string }) =>
    unwrap(
      http.request<
        ApiResult<{
          after_sale: TenantAfterSale;
          messages: AfterSaleMessage[];
          actions: AfterSaleAction[];
        }>
      >("post", `/tenant/after-sales/${id}/replace-code`, { data })
    ),
  refundAfterSale: (id: string, data: { note: string }) =>
    unwrap(
      http.request<
        ApiResult<{
          after_sale: TenantAfterSale;
          messages: AfterSaleMessage[];
          actions: AfterSaleAction[];
          ambiguous?: boolean;
        }>
      >("post", `/tenant/after-sales/${id}/refund`, { data })
    ),
  syncAfterSaleRefund: (id: string) =>
    unwrap(
      http.request<
        ApiResult<{
          after_sale: TenantAfterSale;
          messages: AfterSaleMessage[];
          actions: AfterSaleAction[];
        }>
      >("post", `/tenant/after-sales/${id}/refund/sync`)
    ),
  wallet: () =>
    unwrap(
      http.request<
        ApiResult<{
          wallet: Record<string, number>;
          payout_account: Record<string, any> | null;
          settlement: Record<string, any>;
          recent_ledger: Array<Record<string, any>>;
          config: Record<string, any>;
          fee_policy?: TenantFeePolicy | null;
          fee_policy_upgrade?: TenantFeeUpgradeOption | null;
          fee_policy_options?: TenantFeeUpgradeOption[];
          withdrawals: Array<Record<string, any>>;
        }>
      >("get", "/tenant/wallet")
    ),
  createWithdrawal: (data: { amount: number; remark?: string }) =>
    unwrap(
      http.request<ApiResult<Record<string, any>>>(
        "post",
        "/tenant/withdrawals",
        { data }
      )
    )
};

export const tenantConversionApi = {
  summary: () =>
    unwrap(
      http.request<ApiResult<TenantConversionSummary>>(
        "get",
        "/tenant/conversion/summary"
      )
    ),
  leads: (params: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<PageResult<TenantLead>>>(
        "get",
        "/tenant/conversion/leads",
        { params }
      )
    ),
  createLead: (data: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<{ lead: TenantLead }>>(
        "post",
        "/tenant/conversion/leads",
        { data }
      )
    ),
  updateLead: (id: string, data: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<{ lead: TenantLead }>>(
        "patch",
        `/tenant/conversion/leads/${id}`,
        { data }
      )
    ),
  tags: () =>
    unwrap(
      http.request<ApiResult<{ items: Array<Record<string, any>> }>>(
        "get",
        "/tenant/conversion/tags"
      )
    ),
  createTag: (data: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<Record<string, any>>>(
        "post",
        "/tenant/conversion/tags",
        { data }
      )
    ),
  welcome: () =>
    unwrap(
      http.request<ApiResult<{ automation: Record<string, any> }>>(
        "get",
        "/tenant/conversion/welcome-automation"
      )
    ),
  saveWelcome: (data: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<{ saved: boolean }>>(
        "put",
        "/tenant/conversion/welcome-automation",
        { data }
      )
    ),
  coupons: () =>
    unwrap(
      http.request<ApiResult<{ items: Array<Record<string, any>> }>>(
        "get",
        "/tenant/conversion/coupons"
      )
    ),
  createCoupon: (data: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<Record<string, any>>>(
        "post",
        "/tenant/conversion/coupons",
        { data }
      )
    ),
  inviteCodes: () =>
    unwrap(
      http.request<ApiResult<{ items: Array<Record<string, any>> }>>(
        "get",
        "/tenant/conversion/invite-codes"
      )
    ),
  createInviteCode: (data: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<Record<string, any>>>(
        "post",
        "/tenant/conversion/invite-codes",
        { data }
      )
    ),
  campaigns: () =>
    unwrap(
      http.request<ApiResult<{ items: Array<Record<string, any>> }>>(
        "get",
        "/tenant/conversion/campaigns"
      )
    ),
  createCampaign: (data: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<Record<string, any>>>(
        "post",
        "/tenant/conversion/campaigns",
        { data }
      )
    )
};

export const tenantAiApi = {
  usage: () =>
    unwrap(http.request<ApiResult<TenantAiUsage>>("get", "/tenant/ai/usage")),
  reports: (params: Record<string, any>) =>
    unwrap(
      http.request<
        ApiResult<PageResult<TenantAiReport> & { usage: TenantAiUsage }>
      >("get", "/tenant/ai/reports", { params })
    ),
  generateDailyReport: (data: Record<string, any>) =>
    unwrapAiGeneration(
      http.request<ApiResult<{ report: TenantAiReport }>>(
        "post",
        "/tenant/ai/reports/daily",
        { data }
      )
    ),
  generateCampaignCopy: (data: Record<string, any>) =>
    unwrapAiGeneration(
      http.request<ApiResult<{ report: TenantAiReport }>>(
        "post",
        "/tenant/ai/campaign-copy",
        { data }
      )
    ),
  confirmReport: (id: string, data: Record<string, any>) =>
    unwrap(
      http.request<
        ApiResult<{ confirmation_id: string; report: TenantAiReport }>
      >("post", `/tenant/ai/reports/${id}/confirm`, { data })
    )
};

export const saasApi = {
  plans: () =>
    unwrap(
      http.request<ApiResult<{ items: Array<Record<string, any>> }>>(
        "get",
        "/saas/plans"
      )
    ),
  createPlan: (data: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<{ plan: Record<string, any> }>>(
        "post",
        "/saas/plans",
        { data }
      )
    ),
  updatePlan: (id: string, data: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<{ plan: Record<string, any> }>>(
        "patch",
        `/saas/plans/${id}`,
        { data }
      )
    ),
  tenants: (params: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<PageResult<Record<string, any>>>>(
        "get",
        "/saas/tenants",
        { params }
      )
    ),
  createTenant: (data: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<{ tenant: Record<string, any> }>>(
        "post",
        "/saas/tenants",
        { data }
      )
    ),
  updateTenant: (id: string, data: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<{ tenant: Record<string, any> }>>(
        "patch",
        `/saas/tenants/${id}`,
        { data }
      )
    ),
  createOrder: (tenantId: string, data: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<{ order: Record<string, any> }>>(
        "post",
        `/saas/tenants/${tenantId}/orders`,
        { data }
      )
    ),
  orders: (params: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<PageResult<Record<string, any>>>>(
        "get",
        "/saas/orders",
        { params }
      )
    )
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
        ApiResult<{
          report: ReportItem;
          target_action_result: Record<string, any>;
        }>
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
    unwrap(
      http.request<ApiResult<AdminUser>>("post", "/admin-users", { data })
    ),
  update: (id: string, data: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<AdminUser>>("patch", `/admin-users/${id}`, {
        data
      })
    ),
  resetPassword: (id: string, data: { password?: string }) =>
    unwrap(
      http.request<
        ApiResult<{ id: string; username: string; password: string }>
      >("post", `/admin-users/${id}/reset-password`, { data })
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
  changePassword: (data: { old_password: string; new_password: string }) =>
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
  circle_name?: string;
  circle_code?: string;
  creator_id?: string;
  creator_dxq_id?: string;
  creator_nickname?: string;
  title: string;
  summary: string;
  cover_url: string;
  preview_text?: string;
  preview_images?: string[];
  remark?: string;
  delivery_type: string;
  price: number;
  currency: string;
  resource_type?: string;
  sales_count: number;
  comment_count: number;
  is_pinned: boolean;
  category_id?: string;
  category_name?: string;
  share_token?: string;
  h5_status?: "visible" | "hidden";
  status: "draft" | "published" | "offline" | "disabled" | "deleted";
  audit_status: string;
  purchase_count: number;
  refund_count: number;
  revenue_amount?: number;
  code_stock_total: number;
  code_stock_available: number;
  code_stock_assigned?: number;
  resource_url?: string;
  resource_access_code?: string;
  doc_content?: string;
  doc_url?: string;
  code_items?: string[];
  public_path?: string;
  store_path?: string;
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

export type AfterSaleAction = {
  id: string;
  after_sale_id: string;
  order_id: string;
  circle_id: string;
  actor_type: "buyer" | "creator" | "platform" | "system";
  actor_id: string;
  actor_name: string;
  action: string;
  summary: string;
  payload: Record<string, any>;
  created_at: string;
};

export type BuyerRiskLevel = "normal" | "watch" | "blocked";

export type BuyerRiskProfile = {
  id: string;
  buyer_key: string;
  user_id: string;
  buyer_contact_hash: string;
  buyer_contact_mask: string;
  risk_level: BuyerRiskLevel;
  after_sale_count_30d: number;
  refund_count_30d: number;
  blocked_until?: string | null;
  reason: string;
  note: string;
  is_blocking: boolean;
  created_at: string;
  updated_at: string;
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

export type PlatformRevenueBusinessType =
  | "order_fee"
  | "refund_reverse"
  | "subscription"
  | "manual_adjust";

export type PlatformRevenueSummary = {
  ledger_count: number;
  gmv_amount: number;
  service_fee_amount: number;
  refund_reverse_amount: number;
  channel_cost_amount: number;
  net_revenue_amount: number;
};

export type PlatformRevenueDaySummary = PlatformRevenueSummary & {
  day: string;
};

export type PlatformRevenueTypeSummary = {
  business_type: PlatformRevenueBusinessType;
  ledger_count: number;
  gross_amount: number;
  platform_fee_amount: number;
  channel_cost_amount: number;
  net_revenue_amount: number;
};

export type PlatformRevenueCircleSummary = {
  circle_id: string;
  circle_name: string;
  ledger_count: number;
  gmv_amount: number;
  net_revenue_amount: number;
};

export type PlatformRevenueLedgerItem = {
  id: string;
  business_type: PlatformRevenueBusinessType;
  business_id: string;
  order_id: string;
  circle_id: string;
  circle_name: string;
  gross_amount: number;
  platform_fee_amount: number;
  channel_cost_amount: number;
  net_revenue_amount: number;
  status: string;
  pay_channel: string;
  provider_trade_no: string;
  fee_rate_bps: number;
  fee_policy_id: string;
  adjustment_reason: string;
  adjustment_type: string;
  related_ledger_id: string;
  reverse_of: string;
  created_at: string;
  updated_at: string;
};

export type PlatformRevenueExportColumn = {
  key: string;
  label: string;
};

export type PlatformRevenueExportPreview = {
  columns: PlatformRevenueExportColumn[];
  items: PlatformRevenueLedgerItem[];
  summary: PlatformRevenueSummary;
  total: number;
  preview_count: number;
  limit: number;
  export_limit: number;
  generated_at: string;
};

export type FinanceReconciliationIssueType =
  | "missing_settlement"
  | "missing_revenue_ledger"
  | "settlement_revenue_mismatch"
  | "negative_order_fee"
  | "stale_payment_intent"
  | "payment_amount_mismatch"
  | "refund_pending"
  | "withdrawal_pending"
  | "withdrawal_allocation_mismatch";

export type FinanceReconciliationSeverity = "exception" | "warning";

export type FinanceReconciliationBusinessType =
  | "payment"
  | "settlement"
  | "refund"
  | "withdrawal"
  | "revenue";

export type FinanceReconciliationSummary = {
  total: number;
  exception_count: number;
  warning_count: number;
  involved_amount: number;
  difference_amount: number;
};

export type FinanceReconciliationMarkStatus =
  | "watching"
  | "resolved"
  | "ignored";

export type FinanceReconciliationIssueCount = {
  issue_type: FinanceReconciliationIssueType | string;
  count: number;
};

export type FinanceReconciliationItem = {
  id: string;
  issue_type: FinanceReconciliationIssueType | string;
  severity: FinanceReconciliationSeverity | string;
  business_type: FinanceReconciliationBusinessType | string;
  ref_type: string;
  ref_id: string;
  title: string;
  description: string;
  suggestion: string;
  circle_id: string;
  circle_name: string;
  order_id: string;
  pay_channel: string;
  third_trade_no: string;
  amount: number;
  platform_fee_amount: number;
  difference_amount: number;
  occurred_at: string;
  updated_at: string;
  mark_status: FinanceReconciliationMarkStatus | string;
  mark_note: string;
  mark_updated_at: string;
  mark_resolved_at: string;
  mark_operator_username: string;
};

export type FinanceReconciliationMark = {
  id: string;
  issue_key: string;
  issue_type: string;
  ref_type: string;
  ref_id: string;
  status: FinanceReconciliationMarkStatus | string;
  note: string;
  created_at: string;
  updated_at: string;
  resolved_at: string;
  operator_username: string;
};

export type PlatformFeePolicy = {
  id: string;
  scope_type: "global" | "plan" | "tenant" | "env" | string;
  scope_id: string;
  name: string;
  fee_bps: number;
  min_fee_amount: number;
  max_fee_amount: number | null;
  status: string;
  effective_start_at?: string | null;
  effective_end_at?: string | null;
  note: string;
  source: string;
  created_at: string;
  updated_at: string;
};

export type PlatformFeePolicyPlan = {
  id: string;
  code: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  status: string;
  fee_policy: PlatformFeePolicy | null;
  effective_policy: PlatformFeePolicy;
};

export type PlatformFeePolicyTenant = {
  id: string;
  circle_id: string;
  circle_name: string;
  owner_user_id: string;
  owner_nickname: string;
  owner_dxq_id: string;
  plan_id: string;
  plan_code: string;
  plan_name: string;
  status: string;
  trial_ends_at?: string | null;
  paid_until?: string | null;
  updated_at: string;
  fee_policy: PlatformFeePolicy | null;
  plan_policy: PlatformFeePolicy | null;
  effective_policy: PlatformFeePolicy;
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
    unwrap(
      http.request<ApiResult<ManagedUser>>("patch", `/users/${id}`, { data })
    )
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
      http.request<ApiResult<ManagedCircle>>("patch", `/circles/${id}`, {
        data
      })
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
          actions: AfterSaleAction[];
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

export const buyerRiskApi = {
  list: (params: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<PageResult<BuyerRiskProfile>>>(
        "get",
        "/risk/buyers",
        { params }
      )
    ),
  create: (data: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<{ profile: BuyerRiskProfile }>>(
        "post",
        "/risk/buyers",
        { data }
      )
    ),
  update: (id: string, data: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<{ profile: BuyerRiskProfile }>>(
        "patch",
        `/risk/buyers/${id}`,
        { data }
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

export const platformRevenueApi = {
  summary: (params: Record<string, any>) =>
    unwrap(
      http.request<
        ApiResult<{
          summary: PlatformRevenueSummary;
          by_type: PlatformRevenueTypeSummary[];
          by_day: PlatformRevenueDaySummary[];
          top_circles: PlatformRevenueCircleSummary[];
        }>
      >("get", "/finance/revenue/summary", { params })
    ),
  ledger: (params: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<PageResult<PlatformRevenueLedgerItem>>>(
        "get",
        "/finance/revenue/ledger",
        { params }
      )
    ),
  exportPreview: (params: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<PlatformRevenueExportPreview>>(
        "get",
        "/finance/revenue/export-preview",
        { params }
      )
    ),
  exportCsv: (params: Record<string, any>) =>
    http.request<Blob>("get", "/finance/revenue/export", {
      params,
      responseType: "blob",
      timeout: 60000
    }),
  createAdjustment: (data: Record<string, any>) =>
    unwrap(
      http.request<
        ApiResult<{
          item: PlatformRevenueLedgerItem;
          adjust_limit_amount: number;
        }>
      >("post", "/finance/revenue/adjustments", { data })
    ),
  reverseAdjustment: (ledgerId: string, data: Record<string, any>) =>
    unwrap(
      http.request<
        ApiResult<{
          item: PlatformRevenueLedgerItem;
          reversed_id: string;
        }>
      >("post", `/finance/revenue/adjustments/${ledgerId}/reverse`, { data })
    )
};

export const financeReconciliationApi = {
  list: (params: Record<string, any>) =>
    unwrap(
      http.request<
        ApiResult<
          PageResult<FinanceReconciliationItem> & {
            summary: FinanceReconciliationSummary;
            by_issue_type: FinanceReconciliationIssueCount[];
            generated_at: string;
          }
        >
      >("get", "/finance/reconciliation", { params })
    ),
  detail: (issueKey: string) =>
    unwrap(
      http.request<
        ApiResult<{
          item: FinanceReconciliationItem;
          mark: FinanceReconciliationMark | null;
          related: Record<string, any>;
        }>
      >("get", `/finance/reconciliation/issues/${encodeURIComponent(issueKey)}`)
    ),
  mark: (
    issueKey: string,
    data: { status: FinanceReconciliationMarkStatus; note: string }
  ) =>
    unwrap(
      http.request<
        ApiResult<{
          item: FinanceReconciliationItem;
          mark: FinanceReconciliationMark;
        }>
      >(
        "post",
        `/finance/reconciliation/issues/${encodeURIComponent(issueKey)}/mark`,
        {
          data
        }
      )
    )
};

export const platformFeePoliciesApi = {
  overview: (params: Record<string, any>) =>
    unwrap(
      http.request<
        ApiResult<{
          fallback_policy: PlatformFeePolicy;
          global_policy: PlatformFeePolicy | null;
          plans: PlatformFeePolicyPlan[];
          tenants: PageResult<PlatformFeePolicyTenant>;
          policies: PlatformFeePolicy[];
        }>
      >("get", "/finance/fee-policies", { params })
    ),
  updateGlobal: (data: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<{ policy: PlatformFeePolicy }>>(
        "put",
        "/finance/fee-policies/global",
        { data }
      )
    ),
  updatePlan: (planId: string, data: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<{ policy: PlatformFeePolicy }>>(
        "put",
        `/finance/fee-policies/plans/${planId}`,
        { data }
      )
    ),
  updateTenant: (circleId: string, data: Record<string, any>) =>
    unwrap(
      http.request<ApiResult<{ policy: PlatformFeePolicy }>>(
        "put",
        `/finance/fee-policies/tenants/${circleId}`,
        { data }
      )
    ),
  disable: (id: string, data: { note: string }) =>
    unwrap(
      http.request<ApiResult<{ policy: PlatformFeePolicy }>>(
        "delete",
        `/finance/fee-policies/${id}`,
        { data }
      )
    )
};
