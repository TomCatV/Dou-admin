<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import type { FormInstance } from "element-plus";
import { ElMessage } from "element-plus";
import { loginRules } from "./utils/rule";
import { useUserStoreHook } from "@/store/modules/user";
import { initRouter } from "@/router/utils";
import { useLayout } from "@/layout/hooks/useLayout";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";

defineOptions({
  name: "Login"
});

const router = useRouter();
const loading = ref(false);
const ruleFormRef = ref<FormInstance>();

const { initStorage } = useLayout();
initStorage();

const { overallStyle, dataThemeChange } = useDataThemeChange();
dataThemeChange(overallStyle.value);

const ruleForm = reactive({
  username: "admin",
  password: ""
});

async function onLogin(formEl: FormInstance | undefined) {
  if (!formEl) return;
  const valid = await formEl.validate().catch(() => false);
  if (!valid) return;
  loading.value = true;
  try {
    const res = await useUserStoreHook().loginByUsername({ ...ruleForm });
    if (!res.success) {
      ElMessage.error("登录失败");
      return;
    }
    await initRouter();
    await router.push("/dashboard");
    ElMessage.success("登录成功");
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || "登录失败");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-panel">
      <div class="brand">
        <div class="brand-mark">D</div>
        <div>
          <h1>Dou 管理后台</h1>
          <p>平台举报、内容治理和操作审计</p>
        </div>
      </div>

      <el-form
        ref="ruleFormRef"
        :model="ruleForm"
        :rules="loginRules"
        size="large"
        @keyup.enter="onLogin(ruleFormRef)"
      >
        <el-form-item prop="username">
          <el-input v-model="ruleForm.username" clearable placeholder="管理员账号" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="ruleForm.password"
            clearable
            show-password
            placeholder="管理员密码"
          />
        </el-form-item>
        <el-button
          class="login-button"
          type="primary"
          :loading="loading"
          @click="onLogin(ruleFormRef)"
        >
          登录
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  background:
    linear-gradient(135deg, rgba(246, 241, 233, 0.92), rgba(226, 237, 232, 0.88)),
    #f4efe8;
}

.login-panel {
  width: min(420px, 100%);
  padding: 28px;
  background: #fffdf9;
  border: 1px solid #e6ddd2;
  border-radius: 8px;
  box-shadow: 0 18px 40px rgba(34, 26, 20, 0.08);
}

.brand {
  display: flex;
  gap: 14px;
  align-items: center;
  margin-bottom: 26px;
}

.brand-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  color: #fffdf9;
  font-size: 26px;
  font-weight: 900;
  background: #2b211a;
  border-radius: 8px;
}

h1 {
  margin: 0;
  color: #221a14;
  font-size: 24px;
}

p {
  margin: 6px 0 0;
  color: #766b61;
}

.login-button {
  width: 100%;
  margin-top: 8px;
}
</style>
