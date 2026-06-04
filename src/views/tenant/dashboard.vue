<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import {
  DataAnalysis,
  Goods,
  MagicStick,
  Money,
  Operation,
  Refresh,
  Search,
  Tools,
  TrendCharts,
  User
} from "@element-plus/icons-vue";
import { tenantApi, type TenantDashboard } from "@/api/admin";

defineOptions({ name: "TenantDashboard" });

const router = useRouter();
const loading = ref(false);
const keyword = ref("");
const data = ref<TenantDashboard | null>(null);

const owner = computed(() => data.value?.owner_overview || null);
const ownerMetrics = computed(() => owner.value?.metrics || data.value?.metrics || {});
const query = computed(() => keyword.value.trim().toLowerCase());
const feePolicy = computed(() => data.value?.fee_policy || null);
const feeUpgrade = computed(() => data.value?.fee_policy_upgrade || null);

const usageRows = computed(() => [
  {
    key: "members",
    label: "成员",
    value: data.value?.usage?.members || 0,
    limit: data.value?.limits?.max_members || 0
  },
  {
    key: "staff_accounts",
    label: "子账号",
    value: data.value?.usage?.staff_accounts || 0,
    limit: data.value?.limits?.max_staff || 0
  },
  {
    key: "resource_cards",
    label: "资源卡",
    value: data.value?.usage?.resource_cards || 0,
    limit: data.value?.limits?.max_resource_cards || 0
  },
  {
    key: "leads",
    label: "线索",
    value: data.value?.usage?.leads || 0,
    limit: data.value?.limits?.max_leads || 0
  }
]);

const enabledFeatures = computed(() =>
  Object.entries(data.value?.features || {})
    .filter(([, enabled]) => enabled)
    .map(([key]) => key)
);

const overviewMetrics = computed(() => [
  {
    key: "circles",
    label: "全部圈子",
    value: Number(ownerMetrics.value.total_circles || 0),
    icon: DataAnalysis
  },
  {
    key: "resources",
    label: "所有资源卡",
    value: Number(ownerMetrics.value.resources || 0),
    icon: Goods
  },
  {
    key: "paid_orders",
    label: "付费订单",
    value: Number(ownerMetrics.value.paid_orders || 0),
    icon: User
  },
  {
    key: "revenue",
    label: "全圈成交额",
    value: yuan(ownerMetrics.value.revenue_amount),
    icon: Money,
    income: true
  }
]);

const trendMax = computed(() =>
  Math.max(
    1,
    ...(owner.value?.revenue_trend || []).map(item => Number(item.revenue_amount || 0))
  )
);

const trendRows = computed(() =>
  (owner.value?.revenue_trend || []).map(item => ({
    ...item,
    day: String(item.date || "").slice(5) || "-",
    bar: Math.max(6, Math.round((Number(item.revenue_amount || 0) / trendMax.value) * 100))
  }))
);

const filteredCircles = computed(() =>
  (owner.value?.circles || []).filter(item =>
    matchText(item.name, item.circle_code, item.status)
  )
);

const filteredCategories = computed(() =>
  (owner.value?.resource_categories || []).filter(item =>
    matchText(item.category_name, item.delivery_label, item.status)
  )
);

const filteredPaidUsers = computed(() =>
  (owner.value?.paid_user_leaderboard || []).filter(item =>
    matchText(item.nickname, item.dxq_id)
  )
);

const filteredIncomeTypes = computed(() =>
  (owner.value?.income_types || []).filter(item =>
    matchText(
      item.label,
      item.pay_channel_label,
      item.settlement_label,
      item.delivery_label
    )
  )
);

const suggestions = computed(() => owner.value?.suggestions || []);

function matchText(...values: Array<string | number | undefined | null>) {
  if (!query.value) return true;
  return values.some(value =>
    String(value || "")
      .toLowerCase()
      .includes(query.value)
  );
}

function yuan(value?: number | string) {
  return `¥${((Number(value) || 0) / 100).toFixed(2)}`;
}

function percentBps(value?: number) {
  return `${((Number(value) || 0) / 100).toFixed(2)}%`;
}

function feeSourceLabel(source?: string) {
  return (
    {
      tenant: "专属费率",
      plan: "套餐费率",
      global: "平台默认",
      env: "系统默认"
    }[String(source || "")] || "当前策略"
  );
}

function savingPerHundred(value?: number) {
  return yuan(Math.floor((10000 * (Number(value) || 0)) / 10000));
}

function subscriptionStatusLabel(status?: string) {
  return (
    {
      none: "未开通",
      trial: "试用中",
      active: "已开通",
      expired: "已到期",
      suspended: "已暂停"
    }[String(status || "none")] || status
  );
}

function subscriptionStatusType(status?: string) {
  if (status === "active") return "success";
  if (status === "trial") return "warning";
  if (status === "expired" || status === "suspended") return "danger";
  return "info";
}

function resourceStatusText(status?: string) {
  return (
    {
      draft: "草稿",
      published: "已发布",
      offline: "已下架",
      disabled: "已禁用"
    }[String(status || "")] || status || "-"
  );
}

function suggestionType(priority?: string) {
  if (priority === "high") return "danger";
  if (priority === "medium") return "warning";
  return "info";
}

function go(path = "") {
  if (!path) return;
  router.push(path);
}

async function loadData() {
  loading.value = true;
  try {
    data.value = await tenantApi.dashboard();
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <div v-loading="loading" class="tenant-page">
    <div class="page-head">
      <div>
        <h1>{{ data?.circle?.name || "经营总览" }}</h1>
        <p>{{ data?.circle?.description || "查看全圈资源、成交、收益和运营入口。" }}</p>
      </div>
      <div class="head-actions">
        <el-input
          v-model="keyword"
          class="search-input"
          clearable
          :prefix-icon="Search"
          placeholder="搜索圈子 / 分类 / 付费用户 / 收益类型"
        />
        <el-button type="primary" :icon="Refresh" @click="loadData">刷新</el-button>
      </div>
    </div>

    <el-alert
      v-if="data && !data.writable"
      class="mb"
      type="warning"
      show-icon
      :closable="false"
      title="当前套餐已到期、暂停或未开通，后台写入操作将进入只读保护。"
    />

    <el-row :gutter="16">
      <el-col
        v-for="item in overviewMetrics"
        :key="item.key"
        :xs="24"
        :sm="12"
        :lg="6"
      >
        <div class="metric" :class="{ income: item.income }">
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mt">
      <el-col :xs="24" :lg="15">
        <div class="panel trend-panel">
          <div class="panel-title">
            <h2>近 7 日成交趋势</h2>
            <el-tag type="success">{{ yuan(ownerMetrics.revenue_amount) }}</el-tag>
          </div>
          <div class="trend-chart">
            <div v-for="item in trendRows" :key="item.date" class="trend-item">
              <div class="trend-bar-track">
                <div class="trend-bar" :style="{ height: `${item.bar}%` }" />
              </div>
              <strong>{{ yuan(item.revenue_amount) }}</strong>
              <span>{{ item.day }}</span>
              <em>{{ item.paid_orders }} 单</em>
            </div>
            <p v-if="!trendRows.length" class="empty-text">暂无趋势数据</p>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :lg="9">
        <div class="panel entry-panel">
          <div class="panel-title">
            <h2>经营入口</h2>
            <el-tag type="info">AI / 工具</el-tag>
          </div>
          <div class="entry-grid">
            <el-button type="primary" :icon="MagicStick" @click="go('/tenant/ai')">
              AI 分析
            </el-button>
            <el-button :icon="Tools" @click="go('/tenant/conversion/tools')">
              经营工具
            </el-button>
            <el-button :icon="Goods" @click="go('/tenant/resources')">
              商品中心
            </el-button>
            <el-button :icon="Operation" @click="go('/tenant/orders')">
              订单售后
            </el-button>
          </div>
          <div class="suggestions">
            <div v-for="item in suggestions" :key="item.key" class="suggestion-row">
              <div>
                <el-tag size="small" :type="suggestionType(item.priority)">
                  {{ item.priority || "low" }}
                </el-tag>
                <strong>{{ item.title }}</strong>
                <p>{{ item.description }}</p>
              </div>
              <el-button link type="primary" @click="go(item.route_path)">
                {{ item.action_label }}
              </el-button>
            </div>
            <p v-if="!suggestions.length" class="empty-text">暂无经营建议</p>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mt">
      <el-col :xs="24" :lg="8">
        <div class="panel list-panel">
          <div class="panel-title">
            <h2>全部圈子</h2>
            <el-tag>{{ filteredCircles.length }}</el-tag>
          </div>
          <div class="circle-list">
            <div v-for="item in filteredCircles" :key="item.id" class="circle-row">
              <div>
                <strong>{{ item.name }}</strong>
                <span>{{ item.circle_code || item.id }}</span>
              </div>
              <div class="row-num">
                <strong>{{ item.resource_count }}</strong>
                <span>资源</span>
              </div>
              <div class="row-num">
                <strong>{{ item.member_count }}</strong>
                <span>成员</span>
              </div>
            </div>
            <p v-if="!filteredCircles.length" class="empty-text">没有匹配圈子</p>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :lg="16">
        <div class="panel">
          <div class="panel-title">
            <h2>资源卡按类别</h2>
            <el-button link type="primary" :icon="Goods" @click="go('/tenant/resources')">
              管理资源
            </el-button>
          </div>
          <div class="category-grid">
            <div
              v-for="item in filteredCategories"
              :key="`${item.category_id}-${item.delivery_type}-${item.status}`"
              class="category-card"
            >
              <div class="category-head">
                <strong>{{ item.category_name || "未分类" }}</strong>
                <el-tag size="small">{{ item.delivery_label }}</el-tag>
              </div>
              <span>{{ resourceStatusText(item.status) }}</span>
              <div class="category-stats">
                <div>
                  <strong>{{ item.resource_count }}</strong>
                  <span>资源</span>
                </div>
                <div>
                  <strong>{{ item.published_count }}</strong>
                  <span>发布</span>
                </div>
                <div>
                  <strong>{{ item.paid_orders }}</strong>
                  <span>订单</span>
                </div>
              </div>
              <em>{{ yuan(item.revenue_amount) }}</em>
            </div>
            <p v-if="!filteredCategories.length" class="empty-text">没有匹配资源类别</p>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mt">
      <el-col :xs="24" :lg="12">
        <div class="panel">
          <div class="panel-title">
            <h2>付费用户排行榜</h2>
            <el-icon><User /></el-icon>
          </div>
          <div class="ranking-list">
            <div v-for="(item, index) in filteredPaidUsers" :key="item.user_id" class="rank-row">
              <span class="rank-index">{{ index + 1 }}</span>
              <div>
                <strong>{{ item.nickname || "匿名买家" }}</strong>
                <span>{{ item.dxq_id || item.user_id }}</span>
              </div>
              <div class="rank-amount">
                <strong>{{ yuan(item.paid_amount) }}</strong>
                <span>{{ item.paid_orders }} 单</span>
              </div>
            </div>
            <p v-if="!filteredPaidUsers.length" class="empty-text">没有匹配付费用户</p>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :lg="12">
        <div class="panel">
          <div class="panel-title">
            <h2>收益类型面板</h2>
            <el-icon><TrendCharts /></el-icon>
          </div>
          <div class="income-list">
            <div v-for="item in filteredIncomeTypes" :key="item.key" class="income-row">
              <div>
                <strong>{{ item.pay_channel_label }}</strong>
                <span>{{ item.settlement_label }} / {{ item.delivery_label }}</span>
              </div>
              <div class="income-amounts">
                <strong>{{ yuan(item.gross_amount) }}</strong>
                <span>圈主 {{ yuan(item.creator_amount) }}</span>
                <span>服务费 {{ yuan(item.platform_fee_amount) }}</span>
              </div>
            </div>
            <p v-if="!filteredIncomeTypes.length" class="empty-text">没有匹配收益类型</p>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mt">
      <el-col :xs="24" :lg="12">
        <div class="panel">
          <div class="panel-title">
            <h2>套餐订阅</h2>
            <el-tag :type="subscriptionStatusType(data?.subscription_status?.status)">
              {{ subscriptionStatusLabel(data?.subscription_status?.status) }}
            </el-tag>
          </div>
          <div class="line">
            <span>当前套餐</span>
            <strong>{{ data?.subscription?.plan_name || "未开通套餐" }}</strong>
          </div>
          <div class="line">
            <span>服务到期</span>
            <strong>{{ data?.subscription_status?.paid_until || "-" }}</strong>
          </div>
          <div class="line">
            <span>租户状态</span>
            <strong>{{ subscriptionStatusLabel(data?.subscription?.status) }}</strong>
          </div>
          <div v-if="feePolicy" class="line">
            <span>交易服务费</span>
            <strong>{{ percentBps(feePolicy.fee_bps) }}</strong>
          </div>
          <div v-if="feePolicy" class="fee-note">
            {{ feeSourceLabel(feePolicy.source) }}生效，后续新订单会按该费率结算。
          </div>
          <div v-if="feeUpgrade" class="upgrade-hint">
            <strong>
              {{ feeUpgrade.action_label || "升级" }}{{ feeUpgrade.plan.name }}可降至
              {{ percentBps(feeUpgrade.fee_policy.fee_bps) }}
            </strong>
            <span>
              每成交 ¥100 预计少扣
              {{ savingPerHundred(feeUpgrade.save_bps) }} 服务费。
            </span>
          </div>
          <div class="feature-tags">
            <el-tag v-for="item in enabledFeatures" :key="item" type="success">
              {{ item }}
            </el-tag>
            <span v-if="!enabledFeatures.length" class="empty-text">暂无开通功能</span>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :lg="12">
        <div class="panel">
          <h2>当前用量</h2>
          <div class="usage-grid">
            <div v-for="item in usageRows" :key="item.key">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
              <em>{{ item.limit ? `上限 ${item.limit}` : "不限" }}</em>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mt">
      <el-col :xs="24" :lg="12">
        <div class="panel">
          <h2>内容与售后</h2>
          <div class="line">
            <span>已发布资源</span>
            <strong>{{ ownerMetrics.published_resources || data?.metrics.published_resources || 0 }}</strong>
          </div>
          <div class="line">
            <span>待处理售后</span>
            <strong>{{ ownerMetrics.open_after_sales || data?.metrics.open_after_sales || 0 }}</strong>
          </div>
          <div class="line">
            <span>待处理举报</span>
            <strong>{{ ownerMetrics.reports_pending || data?.metrics.reports_pending || 0 }}</strong>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :lg="12">
        <div class="panel">
          <h2>钱包</h2>
          <div class="line">
            <span>可提现</span>
            <strong>{{ yuan(data?.wallet.available_amount) }}</strong>
          </div>
          <div class="line">
            <span>结算中</span>
            <strong>{{ yuan(data?.wallet.pending_amount) }}</strong>
          </div>
          <div class="line">
            <span>累计收入</span>
            <strong>{{ yuan(data?.wallet.lifetime_income_amount) }}</strong>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.tenant-page {
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

.head-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-input {
  width: min(420px, 44vw);
}

.metric,
.panel {
  padding: 18px;
  background: #fffdf9;
  border: 1px solid #e6ddd2;
  border-radius: 8px;
}

.metric {
  min-height: 118px;
}

.metric .el-icon {
  color: #1f7a64;
}

.metric span,
.line span {
  color: #766b61;
}

.metric strong {
  display: block;
  margin-top: 8px;
  font-size: 28px;
  color: #221a14;
}

.metric.income strong {
  color: #16794c;
}

.panel h2 {
  margin: 0 0 12px;
  font-size: 16px;
}

.panel-title {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.panel-title h2 {
  margin: 0;
}

.trend-chart {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 12px;
  min-height: 230px;
  align-items: end;
}

.trend-item {
  display: grid;
  gap: 6px;
  justify-items: center;
  min-width: 0;
}

.trend-bar-track {
  display: flex;
  align-items: end;
  width: 100%;
  height: 150px;
  overflow: hidden;
  background: #eef6f2;
  border: 1px solid #dbe6e1;
  border-radius: 8px;
}

.trend-bar {
  width: 100%;
  min-height: 8px;
  background: linear-gradient(180deg, #4b8f7a 0%, #1f7a64 100%);
}

.trend-item strong {
  font-size: 12px;
  color: #221a14;
}

.trend-item span,
.trend-item em {
  font-size: 12px;
  font-style: normal;
  color: #766b61;
}

.entry-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.entry-grid .el-button {
  width: 100%;
  margin: 0;
}

.suggestions {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

.suggestion-row,
.circle-row,
.rank-row,
.income-row {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-top: 1px solid #efe6db;
}

.suggestion-row strong,
.circle-row strong,
.rank-row strong,
.income-row strong {
  color: #221a14;
}

.suggestion-row p,
.circle-row span,
.rank-row span,
.income-row span {
  margin: 4px 0 0;
  color: #766b61;
}

.circle-list,
.ranking-list,
.income-list {
  display: grid;
}

.row-num,
.rank-amount,
.income-amounts {
  display: grid;
  min-width: 78px;
  justify-items: end;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 12px;
}

.category-card {
  display: grid;
  gap: 10px;
  min-height: 156px;
  padding: 14px;
  background: #fff;
  border: 1px solid #efe6db;
  border-radius: 8px;
}

.category-head {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
}

.category-card > span {
  color: #766b61;
}

.category-card em {
  font-style: normal;
  font-weight: 800;
  color: #16794c;
}

.category-stats,
.usage-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.category-stats div,
.usage-grid div {
  min-height: 70px;
  padding: 10px;
  background: #fbfcfb;
  border: 1px solid #edf2ef;
  border-radius: 8px;
}

.category-stats strong,
.usage-grid strong {
  display: block;
  font-size: 20px;
  color: #221a14;
}

.category-stats span,
.usage-grid span,
.usage-grid em {
  font-size: 12px;
  font-style: normal;
  color: #766b61;
}

.rank-index {
  display: grid;
  flex: 0 0 30px;
  width: 30px;
  height: 30px;
  place-items: center;
  font-weight: 800;
  color: #1f7a64;
  background: #eef6f2;
  border-radius: 8px;
}

.line {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-top: 1px solid #efe6db;
}

.usage-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.mt {
  margin-top: 16px;
}

.mb {
  margin-bottom: 16px;
}

.feature-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #efe6db;
}

.fee-note {
  padding: 8px 0 12px;
  font-size: 13px;
  line-height: 1.5;
  color: #8f8276;
  border-top: 1px solid #efe6db;
}

.upgrade-hint {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  margin: 8px 0 12px;
  color: #4f3a1b;
  background: #fff7e8;
  border: 1px solid #f0d5a8;
  border-radius: 8px;
}

.upgrade-hint span {
  font-size: 13px;
  color: #8a6125;
}

.empty-text {
  font-size: 12px;
  font-style: normal;
  color: #8f8276;
}

@media (width <= 960px) {
  .page-head,
  .head-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .search-input {
    width: 100%;
  }

  .trend-chart {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .usage-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (width <= 640px) {
  .entry-grid,
  .category-stats,
  .trend-chart {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
