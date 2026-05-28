import Axios from "axios";

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
  amount: number;
  status: "draft" | "expired" | string;
  expires_at: string;
  created_at: string;
  updated_at: string;
};

export type OrderDraftPayload = {
  order_draft: OrderDraft;
  next_action?: {
    type: string;
    message: string;
  };
};

export type PublicOrder = {
  id: string;
  circle_id: string;
  resource_card_id: string;
  amount: number;
  currency: string;
  status: string;
  paid_at?: string | null;
  product_title?: string;
  product_summary?: string;
  product_cover_url?: string;
  resource_title?: string;
  resource_summary?: string;
  resource_cover_url?: string;
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

function unwrap<T>(promise: Promise<{ data: ShopApiResult<T> }>) {
  return promise.then(res => {
    if (res.data?.code !== 0) {
      throw new Error(res.data?.message || "请求失败");
    }
    return res.data.data;
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
  createOrderDraft: (productKey: string, data: Record<string, any>) =>
    unwrap<OrderDraftPayload>(
      shopHttp.post(
        `/products/${encodeURIComponent(productKey)}/order-drafts`,
        data
      )
    ),
  orderDraft: (draftId: string) =>
    unwrap<{ order_draft: OrderDraft }>(
      shopHttp.get(`/order-drafts/${encodeURIComponent(draftId)}`)
    ),
  order: (orderId: string) =>
    unwrap<{ order: PublicOrder }>(
      shopHttp.get(`/orders/${encodeURIComponent(orderId)}`)
    )
};
