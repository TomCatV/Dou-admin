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
  operator: "运营管理员",
  viewer: "只读管理员"
};

export const adminRoleTagTypes: Record<string, string> = {
  super_admin: "danger",
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
