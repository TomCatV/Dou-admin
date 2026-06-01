<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import {
  financeReconciliationApi,
  type FinanceReconciliationBusinessType,
  type FinanceReconciliationItem,
  type FinanceReconciliationIssueCount,
  type FinanceReconciliationIssueType,
  type FinanceReconciliationSeverity,
  type FinanceReconciliationSummary
} from "@/api/admin";

defineOptions({
  name: "FinanceReconciliation"
});

type TagType = "primary" | "success" | "warning" | "danger" | "info";

const emptySummary: FinanceReconciliationSummary = {
  total: 0,
  exception_count: 0,
  warning_count: 0,
  involved_amount: 0,
  difference_amount: 0
};

const issueTypeMap: Record<
  FinanceReconciliationIssueType,
  { label: string; type: TagType }
> = {
  missing_settlement: { label: "缺结算", type: "danger" },
  missing_revenue_ledger: { label: "缺收入流水", type: "danger" },
  settlement_revenue_mismatch: { label: "结算流水不一致", type: "danger" },
  negative_order_fee: { label: "服务费负数", type: "danger" },
  stale_payment_intent: { label: "支付待查单", type: "warning" },
  payment_amount_mismatch: { label: "支付金额不一致", type: "danger" },
  refund_pending: { label: "退款待确认", type: "warning" },
  withdrawal_pending: { label: "提现待确认", type: "warning" },
  withdrawal_allocation_mismatch: { label: "提现锁定不一致", type: "danger" }
};

const severityMap: Record<
  FinanceReconciliationSeverity,
  { label: string; type: TagType }
> = {
  exception: { label: "异常", type: "danger" },
  warning: { label: "提醒", type: "warning" }
};

const businessTypeMap: Record<FinanceReconciliationBusinessType, string> = {
  payment: "支付",
  settlement: "结算",
  refund: "退款",
  withdrawal: "提现",
  revenue: "营收"
};

const channelMap: Record<string, string> = {
  wechat_native: "微信扫码",
  wechat_jsapi: "微信支付",
  alipay_precreate: "支付宝扫码",
  alipay: "支付宝"
};

const loading = ref(false);
const rows = ref<FinanceReconciliationItem[]>([]);
const issueCounts = ref<FinanceReconciliationIssueCount[]>([]);
const summary = ref<FinanceReconciliationSummary>({ ...emptySummary });
const total = ref(0);
const generatedAt = ref("");

const filters = reactive({
  date_range: defaultDateRange(),
  issue_type: "",
  severity: "",
  business_type: "",
  keyword: "",
  page: 1,
  page_size: 20
});

const topIssueCounts = computed(() => issueCounts.value.slice(0, 6));

function defaultDateRange() {
  const end = new Date();
  const start = new Date(end.getTime() - 29 * 24 * 60 * 60 * 1000);
  return [formatDate(start), formatDate(end)];
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function yuan(value?: number) {
  return `¥${((Number(value) || 0) / 100).toFixed(2)}`;
}

function signedYuan(value?: number) {
  const amount = Number(value) || 0;
  if (amount === 0) return yuan(0);
  return `${amount > 0 ? "+" : "-"}${yuan(Math.abs(amount))}`;
}

function issueMeta(value?: string): { label: string; type: TagType } {
  return (
    issueTypeMap[value as FinanceReconciliationIssueType] || {
      label: String(value || "-"),
      type: "info"
    }
  );
}

function severityMeta(value?: string): { label: string; type: TagType } {
  return (
    severityMap[value as FinanceReconciliationSeverity] || {
      label: String(value || "-"),
      type: "info"
    }
  );
}

function businessText(value?: string) {
  const key = String(value || "");
  return (
    businessTypeMap[key as FinanceReconciliationBusinessType] || key || "-"
  );
}

function channelText(value?: string) {
  const key = String(value || "");
  return channelMap[key] || key || "-";
}

function queryParams() {
  return {
    date_from: filters.date_range?.[0] || "",
    date_to: filters.date_range?.[1] || "",
    issue_type: filters.issue_type,
    severity: filters.severity,
    business_type: filters.business_type,
    keyword: filters.keyword,
    page: filters.page,
    page_size: filters.page_size
  };
}

async function loadData() {
  loading.value = true;
  try {
    const data = await financeReconciliationApi.list(queryParams());
    rows.value = data.items || [];
    summary.value = data.summary || { ...emptySummary };
    issueCounts.value = data.by_issue_type || [];
    total.value = data.total || 0;
    generatedAt.value = data.generated_at || "";
  } catch (error) {
    ElMessage.error(
      error instanceof Error ? error.message : "对账中心加载失败"
    );
  } finally {
    loading.value = false;
  }
}

function search() {
  filters.page = 1;
  loadData();
}

function resetSearch() {
  filters.date_range = defaultDateRange();
  filters.issue_type = "";
  filters.severity = "";
  filters.business_type = "";
  filters.keyword = "";
  filters.page = 1;
  loadData();
}

onMounted(loadData);
</script>

<template>
  <div class="reconciliation-page">
    <div class="filter-bar">
      <el-date-picker
        v-model="filters.date_range"
        type="daterange"
        value-format="YYYY-MM-DD"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        range-separator="至"
        class="date-range"
      />
      <el-select
        v-model="filters.issue_type"
        class="filter-item"
        clearable
        placeholder="异常类型"
      >
        <el-option
          v-for="(meta, value) in issueTypeMap"
          :key="value"
          :label="meta.label"
          :value="value"
        />
      </el-select>
      <el-select
        v-model="filters.severity"
        class="filter-item"
        clearable
        placeholder="严重级别"
      >
        <el-option label="异常" value="exception" />
        <el-option label="提醒" value="warning" />
      </el-select>
      <el-select
        v-model="filters.business_type"
        class="filter-item"
        clearable
        placeholder="业务域"
      >
        <el-option label="支付" value="payment" />
        <el-option label="结算" value="settlement" />
        <el-option label="退款" value="refund" />
        <el-option label="提现" value="withdrawal" />
        <el-option label="营收" value="revenue" />
      </el-select>
      <el-input
        v-model="filters.keyword"
        class="keyword"
        clearable
        placeholder="搜索圈子、订单或交易号"
        @keyup.enter="search"
      />
      <el-button type="primary" @click="search">查询</el-button>
      <el-button @click="resetSearch">重置</el-button>
    </div>

    <div v-loading="loading" class="summary-strip">
      <div class="metric">
        <span>待核对</span>
        <strong>{{ summary.total }}</strong>
      </div>
      <div class="metric">
        <span>异常</span>
        <strong class="danger">{{ summary.exception_count }}</strong>
      </div>
      <div class="metric">
        <span>提醒</span>
        <strong class="warning">{{ summary.warning_count }}</strong>
      </div>
      <div class="metric">
        <span>涉及金额</span>
        <strong>{{ yuan(summary.involved_amount) }}</strong>
      </div>
      <div class="metric">
        <span>差额合计</span>
        <strong :class="{ negative: summary.difference_amount < 0 }">
          {{ signedYuan(summary.difference_amount) }}
        </strong>
      </div>
    </div>

    <section class="issue-strip">
      <div
        v-for="item in topIssueCounts"
        :key="item.issue_type"
        class="issue-pill"
      >
        <span>{{ issueMeta(item.issue_type).label }}</span>
        <strong>{{ item.count }}</strong>
      </div>
      <div v-if="!topIssueCounts.length" class="issue-pill empty">
        <span>当前筛选</span>
        <strong>0</strong>
      </div>
      <em v-if="generatedAt">生成于 {{ generatedAt }}</em>
    </section>

    <section class="table-panel">
      <div class="panel-title">对账列表</div>
      <el-table v-loading="loading" :data="rows" border>
        <el-table-column label="类型" min-width="170">
          <template #default="{ row }">
            <el-tag :type="issueMeta(row.issue_type).type">
              {{ issueMeta(row.issue_type).label }}
            </el-tag>
            <div class="cell-sub">{{ businessText(row.business_type) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="级别" width="100">
          <template #default="{ row }">
            <el-tag :type="severityMeta(row.severity).type">
              {{ severityMeta(row.severity).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="业务对象" min-width="250">
          <template #default="{ row }">
            <div class="cell-main">{{ row.title }}</div>
            <div class="cell-sub">
              {{ row.order_id || row.ref_id || "-" }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="圈子" min-width="170">
          <template #default="{ row }">
            <div class="cell-main">
              {{ row.circle_name || row.circle_id || "-" }}
            </div>
            <div v-if="row.circle_name" class="cell-sub">
              {{ row.circle_id }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="130">
          <template #default="{ row }">{{ yuan(row.amount) }}</template>
        </el-table-column>
        <el-table-column label="服务费" width="130">
          <template #default="{ row }">{{
            signedYuan(row.platform_fee_amount)
          }}</template>
        </el-table-column>
        <el-table-column label="差额" width="130">
          <template #default="{ row }">
            <span :class="{ negative: row.difference_amount < 0 }">
              {{ signedYuan(row.difference_amount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="渠道/交易号" min-width="210">
          <template #default="{ row }">
            <div>{{ channelText(row.pay_channel) }}</div>
            <div class="cell-sub">{{ row.third_trade_no || "-" }}</div>
          </template>
        </el-table-column>
        <el-table-column label="说明" min-width="300">
          <template #default="{ row }">
            <div class="cell-main">{{ row.description }}</div>
            <div class="cell-sub">{{ row.suggestion }}</div>
          </template>
        </el-table-column>
        <el-table-column label="发生时间" min-width="160">
          <template #default="{ row }">{{ row.occurred_at || "-" }}</template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination
          v-model:current-page="filters.page"
          v-model:page-size="filters.page_size"
          layout="total, sizes, prev, pager, next"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          @change="loadData"
        />
      </div>
    </section>
  </div>
</template>

<style scoped>
.reconciliation-page {
  padding: 16px;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.date-range {
  width: 260px;
}

.filter-item {
  width: 150px;
}

.keyword {
  width: 280px;
}

.summary-strip {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.metric,
.table-panel {
  background: #fff;
  border: 1px solid #e6e1da;
  border-radius: 8px;
}

.metric {
  min-height: 84px;
  padding: 14px 16px;
}

.metric span {
  display: block;
  margin-bottom: 10px;
  font-size: 13px;
  color: #7c7066;
}

.metric strong {
  font-size: 22px;
  line-height: 1.2;
  color: #211a14;
}

.danger {
  color: #c45656 !important;
}

.warning {
  color: #b06b00 !important;
}

.negative {
  color: #c45656;
}

.issue-strip {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.issue-strip em {
  margin-left: auto;
  font-style: normal;
  color: #8f8276;
}

.issue-pill {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  min-height: 34px;
  padding: 0 12px;
  background: #fff;
  border: 1px solid #e6e1da;
  border-radius: 8px;
}

.issue-pill span {
  color: #62574f;
}

.issue-pill strong {
  color: #211a14;
}

.issue-pill.empty {
  color: #8f8276;
}

.table-panel {
  padding: 14px;
}

.panel-title {
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 700;
  color: #211a14;
}

.cell-main {
  font-weight: 700;
  color: #221a14;
}

.cell-sub {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.35;
  color: #8f8276;
  word-break: break-all;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

@media (width <= 1280px) {
  .summary-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (width <= 760px) {
  .summary-strip {
    grid-template-columns: 1fr;
  }

  .date-range,
  .filter-item,
  .keyword {
    width: 100%;
  }

  .issue-strip em {
    width: 100%;
    margin-left: 0;
  }
}
</style>
