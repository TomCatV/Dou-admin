<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import {
  platformAiSettingsApi,
  type PlatformAiRuntime,
  type PlatformAiSettings
} from "@/api/admin";

defineOptions({ name: "PlatformAiSettings" });

const loading = ref(false);
const saving = ref(false);
const settings = ref<PlatformAiSettings | null>(null);
const runtime = ref<PlatformAiRuntime | null>(null);

const form = reactive({
  enabled: true,
  daily_report_enabled: true,
  campaign_copy_enabled: true,
  model: "",
  protocol: "",
  base_url: "",
  responses_url: "",
  chat_completions_url: "",
  chat_max_tokens_field: "max_tokens",
  basic_daily_limit: null as number | null,
  pro_daily_limit: null as number | null,
  super_admin_unlimited: true,
  request_timeout_ms: null as number | null,
  max_output_tokens: null as number | null,
  update_note: ""
});

const status = computed(() => {
  if (!runtime.value?.enabled) return { text: "已关闭", type: "danger" };
  if (!runtime.value?.api_key_configured) {
    return { text: "等待密钥", type: "warning" };
  }
  return { text: "可生成", type: "success" };
});

const statusType = computed(() => status.value.type as "success" | "warning" | "danger");

function urlText(value?: { host: string; path: string }) {
  if (!value?.host && !value?.path) return "-";
  return `${value.host}${value.path}`;
}

function fillForm(value: PlatformAiSettings) {
  form.enabled = value.enabled;
  form.daily_report_enabled = value.daily_report_enabled;
  form.campaign_copy_enabled = value.campaign_copy_enabled;
  form.model = value.model || "";
  form.protocol = value.protocol || "";
  form.base_url = value.base_url || "";
  form.responses_url = value.responses_url || "";
  form.chat_completions_url = value.chat_completions_url || "";
  form.chat_max_tokens_field = value.chat_max_tokens_field || "max_tokens";
  form.basic_daily_limit = value.basic_daily_limit;
  form.pro_daily_limit = value.pro_daily_limit;
  form.super_admin_unlimited = value.super_admin_unlimited;
  form.request_timeout_ms = value.request_timeout_ms;
  form.max_output_tokens = value.max_output_tokens;
  form.update_note = "";
}

async function loadData() {
  loading.value = true;
  try {
    const data = await platformAiSettingsApi.detail();
    settings.value = data.settings;
    runtime.value = data.runtime;
    fillForm(data.settings);
  } finally {
    loading.value = false;
  }
}

function payload() {
  return {
    enabled: form.enabled,
    daily_report_enabled: form.daily_report_enabled,
    campaign_copy_enabled: form.campaign_copy_enabled,
    model: form.model.trim(),
    protocol: form.protocol,
    base_url: form.base_url.trim(),
    responses_url: form.responses_url.trim(),
    chat_completions_url: form.chat_completions_url.trim(),
    chat_max_tokens_field: form.chat_max_tokens_field,
    basic_daily_limit: form.basic_daily_limit,
    pro_daily_limit: form.pro_daily_limit,
    super_admin_unlimited: form.super_admin_unlimited,
    request_timeout_ms: form.request_timeout_ms,
    max_output_tokens: form.max_output_tokens,
    update_note: form.update_note.trim()
  };
}

async function saveSettings() {
  if (!form.update_note.trim()) {
    ElMessage.warning("请填写调整原因");
    return;
  }
  saving.value = true;
  try {
    const data = await platformAiSettingsApi.save(payload());
    settings.value = data.settings;
    runtime.value = data.runtime;
    fillForm(data.settings);
    ElMessage.success("AI 设置已保存");
  } finally {
    saving.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <div v-loading="loading" class="ai-settings-page">
    <div class="summary-strip">
      <div class="metric">
        <span>生成状态</span>
        <strong>
          <el-tag :type="statusType">{{ status.text }}</el-tag>
        </strong>
        <em>{{ runtime?.api_key_configured ? "服务端密钥已配置" : "服务端密钥未配置" }}</em>
      </div>
      <div class="metric">
        <span>生效模型</span>
        <strong>{{ runtime?.effective_model || "-" }}</strong>
        <em>{{ runtime?.protocol || "-" }} / {{ runtime?.protocol_source || "-" }}</em>
      </div>
      <div class="metric">
        <span>超管次数</span>
        <strong>{{ runtime?.super_admin_unlimited ? "不限" : "按套餐" }}</strong>
        <em>圈主账号仍按套餐额度</em>
      </div>
      <div class="metric">
        <span>最近保存</span>
        <strong>{{ settings?.updated_at || "-" }}</strong>
        <em>{{ settings?.updated_by_admin_id ? "已写入审计" : "默认配置" }}</em>
      </div>
    </div>

    <section class="panel">
      <div class="panel-title">公共开关</div>
      <el-form label-width="136px">
        <el-form-item label="总开关">
          <el-switch v-model="form.enabled" active-text="允许生成" inactive-text="关闭生成" />
        </el-form-item>
        <el-form-item label="经营日报">
          <el-switch v-model="form.daily_report_enabled" active-text="允许" inactive-text="关闭" />
        </el-form-item>
        <el-form-item label="活动文案">
          <el-switch v-model="form.campaign_copy_enabled" active-text="允许" inactive-text="关闭" />
        </el-form-item>
        <el-form-item label="超管不限次">
          <el-switch v-model="form.super_admin_unlimited" active-text="开启" inactive-text="关闭" />
        </el-form-item>
      </el-form>
    </section>

    <section class="panel">
      <div class="panel-title">模型与协议</div>
      <el-form label-width="136px">
        <el-form-item label="模型">
          <el-input v-model="form.model" placeholder="为空时使用服务端环境变量" maxlength="120" />
        </el-form-item>
        <el-form-item label="协议">
          <el-select v-model="form.protocol" clearable placeholder="自动沿用服务端推断">
            <el-option label="Responses" value="responses" />
            <el-option label="Chat Completions" value="chat_completions" />
            <el-option label="Auto" value="auto" />
          </el-select>
        </el-form-item>
        <el-form-item label="中转站 BaseURL">
          <el-input v-model="form.base_url" placeholder="https://relay.example.com/v1" maxlength="300" />
        </el-form-item>
        <el-form-item label="Responses URL">
          <el-input v-model="form.responses_url" placeholder="可留空，由 BaseURL 拼接" maxlength="300" />
        </el-form-item>
        <el-form-item label="Chat URL">
          <el-input v-model="form.chat_completions_url" placeholder="可留空，由 BaseURL 拼接" maxlength="300" />
        </el-form-item>
        <el-form-item label="Chat Token 字段">
          <el-select v-model="form.chat_max_tokens_field">
            <el-option label="max_tokens" value="max_tokens" />
            <el-option label="max_completion_tokens" value="max_completion_tokens" />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="runtime">
        <span>Responses：{{ urlText(runtime?.responses_url) }}</span>
        <span>Chat：{{ urlText(runtime?.chat_completions_url) }}</span>
      </div>
    </section>

    <section class="panel">
      <div class="panel-title">额度与成本</div>
      <el-form label-width="136px">
        <el-form-item label="入门每日次数">
          <el-input-number v-model="form.basic_daily_limit" :min="0" :max="10000" controls-position="right" />
        </el-form-item>
        <el-form-item label="专业每日次数">
          <el-input-number v-model="form.pro_daily_limit" :min="0" :max="10000" controls-position="right" />
        </el-form-item>
        <el-form-item label="超时毫秒">
          <el-input-number v-model="form.request_timeout_ms" :min="5000" :max="120000" :step="1000" controls-position="right" />
        </el-form-item>
        <el-form-item label="最大输出 Token">
          <el-input-number v-model="form.max_output_tokens" :min="600" :max="20000" :step="100" controls-position="right" />
        </el-form-item>
        <el-form-item label="调整原因" required>
          <el-input
            v-model="form.update_note"
            type="textarea"
            :rows="3"
            maxlength="500"
            show-word-limit
            placeholder="例如：线上中转站只支持 Chat Completions，本次切换为 auto"
          />
        </el-form-item>
      </el-form>
      <div class="actions">
        <el-button @click="loadData">重置</el-button>
        <el-button type="primary" :loading="saving" @click="saveSettings">保存设置</el-button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.ai-settings-page {
  padding: 16px;
}

.summary-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.metric,
.panel {
  padding: 16px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.metric span,
.metric em {
  display: block;
  font-style: normal;
  color: #667085;
}

.metric strong {
  display: block;
  min-height: 30px;
  margin-top: 8px;
  overflow: hidden;
  font-size: 20px;
  color: #111827;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.panel {
  margin-top: 16px;
}

.panel-title {
  margin-bottom: 14px;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.runtime {
  display: grid;
  gap: 8px;
  padding: 12px;
  margin-top: 8px;
  color: #475467;
  background: #f9fafb;
  border: 1px solid #edf0f3;
  border-radius: 8px;
}

.actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

@media (width <= 1100px) {
  .summary-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (width <= 720px) {
  .summary-strip {
    grid-template-columns: 1fr;
  }
}
</style>
