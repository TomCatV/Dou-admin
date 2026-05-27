<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  adminUsersApi,
  type AdminCircleOption,
  type AdminRole,
  type AdminScopeType,
  type AdminUser,
  type AdminUserOption,
  type PermissionCatalog
} from "@/api/admin";
import {
  adminRoleLabels,
  adminRoleTagTypes,
  adminScopeLabels,
  adminStatusMap
} from "@/utils/labels";
import { useUserStoreHook } from "@/store/modules/user";

defineOptions({
  name: "AdminUsers"
});

type AccountForm = {
  id: string;
  username: string;
  display_name: string;
  role: AdminRole;
  status: "active" | "disabled";
  scope_type: AdminScopeType;
  scope_circle_id: string;
  bound_user_id: string;
  permissions: string[];
  password: string;
};

type TagType = "primary" | "success" | "warning" | "danger" | "info";

const userStore = useUserStoreHook();
const loading = ref(false);
const submitting = ref(false);
const rows = ref<AdminUser[]>([]);
const total = ref(0);
const dialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref<FormInstance>();
const catalog = ref<PermissionCatalog | null>(null);
const circleOptions = ref<AdminCircleOption[]>([]);
const userOptions = ref<AdminUserOption[]>([]);
const circleLoading = ref(false);
const userLoading = ref(false);
const resetVisible = ref(false);
const resetPassword = ref("");
const resetUsername = ref("");

const filters = reactive({
  keyword: "",
  role: "",
  status: "",
  scope_type: "",
  page: 1,
  page_size: 20
});

const form = reactive<AccountForm>({
  id: "",
  username: "",
  display_name: "",
  role: "admin_l3",
  status: "active",
  scope_type: "global",
  scope_circle_id: "",
  bound_user_id: "",
  permissions: [],
  password: ""
});

const isSuperAdmin = computed(() => userStore.roles?.includes("super_admin"));

const rules = computed<FormRules>(() => ({
  username: [
    { required: true, message: "请输入账号名", trigger: "blur" },
    { min: 3, message: "账号名至少 3 位", trigger: "blur" }
  ],
  role: [{ required: true, message: "请选择角色", trigger: "change" }],
  status: [{ required: true, message: "请选择状态", trigger: "change" }],
  scope_type: [{ required: true, message: "请选择账号范围", trigger: "change" }],
  scope_circle_id: [
    {
      validator: (_rule, value, callback) => {
        if (form.scope_type === "circle" && !value) {
          callback(new Error("请选择授权圈子"));
        } else {
          callback();
        }
      },
      trigger: "change"
    }
  ],
  password: [
    {
      validator: (_rule, value, callback) => {
        if (isEdit.value && !value) return callback();
        if (!value) return callback(new Error("请输入初始密码"));
        if (String(value).length < 8) return callback(new Error("密码至少 8 位"));
        if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
          return callback(new Error("密码需同时包含字母和数字"));
        }
        callback();
      },
      trigger: "blur"
    }
  ]
}));

const groupedPermissions = computed(() => {
  const groups: Record<string, PermissionCatalog["permissions"]> = {};
  for (const item of catalog.value?.permissions || []) {
    const key = item.group || "其他";
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return groups;
});

function roleType(role: string) {
  return (adminRoleTagTypes[role] || "info") as TagType;
}

function statusMeta(status: string) {
  return adminStatusMap[status as keyof typeof adminStatusMap] || {
    label: status,
    type: "info" as TagType
  };
}

function roleDefaults(role: string, scopeType: string) {
  if (scopeType === "circle") {
    const option = catalog.value?.scope_options.find(item => item.value === "circle");
    return option?.default_permissions || [];
  }
  const option = catalog.value?.role_options.find(item => item.value === role);
  return option?.permissions || [];
}

function isTenantRole(role: string) {
  return role.startsWith("tenant_");
}

function isPlatformRole(role: string) {
  return ["super_admin", "admin_l1", "admin_l2", "admin_l3"].includes(role);
}

function accountRole(row: AdminUser) {
  return row.account_type || row.role;
}

function effectivePermissions(row: AdminUser) {
  return row.permissions || [];
}

async function loadCatalog() {
  catalog.value = await adminUsersApi.permissions();
}

async function loadList() {
  loading.value = true;
  try {
    const data = await adminUsersApi.list({ ...filters });
    rows.value = data.items;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

function resetSearch() {
  filters.keyword = "";
  filters.role = "";
  filters.status = "";
  filters.scope_type = "";
  filters.page = 1;
  loadList();
}

function resetForm() {
    Object.assign(form, {
    id: "",
    username: "",
    display_name: "",
    role: "admin_l3",
    status: "active",
    scope_type: "global",
    scope_circle_id: "",
    bound_user_id: "",
    permissions: roleDefaults("admin_l3", "global"),
    password: ""
  });
}

function openCreate() {
  isEdit.value = false;
  resetForm();
  dialogVisible.value = true;
}

function openEdit(row: AdminUser) {
  isEdit.value = true;
  Object.assign(form, {
    id: row.id,
    username: row.username,
    display_name: row.display_name,
    role: row.account_type || row.role,
    status: row.status,
    scope_type: row.scope_type,
    scope_circle_id: row.scope_circle_id || "",
    bound_user_id: row.bound_user_id || "",
    permissions: row.permissions_json?.length ? row.permissions_json : row.permissions,
    password: ""
  });
  if (row.scope_circle_id && row.scope_circle_name) {
    circleOptions.value = [
      {
        id: row.scope_circle_id,
        name: row.scope_circle_name,
        owner_user_id: row.bound_user_id || "",
        owner_nickname: row.bound_user_nickname || "",
        owner_dxq_id: "",
        status: "",
        member_count: 0
      }
    ];
  }
  if (row.bound_user_id && row.bound_user_nickname) {
    userOptions.value = [
      {
        id: row.bound_user_id,
        dxq_id: "",
        nickname: row.bound_user_nickname,
        avatar: "",
        status: ""
      }
    ];
  }
  dialogVisible.value = true;
}

async function remoteCircleSearch(keyword: string) {
  circleLoading.value = true;
  try {
    const data = await adminUsersApi.circles({ keyword, page_size: 20 });
    circleOptions.value = data.items;
  } finally {
    circleLoading.value = false;
  }
}

async function remoteUserSearch(keyword: string) {
  userLoading.value = true;
  try {
    const data = await adminUsersApi.users({ keyword, page_size: 20 });
    userOptions.value = data.items;
  } finally {
    userLoading.value = false;
  }
}

function applyRoleDefault() {
  form.permissions = roleDefaults(form.role, form.scope_type);
}

const availableRoleOptions = computed(() => {
  const options = catalog.value?.role_options || [];
  if (isSuperAdmin.value) return options;
  return options.filter(item => isTenantRole(item.value));
});

let syncingRoleScope = false;

watch(
  () => form.scope_type,
  value => {
    if (syncingRoleScope) return;
    syncingRoleScope = true;
    if (value === "global" && isTenantRole(form.role)) {
      form.role = "admin_l3";
    }
    if (value === "global") {
      form.scope_circle_id = "";
      form.bound_user_id = "";
    } else if (value === "circle" && isPlatformRole(form.role)) {
      form.role = "tenant_owner";
    }
    applyRoleDefault();
    syncingRoleScope = false;
  }
);

watch(
  () => form.role,
  value => {
    if (syncingRoleScope) return;
    syncingRoleScope = true;
    form.scope_type = isTenantRole(value) ? "circle" : "global";
    applyRoleDefault();
    syncingRoleScope = false;
  }
);

watch(
  () => form.scope_circle_id,
  value => {
    const circle = circleOptions.value.find(item => item.id === value);
    if (circle?.owner_user_id) {
      form.bound_user_id = circle.owner_user_id;
      userOptions.value = [
        {
          id: circle.owner_user_id,
          dxq_id: circle.owner_dxq_id,
          nickname: circle.owner_nickname,
          avatar: "",
          status: ""
        }
      ];
    }
  }
);

async function submit() {
  await formRef.value?.validate();
  submitting.value = true;
  try {
    const payload = {
      username: form.username,
      display_name: form.display_name,
      role: form.role,
      account_type: form.role,
      status: form.status,
      scope_type: form.scope_type,
      scope_circle_id: form.scope_type === "circle" ? form.scope_circle_id : "",
      bound_user_id: form.scope_type === "circle" ? form.bound_user_id : "",
      permissions: form.permissions,
      password: form.password
    };
    if (isEdit.value) {
      await adminUsersApi.update(form.id, payload);
      ElMessage.success("账号已更新");
    } else {
      await adminUsersApi.create(payload);
      ElMessage.success("账号已创建");
    }
    dialogVisible.value = false;
    await loadList();
  } finally {
    submitting.value = false;
  }
}

async function resetAccountPassword(row: AdminUser) {
  await ElMessageBox.confirm(
    `确认重置 ${row.username} 的后台登录密码？`,
    "重置密码",
    { type: "warning" }
  );
  const data = await adminUsersApi.resetPassword(row.id, {});
  resetUsername.value = data.username;
  resetPassword.value = data.password;
  resetVisible.value = true;
}

async function toggleStatus(row: AdminUser) {
  const nextStatus = row.status === "active" ? "disabled" : "active";
  await ElMessageBox.confirm(
    `确认${nextStatus === "active" ? "启用" : "停用"} ${row.username}？`,
    "账号状态",
    { type: "warning" }
  );
  await adminUsersApi.update(row.id, {
    display_name: row.display_name,
    role: accountRole(row),
    account_type: accountRole(row),
    status: nextStatus,
    scope_type: row.scope_type,
    scope_circle_id: row.scope_circle_id,
    bound_user_id: row.bound_user_id,
    permissions: row.permissions_json?.length ? row.permissions_json : row.permissions
  });
  ElMessage.success("状态已更新");
  await loadList();
}

async function copyPassword() {
  await navigator.clipboard.writeText(resetPassword.value);
  ElMessage.success("新密码已复制");
}

onMounted(async () => {
  await loadCatalog();
  resetForm();
  await loadList();
});
</script>

<template>
  <div class="admin-users-page">
    <div class="filter-bar">
      <el-input
        v-model="filters.keyword"
        class="keyword"
        clearable
        placeholder="搜索账号、昵称、圈子"
        @keyup.enter="loadList"
      />
      <el-select v-model="filters.role" class="filter-item" placeholder="角色" clearable>
        <el-option
          v-for="item in availableRoleOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
      <el-select v-model="filters.status" class="filter-item" placeholder="状态" clearable>
        <el-option label="启用" value="active" />
        <el-option label="停用" value="disabled" />
      </el-select>
      <el-select v-model="filters.scope_type" class="filter-item" placeholder="范围" clearable>
        <el-option label="平台全局" value="global" />
        <el-option label="指定圈子" value="circle" />
      </el-select>
      <el-button type="primary" @click="loadList">查询</el-button>
      <el-button @click="resetSearch">重置</el-button>
      <el-button type="success" @click="openCreate">新建账号</el-button>
    </div>

    <el-table v-loading="loading" :data="rows" border>
      <el-table-column label="账号" min-width="180">
        <template #default="{ row }">
          <div class="cell-main">{{ row.display_name || row.username }}</div>
          <div class="cell-sub">{{ row.username }}</div>
        </template>
      </el-table-column>
      <el-table-column label="角色" width="130">
        <template #default="{ row }">
          <el-tag :type="roleType(accountRole(row))">
            {{ adminRoleLabels[accountRole(row)] || accountRole(row) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="范围" min-width="190">
        <template #default="{ row }">
          <div class="cell-main">{{ adminScopeLabels[row.scope_type] || row.scope_type }}</div>
          <div v-if="row.scope_type === 'circle'" class="cell-sub">
            {{ row.scope_circle_name || row.scope_circle_id || "-" }}
          </div>
        </template>
      </el-table-column>
      <el-table-column label="绑定用户" min-width="150">
        <template #default="{ row }">
          {{ row.bound_user_nickname || row.bound_user_id || "-" }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusMeta(row.status).type">
            {{ statusMeta(row.status).label }}
          </el-tag>
          <el-tag
            v-if="row.must_change_password"
            class="password-tag"
            size="small"
            type="warning"
          >
            待改密
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="权限" min-width="220">
        <template #default="{ row }">
          <el-tag
            v-for="code in effectivePermissions(row).slice(0, 3)"
            :key="code"
            class="perm-tag"
            type="info"
          >
            {{ code }}
          </el-tag>
          <span v-if="effectivePermissions(row).length > 3" class="cell-sub">
            +{{ effectivePermissions(row).length - 3 }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="last_login_at" label="最近登录" width="170" />
      <el-table-column label="操作" fixed="right" width="220">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="warning" @click="resetAccountPassword(row)">
            重置密码
          </el-button>
          <el-button
            link
            :type="row.status === 'active' ? 'danger' : 'success'"
            :disabled="row.username === userStore.username"
            @click="toggleStatus(row)"
          >
            {{ row.status === "active" ? "停用" : "启用" }}
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

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑后台账号' : '新建后台账号'"
      width="720px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="110px"
        class="account-form"
      >
        <el-form-item label="账号名" prop="username">
          <el-input
            v-model="form.username"
            :disabled="isEdit"
            placeholder="例如 creator_001"
          />
        </el-form-item>
        <el-form-item label="显示名">
          <el-input v-model="form.display_name" placeholder="后台显示名称" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" class="full">
            <el-option
              v-for="item in availableRoleOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="账号状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio-button label="active">启用</el-radio-button>
            <el-radio-button label="disabled">停用</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="账号范围" prop="scope_type">
          <el-radio-group v-model="form.scope_type" disabled>
            <el-radio-button label="global">平台全局</el-radio-button>
            <el-radio-button label="circle">指定圈子</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <template v-if="form.scope_type === 'circle'">
          <el-form-item label="授权圈子" prop="scope_circle_id">
            <el-select
              v-model="form.scope_circle_id"
              class="full"
              filterable
              remote
              reserve-keyword
              :remote-method="remoteCircleSearch"
              :loading="circleLoading"
              placeholder="搜索圈子名称、ID 或圈主"
            >
              <el-option
                v-for="item in circleOptions"
                :key="item.id"
                :label="`${item.name} / ${item.owner_nickname || item.owner_dxq_id}`"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="绑定圈主">
            <el-select
              v-model="form.bound_user_id"
              class="full"
              filterable
              remote
              reserve-keyword
              :remote-method="remoteUserSearch"
              :loading="userLoading"
              placeholder="默认随授权圈子自动带出圈主"
            >
              <el-option
                v-for="item in userOptions"
                :key="item.id"
                :label="`${item.nickname || item.dxq_id} / ${item.dxq_id || item.id}`"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </template>
        <el-form-item :label="isEdit ? '新密码' : '初始密码'" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            :placeholder="isEdit ? '留空则不修改密码' : '至少 8 位，包含字母和数字'"
          />
        </el-form-item>
        <el-form-item label="权限">
          <div class="permission-box">
            <div v-for="(items, group) in groupedPermissions" :key="group" class="perm-group">
              <div class="perm-title">{{ group }}</div>
              <el-checkbox-group v-model="form.permissions">
                <el-checkbox
                  v-for="item in items"
                  :key="item.code"
                  :label="item.code"
                  :disabled="form.role === 'super_admin' && form.scope_type === 'global'"
                >
                  <span>{{ item.label }}</span>
                  <span class="perm-desc">{{ item.code }}</span>
                </el-checkbox>
              </el-checkbox-group>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">
          保存
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="resetVisible" title="新密码" width="520px">
      <div class="reset-result">
        <div class="cell-main">{{ resetUsername }}</div>
        <el-input v-model="resetPassword" readonly>
          <template #append>
            <el-button @click="copyPassword">复制</el-button>
          </template>
        </el-input>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.admin-users-page {
  padding: 16px;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.keyword {
  width: 260px;
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

.perm-tag {
  margin: 0 4px 4px 0;
}

.password-tag {
  margin-top: 4px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.account-form {
  max-height: 68vh;
  padding-right: 8px;
  overflow: auto;
}

.full {
  width: 100%;
}

.permission-box {
  width: 100%;
  padding: 12px;
  background: #fffdf9;
  border: 1px solid #e6ddd2;
  border-radius: 8px;
}

.perm-group + .perm-group {
  margin-top: 12px;
}

.perm-title {
  margin-bottom: 6px;
  color: #6e6258;
  font-size: 13px;
  font-weight: 700;
}

.perm-desc {
  margin-left: 6px;
  color: #9b8d80;
  font-size: 12px;
}

.reset-result {
  display: grid;
  gap: 10px;
}
</style>
