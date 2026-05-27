export const reportStatusMap = {
  pending: { label: "待处理", type: "warning" },
  processed: { label: "已处理", type: "success" },
  rejected: { label: "已驳回", type: "info" }
} as const;

export const targetTypeLabels: Record<string, string> = {
  circle: "圈子",
  room: "房间",
  message: "聊天消息",
  user: "用户",
  resource_card: "资源卡",
  other: "其他"
};

export const reasonTypeLabels: Record<string, string> = {
  illegal: "违法违规内容",
  sexual_content: "色情低俗",
  gambling_content: "赌博抽奖",
  fraud: "诈骗或虚假交易",
  induced_share: "诱导分享或返利裂变",
  harassment: "骚扰辱骂",
  infringement: "侵权或隐私泄露",
  other: "其他问题"
};

export const governanceReasonOptions = [
  "资料或内容存在违规风险",
  "疑似营销、刷屏或低质内容",
  "交易或资金行为存在风控风险",
  "涉及侵权、隐私或骚扰问题",
  "举报核实后执行治理",
  "人工复核通过",
  "人工复核拒绝",
  "后台管理员手动封禁",
  "后台管理员手动解封",
  "后台管理员移出广场",
  "后台管理员恢复广场",
  "后台管理员下架资源卡",
  "后台管理员禁用资源卡",
  "后台管理员恢复发布",
  "售后审核通过并退款",
  "售后诉求不成立",
  "提现审核通过",
  "提现审核拒绝",
  "其他平台治理原因"
].map(label => ({ label, value: label }));

export const targetActionLabels: Record<string, string> = {
  none: "仅标记处理",
  ban_user: "封禁相关用户",
  hide_message: "隐藏聊天消息",
  hide_circle_from_square: "圈子退出广场",
  dismiss_circle: "解散圈子",
  close_room: "关闭房间",
  unpublish_resource_card: "下架资源卡",
  disable_resource_card: "禁用资源卡"
};

export const adminRoleLabels: Record<string, string> = {
  super_admin: "超级管理员",
  admin_l1: "1 级管理员",
  admin_l2: "2 级管理员",
  admin_l3: "3 级管理员",
  tenant_owner: "圈主账号",
  tenant_staff: "圈主子账号",
  tenant_viewer: "圈主只读账号",
  operator: "运营管理员",
  viewer: "只读管理员"
};

export const adminRoleTagTypes: Record<string, string> = {
  super_admin: "danger",
  admin_l1: "warning",
  admin_l2: "primary",
  admin_l3: "info",
  tenant_owner: "success",
  tenant_staff: "success",
  tenant_viewer: "info",
  operator: "warning",
  viewer: "info"
};

export const adminStatusMap = {
  active: { label: "启用", type: "success" },
  disabled: { label: "停用", type: "info" }
} as const;

export const adminScopeLabels: Record<string, string> = {
  global: "平台全局",
  circle: "指定圈子"
};

export const userStatusMap = {
  active: { label: "正常", type: "success" },
  banned: { label: "已封禁", type: "danger" }
} as const;

export const circleStatusMap = {
  active: { label: "正常", type: "success" },
  dismissed: { label: "已解散", type: "info" }
} as const;

export const auditStatusMap = {
  pending: { label: "待审核", type: "warning" },
  pass: { label: "通过", type: "success" },
  reject: { label: "拒绝", type: "danger" },
  manual_review: { label: "人工复核", type: "warning" }
} as const;

export const resourceCardStatusMap = {
  draft: { label: "草稿", type: "info" },
  published: { label: "已发布", type: "success" },
  offline: { label: "已下架", type: "warning" },
  disabled: { label: "已禁用", type: "danger" },
  deleted: { label: "已删除", type: "info" }
} as const;

export const deliveryTypeLabels: Record<string, string> = {
  resource: "资源交付",
  code: "卡密交付"
};

export const manualReviewTargetLabels: Record<string, string> = {
  user: "用户",
  circle: "圈子",
  resource_card: "资源卡"
};

export const afterSaleStatusMap = {
  open: { label: "处理中", type: "warning" },
  buyer_withdrew: { label: "买家撤回", type: "info" },
  refunded: { label: "已退款", type: "success" },
  rejected: { label: "已拒绝", type: "danger" },
  closed: { label: "已关闭", type: "info" }
} as const;

export const refundStatusMap = {
  none: { label: "未退款", type: "info" },
  local_refunded: { label: "本地已退", type: "success" },
  wechat_pending: { label: "微信退款中", type: "warning" },
  wechat_refunded: { label: "微信已退款", type: "success" },
  failed: { label: "退款失败", type: "danger" }
} as const;

export const complaintTypeLabels: Record<string, string> = {
  cannot_access: "无法访问资源",
  resource_mismatch: "资源与描述不符",
  code_invalid: "卡密不可用",
  duplicate_purchase: "重复购买",
  quality_issue: "质量问题",
  other: "其他问题"
};

export const withdrawalStatusMap = {
  requested: { label: "待审核", type: "warning" },
  approved: { label: "已审核", type: "primary" },
  wait_user_confirm: { label: "待用户确认", type: "warning" },
  canceling: { label: "撤销中", type: "warning" },
  success: { label: "已到账", type: "success" },
  failed: { label: "转账失败", type: "danger" },
  cancelled: { label: "已撤销", type: "info" },
  rejected: { label: "已拒绝", type: "danger" }
} as const;
