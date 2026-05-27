<script setup lang="ts">
import { reactive, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import { accountApi } from "@/api/admin";
import { useUserStoreHook } from "@/store/modules/user";

defineOptions({
  name: "AccountSecurity"
});

const formRef = ref<FormInstance>();
const loading = ref(false);
const userStore = useUserStoreHook();
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
    userStore.logOut();
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="security-page">
    <el-card shadow="never" class="security-card">
      <template #header>
        <div class="card-title">
          <span>修改登录密码</span>
          <span class="sub">当前账号：{{ userStore.username }}</span>
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
          <span class="sub">当前为提示态，后续接入管理端安全配置</span>
        </div>
      </template>

      <div class="security-list">
        <div class="security-item">
          <div>
            <div class="item-title">双因素验证</div>
            <div class="item-sub">建议超级管理员开启短信或验证器二次确认。</div>
          </div>
          <el-tag type="warning">待接入</el-tag>
        </div>
        <div class="security-item">
          <div>
            <div class="item-title">IP 白名单</div>
            <div class="item-sub">生产环境建议限制后台登录来源，降低撞库风险。</div>
          </div>
          <el-tag type="info">未启用</el-tag>
        </div>
        <div class="security-item">
          <div>
            <div class="item-title">会话有效期</div>
            <div class="item-sub">当前令牌由后端统一签发，默认随 JWT 过期策略生效。</div>
          </div>
          <el-tag type="success">已启用</el-tag>
        </div>
      </div>
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
