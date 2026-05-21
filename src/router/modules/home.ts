const Layout = () => import("@/layout/index.vue");

export default {
  path: "/",
  name: "Home",
  component: Layout,
  redirect: "/dashboard",
  meta: {
    icon: "ep/home-filled",
    title: "\u5de5\u4f5c\u53f0",
    rank: 0
  },
  children: [
    {
      path: "/dashboard",
      name: "Dashboard",
      component: () => import("@/views/welcome/index.vue"),
      meta: {
        title: "\u5de5\u4f5c\u53f0",
        icon: "ep/data-line"
      }
    },
    {
      path: "/reports",
      name: "Reports",
      component: () => import("@/views/reports/index.vue"),
      meta: {
        title: "\u4e3e\u62a5\u5904\u7406",
        icon: "ep/warning"
      }
    },
    {
      path: "/audit-logs",
      name: "AuditLogs",
      component: () => import("@/views/audit-logs/index.vue"),
      meta: {
        title: "\u64cd\u4f5c\u65e5\u5fd7",
        icon: "ep/document"
      }
    }
  ]
} satisfies RouteConfigsTable;
