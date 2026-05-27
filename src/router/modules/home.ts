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
        icon: "ep/data-line",
        roles: [
          "super_admin",
          "admin_l1",
          "admin_l2",
          "admin_l3",
          "tenant_owner",
          "tenant_staff",
          "tenant_viewer",
          "operator",
          "viewer",
          "circle_admin"
        ]
      }
    },
    {
      path: "/reports",
      name: "Reports",
      component: () => import("@/views/reports/index.vue"),
      meta: {
        title: "\u4e3e\u62a5\u5904\u7406",
        icon: "ep/warning",
        roles: [
          "super_admin",
          "admin_l1",
          "admin_l2",
          "admin_l3",
          "tenant_owner",
          "tenant_staff",
          "tenant_viewer",
          "operator",
          "viewer",
          "circle_admin"
        ]
      }
    },
    {
      path: "/audit-logs",
      name: "AuditLogs",
      component: () => import("@/views/audit-logs/index.vue"),
      meta: {
        title: "\u64cd\u4f5c\u65e5\u5fd7",
        icon: "ep/document",
        roles: ["super_admin", "admin_l1", "admin_l2", "admin_l3", "operator", "viewer"]
      }
    },
    {
      path: "/users",
      name: "ManagedUsers",
      component: () => import("@/views/users/index.vue"),
      meta: {
        title: "用户管理",
        icon: "ep/user",
        roles: [
          "super_admin",
          "admin_l1",
          "admin_l2",
          "admin_l3",
          "tenant_owner",
          "tenant_staff",
          "tenant_viewer",
          "operator",
          "viewer",
          "circle_admin"
        ]
      }
    },
    {
      path: "/circles",
      name: "ManagedCircles",
      component: () => import("@/views/circles/index.vue"),
      meta: {
        title: "圈子管理",
        icon: "ep/connection",
        roles: [
          "super_admin",
          "admin_l1",
          "admin_l2",
          "admin_l3",
          "tenant_owner",
          "tenant_staff",
          "tenant_viewer",
          "operator",
          "viewer",
          "circle_admin"
        ]
      }
    },
    {
      path: "/resource-cards",
      name: "ManagedResourceCards",
      component: () => import("@/views/resource-cards/index.vue"),
      meta: {
        title: "资源卡管理",
        icon: "ep/goods",
        roles: [
          "super_admin",
          "admin_l1",
          "admin_l2",
          "admin_l3",
          "tenant_owner",
          "tenant_staff",
          "tenant_viewer",
          "operator",
          "viewer",
          "circle_admin"
        ]
      }
    },
    {
      path: "/manual-reviews",
      name: "ManualReviews",
      component: () => import("@/views/manual-reviews/index.vue"),
      meta: {
        title: "人工复核",
        icon: "ep/view",
        roles: [
          "super_admin",
          "admin_l1",
          "admin_l2",
          "admin_l3",
          "tenant_owner",
          "tenant_staff",
          "tenant_viewer",
          "operator",
          "viewer",
          "circle_admin"
        ]
      }
    },
    {
      path: "/after-sales",
      name: "AfterSales",
      component: () => import("@/views/after-sales/index.vue"),
      meta: {
        title: "售后退款",
        icon: "ep/service",
        roles: [
          "super_admin",
          "admin_l1",
          "admin_l2",
          "admin_l3",
          "tenant_owner",
          "tenant_staff",
          "tenant_viewer",
          "operator",
          "viewer",
          "circle_admin"
        ]
      }
    },
    {
      path: "/withdrawals",
      name: "Withdrawals",
      component: () => import("@/views/withdrawals/index.vue"),
      meta: {
        title: "提现审核",
        icon: "ep/wallet",
        roles: ["super_admin", "admin_l1", "admin_l2", "operator", "viewer"]
      }
    },
    {
      path: "/admin-users",
      name: "AdminUsers",
      component: () => import("@/views/admin-users/index.vue"),
      meta: {
        title: "\u8d26\u53f7\u4e0e\u6743\u9650",
        icon: "ep/user-filled",
        roles: ["super_admin", "admin_l1", "admin_l2", "admin_l3"]
      }
    },
    {
      path: "/account-groups",
      name: "AccountGroups",
      component: () => import("@/views/account-groups/index.vue"),
      meta: {
        title: "账号分组",
        icon: "ep/collection",
        roles: ["super_admin"]
      }
    },
    {
      path: "/account/security",
      name: "AccountSecurity",
      component: () => import("@/views/account/security.vue"),
      meta: {
        title: "\u4fee\u6539\u5bc6\u7801",
        icon: "ep/lock",
        roles: [
          "super_admin",
          "admin_l1",
          "admin_l2",
          "admin_l3",
          "tenant_owner",
          "tenant_staff",
          "tenant_viewer",
          "operator",
          "viewer",
          "circle_admin"
        ]
      }
    }
  ]
} satisfies RouteConfigsTable;
