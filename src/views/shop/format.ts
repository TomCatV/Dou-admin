export function yuan(value?: number) {
  return `¥${((Number(value) || 0) / 100).toFixed(2)}`;
}

export function shopImage(url?: string) {
  return String(url || "").trim();
}

export function statusLabel(status?: string) {
  const map: Record<string, string> = {
    draft: "待付款",
    created: "待付款",
    order_created: "待付款",
    qr_issued: "待扫码",
    unknown: "待确认",
    failed: "支付失败",
    expired: "已失效",
    paid: "已支付",
    fulfilled: "已交付",
    refunded: "已退款",
    closed: "已关闭"
  };
  return map[String(status || "")] || String(status || "处理中");
}
