<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  adminAccountGroupsApi,
  type AdminAccountGroup,
  type AdminAccountGroupMember
} from "@/api/admin";

defineOptions({
  name: "AccountGroups"
});

const loading = ref(false);
const submitting = ref(false);
const detailLoading = ref(false);
const memberLoading = ref(false);
const rows = ref<AdminAccountGroup[]>([]);
const total = ref(0);
const dialogVisible = ref(false);
const detailVisible = ref(false);
const isEdit = ref(false);
const current = ref<AdminAccountGroup | null>(null);
const members = ref<AdminAccountGroupMember[]>([]);
const memberOptions = ref<AdminAccountGroupMember[]>([]);
const selectedMemberIds = ref<string[]>([]);
const formRef = ref<FormInstance>();

const filters = reactive({
  keyword: "",
  status: "",
  page: 1,
  page_size: 20
});

const form = reactive({
  id: "",
  name: "",
  description: "",
  status: "active",
  can_view_main_room_messages: false
});

const rules: FormRules = {
  name: [{ required: true, message: "请输入分组名称", trigger: "blur" }],
  status: [{ required: true, message: "请选择分组状态", trigger: "change" }]
};

const memberIdSet = computed(() => new Set(members.value.map(item => item.admin_user_id)));

function resetForm() {
  Object.assign(form, {
    id: "",
    name: "",
    description: "",
    status: "active",
    can_view_main_room_messages: false
  });
}

async function loadList() {
  loading.value = true;
  try {
    const data = await adminAccountGroupsApi.list({ ...filters });
    rows.value = data.items;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

function resetSearch() {
  filters.keyword = "";
  filters.status = "";
  filters.page = 1;
  loadList();
}

function openCreate() {
  isEdit.value = false;
  resetForm();
  dialogVisible.value = true;
}

function openEdit(row: AdminAccountGroup) {
  isEdit.value = true;
  Object.assign(form, row);
  dialogVisible.value = true;
}

async function submit() {
  await formRef.value?.validate();
  submitting.value = true;
  try {
    const payload = {
      name: form.name,
      description: form.description,
      status: form.status,
      can_view_main_room_messages: form.can_view_main_room_messages
    };
    if (isEdit.value) {
      await adminAccountGroupsApi.update(form.id, payload);
      ElMessage.success("分组已更新");
    } else {
      await adminAccountGroupsApi.create(payload);
      ElMessage.success("分组已创建");
    }
    dialogVisible.value = false;
    await loadList();
  } finally {
    submitting.value = false;
  }
}

async function openDetail(row: AdminAccountGroup) {
  detailVisible.value = true;
  detailLoading.value = true;
  selectedMemberIds.value = [];
  try {
    const data = await adminAccountGroupsApi.detail(row.id);
    current.value = data.group;
    members.value = data.members;
  } finally {
    detailLoading.value = false;
  }
}

async function remoteMemberSearch(keyword: string) {
  memberLoading.value = true;
  try {
    const data = await adminAccountGroupsApi.adminUsers({
      keyword,
      page_size: 30
    });
    memberOptions.value = data.items.filter(item => !memberIdSet.value.has(item.admin_user_id || item.id));
  } finally {
    memberLoading.value = false;
  }
}

async function addMembers() {
  if (!current.value || !selectedMemberIds.value.length) return;
  await adminAccountGroupsApi.addMembers(current.value.id, {
    admin_user_ids: selectedMemberIds.value
  });
  ElMessage.success("成员已加入分组");
  await openDetail(current.value);
}

async function removeMember(row: AdminAccountGroupMember) {
  if (!current.value) return;
  await ElMessageBox.confirm(`确认将 ${row.display_name || row.username} 移出分组？`, "移除成员", {
    type: "warning"
  });
  await adminAccountGroupsApi.removeMember(current.value.id, row.admin_user_id);
  ElMessage.success("成员已移除");
  await openDetail(current.value);
}

async function toggleGrant(row: AdminAccountGroup) {
  await adminAccountGroupsApi.update(row.id, {
    ...row,
    can_view_main_room_messages: !row.can_view_main_room_messages
  });
  ElMessage.success("授权状态已更新");
  await loadList();
}

async function removeGroup(row: AdminAccountGroup) {
  await ElMessageBox.confirm(`确认删除账号分组「${row.name}」？`, "删除分组", {
    type: "warning"
  });
  await adminAccountGroupsApi.remove(row.id);
  ElMessage.success("分组已删除");
  await loadList();
}

onMounted(loadList);
</script>

<template>
  <div class="account-groups-page">
    <div class="filter-bar">
      <el-input
        v-model="filters.keyword"
        class="keyword"
        clearable
        placeholder="搜索分组名称或说明"
        @keyup.enter="loadList"
      />
      <el-select v-model="filters.status" class="filter-item" placeholder="状态" clearable>
        <el-option label="启用" value="active" />
        <el-option label="停用" value="disabled" />
      </el-select>
      <el-button type="primary" @click="loadList">查询</el-button>
      <el-button @click="resetSearch">重置</el-button>
      <el-button type="success" @click="openCreate">新建分组</el-button>
    </div>

    <el-table v-loading="loading" :data="rows" border>
      <el-table-column label="分组" min-width="220">
        <template #default="{ row }">
          <div class="cell-main">{{ row.name }}</div>
          <div class="cell-sub">{{ row.description || "-" }}</div>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="110">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'info'">
            {{ row.status === "active" ? "启用" : "停用" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="主房间聊天" min-width="180">
        <template #default="{ row }">
          <el-switch
            :model-value="row.can_view_main_room_messages"
            active-text="已授权"
            inactive-text="未授权"
            @change="toggleGrant(row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="成员" width="100">
        <template #default="{ row }">
          <el-tag type="info">{{ row.member_count }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="updated_at" label="更新时间" width="170" />
      <el-table-column label="操作" fixed="right" width="230">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row)">成员</el-button>
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="removeGroup(row)">删除</el-button>
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑账号分组' : '新建账号分组'" width="560px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="分组名称" prop="name">
          <el-input v-model="form.name" maxlength="80" show-word-limit />
        </el-form-item>
        <el-form-item label="分组说明">
          <el-input
            v-model="form.description"
            type="textarea"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio-button label="active">启用</el-radio-button>
            <el-radio-button label="disabled">停用</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="聊天记录授权">
          <el-switch
            v-model="form.can_view_main_room_messages"
            active-text="允许组内圈主查看主房间聊天记录"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">
          保存
        </el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="detailVisible" size="720px" title="分组成员">
      <div v-loading="detailLoading" v-if="current" class="detail">
        <div class="detail-head">
          <div>
            <div class="cell-main">{{ current.name }}</div>
            <div class="cell-sub">
              {{ current.can_view_main_room_messages ? "已授权查看主房间聊天记录" : "未授权查看主房间聊天记录" }}
            </div>
          </div>
          <el-tag :type="current.status === 'active' ? 'success' : 'info'">
            {{ current.status === "active" ? "启用" : "停用" }}
          </el-tag>
        </div>

        <div class="member-picker">
          <el-select
            v-model="selectedMemberIds"
            class="member-select"
            multiple
            filterable
            remote
            reserve-keyword
            :remote-method="remoteMemberSearch"
            :loading="memberLoading"
            placeholder="搜索圈主后台账号、圈子或绑定用户"
          >
            <el-option
              v-for="item in memberOptions"
              :key="item.admin_user_id || item.id"
              :label="`${item.display_name || item.username} / ${item.scope_circle_name || item.scope_circle_id}`"
              :value="item.admin_user_id || item.id"
            />
          </el-select>
          <el-button type="primary" :disabled="!selectedMemberIds.length" @click="addMembers">
            加入分组
          </el-button>
        </div>

        <el-table :data="members" border>
          <el-table-column label="圈主账号" min-width="190">
            <template #default="{ row }">
              <div class="cell-main">{{ row.display_name || row.username }}</div>
              <div class="cell-sub">{{ row.username }}</div>
            </template>
          </el-table-column>
          <el-table-column label="授权圈子" min-width="190">
            <template #default="{ row }">
              <div class="cell-main">{{ row.scope_circle_name || row.scope_circle_id }}</div>
              <div class="cell-sub">{{ row.bound_user_nickname || row.bound_user_id || "-" }}</div>
            </template>
          </el-table-column>
          <el-table-column label="账号状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'info'">
                {{ row.status === "active" ? "启用" : "停用" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button link type="danger" @click="removeMember(row)">移除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped>
.account-groups-page {
  padding: 16px;
}

.filter-bar,
.member-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.keyword {
  width: 280px;
}

.filter-item {
  width: 140px;
}

.cell-main {
  font-weight: 700;
  color: #221a14;
}

.cell-sub {
  color: #8f8276;
  font-size: 12px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.detail {
  display: grid;
  gap: 14px;
}

.detail-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.member-select {
  flex: 1;
  min-width: 360px;
}
</style>
