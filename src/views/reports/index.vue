<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { reportsApi, type ReportDetail, type ReportItem } from "@/api/admin";
import {
  reasonTypeLabels,
  reportStatusMap,
  targetActionLabels,
  targetTypeLabels
} from "@/utils/labels";
import { hasPerms } from "@/utils/auth";
import { readableRows } from "@/utils/readableDetail";

defineOptions({
  name: "Reports"
});

const loading = ref(false);
const detailLoading = ref(false);
const actionLoading = ref(false);
const rows = ref<ReportItem[]>([]);
const total = ref(0);
const detailVisible = ref(false);
const detail = ref<ReportDetail | null>(null);
const route = useRoute();
const filters = reactive({
  status: "pending",
  target_type: "",
  reason_type: "",
  keyword: "",
  page: 1,
  page_size: 20
});
const actionForm = reactive({
  action: "process",
  target_action: "none",
  note: ""
});
const canProcessReport = computed(() => hasPerms("report:process"));
const canManageUsers = computed(() => hasPerms("user:manage"));
const canManageCircles = computed(() => hasPerms("circle:manage"));
const canManageResourceCards = computed(() => hasPerms("resource_card:manage"));
const targetRows = computed(() => readableRows(detail.value?.report?.target));

const targetActions = computed(() => {
  const type = detail.value?.report?.target_type || "";
  const base = [{ label: targetActionLabels.none, value: "none" }];
  if (type === "message") {
    base.push({
      label: targetActionLabels.hide_message,
      value: "hide_message"
    });
    if (canManageUsers.value) {
      base.push({ label: targetActionLabels.ban_user, value: "ban_user" });
    }
  } else if (type === "circle") {
    if (canManageCircles.value) {
      base.push({
        label: targetActionLabels.hide_circle_from_square,
        value: "hide_circle_from_square"
      });
      base.push({
        label: targetActionLabels.dismiss_circle,
        value: "dismiss_circle"
      });
    }
    if (canManageUsers.value) {
      base.push({ label: targetActionLabels.ban_user, value: "ban_user" });
    }
  } else if (type === "room") {
    if (canManageCircles.value) {
      base.push({ label: targetActionLabels.close_room, value: "close_room" });
    }
  } else if (type === "user") {
    if (canManageUsers.value) {
      base.push({ label: targetActionLabels.ban_user, value: "ban_user" });
    }
  } else if (type === "resource_card") {
    if (canManageResourceCards.value) {
      base.push({
        label: targetActionLabels.unpublish_resource_card,
        value: "unpublish_resource_card"
      });
      base.push({
        label: targetActionLabels.disable_resource_card,
        value: "disable_resource_card"
      });
    }
    if (canManageUsers.value) {
      base.push({ label: targetActionLabels.ban_user, value: "ban_user" });
    }
  }
  return base;
});

watch(
  () => actionForm.action,
  action => {
    if (action === "reject") actionForm.target_action = "none";
  }
);

function labelOf(map: Record<string, string>, value: string) {
  return map[value] || value || "-";
}

function statusMeta(status: string) {
  return (
    reportStatusMap[status as keyof typeof reportStatusMap] || {
      label: status,
      type: "info"
    }
  );
}

async function loadList() {
  loading.value = true;
  try {
    const data = await reportsApi.list({ ...filters });
    rows.value = data.items;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

function resetSearch() {
  filters.status = "pending";
  filters.target_type = "";
  filters.reason_type = "";
  filters.keyword = "";
  filters.page = 1;
  loadList();
}

async function openDetail(row: ReportItem) {
  detailVisible.value = true;
  detailLoading.value = true;
  actionForm.action = row.status === "pending" ? "process" : "reject";
  actionForm.target_action = "none";
  actionForm.note = "";
  try {
    detail.value = await reportsApi.detail(row.id);
  } finally {
    detailLoading.value = false;
  }
}

async function submitAction() {
  const current = detail.value?.report;
  if (!current) return;
  await ElMessageBox.confirm("确认提交本次举报处理结果？", "处理确认", {
    type: "warning"
  });
  actionLoading.value = true;
  try {
    const result = await reportsApi.action(current.id, { ...actionForm });
    detail.value = await reportsApi.detail(result.report.id);
    ElMessage.success("处理完成");
    await loadList();
  } finally {
    actionLoading.value = false;
  }
}

onMounted(() => {
  const status = String(route.query.status || "");
  if (status) filters.status = status;
  loadList();
});
</script>

<template>
  <div class="reports-page">
    <div class="filter-bar">
      <el-select
        v-model="filters.status"
        class="filter-item"
        placeholder="状态"
        clearable
      >
        <el-option label="待处理" value="pending" />
        <el-option label="已处理" value="processed" />
        <el-option label="已驳回" value="rejected" />
      </el-select>
      <el-select
        v-model="filters.target_type"
        class="filter-item"
        placeholder="对象"
        clearable
      >
        <el-option
          v-for="(label, value) in targetTypeLabels"
          :key="value"
          :label="label"
          :value="value"
        />
      </el-select>
      <el-input
        v-model="filters.keyword"
        class="keyword"
        clearable
        placeholder="搜索说明、对象ID、举报人"
        @keyup.enter="loadList"
      />
      <el-button type="primary" @click="loadList">查询</el-button>
      <el-button @click="resetSearch">重置</el-button>
    </div>

    <el-table v-loading="loading" :data="rows" border>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusMeta(row.status).type">
            {{ statusMeta(row.status).label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="举报对象" min-width="180">
        <template #default="{ row }">
          <div class="cell-main">
            {{ labelOf(targetTypeLabels, row.target_type) }}
          </div>
          <div class="cell-sub">{{ row.target?.title || row.target_id }}</div>
        </template>
      </el-table-column>
      <el-table-column label="举报原因" width="150">
        <template #default="{ row }">
          {{ labelOf(reasonTypeLabels, row.reason_type) }}
        </template>
      </el-table-column>
      <el-table-column label="举报人" min-width="150">
        <template #default="{ row }">
          <div class="cell-main">{{ row.reporter?.nickname || "-" }}</div>
          <div class="cell-sub">
            {{ row.reporter?.dxq_id || row.reporter_id }}
          </div>
        </template>
      </el-table-column>
      <el-table-column
        prop="description"
        label="说明"
        min-width="260"
        show-overflow-tooltip
      />
      <el-table-column prop="created_at" label="提交时间" width="170" />
      <el-table-column label="操作" fixed="right" width="110">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row)"
            >查看</el-button
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

    <el-drawer v-model="detailVisible" size="640px" title="举报详情">
      <div v-if="detail?.report" v-loading="detailLoading" class="detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="状态">
            <el-tag :type="statusMeta(detail.report.status).type">
              {{ statusMeta(detail.report.status).label }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="举报对象">
            {{ labelOf(targetTypeLabels, detail.report.target_type) }}
          </el-descriptions-item>
          <el-descriptions-item label="对象摘要">
            <div v-if="targetRows.length" class="info-list">
              <div
                v-for="item in targetRows"
                :key="item.label"
                class="info-row"
              >
                <span>{{ item.label }}</span>
                <strong :class="{ long: item.long }">{{ item.value }}</strong>
              </div>
            </div>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="举报说明">
            {{ detail.report.description || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="图片凭证">
            <el-image
              v-for="url in detail.report.evidence_urls"
              :key="url"
              class="evidence"
              :src="url"
              :preview-src-list="detail.report.evidence_urls"
              fit="cover"
            />
            <span v-if="!detail.report.evidence_urls.length">无</span>
          </el-descriptions-item>
        </el-descriptions>

        <div
          v-if="detail.report.status === 'pending' && canProcessReport"
          class="action-box"
        >
          <h3>处理动作</h3>
          <el-radio-group v-model="actionForm.action">
            <el-radio-button label="process">处理通过</el-radio-button>
            <el-radio-button label="reject">驳回举报</el-radio-button>
          </el-radio-group>
          <el-select
            v-model="actionForm.target_action"
            class="action-select"
            :disabled="actionForm.action === 'reject'"
          >
            <el-option
              v-for="item in targetActions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <el-input
            v-model="actionForm.note"
            type="textarea"
            :rows="4"
            maxlength="1000"
            show-word-limit
            placeholder="处理说明，会写入举报记录并通知举报人"
          />
          <el-button
            class="submit-btn"
            type="primary"
            :loading="actionLoading"
            @click="submitAction"
          >
            提交处理
          </el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped>
.reports-page {
  padding: 16px;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.filter-item {
  width: 150px;
}

.keyword {
  width: 280px;
}

.cell-main {
  font-weight: 700;
  color: #221a14;
}

.cell-sub,
.muted {
  margin-left: 4px;
  font-size: 12px;
  color: #8f8276;
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
  padding: 14px;
  margin-top: 18px;
  background: #fffdf9;
  border: 1px solid #e6ddd2;
  border-radius: 8px;
}

.action-box h3 {
  margin: 0 0 12px;
}

.action-select {
  width: 100%;
  margin: 12px 0;
}

.submit-btn {
  width: 100%;
  margin-top: 12px;
}

.info-list {
  display: grid;
  gap: 8px;
}

.info-row {
  display: grid;
  grid-template-columns: 88px 1fr;
  gap: 10px;
  align-items: start;
}

.info-row span {
  color: #8f8276;
}

.info-row strong {
  font-weight: 500;
  color: #221a14;
  word-break: break-word;
}

.info-row .long {
  white-space: pre-wrap;
}
</style>
