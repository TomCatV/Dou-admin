<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  tenantApi,
  type AfterSaleAction,
  type AfterSaleMessage,
  type TenantContext,
  type TenantAfterSale,
  type TenantOrder
} from "@/api/admin";
import {
  afterSaleActionLabels,
  afterSaleStatusMap,
  complaintTypeLabels,
  refundStatusMap
} from "@/utils/labels";
import {
  getSelectedTenantCircleId,
  setSelectedTenantCircleId
} from "@/utils/tenantContext";

defineOptions({ name: "TenantOrders" });

const activeTab = ref("orders");
const loading = ref(false);
const orders = ref<TenantOrder[]>([]);
const afterSales = ref<TenantAfterSale[]>([]);
const total = ref(0);
const route = useRoute();
const tenantContext = ref<TenantContext | null>(null);
const selectedCircleId = ref(getSelectedTenantCircleId());
const filters = reactive({ keyword: "", status: "", page: 1, page_size: 20 });
const detailVisible = ref(false);
const detailLoading = ref(false);
const actionLoading = ref(false);
const current = ref<TenantAfterSale | null>(null);
const messages = ref<AfterSaleMessage[]>([]);
const actions = ref<AfterSaleAction[]>([]);
const actionForm = reactive({
  reply: "",
  note: "已核实售后诉求，圈主协助处理"
});

type TagType = "primary" | "success" | "warning" | "danger" | "info";

function yuan(value: number) {
  return `¥${((Number(value) || 0) / 100).toFixed(2)}`;
}

function feeRate(value?: number) {
  const bps = Number(value) || 0;
  return bps ? `${(bps / 100).toFixed(2)}%` : "-";
}

function metaOf<T extends Record<string, { label: string; type: string }>>(
  map: T,
  value?: string
) {
  return (map[value as keyof T] || { label: value || "-", type: "info" }) as {
    label: string;
    type: TagType;
  };
}

function labelOf(map: Record<string, string>, value?: string) {
  return map[String(value || "")] || value || "-";
}

const canReplaceCode = computed(
  () =>
    current.value?.status === "open" && current.value?.delivery_type === "code"
);

const canHandleCurrent = computed(() => current.value?.status === "open");
const currentCircle = computed(() => tenantContext.value?.current_circle || null);

async function loadTenantContext() {
  try {
    const context = await tenantApi.context();
    const circles = context.circles || [];
    let nextSelected = selectedCircleId.value || context.selected_circle_id;
    if (!circles.some(item => item.id === nextSelected)) {
      nextSelected = context.selected_circle_id || circles[0]?.id || "";
    }
    if (nextSelected) {
      setSelectedTenantCircleId(nextSelected);
      selectedCircleId.value = nextSelected;
    }
    const nextCircle =
      circles.find(item => item.id === nextSelected) ||
      context.current_circle ||
      null;
    tenantContext.value = {
      ...context,
      can_enter: Boolean(nextCircle),
      selected_circle_id: nextSelected,
      current_circle: nextCircle
    };
    return Boolean(nextCircle);
  } catch (error) {
    tenantContext.value = {
      can_enter: false,
      message: error instanceof Error ? error.message : "当前账号暂无可经营圈子",
      selected_circle_id: "",
      current_circle: null,
      circles: []
    };
    return false;
  }
}

async function loadList() {
  if (tenantContext.value && !tenantContext.value.can_enter) {
    orders.value = [];
    afterSales.value = [];
    total.value = 0;
    return;
  }
  loading.value = true;
  try {
    if (activeTab.value === "orders") {
      const data = await tenantApi.orders({ ...filters });
      orders.value = data.items;
      total.value = data.total;
    } else {
      const data = await tenantApi.afterSales({
        status: filters.status,
        page: filters.page,
        page_size: filters.page_size
      });
      afterSales.value = data.items;
      total.value = data.total;
    }
  } finally {
    loading.value = false;
  }
}

async function loadPageData() {
  const canEnter = await loadTenantContext();
  if (!canEnter) {
    orders.value = [];
    afterSales.value = [];
    total.value = 0;
    detailVisible.value = false;
    current.value = null;
    messages.value = [];
    actions.value = [];
    return;
  }
  await loadList();
}

function applyDetail(data: {
  after_sale: TenantAfterSale;
  messages: AfterSaleMessage[];
  actions: AfterSaleAction[];
}) {
  current.value = data.after_sale;
  messages.value = data.messages || [];
  actions.value = data.actions || [];
}

async function openAfterSale(row: TenantAfterSale) {
  detailVisible.value = true;
  detailLoading.value = true;
  actionForm.reply = "";
  actionForm.note = "已核实售后诉求，圈主协助处理";
  try {
    applyDetail(await tenantApi.afterSaleDetail(row.id));
  } finally {
    detailLoading.value = false;
  }
}

async function replyCurrent() {
  if (!current.value) return;
  if (!actionForm.reply.trim()) {
    ElMessage.warning("请填写回复内容");
    return;
  }
  actionLoading.value = true;
  try {
    applyDetail(
      await tenantApi.replyAfterSale(current.value.id, {
        content: actionForm.reply.trim(),
        message_type: "text"
      })
    );
    actionForm.reply = "";
    ElMessage.success("回复已发送");
    await loadList();
  } finally {
    actionLoading.value = false;
  }
}

async function resendCurrent() {
  if (!current.value) return;
  if (!actionForm.note.trim()) {
    ElMessage.warning("请填写处理说明");
    return;
  }
  await ElMessageBox.confirm("确认补发资源并记录售后动作？", "补发确认", {
    type: "warning"
  });
  actionLoading.value = true;
  try {
    applyDetail(
      await tenantApi.resendAfterSale(current.value.id, {
        note: actionForm.note.trim()
      })
    );
    ElMessage.success("补发动作已记录");
    await loadList();
  } finally {
    actionLoading.value = false;
  }
}

async function replaceCodeCurrent() {
  if (!current.value) return;
  if (!actionForm.note.trim()) {
    ElMessage.warning("请填写更换原因");
    return;
  }
  await ElMessageBox.confirm(
    "确认禁用旧卡密并发放一条新卡密？",
    "更换卡密确认",
    { type: "warning" }
  );
  actionLoading.value = true;
  try {
    applyDetail(
      await tenantApi.replaceAfterSaleCode(current.value.id, {
        note: actionForm.note.trim()
      })
    );
    ElMessage.success("卡密已更换");
    await loadList();
  } finally {
    actionLoading.value = false;
  }
}

async function refundCurrent() {
  if (!current.value) return;
  if (!actionForm.note.trim()) {
    ElMessage.warning("请填写退款原因");
    return;
  }
  await ElMessageBox.confirm(
    "确认发起原路退款？退款终态以微信回调或查单为准。",
    "退款确认",
    { type: "warning" }
  );
  actionLoading.value = true;
  try {
    const data = await tenantApi.refundAfterSale(current.value.id, {
      note: actionForm.note.trim()
    });
    applyDetail(data);
    ElMessage.success(
      data.ambiguous ? "退款已提交，等待确认" : "退款处理已提交"
    );
    await loadList();
  } finally {
    actionLoading.value = false;
  }
}

async function syncRefundCurrent() {
  if (!current.value) return;
  actionLoading.value = true;
  try {
    applyDetail(await tenantApi.syncAfterSaleRefund(current.value.id));
    ElMessage.success("退款状态已刷新");
    await loadList();
  } finally {
    actionLoading.value = false;
  }
}

function switchTab() {
  filters.page = 1;
  filters.status = "";
  loadPageData();
}

async function switchTenantCircle(value: string) {
  setSelectedTenantCircleId(value);
  selectedCircleId.value = value;
  filters.page = 1;
  detailVisible.value = false;
  current.value = null;
  await loadPageData();
}

onMounted(() => {
  const tab = String(route.query.tab || "");
  const status = String(route.query.status || "");
  if (tab === "after-sales") activeTab.value = tab;
  if (status) filters.status = status;
  loadPageData();
});
</script>

<template>
  <div class="tenant-list-page">
    <div class="page-head">
      <div>
        <h1>订单与售后</h1>
        <p>查看当前经营圈子的成交订单、售后协商、补发和退款处理进度。</p>
      </div>
      <div class="head-actions">
        <el-select
          v-if="tenantContext?.circles?.length"
          v-model="selectedCircleId"
          class="circle-switch"
          placeholder="选择经营圈子"
          @change="switchTenantCircle"
        >
          <el-option
            v-for="item in tenantContext.circles"
            :key="item.id"
            :label="item.name || item.circle_code || item.id"
            :value="item.id"
          />
        </el-select>
        <el-button type="primary" @click="loadPageData">刷新</el-button>
      </div>
    </div>

    <el-alert
      v-if="tenantContext && !tenantContext.can_enter"
      class="mb"
      type="warning"
      show-icon
      :closable="false"
      :title="tenantContext.message || '当前账号还没有可经营的圈子上下文。'"
      description="请先确认后台账号已绑定到微信小程序注册的圈主用户，并且该用户名下至少有一个活跃圈子。"
    />

    <el-alert
      v-else-if="currentCircle"
      class="mb"
      type="info"
      show-icon
      :closable="false"
      :title="`当前经营圈子：${currentCircle.name || currentCircle.circle_code || currentCircle.id}`"
      description="订单列表、售后协商和退款动作都会作用于当前选中的圈子。"
    />

    <el-tabs v-model="activeTab" @tab-change="switchTab">
      <el-tab-pane label="订单" name="orders" />
      <el-tab-pane label="售后" name="after-sales" />
    </el-tabs>
    <div class="filter-bar">
      <el-input
        v-if="activeTab === 'orders'"
        v-model="filters.keyword"
        class="keyword"
        clearable
        placeholder="搜索订单、用户或资源"
        @keyup.enter="loadList"
      />
      <el-select
        v-model="filters.status"
        class="filter-item"
        clearable
        placeholder="状态"
      >
        <template v-if="activeTab === 'orders'">
          <el-option label="待支付" value="created" />
          <el-option label="已支付" value="paid" />
          <el-option label="已退款" value="refunded" />
        </template>
        <template v-else>
          <el-option label="处理中" value="open" />
          <el-option label="已退款" value="refunded" />
          <el-option label="已拒绝" value="rejected" />
          <el-option label="已关闭" value="closed" />
        </template>
      </el-select>
      <el-button type="primary" @click="loadList">查询</el-button>
    </div>

    <el-table
      v-if="activeTab === 'orders'"
      v-loading="loading"
      :data="orders"
      border
    >
      <el-table-column label="订单" min-width="220">
        <template #default="{ row }">
          <div class="main">
            {{ row.resource_title || row.room_name || row.id }}
          </div>
          <div class="sub">{{ row.id }}</div>
        </template>
      </el-table-column>
      <el-table-column label="买家" min-width="150">
        <template #default="{ row }">{{
          row.buyer_nickname || row.buyer_dxq_id || "-"
        }}</template>
      </el-table-column>
      <el-table-column label="金额" width="120">
        <template #default="{ row }">
          <div>{{ yuan(row.amount) }}</div>
          <div v-if="row.discount_amount" class="sub">
            优惠 {{ yuan(row.discount_amount) }}
          </div>
        </template>
      </el-table-column>
      <el-table-column label="平台服务费" width="140">
        <template #default="{ row }">
          <div>{{ yuan(row.platform_fee_amount || 0) }}</div>
          <div class="sub">{{ feeRate(row.fee_rate_bps) }}</div>
        </template>
      </el-table-column>
      <el-table-column label="预计入账" width="130">
        <template #default="{ row }">{{
          yuan(row.creator_amount || 0)
        }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="110" />
      <el-table-column label="来源" width="150">
        <template #default="{ row }">
          <div>
            {{ row.coupon_code || row.invite_code || row.campaign_name || "-" }}
          </div>
          <div class="sub">
            {{ row.attribution_source || row.source_channel || "-" }}
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="170" />
    </el-table>

    <el-table v-else v-loading="loading" :data="afterSales" border>
      <el-table-column label="售后" min-width="220">
        <template #default="{ row }">
          <div class="main">{{ row.resource_title || row.id }}</div>
          <div class="sub">{{ row.description || "-" }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="buyer_nickname" label="买家" min-width="140" />
      <el-table-column prop="complaint_type" label="类型" width="130" />
      <el-table-column prop="status" label="状态" width="110" />
      <el-table-column label="退款" width="120">
        <template #default="{ row }">{{ yuan(row.refund_amount) }}</template>
      </el-table-column>
      <el-table-column prop="updated_at" label="更新时间" width="170" />
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openAfterSale(row)"
            >详情</el-button
          >
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
        @change="loadList"
      />
    </div>

    <el-drawer v-model="detailVisible" size="560px" title="售后处理">
      <div v-loading="detailLoading">
        <template v-if="current">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="商品">{{
              current.resource_title || current.resource_card_id
            }}</el-descriptions-item>
            <el-descriptions-item label="订单">{{
              current.order_id
            }}</el-descriptions-item>
            <el-descriptions-item label="买家">{{
              current.buyer?.nickname ||
              current.buyer_nickname ||
              current.buyer_user_id
            }}</el-descriptions-item>
            <el-descriptions-item label="售后原因">{{
              labelOf(complaintTypeLabels, current.complaint_type)
            }}</el-descriptions-item>
            <el-descriptions-item label="售后状态">
              <el-tag :type="metaOf(afterSaleStatusMap, current.status).type">
                {{ metaOf(afterSaleStatusMap, current.status).label }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="退款状态">
              <el-tag
                :type="metaOf(refundStatusMap, current.refund_status).type"
              >
                {{ metaOf(refundStatusMap, current.refund_status).label }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="买家说明">{{
              current.description || "-"
            }}</el-descriptions-item>
            <el-descriptions-item
              v-if="current.refund_error"
              label="退款异常"
              >{{ current.refund_error }}</el-descriptions-item
            >
          </el-descriptions>

          <div class="section-title">协商记录</div>
          <el-timeline>
            <el-timeline-item
              v-for="item in messages"
              :key="item.id"
              :timestamp="item.created_at"
            >
              <div class="message-line">
                <strong>{{ item.sender_name || item.sender_role }}</strong>
                <span>{{ item.content || item.image_url || "-" }}</span>
              </div>
            </el-timeline-item>
          </el-timeline>

          <div class="section-title">处理动作</div>
          <el-timeline>
            <el-timeline-item
              v-for="item in actions"
              :key="item.id"
              :timestamp="item.created_at"
            >
              <div class="message-line">
                <strong>{{
                  afterSaleActionLabels[item.action] || item.action
                }}</strong>
                <span>{{ item.summary || "-" }}</span>
              </div>
            </el-timeline-item>
          </el-timeline>

          <div class="section-title">圈主处理</div>
          <el-form label-position="top">
            <el-form-item label="回复买家">
              <el-input
                v-model="actionForm.reply"
                type="textarea"
                :rows="3"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>
            <el-button
              :loading="actionLoading"
              :disabled="!canHandleCurrent"
              type="primary"
              @click="replyCurrent"
              >发送回复</el-button
            >
            <el-divider />
            <el-form-item label="处理说明">
              <el-input
                v-model="actionForm.note"
                type="textarea"
                :rows="3"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>
            <div class="action-row">
              <el-button
                :loading="actionLoading"
                :disabled="!canHandleCurrent"
                @click="resendCurrent"
                >补发资源</el-button
              >
              <el-button
                :loading="actionLoading"
                :disabled="!canReplaceCode"
                @click="replaceCodeCurrent"
                >更换卡密</el-button
              >
              <el-button
                :loading="actionLoading"
                :disabled="!canHandleCurrent"
                type="danger"
                @click="refundCurrent"
                >通过并退款</el-button
              >
              <el-button
                :loading="actionLoading"
                :disabled="!current.out_refund_no"
                @click="syncRefundCurrent"
                >刷新退款</el-button
              >
            </div>
          </el-form>
        </template>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped>
.tenant-list-page {
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

.circle-switch {
  width: 220px;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.mb {
  margin-bottom: 12px;
}

.keyword {
  width: 300px;
}

.filter-item {
  width: 140px;
}

.main {
  font-weight: 700;
  color: #221a14;
}

.sub {
  font-size: 12px;
  color: #8f8276;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.section-title {
  margin: 18px 0 10px;
  font-weight: 700;
  color: #221a14;
}

.message-line {
  display: grid;
  gap: 4px;
  line-height: 1.5;
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

@media (width <= 768px) {
  .page-head,
  .head-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .circle-switch,
  .keyword {
    width: 100%;
  }
}
</style>
