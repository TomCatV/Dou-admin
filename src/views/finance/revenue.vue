<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  platformRevenueApi,
  type PlatformRevenueBusinessType,
  type PlatformRevenueCircleSummary,
  type PlatformRevenueDaySummary,
  type PlatformRevenueExportPreview,
  type PlatformRevenueLedgerItem,
  type PlatformRevenueSummary,
  type PlatformRevenueTypeSummary
} from "@/api/admin";
import { hasPerms } from "@/utils/auth";

defineOptions({
  name: "PlatformRevenue"
});

type TagType = "primary" | "success" | "warning" | "danger" | "info";

const emptySummary: PlatformRevenueSummary = {
  ledger_count: 0,
  gmv_amount: 0,
  service_fee_amount: 0,
  refund_reverse_amount: 0,
  channel_cost_amount: 0,
  net_revenue_amount: 0
};

const businessTypeMap: Record<
  PlatformRevenueBusinessType,
  { label: string; type: TagType }
> = {
  order_fee: { label: "订单服务费", type: "success" },
  refund_reverse: { label: "退款冲正", type: "warning" },
  subscription: { label: "套餐收入", type: "primary" },
  manual_adjust: { label: "人工调整", type: "info" }
};

const channelMap: Record<string, string> = {
  wechat_native: "微信扫码",
  wechat_jsapi: "微信支付",
  alipay_precreate: "支付宝扫码",
  alipay: "支付宝"
};

const statusMap: Record<string, string> = {
  booked: "已入账",
  reversed: "已冲正",
  settled: "已结清"
};

const ADJUST_CONFIRM_TEXT = "确认人工调整";
const REVERSE_CONFIRM_TEXT = "确认反向调整";

const loading = ref(false);
const ledgerLoading = ref(false);
const previewLoading = ref(false);
const exportLoading = ref(false);
const previewVisible = ref(false);
const adjustmentVisible = ref(false);
const adjustmentSubmitting = ref(false);
const adjustmentMode = ref<"create" | "reverse">("create");
const reverseTarget = ref<PlatformRevenueLedgerItem | null>(null);
const preview = ref<PlatformRevenueExportPreview | null>(null);
const summary = ref<PlatformRevenueSummary>({ ...emptySummary });
const byType = ref<PlatformRevenueTypeSummary[]>([]);
const byDay = ref<PlatformRevenueDaySummary[]>([]);
const topCircles = ref<PlatformRevenueCircleSummary[]>([]);
const rows = ref<PlatformRevenueLedgerItem[]>([]);
const total = ref(0);

const filters = reactive({
  date_range: defaultDateRange(),
  business_type: "",
  status: "",
  pay_channel: "",
  keyword: "",
  page: 1,
  page_size: 20
});

const adjustmentForm = reactive({
  circle_id: "",
  related_order_id: "",
  related_ledger_id: "",
  gross_yuan: 0,
  platform_fee_yuan: 0,
  channel_cost_yuan: 0,
  reason: "",
  confirm_text: ""
});

const trendRows = computed(() => byDay.value.slice(-14).reverse());
const canAdjust = computed(() => hasPerms("finance:revenue:adjust"));
const adjustmentNetYuan = computed(
  () =>
    (Number(adjustmentForm.platform_fee_yuan) || 0) -
    (Number(adjustmentForm.channel_cost_yuan) || 0)
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

function rateText(value?: number) {
  const bps = Number(value) || 0;
  return bps ? `${(bps / 100).toFixed(2)}%` : "-";
}

function businessMeta(value: PlatformRevenueBusinessType | string): {
  label: string;
  type: TagType;
} {
  return (
    businessTypeMap[value as PlatformRevenueBusinessType] || {
      label: String(value || "-"),
      type: "info"
    }
  );
}

function channelText(value?: string) {
  const key = String(value || "");
  return channelMap[key] || key || "-";
}

function statusText(value?: string) {
  const key = String(value || "");
  return statusMap[key] || key || "-";
}

function resetAdjustmentForm() {
  adjustmentForm.circle_id = "";
  adjustmentForm.related_order_id = "";
  adjustmentForm.related_ledger_id = "";
  adjustmentForm.gross_yuan = 0;
  adjustmentForm.platform_fee_yuan = 0;
  adjustmentForm.channel_cost_yuan = 0;
  adjustmentForm.reason = "";
  adjustmentForm.confirm_text = "";
}

function yuanToCents(value: number) {
  return Math.round((Number(value) || 0) * 100);
}

function openAdjustment(row?: PlatformRevenueLedgerItem) {
  adjustmentMode.value = "create";
  reverseTarget.value = null;
  resetAdjustmentForm();
  if (row) {
    adjustmentForm.circle_id = row.circle_id || "";
    adjustmentForm.related_order_id = row.order_id || "";
    adjustmentForm.related_ledger_id = row.id || "";
  }
  adjustmentVisible.value = true;
}

function openReverseAdjustment(row: PlatformRevenueLedgerItem) {
  adjustmentMode.value = "reverse";
  reverseTarget.value = row;
  resetAdjustmentForm();
  adjustmentForm.circle_id = row.circle_id || "";
  adjustmentForm.related_order_id = row.order_id || "";
  adjustmentForm.related_ledger_id = row.id || "";
  adjustmentForm.gross_yuan = -Number(row.gross_amount || 0) / 100;
  adjustmentForm.platform_fee_yuan =
    -Number(row.platform_fee_amount || 0) / 100;
  adjustmentForm.channel_cost_yuan =
    -Number(row.channel_cost_amount || 0) / 100;
  adjustmentVisible.value = true;
}

function queryParams(includePage = false) {
  return {
    date_from: filters.date_range?.[0] || "",
    date_to: filters.date_range?.[1] || "",
    business_type: filters.business_type,
    status: filters.status,
    pay_channel: filters.pay_channel,
    keyword: filters.keyword,
    ...(includePage ? { page: filters.page, page_size: filters.page_size } : {})
  };
}

async function loadSummary() {
  loading.value = true;
  try {
    const data = await platformRevenueApi.summary(queryParams());
    summary.value = data.summary || { ...emptySummary };
    byType.value = data.by_type || [];
    byDay.value = data.by_day || [];
    topCircles.value = data.top_circles || [];
  } finally {
    loading.value = false;
  }
}

async function loadLedger() {
  ledgerLoading.value = true;
  try {
    const data = await platformRevenueApi.ledger(queryParams(true));
    rows.value = data.items || [];
    total.value = data.total || 0;
  } finally {
    ledgerLoading.value = false;
  }
}

async function loadAll() {
  try {
    await Promise.all([loadSummary(), loadLedger()]);
  } catch (error) {
    ElMessage.error(
      error instanceof Error ? error.message : "平台营收加载失败"
    );
  }
}

function search() {
  filters.page = 1;
  loadAll();
}

function resetSearch() {
  filters.date_range = defaultDateRange();
  filters.business_type = "";
  filters.status = "";
  filters.pay_channel = "";
  filters.keyword = "";
  filters.page = 1;
  loadAll();
}

async function openExportPreview() {
  previewLoading.value = true;
  try {
    preview.value = await platformRevenueApi.exportPreview(queryParams());
    previewVisible.value = true;
  } catch (error) {
    ElMessage.error(
      error instanceof Error ? error.message : "导出预览生成失败"
    );
  } finally {
    previewLoading.value = false;
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function exportFileName() {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
  return `platform-revenue-${stamp}.csv`;
}

async function confirmExport() {
  if (!preview.value) return;
  const exportLimit = preview.value.export_limit || preview.value.limit || 0;
  if (exportLimit && preview.value.total > exportLimit) {
    ElMessage.error(
      `匹配流水超过单次导出上限 ${exportLimit} 条，请缩小筛选范围`
    );
    return;
  }
  try {
    await ElMessageBox.confirm(
      `将按当前筛选条件导出 ${preview.value.total} 条平台营收流水，并写入管理员审计日志。导出不会改变任何资金状态。`,
      "确认导出收入流水",
      {
        confirmButtonText: "确认导出",
        cancelButtonText: "取消",
        type: "warning"
      }
    );
  } catch {
    return;
  }

  exportLoading.value = true;
  try {
    const blob = await platformRevenueApi.exportCsv(queryParams());
    downloadBlob(blob, exportFileName());
    ElMessage.success("收入流水 CSV 已生成，导出动作已写入审计");
  } catch (error) {
    ElMessage.error(
      error instanceof Error ? error.message : "收入流水导出失败"
    );
  } finally {
    exportLoading.value = false;
  }
}

async function submitAdjustment() {
  const confirmText =
    adjustmentMode.value === "reverse"
      ? REVERSE_CONFIRM_TEXT
      : ADJUST_CONFIRM_TEXT;
  if (adjustmentForm.confirm_text !== confirmText) {
    ElMessage.warning(`请输入“${confirmText}”`);
    return;
  }
  if (adjustmentForm.reason.trim().length < 8) {
    ElMessage.warning("请填写不少于 8 个字的调整原因");
    return;
  }
  if (
    adjustmentMode.value === "create" &&
    ![
      adjustmentForm.gross_yuan,
      adjustmentForm.platform_fee_yuan,
      adjustmentForm.channel_cost_yuan
    ].some(value => Number(value) !== 0)
  ) {
    ElMessage.warning("请至少填写一项需要调整的金额");
    return;
  }
  if (adjustmentMode.value === "reverse" && !reverseTarget.value) return;

  try {
    await ElMessageBox.confirm(
      adjustmentMode.value === "reverse"
        ? "将创建一条金额相反的人工调整流水，并把原人工调整标记为已冲正。该动作不会修改订单、钱包、退款或提现状态。"
        : "将创建一条人工调整流水并写入管理员审计。该动作只影响平台营收流水口径，不会修改订单、钱包、退款或提现状态。",
      adjustmentMode.value === "reverse" ? "确认反向调整" : "确认人工调整",
      {
        confirmButtonText: "继续提交",
        cancelButtonText: "取消",
        type: "warning"
      }
    );
  } catch {
    return;
  }

  adjustmentSubmitting.value = true;
  try {
    if (adjustmentMode.value === "reverse" && reverseTarget.value) {
      await platformRevenueApi.reverseAdjustment(reverseTarget.value.id, {
        reason: adjustmentForm.reason.trim(),
        confirm_text: adjustmentForm.confirm_text
      });
      ElMessage.success("反向调整流水已创建，原流水已标记为已冲正");
    } else {
      await platformRevenueApi.createAdjustment({
        circle_id: adjustmentForm.circle_id.trim(),
        related_order_id: adjustmentForm.related_order_id.trim(),
        related_ledger_id: adjustmentForm.related_ledger_id.trim(),
        gross_amount: yuanToCents(adjustmentForm.gross_yuan),
        platform_fee_amount: yuanToCents(adjustmentForm.platform_fee_yuan),
        channel_cost_amount: yuanToCents(adjustmentForm.channel_cost_yuan),
        reason: adjustmentForm.reason.trim(),
        confirm_text: adjustmentForm.confirm_text
      });
      ElMessage.success("人工调整流水已创建并写入审计");
    }
    adjustmentVisible.value = false;
    await loadAll();
  } catch (error) {
    ElMessage.error(
      error instanceof Error ? error.message : "人工调整提交失败"
    );
  } finally {
    adjustmentSubmitting.value = false;
  }
}

onMounted(loadAll);
</script>

<template>
  <div class="revenue-page">
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
        v-model="filters.business_type"
        class="filter-item"
        clearable
        placeholder="业务类型"
      >
        <el-option label="订单服务费" value="order_fee" />
        <el-option label="退款冲正" value="refund_reverse" />
        <el-option label="套餐收入" value="subscription" />
        <el-option label="人工调整" value="manual_adjust" />
      </el-select>
      <el-select
        v-model="filters.status"
        class="filter-item"
        clearable
        placeholder="流水状态"
      >
        <el-option label="已入账" value="booked" />
        <el-option label="已冲正" value="reversed" />
        <el-option label="已结清" value="settled" />
      </el-select>
      <el-select
        v-model="filters.pay_channel"
        class="filter-item"
        clearable
        placeholder="支付渠道"
      >
        <el-option label="微信扫码" value="wechat_native" />
        <el-option label="微信支付" value="wechat_jsapi" />
        <el-option label="支付宝扫码" value="alipay_precreate" />
        <el-option label="支付宝" value="alipay" />
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
      <el-button :loading="previewLoading" @click="openExportPreview">
        导出预览
      </el-button>
      <el-button v-if="canAdjust" type="warning" @click="openAdjustment()">
        人工调整
      </el-button>
    </div>

    <div v-loading="loading" class="summary-strip">
      <div class="metric">
        <span>成交 GMV</span>
        <strong>{{ yuan(summary.gmv_amount) }}</strong>
      </div>
      <div class="metric">
        <span>平台服务费</span>
        <strong>{{ yuan(summary.service_fee_amount) }}</strong>
      </div>
      <div class="metric">
        <span>退款冲正</span>
        <strong class="warning">{{
          yuan(summary.refund_reverse_amount)
        }}</strong>
      </div>
      <div class="metric">
        <span>通道成本</span>
        <strong>{{ yuan(summary.channel_cost_amount) }}</strong>
      </div>
      <div class="metric">
        <span>平台净收入</span>
        <strong :class="{ negative: summary.net_revenue_amount < 0 }">
          {{ signedYuan(summary.net_revenue_amount) }}
        </strong>
      </div>
    </div>

    <div class="panel-grid">
      <section class="panel">
        <div class="panel-title">近 14 天趋势</div>
        <el-table :data="trendRows" size="small" border>
          <el-table-column prop="day" label="日期" min-width="110" />
          <el-table-column label="服务费" min-width="120">
            <template #default="{ row }">{{
              yuan(row.service_fee_amount)
            }}</template>
          </el-table-column>
          <el-table-column label="退款冲正" min-width="120">
            <template #default="{ row }">{{
              yuan(row.refund_reverse_amount)
            }}</template>
          </el-table-column>
          <el-table-column label="净收入" min-width="120">
            <template #default="{ row }">
              <span :class="{ negative: row.net_revenue_amount < 0 }">
                {{ signedYuan(row.net_revenue_amount) }}
              </span>
            </template>
          </el-table-column>
        </el-table>
      </section>

      <section class="panel">
        <div class="panel-title">收入构成</div>
        <el-table :data="byType" size="small" border>
          <el-table-column label="类型" min-width="120">
            <template #default="{ row }">
              <el-tag :type="businessMeta(row.business_type).type">
                {{ businessMeta(row.business_type).label }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="笔数" width="90">
            <template #default="{ row }">{{ row.ledger_count }}</template>
          </el-table-column>
          <el-table-column label="净收入" min-width="120">
            <template #default="{ row }">
              <span :class="{ negative: row.net_revenue_amount < 0 }">
                {{ signedYuan(row.net_revenue_amount) }}
              </span>
            </template>
          </el-table-column>
        </el-table>
      </section>

      <section class="panel">
        <div class="panel-title">圈子贡献</div>
        <el-table :data="topCircles" size="small" border>
          <el-table-column label="圈子" min-width="160">
            <template #default="{ row }">
              <div class="cell-main">
                {{ row.circle_name || row.circle_id || "-" }}
              </div>
              <div v-if="row.circle_name" class="cell-sub">
                {{ row.circle_id }}
              </div>
            </template>
          </el-table-column>
          <el-table-column label="GMV" width="110">
            <template #default="{ row }">{{ yuan(row.gmv_amount) }}</template>
          </el-table-column>
          <el-table-column label="净收入" width="120">
            <template #default="{ row }">{{
              signedYuan(row.net_revenue_amount)
            }}</template>
          </el-table-column>
        </el-table>
      </section>
    </div>

    <section class="ledger-panel">
      <div class="panel-title">收入流水</div>
      <el-table v-loading="ledgerLoading" :data="rows" border>
        <el-table-column label="业务" min-width="180">
          <template #default="{ row }">
            <el-tag :type="businessMeta(row.business_type).type">
              {{ businessMeta(row.business_type).label }}
            </el-tag>
            <div class="cell-sub">{{ row.created_at }}</div>
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
        <el-table-column label="订单/交易" min-width="220">
          <template #default="{ row }">
            <div class="cell-main">
              {{ row.order_id || row.business_id || "-" }}
            </div>
            <div class="cell-sub">
              {{ row.provider_trade_no || channelText(row.pay_channel) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="成交金额" width="120">
          <template #default="{ row }">{{ yuan(row.gross_amount) }}</template>
        </el-table-column>
        <el-table-column label="服务费" width="130">
          <template #default="{ row }">
            <div>{{ signedYuan(row.platform_fee_amount) }}</div>
            <div class="cell-sub">{{ rateText(row.fee_rate_bps) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="通道成本" width="120">
          <template #default="{ row }">{{
            yuan(row.channel_cost_amount)
          }}</template>
        </el-table-column>
        <el-table-column label="净收入" width="130">
          <template #default="{ row }">
            <span :class="{ negative: row.net_revenue_amount < 0 }">
              {{ signedYuan(row.net_revenue_amount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="渠道" width="120">
          <template #default="{ row }">{{
            channelText(row.pay_channel)
          }}</template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">{{ statusText(row.status) }}</template>
        </el-table-column>
        <el-table-column
          v-if="canAdjust"
          label="操作"
          width="160"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button text type="primary" @click="openAdjustment(row)">
              关联调整
            </el-button>
            <el-button
              v-if="
                row.business_type === 'manual_adjust' &&
                row.status !== 'reversed'
              "
              text
              type="warning"
              @click="openReverseAdjustment(row)"
            >
              反向
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
          @change="loadLedger"
        />
      </div>
    </section>

    <el-drawer
      v-model="previewVisible"
      title="收入流水导出预览"
      size="72%"
      destroy-on-close
    >
      <template v-if="preview">
        <div class="preview-summary">
          <div>
            <span>匹配流水</span>
            <strong>{{ preview.total }}</strong>
          </div>
          <div>
            <span>预览笔数</span>
            <strong>{{ preview.preview_count }} / {{ preview.limit }}</strong>
          </div>
          <div>
            <span>平台服务费</span>
            <strong>{{ yuan(preview.summary.service_fee_amount) }}</strong>
          </div>
          <div>
            <span>平台净收入</span>
            <strong
              :class="{ negative: preview.summary.net_revenue_amount < 0 }"
            >
              {{ signedYuan(preview.summary.net_revenue_amount) }}
            </strong>
          </div>
        </div>
        <div class="preview-action">
          <p class="preview-note">
            导出将按当前筛选条件生成 CSV
            文件，并写入管理员审计日志；该动作不会改变订单、结算、钱包或营收流水状态。
            单次最多导出 {{ preview.export_limit || preview.limit }} 条。
          </p>
          <el-button
            type="primary"
            :loading="exportLoading"
            :disabled="
              !!preview.export_limit && preview.total > preview.export_limit
            "
            @click="confirmExport"
          >
            确认导出 CSV
          </el-button>
        </div>
        <el-table :data="preview.items" border max-height="560">
          <el-table-column label="流水时间" prop="created_at" min-width="160" />
          <el-table-column label="业务类型" min-width="130">
            <template #default="{ row }">
              {{ businessMeta(row.business_type).label }}
            </template>
          </el-table-column>
          <el-table-column label="状态" min-width="100">
            <template #default="{ row }">{{ statusText(row.status) }}</template>
          </el-table-column>
          <el-table-column label="圈子" min-width="170">
            <template #default="{ row }">
              {{ row.circle_name || row.circle_id || "-" }}
            </template>
          </el-table-column>
          <el-table-column label="订单号" prop="order_id" min-width="210" />
          <el-table-column label="第三方交易号" min-width="190">
            <template #default="{ row }">
              {{ row.provider_trade_no || "-" }}
            </template>
          </el-table-column>
          <el-table-column label="渠道" min-width="120">
            <template #default="{ row }">{{
              channelText(row.pay_channel)
            }}</template>
          </el-table-column>
          <el-table-column label="成交金额" min-width="110">
            <template #default="{ row }">{{ yuan(row.gross_amount) }}</template>
          </el-table-column>
          <el-table-column label="服务费" min-width="110">
            <template #default="{ row }">
              {{ signedYuan(row.platform_fee_amount) }}
            </template>
          </el-table-column>
          <el-table-column label="通道成本" min-width="110">
            <template #default="{ row }">
              {{ yuan(row.channel_cost_amount) }}
            </template>
          </el-table-column>
          <el-table-column label="净收入" min-width="120">
            <template #default="{ row }">
              <span :class="{ negative: row.net_revenue_amount < 0 }">
                {{ signedYuan(row.net_revenue_amount) }}
              </span>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </el-drawer>

    <el-drawer
      v-model="adjustmentVisible"
      :title="
        adjustmentMode === 'reverse' ? '反向人工调整' : '创建人工调整流水'
      "
      size="520px"
      destroy-on-close
    >
      <el-alert
        :title="
          adjustmentMode === 'reverse'
            ? '反向调整会创建金额相反的新流水，并把原人工调整标记为已冲正。'
            : '人工调整只修正平台营收流水口径，不会修改订单、结算、钱包、退款或提现状态。'
        "
        type="warning"
        :closable="false"
        class="adjust-alert"
      />
      <el-form label-position="top" class="adjust-form">
        <el-form-item label="圈子 ID">
          <el-input
            v-model="adjustmentForm.circle_id"
            :disabled="adjustmentMode === 'reverse'"
            clearable
            placeholder="可留空；关联圈子时填写 circle_id"
          />
        </el-form-item>
        <el-form-item label="关联订单号">
          <el-input
            v-model="adjustmentForm.related_order_id"
            :disabled="adjustmentMode === 'reverse'"
            clearable
            placeholder="可留空；用于审计追溯"
          />
        </el-form-item>
        <el-form-item label="关联收入流水 ID">
          <el-input
            v-model="adjustmentForm.related_ledger_id"
            :disabled="adjustmentMode === 'reverse'"
            clearable
            placeholder="可留空；从列表关联调整时自动填入"
          />
        </el-form-item>
        <div class="adjust-amount-grid">
          <el-form-item label="成交金额调整">
            <el-input-number
              v-model="adjustmentForm.gross_yuan"
              :disabled="adjustmentMode === 'reverse'"
              :precision="2"
              :step="1"
              controls-position="right"
            />
          </el-form-item>
          <el-form-item label="平台服务费调整">
            <el-input-number
              v-model="adjustmentForm.platform_fee_yuan"
              :disabled="adjustmentMode === 'reverse'"
              :precision="2"
              :step="1"
              controls-position="right"
            />
          </el-form-item>
          <el-form-item label="通道成本调整">
            <el-input-number
              v-model="adjustmentForm.channel_cost_yuan"
              :disabled="adjustmentMode === 'reverse'"
              :precision="2"
              :step="1"
              controls-position="right"
            />
          </el-form-item>
          <el-form-item label="净收入影响">
            <el-input
              :model-value="signedYuan(adjustmentNetYuan * 100)"
              disabled
            />
          </el-form-item>
        </div>
        <el-form-item label="调整原因">
          <el-input
            v-model="adjustmentForm.reason"
            type="textarea"
            :rows="4"
            maxlength="500"
            show-word-limit
            placeholder="至少 8 个字，写清楚来源、对账依据和处理结论"
          />
        </el-form-item>
        <el-form-item
          :label="
            adjustmentMode === 'reverse'
              ? `二次确认：输入“${REVERSE_CONFIRM_TEXT}”`
              : `二次确认：输入“${ADJUST_CONFIRM_TEXT}”`
          "
        >
          <el-input
            v-model="adjustmentForm.confirm_text"
            placeholder="请输入完整确认文案"
          />
        </el-form-item>
        <div class="adjust-actions">
          <el-button @click="adjustmentVisible = false">取消</el-button>
          <el-button
            type="primary"
            :loading="adjustmentSubmitting"
            @click="submitAdjustment"
          >
            提交
          </el-button>
        </div>
      </el-form>
    </el-drawer>
  </div>
</template>

<style scoped>
.revenue-page {
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

.metric {
  min-height: 84px;
  padding: 14px 16px;
  background: #fff;
  border: 1px solid #e7e2dc;
  border-radius: 8px;
}

.metric span {
  display: block;
  margin-bottom: 10px;
  font-size: 13px;
  color: #8a7d71;
}

.metric strong {
  font-size: 22px;
  line-height: 1.2;
  color: #211a14;
}

.warning {
  color: #b06b00 !important;
}

.negative {
  color: #c45656;
}

.panel-grid {
  display: grid;
  grid-template-columns: 1.1fr 0.8fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.panel,
.ledger-panel {
  padding: 14px;
  background: #fff;
  border: 1px solid #e7e2dc;
  border-radius: 8px;
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

.preview-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.preview-summary div {
  padding: 12px;
  background: #fbfaf8;
  border: 1px solid #eee7df;
  border-radius: 8px;
}

.preview-summary span {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  color: #8f8276;
}

.preview-summary strong {
  font-size: 18px;
  color: #211a14;
}

.preview-note {
  margin: 0;
  color: #76695e;
}

.preview-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.adjust-alert {
  margin-bottom: 14px;
}

.adjust-form {
  padding-right: 4px;
}

.adjust-amount-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 12px;
}

.adjust-amount-grid :deep(.el-input-number) {
  width: 100%;
}

.adjust-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (width <= 1280px) {
  .summary-strip,
  .panel-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (width <= 760px) {
  .summary-strip,
  .panel-grid {
    grid-template-columns: 1fr;
  }

  .date-range,
  .filter-item,
  .keyword {
    width: 100%;
  }

  .preview-summary {
    grid-template-columns: 1fr;
  }

  .preview-action {
    align-items: stretch;
    flex-direction: column;
  }

  .adjust-amount-grid {
    grid-template-columns: 1fr;
  }
}
</style>
