<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  manualReviewsApi,
  type ManualReviewItem
} from "@/api/admin";
import {
  auditStatusMap,
  governanceReasonOptions,
  manualReviewTargetLabels
} from "@/utils/labels";
import { hasPerms } from "@/utils/auth";

defineOptions({
  name: "ManualReviews"
});

type TagType = "primary" | "success" | "warning" | "danger" | "info";

const loading = ref(false);
const detailLoading = ref(false);
const actionLoading = ref(false);
const rows = ref<ManualReviewItem[]>([]);
const total = ref(0);
const detailVisible = ref(false);
const current = ref<ManualReviewItem | null>(null);
const logs = ref<Array<Record<string, any>>>([]);

const filters = reactive({
  keyword: "",
  target_type: "",
  audit_status: "manual_review",
  page: 1,
  page_size: 20
});

const actionForm = reactive({
  audit_status: "pass",
  audit_reason: "人工复核通过",
  target_status: ""
});

const canReview = computed(
  () =>
    hasPerms("user:manage") ||
    hasPerms("circle:manage") ||
    hasPerms("resource_card:manage")
);

const targetStatusOptions = computed(() => {
  const type = current.value?.target_type;
  if (type === "user") {
    return [
      { label: "不改变用户状态", value: "" },
      { label: "正常", value: "active" },
      { label: "封禁", value: "banned" }
    ];
  }
  if (type === "circle") {
    return [
      { label: "不改变圈子状态", value: "" },
      { label: "正常", value: "active" },
      { label: "解散", value: "dismissed" }
    ];
  }
  if (type === "resource_card") {
    return [
      { label: "不改变资源卡状态", value: "" },
      { label: "发布", value: "published" },
      { label: "下架", value: "offline" },
      { label: "禁用", value: "disabled" }
    ];
  }
  return [{ label: "不改变业务状态", value: "" }];
});

function metaOf<T extends Record<string, { label: string; type: string }>>(
  map: T,
  value: string
) {
  return (map[value as keyof T] || { label: value || "-", type: "info" }) as {
    label: string;
    type: TagType;
  };
}

function targetLabel(value: string) {
  return manualReviewTargetLabels[value] || value || "-";
}

function resetActionForm(item?: ManualReviewItem) {
  actionForm.audit_status = "pass";
  actionForm.audit_reason =
    item?.audit_status === "reject" ? "人工复核拒绝" : "人工复核通过";
  actionForm.target_status = "";
}

async function loadList() {
  loading.value = true;
  try {
    const data = await manualReviewsApi.list({ ...filters });
    rows.value = data.items;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

function resetSearch() {
  filters.keyword = "";
  filters.target_type = "";
  filters.audit_status = "manual_review";
  filters.page = 1;
  loadList();
}

async function openDetail(row: ManualReviewItem) {
  detailVisible.value = true;
  detailLoading.value = true;
  resetActionForm(row);
  try {
    const data = await manualReviewsApi.detail(row.id);
    current.value = data.item;
    logs.value = data.logs || [];
    resetActionForm(data.item);
  } finally {
    detailLoading.value = false;
  }
}

async function submitAction() {
  if (!current.value) return;
  if (!actionForm.audit_reason) {
    ElMessage.warning("请选择复核原因");
    return;
  }
  await ElMessageBox.confirm("确认提交本次人工复核结果？", "复核确认", {
    type: "warning"
  });
  actionLoading.value = true;
  try {
    const result = await manualReviewsApi.action(current.value.id, {
      audit_status: actionForm.audit_status,
      audit_reason: actionForm.audit_reason,
      target_status: actionForm.target_status || undefined
    });
    current.value = result.item;
    ElMessage.success("复核结果已提交");
    await loadList();
  } finally {
    actionLoading.value = false;
  }
}

onMounted(loadList);
</script>

<template>
  <div class="manual-reviews-page">
    <div class="filter-bar">
      <el-input
        v-model="filters.keyword"
        class="keyword"
        clearable
        placeholder="搜索标题、说明、提交人或ID"
        @keyup.enter="loadList"
      />
      <el-select
        v-model="filters.target_type"
        class="filter-item"
        placeholder="对象"
        clearable
      >
        <el-option label="用户" value="user" />
        <el-option label="圈子" value="circle" />
        <el-option label="资源卡" value="resource_card" />
      </el-select>
      <el-select
        v-model="filters.audit_status"
        class="filter-item"
        placeholder="审核"
        clearable
      >
        <el-option label="待审核" value="pending" />
        <el-option label="通过" value="pass" />
        <el-option label="拒绝" value="reject" />
        <el-option label="人工复核" value="manual_review" />
      </el-select>
      <el-button type="primary" @click="loadList">查询</el-button>
      <el-button @click="resetSearch">重置</el-button>
    </div>

    <el-table v-loading="loading" :data="rows" border>
      <el-table-column label="复核对象" min-width="260">
        <template #default="{ row }">
          <div class="cell-main">{{ row.title || row.target_id }}</div>
          <div class="cell-sub">
            {{ targetLabel(row.target_type) }} / {{ row.target_id }}
          </div>
        </template>
      </el-table-column>
      <el-table-column label="归属" min-width="160">
        <template #default="{ row }">
          <div class="cell-main">{{ row.owner_name || "-" }}</div>
          <div class="cell-sub">{{ row.owner_id || "-" }}</div>
        </template>
      </el-table-column>
      <el-table-column label="审核" width="110">
        <template #default="{ row }">
          <el-tag :type="metaOf(auditStatusMap, row.audit_status).type">
            {{ metaOf(auditStatusMap, row.audit_status).label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="source" label="来源" width="130" show-overflow-tooltip />
      <el-table-column prop="summary" label="摘要" min-width="260" show-overflow-tooltip />
      <el-table-column label="举报" width="90">
        <template #default="{ row }">
          <el-tag :type="row.report_count > 0 ? 'warning' : 'info'">
            {{ row.report_count || 0 }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="updated_at" label="更新时间" width="170" />
      <el-table-column label="操作" fixed="right" width="110">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row)">查看</el-button>
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

    <el-drawer v-model="detailVisible" size="680px" title="人工复核详情">
      <div v-loading="detailLoading" v-if="current" class="detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="对象">
            {{ targetLabel(current.target_type) }}
            <span class="muted">{{ current.target_id }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="标题">{{ current.title || "-" }}</el-descriptions-item>
          <el-descriptions-item label="摘要">{{ current.summary || "-" }}</el-descriptions-item>
          <el-descriptions-item label="当前审核">
            <el-tag :type="metaOf(auditStatusMap, current.audit_status).type">
              {{ metaOf(auditStatusMap, current.audit_status).label }}
            </el-tag>
            <span class="muted">{{ current.audit_reason || "-" }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="原始快照">
            <pre>{{ JSON.stringify(current.raw || {}, null, 2) }}</pre>
          </el-descriptions-item>
          <el-descriptions-item label="操作记录">
            <el-timeline v-if="logs.length">
              <el-timeline-item
                v-for="log in logs"
                :key="log.id || log.created_at"
                :timestamp="log.created_at"
              >
                <div class="cell-main">{{ log.summary || log.action || "-" }}</div>
                <div class="cell-sub">{{ log.admin_username || log.operator || "-" }}</div>
              </el-timeline-item>
            </el-timeline>
            <span v-else>-</span>
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="canReview" class="action-box">
          <h3>复核操作</h3>
          <el-radio-group v-model="actionForm.audit_status">
            <el-radio-button label="pass">通过</el-radio-button>
            <el-radio-button label="reject">拒绝</el-radio-button>
            <el-radio-button label="manual_review">继续复核</el-radio-button>
          </el-radio-group>
          <el-select v-model="actionForm.target_status" class="full">
            <el-option
              v-for="item in targetStatusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <el-select
            v-model="actionForm.audit_reason"
            class="full"
            placeholder="选择复核原因"
          >
            <el-option
              v-for="item in governanceReasonOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <el-button
            class="submit-btn"
            type="primary"
            :loading="actionLoading"
            @click="submitAction"
          >
            提交复核
          </el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped>
.manual-reviews-page {
  padding: 16px;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.keyword {
  width: 300px;
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

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.detail pre {
  max-height: 240px;
  padding: 10px;
  overflow: auto;
  background: #f7f2ea;
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

.full,
.submit-btn {
  width: 100%;
}
</style>
