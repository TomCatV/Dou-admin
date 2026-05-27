<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import { accountApi } from "@/api/admin";
import { removeToken } from "@/utils/auth";
import { useUserStoreHook } from "@/store/modules/user";
import { router } from "@/router";

defineOptions({
  name: "AccountSecurity"
});

const formRef = ref<FormInstance>();
const loading = ref(false);
const logLoading = ref(false);
const userStore = useUserStoreHook();
const loginLogs = ref<Array<Record<string, any>>>([]);
const securityPolicy = ref({
  max_failed_attempts: 5,
  lock_minutes: 15
});
const form = reactive({
  old_password: "",
  new_password: "",
  confirm_password: ""
});

const rules: FormRules = {
  old_password: [{ required: true, message: "请输入原密码", trigger: "blur" }],
  new_password: [
    { required: true, message: "请输入新密码", trigger: "blur" },
    { min: 8, message: "新密码至少 8 位", trigger: "blur" },
    {
      validator: (_rule, value, callback) => {
        if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
          callback(new Error("新密码需同时包含字母和数字"));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ],
  confirm_password: [
    { required: true, message: "请再次输入新密码", trigger: "blur" },
    {
      validator: (_rule, value, callback) => {
        if (value !== form.new_password) callback(new Error("两次输入的新密码不一致"));
        else callback();
      },
      trigger: "blur"
    }
  ]
};

async function submit() {
  await formRef.value?.validate();
  loading.value = true;
  try {
    await accountApi.changePassword({
      old_password: form.old_password,
      new_password: form.new_password
    });
    ElMessage.success("密码已修改，请重新登录");
    removeToken();
    userStore.SET_USERNAME("");
    userStore.SET_NICKNAME("");
    userStore.SET_ROLES([]);
    userStore.SET_PERMS([]);
    userStore.SET_MUST_CHANGE_PASSWORD(false);
    await router.replace("/login");
  } finally {
    loading.value = false;
  }
}

async function loadLoginLogs() {
  logLoading.value = true;
  try {
    const data = await accountApi.loginLogs({ page: 1, page_size: 8 });
    loginLogs.value = data.items;
    securityPolicy.value = data.policy;
  } finally {
    logLoading.value = false;
  }
}

onMounted(loadLoginLogs);
</script>

<template>
  <div class="security-page">
    <el-card shadow="never" class="security-card">
      <template #header>
        <div class="card-title">
          <span>修改登录密码</span>
          <span class="sub">
            当前账号：{{ userStore.username }}
            <el-tag v-if="userStore.mustChangePassword" size="small" type="danger">
              需先改密
            </el-tag>
          </span>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="110px"
        class="password-form"
      >
        <el-form-item label="原密码" prop="old_password">
          <el-input
            v-model="form.old_password"
            type="password"
            show-password
            autocomplete="current-password"
          />
        </el-form-item>
        <el-form-item label="新密码" prop="new_password">
          <el-input
            v-model="form.new_password"
            type="password"
            show-password
            autocomplete="new-password"
          />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirm_password">
          <el-input
            v-model="form.confirm_password"
            type="password"
            show-password
            autocomplete="new-password"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="submit">
            保存并重新登录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="security-card">
      <template #header>
        <div class="card-title">
          <span>登录安全策略</span>
          <span class="sub">
            连续失败 {{ securityPolicy.max_failed_attempts }} 次锁定
            {{ securityPolicy.lock_minutes }} 分钟
          </span>
        </div>
      </template>

      <div class="security-list">
        <div class="security-item">
          <div>
            <div class="item-title">首次登录改密</div>
            <div class="item-sub">新建账号和重置密码后的账号必须先修改密码。</div>
          </div>
          <el-tag type="success">已启用</el-tag>
        </div>
        <div class="security-item">
          <div>
            <div class="item-title">失败锁定</div>
            <div class="item-sub">超过策略阈值后临时锁定账号登录入口。</div>
          </div>
          <el-tag type="success">已启用</el-tag>
        </div>
        <div class="security-item">
          <div>
            <div class="item-title">密码变更失效旧会话</div>
            <div class="item-sub">修改或重置密码后，旧登录令牌立即不可用。</div>
          </div>
          <el-tag type="success">已启用</el-tag>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="security-card">
      <template #header>
        <div class="card-title">
          <span>最近登录记录</span>
          <el-button link type="primary" :loading="logLoading" @click="loadLoginLogs">
            刷新
          </el-button>
        </div>
      </template>
      <el-table v-loading="logLoading" :data="loginLogs" border>
        <el-table-column label="结果" width="90">
          <template #default="{ row }">
            <el-tag :type="row.success ? 'success' : 'danger'">
              {{ row.success ? "成功" : "失败" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ip" label="IP" min-width="140" />
        <el-table-column label="原因" min-width="120">
          <template #default="{ row }">
            {{ row.failure_reason || "-" }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="时间" width="170" />
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.security-page {
  display: grid;
  gap: 16px;
  padding: 16px;
}

.security-card {
  max-width: 720px;
  border-radius: 8px;
}

.card-title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  font-weight: 700;
}

.sub {
  color: #8f8276;
  font-size: 12px;
  font-weight: 400;
}

.password-form {
  max-width: 520px;
}

.security-list {
  display: grid;
  gap: 12px;
}

.security-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border: 1px solid #efe6db;
  border-radius: 8px;
}

.item-title {
  font-weight: 700;
  color: #221a14;
}

.item-sub {
  margin-top: 4px;
  color: #8f8276;
  font-size: 12px;
}
</style>
