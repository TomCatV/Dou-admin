<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import {
  financeReconciliationApi,
  type FinanceReconciliationBusinessType,
  type FinanceReconciliationItem,
  type FinanceReconciliationIssueCount,
  type FinanceReconciliationIssueType,
  type FinanceReconciliationMarkStatus,
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

const markStatusMap: Record<
  FinanceReconciliationMarkStatus | "none",
  { label: string; type: TagType }
> = {
  none: { label: "未标记", type: "info" },
  watching: { label: "跟进中", type: "warning" },
  resolved: { label: "已处理", type: "success" },
  ignored: { label: "已忽略", type: "info" }
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
const detailVisible = ref(false);
const detailLoading = ref(false);
const markSubmitting = ref(false);
const currentIssue = ref<FinanceReconciliationItem | null>(null);
const related = ref<Record<string, any>>({});

const filters = reactive({
  date_range: defaultDateRange(),
  issue_type: "",
  severity: "",
  business_type: "",
  keyword: "",
  page: 1,
  page_size: 20
});

const markForm = reactive({
  status: "watching" as FinanceReconciliationMarkStatus,
  note: ""
});

const topIssueCounts = computed(() => issueCounts.value.slice(0, 6));

const relatedRevenueRows = computed(() => related.value?.revenue_ledgers || []);
const relatedPaymentRows = computed(() => related.value?.payment_intents || []);
const relatedAllocationRows = computed(
  () => related.value?.withdrawal_allocations || []
);

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

function markMeta(value?: string): { label: string; type: TagType } {
  return (
    markStatusMap[value as FinanceReconciliationMarkStatus] ||
    markStatusMap.none
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

function applyUpdatedIssue(item: FinanceReconciliationItem) {
  rows.value = rows.value.map(row => (row.id === item.id ? item : row));
  if (currentIssue.value?.id === item.id) currentIssue.value = item;
}

async function openDetail(row: FinanceReconciliationItem) {
  detailVisible.value = true;
  detailLoading.value = true;
  currentIssue.value = row;
  related.value = {};
  markForm.status =
    (row.mark_status as FinanceReconciliationMarkStatus) || "watching";
  markForm.note = row.mark_note || "";
  try {
    const data = await financeReconciliationApi.detail(row.id);
    currentIssue.value = data.item;
    related.value = data.related || {};
    markForm.status =
      (data.mark?.status as FinanceReconciliationMarkStatus) || "watching";
    markForm.note = data.mark?.note || "";
    applyUpdatedIssue(data.item);
  } catch (error) {
    ElMessage.error(
      error instanceof Error ? error.message : "对账详情加载失败"
    );
  } finally {
    detailLoading.value = false;
  }
}

async function submitMark() {
  if (!currentIssue.value) return;
  if (markForm.status !== "watching" && !markForm.note.trim()) {
    ElMessage.warning("请填写处理备注");
    return;
  }
  markSubmitting.value = true;
  try {
    const data = await financeReconciliationApi.mark(currentIssue.value.id, {
      status: markForm.status,
      note: markForm.note.trim()
    });
    applyUpdatedIssue(data.item);
    ElMessage.success("对账项标记已保存");
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "对账项标记失败");
  } finally {
    markSubmitting.value = false;
  }
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
        <el-table-column label="标记" width="120">
          <template #default="{ row }">
            <el-tag :type="markMeta(row.mark_status).type">
              {{ markMeta(row.mark_status).label }}
            </el-tag>
            <div v-if="row.mark_operator_username" class="cell-sub">
              {{ row.mark_operator_username }}
            </div>
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
        <el-table-column label="操作" fixed="right" width="100">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">
              详情
            </el-button>
          </template>
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

    <el-drawer
      v-model="detailVisible"
      title="对账详情"
      size="62%"
      destroy-on-close
    >
      <div v-loading="detailLoading" class="detail-drawer">
        <template v-if="currentIssue">
          <section class="detail-section">
            <div class="detail-title">
              <span>{{ currentIssue.title }}</span>
              <el-tag :type="severityMeta(currentIssue.severity).type">
                {{ severityMeta(currentIssue.severity).label }}
              </el-tag>
              <el-tag :type="markMeta(currentIssue.mark_status).type">
                {{ markMeta(currentIssue.mark_status).label }}
              </el-tag>
            </div>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="异常类型">
                {{ issueMeta(currentIssue.issue_type).label }}
              </el-descriptions-item>
              <el-descriptions-item label="业务域">
                {{ businessText(currentIssue.business_type) }}
              </el-descriptions-item>
              <el-descriptions-item label="订单号">
                {{ currentIssue.order_id || "-" }}
              </el-descriptions-item>
              <el-descriptions-item label="引用对象">
                {{ currentIssue.ref_type }} / {{ currentIssue.ref_id || "-" }}
              </el-descriptions-item>
              <el-descriptions-item label="圈子">
                {{ currentIssue.circle_name || currentIssue.circle_id || "-" }}
              </el-descriptions-item>
              <el-descriptions-item label="渠道">
                {{ channelText(currentIssue.pay_channel) }}
              </el-descriptions-item>
              <el-descriptions-item label="涉及金额">
                {{ yuan(currentIssue.amount) }}
              </el-descriptions-item>
              <el-descriptions-item label="差额">
                {{ signedYuan(currentIssue.difference_amount) }}
              </el-descriptions-item>
              <el-descriptions-item label="说明" :span="2">
                {{ currentIssue.description }}
              </el-descriptions-item>
              <el-descriptions-item label="建议" :span="2">
                {{ currentIssue.suggestion }}
              </el-descriptions-item>
            </el-descriptions>
          </section>

          <section class="detail-section mark-panel">
            <div class="panel-title">处理标记</div>
            <el-form label-width="88px">
              <el-form-item label="标记状态">
                <el-radio-group v-model="markForm.status">
                  <el-radio-button label="watching">跟进中</el-radio-button>
                  <el-radio-button label="resolved">已处理</el-radio-button>
                  <el-radio-button label="ignored">忽略</el-radio-button>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="处理备注">
                <el-input
                  v-model="markForm.note"
                  maxlength="500"
                  show-word-limit
                  type="textarea"
                  :rows="3"
                  placeholder="记录核对结论、第三方单号、后续处理人或忽略原因"
                />
              </el-form-item>
              <el-form-item>
                <el-button
                  type="primary"
                  :loading="markSubmitting"
                  @click="submitMark"
                >
                  保存标记
                </el-button>
              </el-form-item>
            </el-form>
          </section>

          <section class="detail-section">
            <div class="panel-title">关联记录</div>
            <div class="related-grid">
              <div v-if="related.order" class="related-card">
                <span>订单</span>
                <strong>{{ related.order.status }}</strong>
                <em>{{ yuan(related.order.amount) }}</em>
                <small>{{ related.order.provider_trade_no || "-" }}</small>
              </div>
              <div v-if="related.settlement" class="related-card">
                <span>结算</span>
                <strong>{{ related.settlement.status }}</strong>
                <em>{{ yuan(related.settlement.platform_fee_amount) }}</em>
                <small>{{ related.settlement.fee_rate_bps || 0 }} bps</small>
              </div>
              <div v-if="related.after_sale" class="related-card">
                <span>售后退款</span>
                <strong>{{ related.after_sale.refund_status }}</strong>
                <em>{{ yuan(related.after_sale.refund_amount) }}</em>
                <small>{{
                  related.after_sale.wechat_refund_status || "-"
                }}</small>
              </div>
              <div v-if="related.withdrawal" class="related-card">
                <span>提现</span>
                <strong>{{ related.withdrawal.status }}</strong>
                <em>{{ yuan(related.withdrawal.amount) }}</em>
                <small>{{ related.withdrawal.out_bill_no || "-" }}</small>
              </div>
            </div>

            <el-table
              v-if="relatedRevenueRows.length"
              :data="relatedRevenueRows"
              border
              class="related-table"
            >
              <el-table-column label="收入流水" prop="business_type" />
              <el-table-column label="服务费">
                <template #default="{ row }">
                  {{ signedYuan(row.platform_fee_amount) }}
                </template>
              </el-table-column>
              <el-table-column label="净收入">
                <template #default="{ row }">
                  {{ signedYuan(row.net_revenue_amount) }}
                </template>
              </el-table-column>
              <el-table-column label="时间" prop="created_at" min-width="150" />
            </el-table>

            <el-table
              v-if="relatedPaymentRows.length"
              :data="relatedPaymentRows"
              border
              class="related-table"
            >
              <el-table-column label="支付意图" prop="id" min-width="200" />
              <el-table-column label="渠道">
                <template #default="{ row }">{{
                  channelText(row.channel)
                }}</template>
              </el-table-column>
              <el-table-column label="状态" prop="status" />
              <el-table-column label="金额">
                <template #default="{ row }">{{ yuan(row.amount) }}</template>
              </el-table-column>
              <el-table-column
                label="过期时间"
                prop="expires_at"
                min-width="150"
              />
            </el-table>

            <el-table
              v-if="relatedAllocationRows.length"
              :data="relatedAllocationRows"
              border
              class="related-table"
            >
              <el-table-column
                label="结算单"
                prop="settlement_id"
                min-width="210"
              />
              <el-table-column label="状态" prop="status" />
              <el-table-column label="锁定金额">
                <template #default="{ row }">{{ yuan(row.amount) }}</template>
              </el-table-column>
            </el-table>
          </section>
        </template>
      </div>
    </el-drawer>
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

.detail-drawer {
  min-height: 420px;
}

.detail-section {
  margin-bottom: 16px;
}

.detail-title {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
}

.detail-title span {
  margin-right: 4px;
  font-size: 18px;
  font-weight: 700;
  color: #211a14;
}

.mark-panel {
  padding: 14px;
  background: #fbfaf8;
  border: 1px solid #e6e1da;
  border-radius: 8px;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.related-card {
  min-height: 96px;
  padding: 12px;
  background: #fff;
  border: 1px solid #e6e1da;
  border-radius: 8px;
}

.related-card span,
.related-card small {
  display: block;
  color: #8f8276;
  word-break: break-all;
}

.related-card strong {
  display: block;
  margin: 8px 0 4px;
  color: #211a14;
}

.related-card em {
  display: block;
  margin-bottom: 4px;
  font-style: normal;
  color: #4f463f;
}

.related-table {
  margin-top: 10px;
}

@media (width <= 1280px) {
  .summary-strip,
  .related-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (width <= 760px) {
  .summary-strip,
  .related-grid {
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
