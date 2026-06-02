const Layout = () => import("@/layout/index.vue");

export default [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/login/index.vue"),
    meta: {
      title: "登录",
      showLink: false
    }
  },
  {
    path: "/shop/store/:storeKey?",
    name: "PublicShopStore",
    component: () => import("@/views/shop/store.vue"),
    meta: {
      title: "店铺",
      showLink: false,
      public: true
    }
  },
  {
    path: "/shop/product/:productKey?",
    name: "PublicShopProduct",
    component: () => import("@/views/shop/product.vue"),
    meta: {
      title: "商品详情",
      showLink: false,
      public: true
    }
  },
  {
    path: "/shop/checkout/:draftId",
    name: "PublicShopCheckout",
    component: () => import("@/views/shop/checkout.vue"),
    meta: {
      title: "确认订单",
      showLink: false,
      public: true
    }
  },
  {
    path: "/shop/order/:orderId",
    name: "PublicShopOrder",
    component: () => import("@/views/shop/order.vue"),
    meta: {
      title: "订单状态",
      showLink: false,
      public: true
    }
  },
  {
    path: "/shop/order/:orderId/report",
    name: "PublicShopReport",
    component: () => import("@/views/shop/report.vue"),
    meta: {
      title: "投诉举报",
      showLink: false,
      public: true
    }
  },
  // 全屏403（无权访问）页面
  {
    path: "/access-denied",
    name: "AccessDenied",
    component: () => import("@/views/error/403.vue"),
    meta: {
      title: "403",
      showLink: false
    }
  },
  // 全屏500（服务器出错）页面
  {
    path: "/server-error",
    name: "ServerError",
    component: () => import("@/views/error/500.vue"),
    meta: {
      title: "500",
      showLink: false
    }
  },
  {
    path: "/redirect",
    component: Layout,
    meta: {
      title: "加载中...",
      showLink: false
    },
    children: [
      {
        path: "/redirect/:path(.*)",
        name: "Redirect",
        component: () => import("@/layout/redirect.vue")
      }
    ]
  }
] satisfies Array<RouteConfigsTable>;
