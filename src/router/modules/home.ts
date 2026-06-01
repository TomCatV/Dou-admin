const Layout = () => import("@/layout/index.vue");

const allRoles = [
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
];

const platformRoles = [
  "super_admin",
  "admin_l1",
  "admin_l2",
  "admin_l3",
  "operator",
  "viewer"
];

const tenantRoles = [
  "tenant_owner",
  "tenant_staff",
  "tenant_viewer",
  "circle_admin"
];

const tenantManageRoles = ["tenant_owner", "tenant_staff", "circle_admin"];

export default [
  {
    path: "/",
    name: "Home",
    component: Layout,
    redirect: "/dashboard",
    meta: {
      title: "根布局",
      showLink: false,
      rank: 0
    }
  },
  {
    path: "/overview",
    name: "OverviewModule",
    redirect: "/dashboard",
    meta: {
      icon: "ep/home-filled",
      title: "经营总览",
      rank: 1
    },
    children: [
      {
        path: "/dashboard",
        name: "Dashboard",
        component: () => import("@/views/welcome/index.vue"),
        meta: {
          title: "工作台",
          icon: "ep/data-line",
          showParent: true,
          roles: allRoles
        }
      }
    ]
  },
  {
    path: "/platform-governance",
    name: "PlatformGovernanceModule",
    redirect: "/users",
    meta: {
      icon: "ep/operation",
      title: "平台治理",
      rank: 2
    },
    children: [
      {
        path: "/users",
        name: "ManagedUsers",
        component: () => import("@/views/users/index.vue"),
        meta: {
          title: "用户管理",
          icon: "ep/user",
          roles: allRoles
        }
      },
      {
        path: "/circles",
        name: "ManagedCircles",
        component: () => import("@/views/circles/index.vue"),
        meta: {
          title: "圈子管理",
          icon: "ep/connection",
          roles: allRoles
        }
      },
      {
        path: "/resource-cards",
        name: "ManagedResourceCards",
        component: () => import("@/views/resource-cards/index.vue"),
        meta: {
          title: "资源卡管理",
          icon: "ep/goods",
          roles: allRoles
        }
      },
      {
        path: "/manual-reviews",
        name: "ManualReviews",
        component: () => import("@/views/manual-reviews/index.vue"),
        meta: {
          title: "人工复核",
          icon: "ep/view",
          roles: allRoles
        }
      },
      {
        path: "/risk/buyers",
        name: "BuyerRiskProfiles",
        component: () => import("@/views/risk/buyers.vue"),
        meta: {
          title: "买家风控",
          icon: "ep/warn-triangle-filled",
          roles: ["super_admin", "admin_l1"]
        }
      },
      {
        path: "/reports",
        name: "Reports",
        component: () => import("@/views/reports/index.vue"),
        meta: {
          title: "举报处理",
          icon: "ep/warning",
          roles: allRoles
        }
      }
    ]
  },
  {
    path: "/account-permission",
    name: "AccountPermissionModule",
    redirect: "/admin-users",
    meta: {
      icon: "ep/user-filled",
      title: "账号权限",
      rank: 3
    },
    children: [
      {
        path: "/admin-users",
        name: "AdminUsers",
        component: () => import("@/views/admin-users/index.vue"),
        meta: {
          title: "后台账号",
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
      }
    ]
  },
  {
    path: "/tenant-operations",
    name: "TenantOperationsModule",
    redirect: "/tenant/dashboard",
    meta: {
      icon: "ep/monitor",
      title: "圈主后台",
      rank: 4
    },
    children: [
      {
        path: "/tenant/dashboard",
        name: "TenantDashboard",
        component: () => import("@/views/tenant/dashboard.vue"),
        meta: {
          title: "圈主工作台",
          icon: "ep/monitor",
          roles: tenantRoles
        }
      },
      {
        path: "/tenant/circle",
        name: "TenantCircle",
        component: () => import("@/views/tenant/circle.vue"),
        meta: {
          title: "店铺资料",
          icon: "ep/connection",
          roles: tenantRoles
        }
      },
      {
        path: "/tenant/members",
        name: "TenantMembers",
        component: () => import("@/views/tenant/members.vue"),
        meta: {
          title: "圈内成员",
          icon: "ep/user",
          roles: tenantRoles
        }
      },
      {
        path: "/tenant/resources",
        name: "TenantResources",
        component: () => import("@/views/tenant/resources.vue"),
        meta: {
          title: "圈内资源",
          icon: "ep/goods",
          roles: tenantRoles
        }
      }
    ]
  },
  {
    path: "/private-conversion",
    name: "PrivateConversionModule",
    redirect: "/tenant/conversion/leads",
    meta: {
      icon: "ep/promotion",
      title: "私域转化",
      rank: 5
    },
    children: [
      {
        path: "/tenant/conversion/leads",
        name: "TenantConversionLeads",
        component: () => import("@/views/tenant/conversion-leads.vue"),
        meta: {
          title: "私域线索",
          icon: "ep/user-filled",
          roles: tenantManageRoles
        }
      },
      {
        path: "/tenant/conversion/tools",
        name: "TenantConversionTools",
        component: () => import("@/views/tenant/conversion-tools.vue"),
        meta: {
          title: "转化工具",
          icon: "ep/promotion",
          roles: tenantManageRoles
        }
      },
      {
        path: "/tenant/conversion/funnel",
        name: "TenantConversionFunnel",
        component: () => import("@/views/tenant/conversion-funnel.vue"),
        meta: {
          title: "转化漏斗",
          icon: "ep/data-analysis",
          roles: tenantRoles
        }
      }
    ]
  },
  {
    path: "/trade-funds",
    name: "TradeFundsModule",
    redirect: "/tenant/orders",
    meta: {
      icon: "ep/wallet",
      title: "交易资金",
      rank: 6
    },
    children: [
      {
        path: "/tenant/orders",
        name: "TenantOrders",
        component: () => import("@/views/tenant/orders.vue"),
        meta: {
          title: "订单售后",
          icon: "ep/tickets",
          roles: tenantRoles
        }
      },
      {
        path: "/tenant/wallet",
        name: "TenantWallet",
        component: () => import("@/views/tenant/wallet.vue"),
        meta: {
          title: "钱包提现",
          icon: "ep/wallet",
          roles: tenantManageRoles
        }
      },
      {
        path: "/finance/revenue",
        name: "PlatformRevenue",
        component: () => import("@/views/finance/revenue.vue"),
        meta: {
          title: "平台营收",
          icon: "ep/data-line",
          roles: ["super_admin", "admin_l1", "admin_l2", "operator"]
        }
      },
      {
        path: "/finance/reconciliation",
        name: "FinanceReconciliation",
        component: () => import("@/views/finance/reconciliation.vue"),
        meta: {
          title: "对账中心",
          icon: "ep/connection",
          roles: ["super_admin", "admin_l1", "admin_l2"]
        }
      },
      {
        path: "/finance/fee-policies",
        name: "PlatformFeePolicies",
        component: () => import("@/views/finance/fee-policies.vue"),
        meta: {
          title: "费率策略",
          icon: "ep/setting",
          roles: ["super_admin", "admin_l1"]
        }
      },
      {
        path: "/after-sales",
        name: "AfterSales",
        component: () => import("@/views/after-sales/index.vue"),
        meta: {
          title: "售后退款",
          icon: "ep/service",
          roles: allRoles
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
      }
    ]
  },
  {
    path: "/tenant-ai",
    name: "TenantAiModule",
    redirect: "/tenant/ai",
    meta: {
      icon: "ep/magic-stick",
      title: "AI 经营",
      rank: 7
    },
    children: [
      {
        path: "/tenant/ai",
        name: "TenantAiAssistant",
        component: () => import("@/views/tenant/ai.vue"),
        meta: {
          title: "经营助手",
          icon: "ep/magic-stick",
          showParent: true,
          roles: tenantRoles
        }
      }
    ]
  },
  {
    path: "/saas-billing",
    name: "SaasBillingModule",
    redirect: "/saas",
    meta: {
      icon: "ep/coin",
      title: "SaaS计费",
      rank: 8
    },
    children: [
      {
        path: "/saas",
        name: "SaasBilling",
        component: () => import("@/views/saas/index.vue"),
        meta: {
          title: "套餐订阅",
          icon: "ep/coin",
          showParent: true,
          roles: ["super_admin", "admin_l1", "admin_l2", "admin_l3"]
        }
      }
    ]
  },
  {
    path: "/system-security",
    name: "SystemSecurityModule",
    redirect: "/audit-logs",
    meta: {
      icon: "ep/lock",
      title: "系统安全",
      rank: 9
    },
    children: [
      {
        path: "/audit-logs",
        name: "AuditLogs",
        component: () => import("@/views/audit-logs/index.vue"),
        meta: {
          title: "操作日志",
          icon: "ep/document",
          showParent: true,
          roles: platformRoles
        }
      },
      {
        path: "/account/security",
        name: "AccountSecurity",
        component: () => import("@/views/account/security.vue"),
        meta: {
          title: "修改密码",
          icon: "ep/lock",
          showLink: false,
          roles: allRoles
        }
      }
    ]
  }
] satisfies Array<RouteConfigsTable>;
