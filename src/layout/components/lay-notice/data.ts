export type NoticeSeverity = "primary" | "success" | "warning" | "info" | "danger";

export interface ListItem {
  id: string;
  avatar?: string;
  title: string;
  datetime: string;
  type: string;
  description: string;
  status?: NoticeSeverity;
  extra?: string;
  routePath?: string;
  count?: number;
}

export interface TabItem {
  key: string;
  name: string;
  list: ListItem[];
  emptyText: string;
}

export const noticeTabs: Array<Omit<TabItem, "list">> = [
  {
    key: "todo",
    name: "治理待办",
    emptyText: "暂无治理待办"
  },
  {
    key: "finance",
    name: "资金相关",
    emptyText: "暂无资金提醒"
  },
  {
    key: "expiry",
    name: "到期相关",
    emptyText: "暂无到期提醒"
  }
];
