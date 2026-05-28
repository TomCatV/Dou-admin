import {
  auditStatusMap,
  targetActionLabels,
  targetTypeLabels,
  userStatusMap,
  circleStatusMap,
  resourceCardStatusMap,
  deliveryTypeLabels,
  adminRoleLabels
} from "@/utils/labels";

export type ReadableRow = {
  label: string;
  value: string;
  long?: boolean;
};

const keyLabels: Record<string, string> = {
  type: "类型",
  title: "标题",
  name: "名称",
  nickname: "昵称",
  content: "内容",
  description: "简介",
  summary: "摘要",
  intro: "简介",
  message_type: "消息类型",
  status: "状态",
  audit_status: "审核状态",
  audit_reason: "审核原因",
  reason_type: "举报原因",
  target_type: "对象类型",
  target_action: "处置动作",
  action: "动作",
  note: "备注",
  handle_note: "处理说明",
  circle_name: "圈子",
  room_name: "房间",
  sender_nickname: "发送人",
  sender_dxq_id: "发送人账号",
  owner_nickname: "圈主",
  owner_dxq_id: "圈主账号",
  creator_nickname: "创作者",
  creator_dxq_id: "创作者账号",
  reporter_nickname: "举报人",
  reporter_dxq_id: "举报人账号",
  dxq_id: "抖小圈号",
  phone: "手机号",
  price: "价格",
  amount: "金额",
  currency: "币种",
  delivery_type: "交付方式",
  is_public_square: "广场展示",
  member_count: "成员数",
  sales_count: "销量",
  comment_count: "评论数",
  created_at: "创建时间",
  updated_at: "更新时间",
  published_at: "发布时间",
  changed: "是否变更",
  max_members: "成员上限",
  max_staff: "子账号上限",
  max_resource_cards: "资源卡上限",
  max_leads: "线索上限",
  conversion: "私域线索",
  coupons: "优惠券",
  invite_codes: "邀请码"
};

const valueLabels: Record<string, Record<string, string>> = {
  type: targetTypeLabels,
  target_type: targetTypeLabels,
  target_action: targetActionLabels,
  audit_status: Object.fromEntries(
    Object.entries(auditStatusMap).map(([key, value]) => [key, value.label])
  ),
  status: {
    ...Object.fromEntries(
      Object.entries(userStatusMap).map(([key, value]) => [key, value.label])
    ),
    ...Object.fromEntries(
      Object.entries(circleStatusMap).map(([key, value]) => [key, value.label])
    ),
    ...Object.fromEntries(
      Object.entries(resourceCardStatusMap).map(([key, value]) => [
        key,
        value.label
      ])
    ),
    sent: "已发送",
    hidden: "已隐藏",
    open: "处理中",
    closed: "已关闭",
    pending: "待处理",
    processed: "已处理",
    rejected: "已驳回",
    active: "正常",
    banned: "已封禁",
    dismissed: "已解散",
    offline: "已下架",
    disabled: "已停用"
  },
  delivery_type: deliveryTypeLabels,
  role: adminRoleLabels,
  account_type: adminRoleLabels,
  message_type: {
    text: "文字",
    image: "图片",
    video: "视频",
    audio: "语音",
    file: "文件"
  }
};

const hiddenKeys = new Set([
  "id",
  "report_id",
  "target_id",
  "room_id",
  "circle_id",
  "sender_id",
  "owner_user_id",
  "creator_id",
  "creator_user_id",
  "reporter_id",
  "admin_id",
  "user_id",
  "resource_card_id",
  "before",
  "after",
  "raw",
  "raw_json",
  "target_snapshot",
  "target_snapshot_json",
  "detail",
  "detail_json",
  "avatar",
  "cover_url",
  "cover_image",
  "preview_images",
  "preview_images_json",
  "evidence_urls",
  "evidence_urls_json"
]);

const priorityKeys = [
  "title",
  "content",
  "name",
  "nickname",
  "summary",
  "description",
  "intro",
  "message_type",
  "status",
  "audit_status",
  "audit_reason",
  "circle_name",
  "room_name",
  "sender_nickname",
  "sender_dxq_id",
  "owner_nickname",
  "owner_dxq_id",
  "creator_nickname",
  "creator_dxq_id",
  "dxq_id",
  "delivery_type",
  "price",
  "amount",
  "member_count",
  "sales_count",
  "comment_count",
  "created_at",
  "updated_at"
];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function labelFor(key: string) {
  return (
    keyLabels[key] ||
    key
      .replace(/_json$/g, "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, char => char.toUpperCase())
  );
}

function valueFor(key: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "是" : "否";
  if (typeof value === "number") {
    if (key === "price" || key === "amount")
      return `￥${(value / 100).toFixed(2)}`;
    return String(value);
  }
  if (Array.isArray(value)) {
    const items = value
      .map(item => valueFor(key, item))
      .filter(item => item && item !== "-");
    return items.length ? items.join("、") : "-";
  }
  if (isPlainObject(value)) return objectSummary(value);
  const raw = String(value);
  return valueLabels[key]?.[raw] || raw;
}

function objectSummary(value: Record<string, unknown>) {
  const keys = [
    "summary",
    "title",
    "content",
    "name",
    "nickname",
    "message",
    "note"
  ];
  for (const key of keys) {
    const item = value[key];
    if (item !== undefined && item !== null && String(item).trim())
      return String(item);
  }
  const parts = Object.entries(value)
    .filter(
      ([key, item]) =>
        !hiddenKeys.has(key) &&
        item !== undefined &&
        item !== null &&
        item !== ""
    )
    .slice(0, 3)
    .map(([key, item]) => `${labelFor(key)}：${valueFor(key, item)}`);
  return parts.length ? parts.join("；") : "-";
}

export function readableRows(
  value: Record<string, unknown> | null | undefined,
  options: { limit?: number; includeKeys?: string[] } = {}
): ReadableRow[] {
  if (!value || typeof value !== "object") return [];
  const limit = options.limit ?? 14;
  const keys = [
    ...(options.includeKeys || []),
    ...priorityKeys,
    ...Object.keys(value)
  ].filter((key, index, array) => array.indexOf(key) === index);

  return keys
    .filter(key => Object.prototype.hasOwnProperty.call(value, key))
    .filter(key => !hiddenKeys.has(key))
    .map(key => ({
      label: labelFor(key),
      value: valueFor(key, value[key]),
      long: [
        "content",
        "description",
        "summary",
        "intro",
        "note",
        "handle_note"
      ].includes(key)
    }))
    .filter(row => row.value && row.value !== "-")
    .slice(0, limit);
}

export function readableChangeRows(
  value: Record<string, unknown> | null | undefined
) {
  if (!value || typeof value !== "object") return [];
  const rows = readableRows(value, { limit: 10 });
  const before = isPlainObject(value.before) ? objectSummary(value.before) : "";
  const after = isPlainObject(value.after) ? objectSummary(value.after) : "";
  if (before) rows.push({ label: "变更前", value: before, long: true });
  if (after) rows.push({ label: "变更后", value: after, long: true });
  return rows;
}
