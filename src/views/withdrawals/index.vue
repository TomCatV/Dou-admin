<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  type CreatorWithdrawal,
  withdrawalsApi
} from "@/api/admin";
import {
  governanceReasonOptions,
  withdrawalStatusMap
} from "@/utils/labels";
import { hasPerms } from "@/utils/auth";

defineOptions({
  name: "Withdrawals"
});

type TagType = "primary" | "success" | "warning" | "danger" | "info";

const loading = ref(false);
const detailLoading = ref(false);
const actionLoading = ref(false);
const rows = ref<CreatorWithdrawal[]>([]);
const total = ref(0);
const detailVisible = ref(false);
const current = ref<CreatorWithdrawal | null>(null);

const filters = reactive({
  keyword: "",
  status: "requested",
  page: 1,
  page_size: 20
});

const actionForm = reactive({
  note: "提现审核通过"
});

const canHandle = computed(() => hasPerms("withdrawal:manage"));

function metaOf<T extends Record<string, { label: string; type: string }>>(
  map: T,
  value: string
) {
  return (map[value as keyof T] || { label: value || "-", type: "info" }) as {
    label: string;
    type: TagType;
  };
}

function moneyText(value: number) {
  return `￥${((Number(value) || 0) / 100).toFixed(2)}`;
}

async function loadList() {
  loading.value = true;
  try {
    const data = await withdrawalsApi.list({ ...filters });
    rows.value = data.items;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

function resetSearch() {
  filters.keyword = "";
  filters.status = "requested";
  filters.page = 1;
  loadList();
}

async function openDetail(row: CreatorWithdrawal) {
  detailVisible.value = true;
  detailLoading.value = true;
  actionForm.note = row.status === "requested" ? "提现审核通过" : actionForm.note;
  try {
    const data = await withdrawalsApi.detail(row.id);
    current.value = data.withdrawal;
  } finally {
    detailLoading.value = false;
  }
}

async function approveCurrent() {
  if (!current.value) return;
  if (!actionForm.note) {
    ElMessage.warning("请选择审核原因");
    return;
  }
  await ElMessageBox.confirm("确认通过该提现并提交微信转账？", "提现审核确认", {
    type: "warning"
  });
  actionLoading.value = true;
  try {
    const data = await withdrawalsApi.approve(current.value.id, {
      note: actionForm.note
    });
    current.value = data.withdrawal;
    ElMessage.success("提现已审核通过");
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
  await ElMessageBox.confirm("确认拒绝该提现申请并释放余额？", "提现拒绝确认", {
    type: "warning"
  });
  actionLoading.value = true;
  try {
    const data = await withdrawalsApi.reject(current.value.id, {
      note: actionForm.note
    });
    current.value = data.withdrawal;
    ElMessage.success("提现已拒绝");
    await loadList();
  } finally {
    actionLoading.value = false;
  }
}

async function syncWithdrawal(row?: CreatorWithdrawal) {
  const item = row || current.value;
  if (!item) return;
  actionLoading.value = true;
  try {
    const data = await withdrawalsApi.sync(item.id);
    if (current.value?.id === item.id) current.value = data.withdrawal;
    ElMessage.success("提现状态已同步");
    await loadList();
  } finally {
    actionLoading.value = false;
  }
}

async function cancelCurrent() {
  if (!current.value) return;
  if (!actionForm.note) {
    ElMessage.warning("请选择撤销原因");
    return;
  }
  await ElMessageBox.confirm("确认撤销该提现并按状态释放余额？", "撤销确认", {
    type: "warning"
  });
  actionLoading.value = true;
  try {
    const data = await withdrawalsApi.cancel(current.value.id, {
      note: actionForm.note
    });
    current.value = data.withdrawal;
    ElMessage.success("提现撤销已提交");
    await loadList();
  } finally {
    actionLoading.value = false;
  }
}

onMounted(loadList);
</script>

<template>
  <div class="withdrawals-page">
    <div class="filter-bar">
      <el-input
        v-model="filters.keyword"
        class="keyword"
        clearable
        placeholder="搜索提现单、商户单、用户昵称或抖小圈号"
        @keyup.enter="loadList"
      />
      <el-select v-model="filters.status" class="filter-item" placeholder="状态" clearable>
        <el-option label="待审核" value="requested" />
        <el-option label="已审核" value="approved" />
        <el-option label="待用户确认" value="wait_user_confirm" />
        <el-option label="撤销中" value="canceling" />
        <el-option label="已到账" value="success" />
        <el-option label="转账失败" value="failed" />
        <el-option label="已撤销" value="cancelled" />
        <el-option label="已拒绝" value="rejected" />
      </el-select>
      <el-button type="primary" @click="loadList">查询</el-button>
      <el-button @click="resetSearch">重置</el-button>
    </div>

    <el-table v-loading="loading" :data="rows" border>
      <el-table-column label="提现单" min-width="240">
        <template #default="{ row }">
          <div class="cell-main">{{ row.id }}</div>
          <div class="cell-sub">{{ row.out_bill_no || "-" }}</div>
        </template>
      </el-table-column>
      <el-table-column label="圈主" min-width="170">
        <template #default="{ row }">
          <div class="cell-main">{{ row.user_nickname || row.user_id }}</div>
          <div class="cell-sub">{{ row.user_dxq_id || row.circle_name || "-" }}</div>
        </template>
      </el-table-column>
      <el-table-column label="金额" width="120">
        <template #default="{ row }">{{ moneyText(row.amount) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="metaOf(withdrawalStatusMap, row.status).type">
            {{ metaOf(withdrawalStatusMap, row.status).label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
      <el-table-column prop="requested_at" label="申请时间" width="170" />
      <el-table-column label="操作" fixed="right" width="170">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row)">查看</el-button>
          <el-button
            v-if="['approved', 'wait_user_confirm', 'canceling'].includes(row.status)"
            link
            type="warning"
            @click="syncWithdrawal(row)"
          >
            同步
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

    <el-drawer v-model="detailVisible" size="680px" title="提现审核详情">
      <div v-loading="detailLoading" v-if="current" class="detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="提现单">{{ current.id }}</el-descriptions-item>
          <el-descriptions-item label="圈主">
            {{ current.user_nickname || current.user_id }}
            <span class="muted">{{ current.user_dxq_id || current.user_id }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="圈子">{{ current.circle_name || current.circle_id || "-" }}</el-descriptions-item>
          <el-descriptions-item label="金额">{{ moneyText(current.amount) }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="metaOf(withdrawalStatusMap, current.status).type">
              {{ metaOf(withdrawalStatusMap, current.status).label }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="商户单号">{{ current.out_bill_no || "-" }}</el-descriptions-item>
          <el-descriptions-item label="微信单号">{{ current.transfer_bill_no || "-" }}</el-descriptions-item>
          <el-descriptions-item label="失败/提示">
            <span :class="{ 'danger-text': current.failure_reason }">
              {{ current.failure_reason || "-" }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="时间">
            <div>申请：{{ current.requested_at || "-" }}</div>
            <div>审核：{{ current.approved_at || "-" }}</div>
            <div>提交：{{ current.submitted_at || "-" }}</div>
            <div>完成：{{ current.completed_at || "-" }}</div>
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="canHandle" class="action-box">
          <h3>提现操作</h3>
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
              :disabled="current.status !== 'requested'"
              :loading="actionLoading"
              @click="approveCurrent"
            >
              通过并转账
            </el-button>
            <el-button
              type="danger"
              :disabled="!['requested', 'approved'].includes(current.status)"
              :loading="actionLoading"
              @click="rejectCurrent"
            >
              拒绝提现
            </el-button>
            <el-button
              :disabled="!['approved', 'wait_user_confirm', 'canceling'].includes(current.status)"
              :loading="actionLoading"
              @click="syncWithdrawal()"
            >
              同步状态
            </el-button>
            <el-button
              type="warning"
              :disabled="!['approved', 'wait_user_confirm'].includes(current.status)"
              :loading="actionLoading"
              @click="cancelCurrent"
            >
              撤销提现
            </el-button>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped>
.withdrawals-page {
  padding: 16px;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.keyword {
  width: 340px;
}

.filter-item {
  width: 150px;
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

.danger-text {
  color: #c45656;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
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
