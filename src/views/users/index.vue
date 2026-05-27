<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  managedUsersApi,
  type ManagedUser
} from "@/api/admin";
import {
  auditStatusMap,
  governanceReasonOptions,
  userStatusMap
} from "@/utils/labels";
import { hasPerms } from "@/utils/auth";

defineOptions({
  name: "ManagedUsers"
});

type TagType = "primary" | "success" | "warning" | "danger" | "info";

const loading = ref(false);
const detailLoading = ref(false);
const actionLoading = ref(false);
const rows = ref<ManagedUser[]>([]);
const total = ref(0);
const detailVisible = ref(false);
const current = ref<ManagedUser | null>(null);
const userCircles = ref<Array<Record<string, any>>>([]);

const filters = reactive({
  keyword: "",
  status: "",
  audit_status: "",
  page: 1,
  page_size: 20
});

const actionForm = reactive({
  status: "active",
  audit_status: "pass",
  audit_reason: "人工复核通过"
});

const canManage = computed(() => hasPerms("user:manage"));

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
    const data = await managedUsersApi.list({ ...filters });
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
  filters.page = 1;
  loadList();
}

async function openDetail(row: ManagedUser) {
  detailVisible.value = true;
  detailLoading.value = true;
  try {
    const data = await managedUsersApi.detail(row.id);
    current.value = data.user;
    userCircles.value = data.circles;
    actionForm.status = data.user.status;
    actionForm.audit_status = data.user.audit_status || "pass";
    actionForm.audit_reason = data.user.audit_reason || "人工复核通过";
  } finally {
    detailLoading.value = false;
  }
}

async function submitAction() {
  if (!current.value) return;
  if (!actionForm.audit_reason) {
    ElMessage.warning("请选择处置原因");
    return;
  }
  await ElMessageBox.confirm("确认更新该用户的平台治理状态？", "用户处置确认", {
    type: "warning"
  });
  actionLoading.value = true;
  try {
    const next = await managedUsersApi.update(current.value.id, {
      status: actionForm.status,
      audit_status: actionForm.audit_status,
      audit_reason: actionForm.audit_reason
    });
    current.value = next;
    ElMessage.success("用户状态已更新");
    await loadList();
  } finally {
    actionLoading.value = false;
  }
}

async function toggleBan(row: ManagedUser) {
  const nextStatus = row.status === "active" ? "banned" : "active";
  await ElMessageBox.confirm(
    `确认${nextStatus === "banned" ? "封禁" : "解封"} ${row.nickname || row.dxq_id}？`,
    "用户状态确认",
    { type: "warning" }
  );
  await managedUsersApi.update(row.id, {
    status: nextStatus,
    audit_status: row.audit_status || "pass",
    audit_reason:
      nextStatus === "banned" ? "后台管理员手动封禁" : "后台管理员手动解封"
  });
  ElMessage.success("用户状态已更新");
  await loadList();
}

onMounted(loadList);
</script>

<template>
  <div class="users-page">
    <div class="filter-bar">
      <el-input
        v-model="filters.keyword"
        class="keyword"
        clearable
        placeholder="搜索昵称、抖小圈号、手机号或ID"
        @keyup.enter="loadList"
      />
      <el-select v-model="filters.status" class="filter-item" placeholder="状态" clearable>
        <el-option label="正常" value="active" />
        <el-option label="已封禁" value="banned" />
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
      <el-table-column label="用户" min-width="200">
        <template #default="{ row }">
          <div class="user-cell">
            <el-avatar :size="34" :src="row.avatar">{{ row.nickname?.slice(0, 1) }}</el-avatar>
            <div>
              <div class="cell-main">{{ row.nickname || "-" }}</div>
              <div class="cell-sub">{{ row.dxq_id || row.id }}</div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="metaOf(userStatusMap, row.status).type">
            {{ metaOf(userStatusMap, row.status).label }}
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
      <el-table-column label="数据" min-width="220">
        <template #default="{ row }">
          <el-tag class="metric" type="info">圈子 {{ row.circle_count }}</el-tag>
          <el-tag class="metric" type="info">创建 {{ row.owned_circle_count }}</el-tag>
          <el-tag class="metric" type="info">资源 {{ row.resource_card_count }}</el-tag>
          <el-tag class="metric" type="warning">举报 {{ row.report_count }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="注册时间" width="170" />
      <el-table-column label="操作" fixed="right" width="170">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row)">查看</el-button>
          <el-button
            v-if="canManage"
            link
            :type="row.status === 'active' ? 'danger' : 'success'"
            @click="toggleBan(row)"
          >
            {{ row.status === "active" ? "封禁" : "解封" }}
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

    <el-drawer v-model="detailVisible" size="620px" title="用户详情">
      <div v-loading="detailLoading" v-if="current" class="detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="昵称">
            {{ current.nickname || "-" }}
            <span class="muted">{{ current.dxq_id }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="简介">{{ current.intro || "-" }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="metaOf(userStatusMap, current.status).type">
              {{ metaOf(userStatusMap, current.status).label }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="审核">
            <el-tag :type="metaOf(auditStatusMap, current.audit_status).type">
              {{ metaOf(auditStatusMap, current.audit_status).label }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="审核说明">
            {{ current.audit_reason || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="加入圈子">
            <el-tag v-for="item in userCircles" :key="item.id" class="metric" type="info">
              {{ item.name }} / {{ item.role }}
            </el-tag>
            <span v-if="!userCircles.length">-</span>
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="canManage" class="action-box">
          <h3>治理操作</h3>
          <el-radio-group v-model="actionForm.status">
            <el-radio-button label="active">正常</el-radio-button>
            <el-radio-button label="banned">封禁</el-radio-button>
          </el-radio-group>
          <el-select v-model="actionForm.audit_status" class="full">
            <el-option label="待审核" value="pending" />
            <el-option label="通过" value="pass" />
            <el-option label="拒绝" value="reject" />
            <el-option label="人工复核" value="manual_review" />
          </el-select>
          <el-select
            v-model="actionForm.audit_reason"
            class="full"
            placeholder="选择处置原因"
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
            保存处置
          </el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped>
.users-page {
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

.user-cell {
  display: flex;
  gap: 10px;
  align-items: center;
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
