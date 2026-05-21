<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  managedCirclesApi,
  type ManagedCircle
} from "@/api/admin";
import {
  auditStatusMap,
  circleStatusMap
} from "@/utils/labels";
import { hasPerms } from "@/utils/auth";

defineOptions({
  name: "ManagedCircles"
});

type TagType = "primary" | "success" | "warning" | "danger" | "info";

const loading = ref(false);
const detailLoading = ref(false);
const actionLoading = ref(false);
const rows = ref<ManagedCircle[]>([]);
const total = ref(0);
const detailVisible = ref(false);
const current = ref<ManagedCircle | null>(null);
const rooms = ref<Array<Record<string, any>>>([]);

const filters = reactive({
  keyword: "",
  status: "",
  audit_status: "",
  is_public_square: "",
  page: 1,
  page_size: 20
});

const actionForm = reactive({
  status: "active",
  audit_status: "pass",
  audit_reason: "",
  is_public_square: true
});

const canManage = computed(() => hasPerms("circle:manage"));

function metaOf<T extends Record<string, { label: string; type: string }>>(
  map: T,
  value: string
) {
  return (map[value as keyof T] || { label: value || "-", type: "info" }) as {
    label: string;
    type: TagType;
  };
}

async function loadList() {
  loading.value = true;
  try {
    const data = await managedCirclesApi.list({ ...filters });
    rows.value = data.items;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

function resetSearch() {
  filters.keyword = "";
  filters.status = "";
  filters.audit_status = "";
  filters.is_public_square = "";
  filters.page = 1;
  loadList();
}

async function openDetail(row: ManagedCircle) {
  detailVisible.value = true;
  detailLoading.value = true;
  try {
    const data = await managedCirclesApi.detail(row.id);
    current.value = data.circle;
    rooms.value = data.rooms;
    actionForm.status = data.circle.status;
    actionForm.audit_status = data.circle.audit_status || "pass";
    actionForm.audit_reason = data.circle.audit_reason || "";
    actionForm.is_public_square = data.circle.is_public_square;
  } finally {
    detailLoading.value = false;
  }
}

async function submitAction() {
  if (!current.value) return;
  await ElMessageBox.confirm("确认更新该圈子的治理状态？", "圈子处置确认", {
    type: "warning"
  });
  actionLoading.value = true;
  try {
    const next = await managedCirclesApi.update(current.value.id, {
      status: actionForm.status,
      audit_status: actionForm.audit_status,
      audit_reason: actionForm.audit_reason,
      is_public_square: actionForm.is_public_square
    });
    current.value = next;
    ElMessage.success("圈子状态已更新");
    await loadList();
  } finally {
    actionLoading.value = false;
  }
}

async function toggleSquare(row: ManagedCircle) {
  await ElMessageBox.confirm(
    `确认${row.is_public_square ? "移出" : "恢复"}广场展示：${row.name}？`,
    "广场展示确认",
    { type: "warning" }
  );
  await managedCirclesApi.update(row.id, {
    is_public_square: !row.is_public_square,
    audit_status: row.audit_status || "pass",
    audit_reason: row.is_public_square ? "后台管理员移出广场" : "后台管理员恢复广场"
  });
  ElMessage.success("广场展示状态已更新");
  await loadList();
}

onMounted(loadList);
</script>

<template>
  <div class="circles-page">
    <div class="filter-bar">
      <el-input
        v-model="filters.keyword"
        class="keyword"
        clearable
        placeholder="搜索圈子名、圈号、圈主或ID"
        @keyup.enter="loadList"
      />
      <el-select v-model="filters.status" class="filter-item" placeholder="状态" clearable>
        <el-option label="正常" value="active" />
        <el-option label="已解散" value="dismissed" />
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
      <el-select
        v-model="filters.is_public_square"
        class="filter-item"
        placeholder="广场"
        clearable
      >
        <el-option label="展示" value="1" />
        <el-option label="隐藏" value="0" />
      </el-select>
      <el-button type="primary" @click="loadList">查询</el-button>
      <el-button @click="resetSearch">重置</el-button>
    </div>

    <el-table v-loading="loading" :data="rows" border>
      <el-table-column label="圈子" min-width="230">
        <template #default="{ row }">
          <div class="cell-main">{{ row.name }}</div>
          <div class="cell-sub">{{ row.circle_code || row.id }}</div>
        </template>
      </el-table-column>
      <el-table-column label="圈主" min-width="160">
        <template #default="{ row }">
          <div class="cell-main">{{ row.owner_nickname || "-" }}</div>
          <div class="cell-sub">{{ row.owner_dxq_id || row.owner_user_id }}</div>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="metaOf(circleStatusMap, row.status).type">
            {{ metaOf(circleStatusMap, row.status).label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="审核" width="110">
        <template #default="{ row }">
          <el-tag :type="metaOf(auditStatusMap, row.audit_status).type">
            {{ metaOf(auditStatusMap, row.audit_status).label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="广场" width="90">
        <template #default="{ row }">
          <el-tag :type="row.is_public_square ? 'success' : 'info'">
            {{ row.is_public_square ? "展示" : "隐藏" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="数据" min-width="230">
        <template #default="{ row }">
          <el-tag class="metric" type="info">成员 {{ row.member_count }}</el-tag>
          <el-tag class="metric" type="info">房间 {{ row.room_count }}</el-tag>
          <el-tag class="metric" type="info">资源 {{ row.resource_count }}</el-tag>
          <el-tag class="metric" type="warning">举报 {{ row.report_count }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="updated_at" label="更新时间" width="170" />
      <el-table-column label="操作" fixed="right" width="170">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row)">查看</el-button>
          <el-button
            v-if="canManage"
            link
            :type="row.is_public_square ? 'warning' : 'success'"
            @click="toggleSquare(row)"
          >
            {{ row.is_public_square ? "移出广场" : "恢复广场" }}
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

    <el-drawer v-model="detailVisible" size="680px" title="圈子详情">
      <div v-loading="detailLoading" v-if="current" class="detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="圈子">{{ current.name }}</el-descriptions-item>
          <el-descriptions-item label="简介">
            {{ current.description || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="圈主">
            {{ current.owner_nickname || "-" }}
            <span class="muted">{{ current.owner_dxq_id || current.owner_user_id }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="metaOf(circleStatusMap, current.status).type">
              {{ metaOf(circleStatusMap, current.status).label }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="审核">
            <el-tag :type="metaOf(auditStatusMap, current.audit_status).type">
              {{ metaOf(auditStatusMap, current.audit_status).label }}
            </el-tag>
            <span class="muted">{{ current.audit_reason }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="房间">
            <el-tag v-for="room in rooms" :key="room.id" class="metric" type="info">
              {{ room.name }} / {{ room.type }} / {{ room.status }}
            </el-tag>
            <span v-if="!rooms.length">-</span>
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="canManage" class="action-box">
          <h3>治理操作</h3>
          <el-radio-group v-model="actionForm.status">
            <el-radio-button label="active">正常</el-radio-button>
            <el-radio-button label="dismissed">解散</el-radio-button>
          </el-radio-group>
          <el-switch
            v-model="actionForm.is_public_square"
            active-text="广场展示"
            inactive-text="广场隐藏"
          />
          <el-select v-model="actionForm.audit_status" class="full">
            <el-option label="待审核" value="pending" />
            <el-option label="通过" value="pass" />
            <el-option label="拒绝" value="reject" />
            <el-option label="人工复核" value="manual_review" />
          </el-select>
          <el-input
            v-model="actionForm.audit_reason"
            type="textarea"
            :rows="4"
            maxlength="500"
            show-word-limit
            placeholder="填写处置原因，便于审计追溯"
          />
          <el-button
            class="submit-btn"
            type="primary"
            :loading="actionLoading"
            @click="submitAction"
          >
            保存处置
          </el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped>
.circles-page {
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
  width: 130px;
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

.full,
.submit-btn {
  width: 100%;
}
</style>
