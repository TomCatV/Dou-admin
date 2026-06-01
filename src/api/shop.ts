import Axios, { type AxiosResponse } from "axios";

export type ShopApiResult<T> = {
  code: number;
  message: string;
  data: T;
};

export type PublicStore = {
  id: string;
  store_key: string;
  name: string;
  description: string;
  cover_image: string;
  owner_nickname?: string;
  owner_avatar?: string;
  status: "open" | "closed" | string;
  closed_reason?: string;
  closed_message?: string;
  member_count?: number;
  resource_count?: number;
};

export type PublicCategory = {
  id: string;
  name: string;
  product_count: number;
};

export type PublicProduct = {
  id: string;
  product_key: string;
  circle_id: string;
  store_key: string;
  title: string;
  summary: string;
  cover_url: string;
  preview_text: string;
  preview_images: string[];
  category_id: string;
  category_name: string;
  delivery_type: "resource" | "code" | string;
  price: number;
  currency: string;
  sales_count: number;
  comment_count: number;
  code_stock_available: number;
  code_stock_total: number;
  stock_status: "available" | "sold_out" | string;
  public_path: string;
  store_path: string;
  published_at?: string | null;
};

export type ShopStorePayload = {
  store: PublicStore;
  categories: PublicCategory[];
  products: PublicProduct[];
};

export type ShopProductPayload = {
  store: PublicStore;
  product: PublicProduct;
};

export type OrderDraft = {
  id: string;
  order_id: string;
  circle_id: string;
  resource_card_id: string;
  buyer_contact: string;
  source_channel: string;
  product_snapshot: PublicProduct;
  original_amount: number;
  discount_amount: number;
  coupon_code: string;
  invite_code: string;
  campaign_name: string;
  attribution_source: string;
  amount: number;
  status: "draft" | "expired" | string;
  expires_at: string;
  created_at: string;
  updated_at: string;
};

export type PromotionQuote = {
  original_amount: number;
  discount_amount: number;
  payable_amount: number;
  coupon: Record<string, any> | null;
  invite_code: Record<string, any> | null;
  campaign: Record<string, any> | null;
  attribution_source: string;
  source_channel: string;
};

export type OrderDraftPayload = {
  order_draft: OrderDraft;
  quote?: PromotionQuote;
  payment_channels?: Record<string, { enabled: boolean }>;
  next_action?: {
    type: string;
    message: string;
  };
};

export type PaymentChannel = "wechat_native" | "alipay_precreate";

export type PaymentIntent = {
  id: string;
  order_id: string;
  draft_id: string;
  circle_id: string;
  channel: PaymentChannel | string;
  out_trade_no: string;
  amount: number;
  currency: string;
  status:
    | "created"
    | "qr_issued"
    | "paid"
    | "closed"
    | "failed"
    | "unknown"
    | string;
  qr_code_url: string;
  expires_at: string;
  paid_at?: string | null;
  closed_at?: string | null;
  last_error_code?: string;
  last_error_message?: string;
  created_at: string;
  updated_at: string;
};

export type ShopOrderPayload = {
  order: PublicOrder;
  order_draft?: OrderDraft;
  reused?: boolean;
  payment_channels?: Record<string, { enabled: boolean }>;
};

export type PublicOrder = {
  id: string;
  circle_id: string;
  resource_card_id: string;
  amount: number;
  original_amount?: number;
  discount_amount?: number;
  coupon_code?: string;
  invite_code?: string;
  campaign_name?: string;
  attribution_source?: string;
  currency: string;
  status: string;
  paid_at?: string | null;
  product_title?: string;
  product_summary?: string;
  product_cover_url?: string;
  resource_title?: string;
  resource_summary?: string;
  resource_cover_url?: string;
  buyer_contact_hint?: string;
  source_channel?: string;
  can_report?: boolean;
  delivery?: {
    type: "resource" | "code" | string;
    resource_url: string;
    resource_access_code: string;
    doc_content: string;
    doc_url: string;
    assigned_code: string;
    assigned_code_at?: string | null;
  } | null;
  created_at: string;
  updated_at: string;
};

export type PublicAfterSale = {
  id: string;
  order_id: string;
  resource_card_id: string;
  complaint_type: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
};

const shopHttp = Axios.create({
  baseURL: import.meta.env.VITE_SHOP_API_BASE_URL || "/api/shop",
  timeout: 10000,
  validateStatus: status => status >= 200 && status < 500,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json"
  }
});

function isHtmlResponse(data: unknown) {
  return (
    typeof data === "string" &&
    /<(html|!doctype)\b/i.test(data.trim().slice(0, 120))
  );
}

function unwrap<T>(promise: Promise<AxiosResponse<ShopApiResult<T> | string>>) {
  return promise
    .then(res => {
      if (isHtmlResponse(res.data)) {
        throw new Error("公开页面接口未接通，请联系管理员检查 H5 服务配置");
      }
      if (!res.data || typeof res.data !== "object" || !("code" in res.data)) {
        throw new Error("公开页面接口返回异常，请稍后再试");
      }
      if (res.data.code !== 0) {
        throw new Error(res.data.message || "请求失败");
      }
      return res.data.data;
    })
    .catch(error => {
      if (Axios.isAxiosError(error)) {
        throw new Error("公开页面接口暂时不可用，请稍后再试");
      }
      throw error;
    });
}

export const shopApi = {
  store: (storeKey: string) =>
    unwrap<ShopStorePayload>(
      shopHttp.get(`/stores/${encodeURIComponent(storeKey)}`)
    ),
  product: (productKey: string) =>
    unwrap<ShopProductPayload>(
      shopHttp.get(`/products/${encodeURIComponent(productKey)}`)
    ),
  promotionQuote: (productKey: string, data: Record<string, any>) =>
    unwrap<{ quote: PromotionQuote }>(
      shopHttp.post(
        `/products/${encodeURIComponent(productKey)}/promotion-quote`,
        data
      )
    ),
  createOrderDraft: (productKey: string, data: Record<string, any>) =>
    unwrap<OrderDraftPayload>(
      shopHttp.post(
        `/products/${encodeURIComponent(productKey)}/order-drafts`,
        data
      )
    ),
  orderDraft: (draftId: string) =>
    unwrap<OrderDraftPayload>(
      shopHttp.get(`/order-drafts/${encodeURIComponent(draftId)}`)
    ),
  createOrderFromDraft: (draftId: string) =>
    unwrap<ShopOrderPayload>(
      shopHttp.post(`/order-drafts/${encodeURIComponent(draftId)}/orders`)
    ),
  createPaymentIntent: (
    orderId: string,
    data: { channel: PaymentChannel | string }
  ) =>
    unwrap<{
      order: PublicOrder;
      payment_intent: PaymentIntent;
      reused: boolean;
      already_paid?: boolean;
    }>(
      shopHttp.post(
        `/orders/${encodeURIComponent(orderId)}/payment-intents`,
        data
      )
    ),
  paymentIntent: (intentId: string) =>
    unwrap<{ payment_intent: PaymentIntent }>(
      shopHttp.get(`/payment-intents/${encodeURIComponent(intentId)}`)
    ),
  syncPaymentStatus: (orderId: string, paymentIntentId = "") =>
    unwrap<{ order: PublicOrder; payment_intent: PaymentIntent }>(
      shopHttp.post(`/orders/${encodeURIComponent(orderId)}/payment-status`, {
        payment_intent_id: paymentIntentId
      })
    ),
  closePaymentIntent: (intentId: string) =>
    unwrap<{ order: PublicOrder; payment_intent: PaymentIntent }>(
      shopHttp.post(`/payment-intents/${encodeURIComponent(intentId)}/close`)
    ),
  order: (orderId: string, buyerContact = "") =>
    unwrap<{ order: PublicOrder }>(
      shopHttp.get(`/orders/${encodeURIComponent(orderId)}`, {
        params: buyerContact ? { buyer_contact: buyerContact } : undefined
      })
    ),
  createOrderAfterSale: (orderId: string, data: Record<string, any>) =>
    unwrap<{ after_sale: PublicAfterSale; reused: boolean }>(
      shopHttp.post(`/orders/${encodeURIComponent(orderId)}/after-sales`, data)
    )
};
