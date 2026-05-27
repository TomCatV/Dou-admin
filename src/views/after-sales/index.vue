<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  afterSalesApi,
  type AfterSaleMessage,
  type ResourceAfterSale
} from "@/api/admin";
import {
  afterSaleStatusMap,
  complaintTypeLabels,
  governanceReasonOptions,
  refundStatusMap
} from "@/utils/labels";
import { hasPerms } from "@/utils/auth";

defineOptions({
  name: "AfterSales"
});

type TagType = "primary" | "success" | "warning" | "danger" | "info";

const loading = ref(false);
const detailLoading = ref(false);
const actionLoading = ref(false);
const rows = ref<ResourceAfterSale[]>([]);
const total = ref(0);
const detailVisible = ref(false);
const current = ref<ResourceAfterSale | null>(null);
const messages = ref<AfterSaleMessage[]>([]);

const filters = reactive({
  keyword: "",
  status: "open",
  refund_status: "",
  page: 1,
  page_size: 20
});

const actionForm = reactive({
  note: "售后审核通过并退款"
});

const canHandle = computed(() => hasPerms("after_sale:manage"));

function metaOf<T extends Record<string, { label: string; type: string }>>(
  map: T,
  value: string
) {
  return (map[value as keyof T] || { label: value || "-", type: "info" }) as {
    label: string;
    type: TagType;
  };
}

function labelOf(map: Record<string, string>, value: string) {
  return map[value] || value || "-";
}

function moneyText(value: number) {
  return `￥${((Number(value) || 0) / 100).toFixed(2)}`;
}

async function loadList() {
  loading.value = true;
  try {
    const data = await afterSalesApi.list({ ...filters });
    rows.value = data.items;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

function resetSearch() {
  filters.keyword = "";
  filters.status = "open";
  filters.refund_status = "";
  filters.page = 1;
  loadList();
}

async function openDetail(row: ResourceAfterSale) {
  detailVisible.value = true;
  detailLoading.value = true;
  actionForm.note = "售后审核通过并退款";
  try {
    const data = await afterSalesApi.detail(row.id);
    current.value = data.after_sale;
    messages.value = data.messages || [];
  } finally {
    detailLoading.value = false;
  }
}

async function refundCurrent() {
  if (!current.value) return;
  if (!actionForm.note) {
    ElMessage.warning("请选择退款审核原因");
    return;
  }
  await ElMessageBox.confirm("确认通过售后并发起退款？", "退款确认", {
    type: "warning"
  });
  actionLoading.value = true;
  try {
    const result = await afterSalesApi.refund(current.value.id, {
      note: actionForm.note
    });
    current.value = result.after_sale;
    ElMessage.success(result.ambiguous ? "退款已提交，等待微信确认" : "退款处理已提交");
    await loadList();
  } finally {
    actionLoading.value = false;
  }
}

async function rejectCurrent() {
  if (!current.value) return;
  if (!actionForm.note) {
    ElMessage.warning("请选择拒绝原因");
    return;
  }
  await ElMessageBox.confirm("确认拒绝该售后申请？", "售后拒绝确认", {
    type: "warning"
  });
  actionLoading.value = true;
  try {
    const result = await afterSalesApi.reject(current.value.id, {
      note: actionForm.note
    });
    current.value = result.after_sale;
    ElMessage.success("售后申请已拒绝");
    await loadList();
  } finally {
    actionLoading.value = false;
  }
}

async function syncRefund(row?: ResourceAfterSale) {
  const item = row || current.value;
  if (!item) return;
  actionLoading.value = true;
  try {
    const result = await afterSalesApi.syncRefund(item.id);
    if (current.value?.id === item.id) current.value = result.after_sale;
    ElMessage.success("退款状态已刷新");
    await loadList();
  } finally {
    actionLoading.value = false;
  }
}

onMounted(loadList);
</script>

<template>
  <div class="after-sales-page">
    <div class="filter-bar">
      <el-input
        v-model="filters.keyword"
        class="keyword"
        clearable
        placeholder="搜索资源、买家、圈主、订单或售后ID"
        @keyup.enter="loadList"
      />
      <el-select v-model="filters.status" class="filter-item" placeholder="售后状态" clearable>
        <el-option label="处理中" value="open" />
        <el-option label="买家撤回" value="buyer_withdrew" />
        <el-option label="已退款" value="refunded" />
        <el-option label="已拒绝" value="rejected" />
        <el-option label="已关闭" value="closed" />
      </el-select>
      <el-select
        v-model="filters.refund_status"
        class="filter-item"
        placeholder="退款状态"
        clearable
      >
        <el-option label="未退款" value="none" />
        <el-option label="微信退款中" value="wechat_pending" />
        <el-option label="微信已退款" value="wechat_refunded" />
        <el-option label="退款失败" value="failed" />
      </el-select>
      <el-button type="primary" @click="loadList">查询</el-button>
      <el-button @click="resetSearch">重置</el-button>
    </div>

    <el-table v-loading="loading" :data="rows" border>
      <el-table-column label="售后单" min-width="260">
        <template #default="{ row }">
          <div class="cell-main">{{ row.resource_title || row.resource_card_id }}</div>
          <div class="cell-sub">{{ row.id }} / {{ row.order_id }}</div>
        </template>
      </el-table-column>
      <el-table-column label="买家/圈主" min-width="180">
        <template #default="{ row }">
          <div class="cell-main">{{ row.buyer?.nickname || row.buyer_user_id }}</div>
          <div class="cell-sub">{{ row.creator?.nickname || row.creator_user_id }}</div>
        </template>
      </el-table-column>
      <el-table-column label="原因" width="140">
        <template #default="{ row }">
          {{ labelOf(complaintTypeLabels, row.complaint_type) }}
        </template>
      </el-table-column>
      <el-table-column label="金额" width="110">
        <template #default="{ row }">
          {{ moneyText(row.refund_amount || row.order_amount) }}
        </template>
      </el-table-column>
      <el-table-column label="售后" width="110">
        <template #default="{ row }">
          <el-tag :type="metaOf(afterSaleStatusMap, row.status).type">
            {{ metaOf(afterSaleStatusMap, row.status).label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="退款" width="120">
        <template #default="{ row }">
          <el-tag :type="metaOf(refundStatusMap, row.refund_status).type">
            {{ metaOf(refundStatusMap, row.refund_status).label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="申请时间" width="170" />
      <el-table-column label="操作" fixed="right" width="170">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row)">查看</el-button>
          <el-button
            v-if="row.refund_status === 'wechat_pending'"
            link
            type="warning"
            @click="syncRefund(row)"
          >
            刷新
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
        @change="loadList"
      />
    </div>

    <el-drawer v-model="detailVisible" size="720px" title="售后退款详情">
      <div v-loading="detailLoading" v-if="current" class="detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="资源卡">
            {{ current.resource_title || "-" }}
            <span class="muted">{{ current.resource_card_id }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="圈子">{{ current.circle_name || current.circle_id }}</el-descriptions-item>
          <el-descriptions-item label="买家">
            {{ current.buyer?.nickname || "-" }}
            <span class="muted">{{ current.buyer_user_id }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="圈主">
            {{ current.creator?.nickname || "-" }}
            <span class="muted">{{ current.creator_user_id }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="金额">
            订单 {{ moneyText(current.order_amount) }} / 退款
            {{ moneyText(current.refund_amount || current.order_amount) }}
          </el-descriptions-item>
          <el-descriptions-item label="售后状态">
            <el-tag :type="metaOf(afterSaleStatusMap, current.status).type">
              {{ metaOf(afterSaleStatusMap, current.status).label }}
            </el-tag>
            <el-tag class="metric" :type="metaOf(refundStatusMap, current.refund_status).type">
              {{ metaOf(refundStatusMap, current.refund_status).label }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="申请说明">
            {{ labelOf(complaintTypeLabels, current.complaint_type) }} /
            {{ current.description || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="图片凭证">
            <el-image
              v-for="url in current.evidence_images"
              :key="url"
              class="evidence"
              :src="url"
              :preview-src-list="current.evidence_images"
              fit="cover"
            />
            <span v-if="!current.evidence_images.length">无</span>
          </el-descriptions-item>
          <el-descriptions-item label="微信退款">
            <div>商户退款单：{{ current.out_refund_no || "-" }}</div>
            <div>微信退款单：{{ current.wechat_refund_id || "-" }}</div>
            <div>微信状态：{{ current.wechat_refund_status || "-" }}</div>
            <div v-if="current.refund_error" class="danger-text">
              {{ current.refund_error }}
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="沟通记录">
            <el-timeline v-if="messages.length">
              <el-timeline-item
                v-for="message in messages"
                :key="message.id"
                :timestamp="message.created_at"
              >
                <div class="cell-main">
                  {{ message.sender_name || message.sender_role }}
                </div>
                <div class="cell-sub" v-if="message.message_type !== 'image'">
                  {{ message.content || "-" }}
                </div>
                <el-image
                  v-else
                  class="evidence"
                  :src="message.image_url"
                  :preview-src-list="[message.image_url]"
                  fit="cover"
                />
              </el-timeline-item>
            </el-timeline>
            <span v-else>-</span>
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="canHandle" class="action-box">
          <h3>售后操作</h3>
          <el-select v-model="actionForm.note" class="full" placeholder="选择审核原因">
            <el-option
              v-for="item in governanceReasonOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <div class="action-row">
            <el-button
              type="primary"
              :disabled="current.status !== 'open'"
              :loading="actionLoading"
              @click="refundCurrent"
            >
              通过并退款
            </el-button>
            <el-button
              type="danger"
              :disabled="current.status !== 'open'"
              :loading="actionLoading"
              @click="rejectCurrent"
            >
              拒绝售后
            </el-button>
            <el-button
              :disabled="current.refund_status !== 'wechat_pending'"
              :loading="actionLoading"
              @click="syncRefund()"
            >
              刷新退款
            </el-button>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped>
.after-sales-page {
  padding: 16px;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.keyword {
  width: 330px;
}

.filter-item {
  width: 140px;
}

.cell-main {
  font-weight: 700;
  color: #221a14;
}

.cell-sub,
.muted {
  margin-left: 4px;
  color: #8f8276;
  font-size: 12px;
}

.metric {
  margin: 0 4px 4px 0;
}

.danger-text {
  color: #c45656;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.evidence {
  width: 88px;
  height: 88px;
  margin-right: 8px;
  border-radius: 6px;
}

.action-box {
  display: grid;
  gap: 12px;
  margin-top: 18px;
  padding: 14px;
  background: #fffdf9;
  border: 1px solid #e6ddd2;
  border-radius: 8px;
}

.action-box h3 {
  margin: 0;
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.full {
  width: 100%;
}
</style>
