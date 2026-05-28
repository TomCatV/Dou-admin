<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { adminUsersApi, saasApi, type AdminCircleOption } from "@/api/admin";
import { readableRows } from "@/utils/readableDetail";

defineOptions({ name: "SaasBilling" });

type TagType = "primary" | "success" | "warning" | "danger" | "info";
type TenantPlan = Record<string, any>;
type CircleTenant = Record<string, any>;
type SubscriptionOrder = Record<string, any>;
type PlanLimitKey =
  | "max_members"
  | "max_staff"
  | "max_resource_cards"
  | "max_leads";
type PlanFeatureKey = "conversion" | "coupons" | "invite_codes";

const planLimitFields: Array<{ key: PlanLimitKey; label: string }> = [
  { key: "max_members", label: "成员上限" },
  { key: "max_staff", label: "子账号上限" },
  { key: "max_resource_cards", label: "资源卡上限" },
  { key: "max_leads", label: "线索上限" }
];

const planFeatureFields: Array<{ key: PlanFeatureKey; label: string }> = [
  { key: "conversion", label: "私域线索" },
  { key: "coupons", label: "优惠券" },
  { key: "invite_codes", label: "邀请码" }
];

const defaultPlanLimits: Record<PlanLimitKey, number> = {
  max_members: 500,
  max_staff: 2,
  max_resource_cards: 50,
  max_leads: 0
};

const defaultPlanFeatures: Record<PlanFeatureKey, boolean> = {
  conversion: true,
  coupons: true,
  invite_codes: true
};

const planLimitKeySet = new Set(planLimitFields.map(item => item.key));
const planFeatureKeySet = new Set(planFeatureFields.map(item => item.key));

const loading = ref(false);
const plans = ref<TenantPlan[]>([]);
const tenants = ref<CircleTenant[]>([]);
const orders = ref<SubscriptionOrder[]>([]);
const tenantTotal = ref(0);
const orderTotal = ref(0);
const activeTab = ref("tenants");
const circleOptions = ref<AdminCircleOption[]>([]);
const circleLoading = ref(false);
const route = useRoute();

const tenantFilters = reactive({
  keyword: "",
  status: "",
  page: 1,
  page_size: 20
});

const orderFilters = reactive({
  page: 1,
  page_size: 20
});

const planDialogVisible = ref(false);
const planSubmitting = ref(false);
const planFormRef = ref<FormInstance>();
const planIsEdit = ref(false);
const planForm = reactive({
  id: "",
  code: "",
  name: "",
  price_monthly_yuan: "",
  price_yearly_yuan: "",
  limits: { ...defaultPlanLimits },
  features: { ...defaultPlanFeatures },
  status: "active"
});
const planLimitExtras = ref<Record<string, unknown>>({});
const planFeatureExtras = ref<Record<string, unknown>>({});

const tenantDialogVisible = ref(false);
const tenantSubmitting = ref(false);
const tenantFormRef = ref<FormInstance>();
const tenantIsEdit = ref(false);
const tenantForm = reactive({
  id: "",
  circle_id: "",
  plan_id: "plan_starter",
  status: "trial",
  trial_ends_at: "",
  paid_until: ""
});
const tenantSettings = ref<Record<string, unknown>>({});

const orderDialogVisible = ref(false);
const orderSubmitting = ref(false);
const orderFormRef = ref<FormInstance>();
const currentTenant = ref<CircleTenant | null>(null);
const orderForm = reactive({
  plan_id: "",
  billing_cycle: "yearly",
  amount_yuan: "",
  starts_at: "",
  ends_at: "",
  contract_no: "",
  invoice_title: "",
  note: ""
});

const planRules: FormRules = {
  code: [{ required: true, message: "请输入套餐编码", trigger: "blur" }],
  name: [{ required: true, message: "请输入套餐名称", trigger: "blur" }]
};

const tenantRules: FormRules = {
  circle_id: [{ required: true, message: "请选择圈子", trigger: "change" }],
  plan_id: [{ required: true, message: "请选择套餐", trigger: "change" }],
  status: [{ required: true, message: "请选择订阅状态", trigger: "change" }]
};

const orderRules: FormRules = {
  plan_id: [{ required: true, message: "请选择套餐", trigger: "change" }],
  billing_cycle: [
    { required: true, message: "请选择计费周期", trigger: "change" }
  ],
  amount_yuan: [{ required: true, message: "请输入订单金额", trigger: "blur" }],
  ends_at: [{ required: true, message: "请选择到期时间", trigger: "change" }]
};

const planMap = computed(() => {
  const map = new Map<string, TenantPlan>();
  for (const item of plans.value) map.set(String(item.id), item);
  return map;
});

const summary = computed(() => {
  const active = tenants.value.filter(item => item.status === "active").length;
  const trial = tenants.value.filter(item => item.status === "trial").length;
  const expired = tenants.value.filter(
    item => item.status === "expired"
  ).length;
  const revenue = orders.value.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );
  return { active, trial, expired, revenue };
});

const tenantSettingRows = computed(() =>
  readableRows(tenantSettings.value, { limit: 8 })
);

function yuan(value?: number | string) {
  return `¥${((Number(value) || 0) / 100).toFixed(2)}`;
}

function toFen(value: string | number) {
  return Math.max(0, Math.round(Number(value || 0) * 100));
}

function fromFen(value: string | number) {
  return ((Number(value) || 0) / 100).toFixed(2);
}

function statusLabel(status: string) {
  return (
    {
      trial: "试用中",
      active: "已开通",
      expired: "已到期",
      suspended: "已暂停",
      disabled: "已停用",
      paid: "已支付",
      created: "待支付",
      cancelled: "已取消",
      refunded: "已退款"
    }[status] || status
  );
}

function statusType(status: string): TagType {
  if (["active", "paid"].includes(status)) return "success";
  if (["trial", "created"].includes(status)) return "warning";
  if (
    ["expired", "suspended", "disabled", "cancelled", "refunded"].includes(
      status
    )
  ) {
    return "danger";
  }
  return "info";
}

function usageText(row: CircleTenant, key: string, limitKey: string) {
  const current = Number(row.usage?.[key] || 0);
  const limit = Number(row.limits?.[limitKey] || 0);
  return limit ? `${current}/${limit}` : `${current}/不限`;
}

function cycleLabel(cycle: string) {
  return (
    {
      monthly: "月付",
      yearly: "年付",
      manual: "手动"
    }[cycle] || cycle
  );
}

function resetTenantSearch() {
  tenantFilters.keyword = "";
  tenantFilters.status = "";
  tenantFilters.page = 1;
  loadTenants();
}

function normalizeRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : {};
}

function pickExtras(record: Record<string, unknown>, knownKeys: Set<string>) {
  return Object.fromEntries(
    Object.entries(record).filter(([key]) => !knownKeys.has(key))
  );
}

function toLimitNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.trunc(number)) : fallback;
}

function toBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return ["1", "true", "yes", "on", "开", "开启"].includes(
      value.toLowerCase()
    );
  }
  return value === undefined || value === null ? fallback : Boolean(value);
}

function setPlanLimits(value: unknown, fallback: Record<PlanLimitKey, number>) {
  const record = normalizeRecord(value);
  for (const item of planLimitFields) {
    planForm.limits[item.key] = toLimitNumber(
      record[item.key],
      fallback[item.key]
    );
  }
  planLimitExtras.value = pickExtras(record, planLimitKeySet);
}

function setPlanFeatures(
  value: unknown,
  fallback: Record<PlanFeatureKey, boolean>
) {
  const record = normalizeRecord(value);
  for (const item of planFeatureFields) {
    planForm.features[item.key] = toBoolean(
      record[item.key],
      fallback[item.key]
    );
  }
  planFeatureExtras.value = pickExtras(record, planFeatureKeySet);
}

function buildLimitPayload() {
  return {
    ...planLimitExtras.value,
    ...Object.fromEntries(
      planLimitFields.map(item => [
        item.key,
        toLimitNumber(planForm.limits[item.key])
      ])
    )
  };
}

function buildFeaturePayload() {
  return {
    ...planFeatureExtras.value,
    ...Object.fromEntries(
      planFeatureFields.map(item => [
        item.key,
        Boolean(planForm.features[item.key])
      ])
    )
  };
}

function limitText(value: unknown) {
  const number = toLimitNumber(value);
  return number > 0 ? String(number) : "不限";
}

function readableLimitTags(limits: unknown) {
  const record = normalizeRecord(limits);
  return planLimitFields.map(item => ({
    key: item.key,
    label: item.label,
    value: limitText(record[item.key])
  }));
}

function readableFeatureTags(features: unknown) {
  const record = normalizeRecord(features);
  return planFeatureFields.map(item => ({
    key: item.key,
    label: item.label,
    enabled: toBoolean(record[item.key])
  }));
}

async function loadPlans() {
  plans.value = (await saasApi.plans()).items;
}

async function loadTenants() {
  const data = await saasApi.tenants({ ...tenantFilters });
  tenants.value = data.items;
  tenantTotal.value = data.total;
}

async function loadOrders() {
  const data = await saasApi.orders({ ...orderFilters });
  orders.value = data.items;
  orderTotal.value = data.total;
}

async function loadData() {
  loading.value = true;
  try {
    await Promise.all([loadPlans(), loadTenants(), loadOrders()]);
  } finally {
    loading.value = false;
  }
}

function openCreatePlan() {
  planIsEdit.value = false;
  Object.assign(planForm, {
    id: "",
    code: "",
    name: "",
    price_monthly_yuan: "",
    price_yearly_yuan: "",
    status: "active"
  });
  setPlanLimits(defaultPlanLimits, defaultPlanLimits);
  setPlanFeatures(defaultPlanFeatures, defaultPlanFeatures);
  planDialogVisible.value = true;
}

function openEditPlan(row: TenantPlan) {
  planIsEdit.value = true;
  Object.assign(planForm, {
    id: row.id,
    code: row.code,
    name: row.name,
    price_monthly_yuan: fromFen(row.price_monthly),
    price_yearly_yuan: fromFen(row.price_yearly),
    status: row.status || "active"
  });
  setPlanLimits(row.limits, defaultPlanLimits);
  setPlanFeatures(row.features, defaultPlanFeatures);
  planDialogVisible.value = true;
}

async function submitPlan() {
  await planFormRef.value?.validate();
  planSubmitting.value = true;
  try {
    const payload = {
      code: planForm.code,
      name: planForm.name,
      price_monthly: toFen(planForm.price_monthly_yuan),
      price_yearly: toFen(planForm.price_yearly_yuan),
      limits: buildLimitPayload(),
      features: buildFeaturePayload(),
      status: planForm.status
    };
    if (planIsEdit.value) {
      await saasApi.updatePlan(planForm.id, payload);
      ElMessage.success("套餐已更新");
    } else {
      await saasApi.createPlan(payload);
      ElMessage.success("套餐已创建");
    }
    planDialogVisible.value = false;
    await loadPlans();
  } catch (error: any) {
    ElMessage.error(error?.message || "保存套餐失败");
  } finally {
    planSubmitting.value = false;
  }
}

async function remoteCircleSearch(keyword: string) {
  circleLoading.value = true;
  try {
    const data = await adminUsersApi.circles({ keyword, page_size: 20 });
    circleOptions.value = data.items;
  } finally {
    circleLoading.value = false;
  }
}

function openCreateTenant() {
  tenantIsEdit.value = false;
  Object.assign(tenantForm, {
    id: "",
    circle_id: "",
    plan_id:
      plans.value.find(item => item.status === "active")?.id || "plan_starter",
    status: "trial",
    trial_ends_at: "",
    paid_until: ""
  });
  tenantSettings.value = {};
  tenantDialogVisible.value = true;
}

function openEditTenant(row: CircleTenant) {
  tenantIsEdit.value = true;
  Object.assign(tenantForm, {
    id: row.id,
    circle_id: row.circle_id,
    plan_id: row.plan_id || "",
    status: row.status || "trial",
    trial_ends_at: row.trial_ends_at || "",
    paid_until: row.paid_until || ""
  });
  tenantSettings.value = normalizeRecord(row.settings);
  circleOptions.value = [
    {
      id: row.circle_id,
      name: row.circle_name,
      owner_user_id: row.owner_user_id,
      owner_nickname: row.owner_nickname,
      owner_dxq_id: row.owner_dxq_id,
      status: "",
      member_count: Number(row.usage?.members || 0)
    }
  ];
  tenantDialogVisible.value = true;
}

async function submitTenant() {
  await tenantFormRef.value?.validate();
  tenantSubmitting.value = true;
  try {
    const payload = {
      circle_id: tenantForm.circle_id,
      plan_id: tenantForm.plan_id,
      status: tenantForm.status,
      trial_ends_at: tenantForm.trial_ends_at || null,
      paid_until: tenantForm.paid_until || null,
      settings: { ...tenantSettings.value }
    };
    if (tenantIsEdit.value) {
      await saasApi.updateTenant(tenantForm.id, payload);
      ElMessage.success("租户订阅已更新");
    } else {
      const created = await saasApi.createTenant(payload);
      if (
        tenantForm.trial_ends_at ||
        tenantForm.paid_until ||
        tenantForm.status !== "trial"
      ) {
        await saasApi.updateTenant(created.tenant.id, payload);
      }
      ElMessage.success("租户已开通");
    }
    tenantDialogVisible.value = false;
    await loadTenants();
  } catch (error: any) {
    ElMessage.error(error?.message || "保存租户失败");
  } finally {
    tenantSubmitting.value = false;
  }
}

function defaultEndAt(cycle: string) {
  const date = new Date();
  if (cycle === "monthly") date.setMonth(date.getMonth() + 1);
  else date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function fillOrderAmount() {
  const plan = planMap.value.get(orderForm.plan_id);
  if (!plan) return;
  if (orderForm.billing_cycle === "yearly") {
    orderForm.amount_yuan = fromFen(plan.price_yearly);
  } else if (orderForm.billing_cycle === "monthly") {
    orderForm.amount_yuan = fromFen(plan.price_monthly);
  }
  if (!orderForm.ends_at)
    orderForm.ends_at = defaultEndAt(orderForm.billing_cycle);
}

function openCreateOrder(row: CircleTenant) {
  currentTenant.value = row;
  Object.assign(orderForm, {
    plan_id:
      row.plan_id ||
      plans.value.find(item => item.status === "active")?.id ||
      "",
    billing_cycle: "yearly",
    amount_yuan: "",
    starts_at: new Date().toISOString().slice(0, 19).replace("T", " "),
    ends_at: defaultEndAt("yearly"),
    contract_no: "",
    invoice_title: row.circle_name || "",
    note: ""
  });
  fillOrderAmount();
  orderDialogVisible.value = true;
}

async function submitOrder() {
  await orderFormRef.value?.validate();
  if (!currentTenant.value) return;
  orderSubmitting.value = true;
  try {
    await ElMessageBox.confirm(
      `确认给 ${currentTenant.value.circle_name || currentTenant.value.circle_id} 记一笔已支付订阅订单？`,
      "确认续费",
      { type: "warning" }
    );
    await saasApi.createOrder(currentTenant.value.id, {
      plan_id: orderForm.plan_id,
      billing_cycle: orderForm.billing_cycle,
      amount: toFen(orderForm.amount_yuan),
      starts_at: orderForm.starts_at,
      ends_at: orderForm.ends_at,
      contract_no: orderForm.contract_no,
      invoice_title: orderForm.invoice_title,
      note: orderForm.note
    });
    ElMessage.success("订阅订单已入账");
    orderDialogVisible.value = false;
    await Promise.all([loadTenants(), loadOrders()]);
  } finally {
    orderSubmitting.value = false;
  }
}

watch(
  () => [orderForm.plan_id, orderForm.billing_cycle],
  () => fillOrderAmount()
);

onMounted(() => {
  const status = String(route.query.status || "");
  if (status) tenantFilters.status = status;
  loadData();
});
</script>

<template>
  <div v-loading="loading" class="saas-page">
    <div class="page-head">
      <div>
        <h1>SaaS 套餐订阅</h1>
        <p>给圈主开通后台套餐，维护订阅周期、账单记录和租户用量。</p>
      </div>
      <div class="head-actions">
        <el-button @click="loadData">刷新</el-button>
        <el-button type="primary" @click="openCreateTenant">开通租户</el-button>
      </div>
    </div>

    <el-row :gutter="16" class="summary-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="metric">
          <span>已开通租户</span>
          <strong>{{ summary.active }}</strong>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="metric">
          <span>试用租户</span>
          <strong>{{ summary.trial }}</strong>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="metric danger">
          <span>到期租户</span>
          <strong>{{ summary.expired }}</strong>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="metric income">
          <span>近期订阅收入</span>
          <strong>{{ yuan(summary.revenue) }}</strong>
        </div>
      </el-col>
    </el-row>

    <el-tabs v-model="activeTab" class="tabs">
      <el-tab-pane label="租户订阅" name="tenants">
        <el-alert
          class="tenant-alert"
          type="info"
          show-icon
          :closable="false"
          title="到期、暂停或套餐停用的圈主后台会自动进入只读保护；子账号、私域线索和营销工具会按套餐上限与功能开关拦截。"
        />
        <div class="filter-bar">
          <el-input
            v-model="tenantFilters.keyword"
            class="keyword"
            clearable
            placeholder="搜索圈子、圈主、租户 ID"
            @keyup.enter="loadTenants"
          />
          <el-select
            v-model="tenantFilters.status"
            class="filter-item"
            clearable
            placeholder="状态"
          >
            <el-option label="试用中" value="trial" />
            <el-option label="已开通" value="active" />
            <el-option label="已到期" value="expired" />
            <el-option label="已暂停" value="suspended" />
          </el-select>
          <el-button type="primary" @click="loadTenants">查询</el-button>
          <el-button @click="resetTenantSearch">重置</el-button>
          <el-button type="success" @click="openCreateTenant"
            >开通租户</el-button
          >
        </div>

        <el-table :data="tenants" border>
          <el-table-column label="租户" min-width="220">
            <template #default="{ row }">
              <div class="cell-main">
                {{ row.circle_name || row.circle_id }}
              </div>
              <div class="cell-sub">
                {{
                  row.owner_nickname || row.owner_dxq_id || row.owner_user_id
                }}
              </div>
            </template>
          </el-table-column>
          <el-table-column label="套餐" width="150">
            <template #default="{ row }">
              <div class="cell-main">
                {{ row.plan_name || row.plan_code || "-" }}
              </div>
              <div class="cell-sub">
                {{ row.plan_code || row.plan_id || "-" }}
              </div>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="statusType(row.status)">
                {{ statusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="到期时间" min-width="170">
            <template #default="{ row }">
              <div>{{ row.paid_until || row.trial_ends_at || "-" }}</div>
            </template>
          </el-table-column>
          <el-table-column label="用量" min-width="260">
            <template #default="{ row }">
              <el-tag class="usage-tag" type="info"
                >成员 {{ usageText(row, "members", "max_members") }}</el-tag
              >
              <el-tag class="usage-tag" type="info"
                >子账号
                {{ usageText(row, "staff_accounts", "max_staff") }}</el-tag
              >
              <el-tag class="usage-tag" type="info"
                >资源
                {{
                  usageText(row, "resource_cards", "max_resource_cards")
                }}</el-tag
              >
              <el-tag class="usage-tag" type="info"
                >线索 {{ usageText(row, "leads", "max_leads") }}</el-tag
              >
            </template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" width="190">
            <template #default="{ row }">
              <el-button link type="primary" @click="openEditTenant(row)"
                >编辑</el-button
              >
              <el-button link type="success" @click="openCreateOrder(row)"
                >续费</el-button
              >
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination">
          <el-pagination
            v-model:current-page="tenantFilters.page"
            v-model:page-size="tenantFilters.page_size"
            layout="total, sizes, prev, pager, next"
            :page-sizes="[10, 20, 50, 100]"
            :total="tenantTotal"
            @change="loadTenants"
          />
        </div>
      </el-tab-pane>

      <el-tab-pane label="套餐配置" name="plans">
        <div class="filter-bar">
          <el-button type="primary" @click="openCreatePlan">新建套餐</el-button>
        </div>
        <el-table :data="plans" border>
          <el-table-column label="套餐" min-width="180">
            <template #default="{ row }">
              <div class="cell-main">{{ row.name }}</div>
              <div class="cell-sub">{{ row.code }}</div>
            </template>
          </el-table-column>
          <el-table-column label="价格" min-width="170">
            <template #default="{ row }">
              <div>月付 {{ yuan(row.price_monthly) }}</div>
              <div class="cell-sub">年付 {{ yuan(row.price_yearly) }}</div>
            </template>
          </el-table-column>
          <el-table-column label="用量限制" min-width="260">
            <template #default="{ row }">
              <el-tag
                v-for="item in readableLimitTags(row.limits)"
                :key="item.key"
                class="usage-tag"
                type="info"
              >
                {{ item.label }} {{ item.value }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="功能" min-width="240">
            <template #default="{ row }">
              <el-tag
                v-for="item in readableFeatureTags(row.features)"
                :key="item.key"
                class="usage-tag"
                :type="item.enabled ? 'success' : 'info'"
              >
                {{ item.label }} {{ item.enabled ? "开" : "关" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="110">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'info'">
                {{ statusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" width="110">
            <template #default="{ row }">
              <el-button link type="primary" @click="openEditPlan(row)"
                >编辑</el-button
              >
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="订阅订单" name="orders">
        <el-table :data="orders" border>
          <el-table-column label="订单" min-width="220">
            <template #default="{ row }">
              <div class="cell-main">{{ row.order_no }}</div>
              <div class="cell-sub">{{ row.contract_no || row.id }}</div>
            </template>
          </el-table-column>
          <el-table-column label="租户" min-width="180">
            <template #default="{ row }">
              {{ row.circle_name || row.circle_id }}
            </template>
          </el-table-column>
          <el-table-column label="套餐" min-width="130">
            <template #default="{ row }">{{
              row.plan_name || row.plan_id || "-"
            }}</template>
          </el-table-column>
          <el-table-column label="周期" width="100">
            <template #default="{ row }">{{
              cycleLabel(row.billing_cycle)
            }}</template>
          </el-table-column>
          <el-table-column label="金额" width="120">
            <template #default="{ row }">{{ yuan(row.amount) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="110">
            <template #default="{ row }">
              <el-tag :type="statusType(row.status)">
                {{ statusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="ends_at" label="服务到期" min-width="170" />
          <el-table-column prop="created_at" label="创建时间" min-width="170" />
        </el-table>
        <div class="pagination">
          <el-pagination
            v-model:current-page="orderFilters.page"
            v-model:page-size="orderFilters.page_size"
            layout="total, sizes, prev, pager, next"
            :page-sizes="[10, 20, 50, 100]"
            :total="orderTotal"
            @change="loadOrders"
          />
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog
      v-model="planDialogVisible"
      :title="planIsEdit ? '编辑套餐' : '新建套餐'"
      width="760px"
    >
      <el-form
        ref="planFormRef"
        :model="planForm"
        :rules="planRules"
        label-width="110px"
      >
        <el-form-item label="套餐编码" prop="code">
          <el-input v-model="planForm.code" placeholder="例如 pro" />
        </el-form-item>
        <el-form-item label="套餐名称" prop="name">
          <el-input v-model="planForm.name" placeholder="例如 专业版" />
        </el-form-item>
        <el-form-item label="月付价格">
          <el-input
            v-model="planForm.price_monthly_yuan"
            placeholder="单位：元"
          />
        </el-form-item>
        <el-form-item label="年付价格">
          <el-input
            v-model="planForm.price_yearly_yuan"
            placeholder="单位：元"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="planForm.status">
            <el-radio-button label="active">启用</el-radio-button>
            <el-radio-button label="disabled">停用</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="用量限制">
          <div class="config-grid">
            <div
              v-for="item in planLimitFields"
              :key="item.key"
              class="config-field"
            >
              <span>{{ item.label }}</span>
              <el-input-number
                v-model="planForm.limits[item.key]"
                class="number-input"
                :min="0"
                :step="1"
                controls-position="right"
              />
            </div>
          </div>
        </el-form-item>
        <el-form-item label="功能开关">
          <div class="switch-grid">
            <div
              v-for="item in planFeatureFields"
              :key="item.key"
              class="switch-field"
            >
              <span>{{ item.label }}</span>
              <el-switch v-model="planForm.features[item.key]" />
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="planDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="planSubmitting" @click="submitPlan">
          保存
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="tenantDialogVisible"
      :title="tenantIsEdit ? '编辑租户订阅' : '开通圈主租户'"
      width="700px"
    >
      <el-form
        ref="tenantFormRef"
        :model="tenantForm"
        :rules="tenantRules"
        label-width="110px"
      >
        <el-form-item label="圈子" prop="circle_id">
          <el-select
            v-model="tenantForm.circle_id"
            class="full"
            filterable
            remote
            reserve-keyword
            :disabled="tenantIsEdit"
            :remote-method="remoteCircleSearch"
            :loading="circleLoading"
            placeholder="搜索圈子名称、ID 或圈主"
          >
            <el-option
              v-for="item in circleOptions"
              :key="item.id"
              :label="`${item.name} / ${item.owner_nickname || item.owner_dxq_id}`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="套餐" prop="plan_id">
          <el-select v-model="tenantForm.plan_id" class="full">
            <el-option
              v-for="item in plans"
              :key="item.id"
              :label="`${item.name} / ${item.code}`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="订阅状态" prop="status">
          <el-radio-group v-model="tenantForm.status">
            <el-radio-button label="trial">试用</el-radio-button>
            <el-radio-button label="active">开通</el-radio-button>
            <el-radio-button label="expired">到期</el-radio-button>
            <el-radio-button label="suspended">暂停</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="试用到期">
          <el-date-picker
            v-model="tenantForm.trial_ends_at"
            class="full"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="选择试用到期时间"
          />
        </el-form-item>
        <el-form-item label="付费到期">
          <el-date-picker
            v-model="tenantForm.paid_until"
            class="full"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="选择付费到期时间"
          />
        </el-form-item>
        <el-form-item label="租户设置">
          <div v-if="tenantSettingRows.length" class="setting-summary">
            <div
              v-for="item in tenantSettingRows"
              :key="item.label"
              class="setting-row"
            >
              <span>{{ item.label }}</span>
              <strong :class="{ long: item.long }">{{ item.value }}</strong>
            </div>
          </div>
          <span v-else class="cell-sub">暂无额外设置</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="tenantDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="tenantSubmitting"
          @click="submitTenant"
        >
          保存
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="orderDialogVisible" title="订阅续费入账" width="680px">
      <div v-if="currentTenant" class="order-tenant">
        <div class="cell-main">
          {{ currentTenant.circle_name || currentTenant.circle_id }}
        </div>
        <div class="cell-sub">
          当前套餐：{{ currentTenant.plan_name || "-" }}，到期：{{
            currentTenant.paid_until || currentTenant.trial_ends_at || "-"
          }}
        </div>
      </div>
      <el-form
        ref="orderFormRef"
        :model="orderForm"
        :rules="orderRules"
        label-width="110px"
      >
        <el-form-item label="套餐" prop="plan_id">
          <el-select v-model="orderForm.plan_id" class="full">
            <el-option
              v-for="item in plans"
              :key="item.id"
              :label="`${item.name} / ${item.code}`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="周期" prop="billing_cycle">
          <el-radio-group v-model="orderForm.billing_cycle">
            <el-radio-button label="monthly">月付</el-radio-button>
            <el-radio-button label="yearly">年付</el-radio-button>
            <el-radio-button label="manual">手动</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="金额" prop="amount_yuan">
          <el-input v-model="orderForm.amount_yuan" placeholder="单位：元" />
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker
            v-model="orderForm.starts_at"
            class="full"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="结束时间" prop="ends_at">
          <el-date-picker
            v-model="orderForm.ends_at"
            class="full"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="合同编号">
          <el-input v-model="orderForm.contract_no" placeholder="可选" />
        </el-form-item>
        <el-form-item label="发票抬头">
          <el-input v-model="orderForm.invoice_title" placeholder="可选" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="orderForm.note" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="orderDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="orderSubmitting"
          @click="submitOrder"
        >
          确认入账
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.saas-page {
  padding: 16px;
}

.page-head {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.page-head h1 {
  margin: 0;
  font-size: 22px;
  color: #221a14;
}

.page-head p {
  margin: 6px 0 0;
  color: #766b61;
}

.head-actions,
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.summary-row {
  margin-bottom: 16px;
}

.metric {
  min-height: 96px;
  padding: 18px;
  background: #fffdf9;
  border: 1px solid #e6ddd2;
  border-radius: 8px;
}

.metric span {
  color: #766b61;
}

.metric strong {
  display: block;
  margin-top: 10px;
  font-size: 28px;
  color: #221a14;
}

.metric.income strong {
  color: #16794c;
}

.metric.danger strong {
  color: #b42318;
}

.tabs {
  padding: 16px;
  background: #fff;
  border: 1px solid #eee5da;
  border-radius: 8px;
}

.filter-bar {
  margin-bottom: 12px;
}

.tenant-alert {
  margin-bottom: 12px;
}

.keyword {
  width: 280px;
}

.filter-item {
  width: 140px;
}

.cell-main {
  font-weight: 700;
  color: #221a14;
}

.cell-sub {
  font-size: 12px;
  color: #8f8276;
}

.usage-tag {
  margin: 0 6px 6px 0;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.full {
  width: 100%;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  width: 100%;
}

.config-field,
.switch-field,
.setting-row {
  display: grid;
  gap: 6px;
}

.config-field span,
.switch-field span,
.setting-row span {
  font-size: 13px;
  color: #766b61;
}

.number-input {
  width: 100%;
}

.switch-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  width: 100%;
}

.switch-field {
  padding: 10px 12px;
  background: #fffdf9;
  border: 1px solid #e6ddd2;
  border-radius: 8px;
}

.setting-summary {
  display: grid;
  gap: 8px;
  width: 100%;
}

.setting-row {
  grid-template-columns: 96px 1fr;
  align-items: start;
}

.setting-row strong {
  font-weight: 500;
  color: #221a14;
  word-break: break-word;
}

.setting-row .long {
  white-space: pre-wrap;
}

.order-tenant {
  padding: 12px 14px;
  margin-bottom: 16px;
  background: #fffdf9;
  border: 1px solid #e6ddd2;
  border-radius: 8px;
}
</style>
