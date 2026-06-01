<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { DocumentCopy, MagicStick, Refresh } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { hasPerms } from "@/utils/auth";
import {
  tenantAiApi,
  type TenantAiReport,
  type TenantAiUsage
} from "@/api/admin";

defineOptions({ name: "TenantAiAssistant" });

const loading = ref(false);
const generating = ref("");
const rows = ref<TenantAiReport[]>([]);
const total = ref(0);
const usage = ref<TenantAiUsage | null>(null);
const activeReport = ref<TenantAiReport | null>(null);
const reportDrawerVisible = ref(false);
const filters = reactive({
  scene: "",
  status: "",
  page: 1,
  page_size: 10
});
const dailyForm = reactive({
  range_days: 1
});
const copyForm = reactive({
  goal: "提升本周私域成交转化",
  audience: "圈内潜在付费用户",
  tone: "可信、直接、有行动感"
});

const canGenerate = computed(() => hasPerms("tenant:ai:generate"));
const usageText = computed(() => {
  if (!usage.value) return "0 / 0";
  return `${usage.value.used} / ${usage.value.limit}`;
});

function yuan(value?: number) {
  return `¥${((Number(value) || 0) / 100).toFixed(2)}`;
}

function sceneText(scene: string) {
  return (
    {
      daily_report: "经营日报",
      campaign_copy: "活动文案"
    }[scene] || scene
  );
}

function statusType(status: string) {
  if (status === "generated") return "success";
  if (status === "accepted") return "primary";
  if (status === "dismissed") return "info";
  if (status === "failed") return "danger";
  return "warning";
}

function statusText(status: string) {
  return (
    {
      generated: "已生成",
      accepted: "已确认",
      dismissed: "已忽略",
      failed: "生成失败"
    }[status] || status
  );
}

async function loadReports() {
  loading.value = true;
  try {
    const data = await tenantAiApi.reports({ ...filters });
    rows.value = data.items;
    total.value = data.total;
    usage.value = data.usage;
  } finally {
    loading.value = false;
  }
}

async function loadUsage() {
  usage.value = await tenantAiApi.usage();
}

function search() {
  filters.page = 1;
  loadReports();
}

function openReport(row: TenantAiReport) {
  activeReport.value = row;
  reportDrawerVisible.value = true;
}

async function generateDailyReport() {
  if (!canGenerate.value) {
    ElMessage.warning("当前账号没有 AI 生成权限");
    return;
  }
  generating.value = "daily";
  try {
    const data = await tenantAiApi.generateDailyReport({
      range_days: dailyForm.range_days
    });
    activeReport.value = data.report;
    reportDrawerVisible.value = true;
    ElMessage.success(
      data.report.status === "failed"
        ? "AI 服务暂不可用，已保留本次数据摘要"
        : "经营日报已生成"
    );
    await loadReports();
  } finally {
    generating.value = "";
  }
}

async function generateCampaignCopy() {
  if (!canGenerate.value) {
    ElMessage.warning("当前账号没有 AI 生成权限");
    return;
  }
  generating.value = "copy";
  try {
    const data = await tenantAiApi.generateCampaignCopy({ ...copyForm });
    activeReport.value = data.report;
    reportDrawerVisible.value = true;
    ElMessage.success(
      data.report.status === "failed"
        ? "AI 服务暂不可用，已保留本次数据摘要"
        : "活动文案已生成"
    );
    await loadReports();
  } finally {
    generating.value = "";
  }
}

async function confirmReport(status: "accepted" | "dismissed") {
  if (!activeReport.value) return;
  const result = await tenantAiApi.confirmReport(activeReport.value.id, {
    status,
    suggested_action:
      activeReport.value.output?.summary ||
      activeReport.value.output?.theme ||
      ""
  });
  activeReport.value = result.report;
  ElMessage.success(status === "accepted" ? "AI 建议已确认" : "AI 建议已忽略");
  await loadReports();
}

async function copyText(text: string) {
  if (!text) return;
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
  } else {
    window.prompt("复制内容", text);
  }
  ElMessage.success("内容已复制");
}

function copyCandidateText(item: Record<string, any>) {
  return [item.title, item.body, item.cta].filter(Boolean).join("\n");
}

onMounted(async () => {
  await Promise.all([loadUsage(), loadReports()]);
});
</script>

<template>
  <div v-loading="loading" class="ai-page">
    <div class="page-head">
      <div>
        <h1>AI 经营助手</h1>
        <p>基于聚合脱敏经营数据生成日报和活动文案，所有建议都需要人工确认。</p>
      </div>
      <el-button :icon="Refresh" @click="loadReports">刷新</el-button>
    </div>

    <el-alert
      v-if="usage && !usage.ai_available"
      class="mb"
      type="warning"
      show-icon
      :closable="false"
      title="服务端尚未配置 OPENAI_API_KEY，AI 生成会保存脱敏摘要并返回失败状态。"
    />
    <el-alert
      v-if="!canGenerate"
      class="mb"
      type="info"
      show-icon
      :closable="false"
      title="当前账号可查看 AI 历史记录，不能发起新的生成。"
    />

    <el-row :gutter="16">
      <el-col :xs="24" :lg="8">
        <div class="metric">
          <span>今日用量</span>
          <strong>{{ usageText }}</strong>
          <em>剩余 {{ usage?.remaining || 0 }} 次</em>
        </div>
      </el-col>
      <el-col :xs="24" :lg="8">
        <div class="metric">
          <span>默认模型</span>
          <strong>{{ usage?.model || "-" }}</strong>
          <em>{{ usage?.ai_available ? "服务可用" : "等待配置" }}</em>
        </div>
      </el-col>
      <el-col :xs="24" :lg="8">
        <div class="metric">
          <span>套餐</span>
          <strong>{{ usage?.plan_code || "未识别" }}</strong>
          <em>按套餐限制每日生成次数</em>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mt">
      <el-col :xs="24" :lg="12">
        <div class="panel">
          <div class="panel-head">
            <h2>经营日报</h2>
            <el-button
              type="primary"
              :icon="MagicStick"
              :disabled="!canGenerate"
              :loading="generating === 'daily'"
              @click="generateDailyReport"
            >
              生成日报
            </el-button>
          </div>
          <el-form label-width="96px">
            <el-form-item label="数据范围">
              <el-input-number
                v-model="dailyForm.range_days"
                :min="1"
                :max="30"
                controls-position="right"
              />
              <span class="hint">天</span>
            </el-form-item>
          </el-form>
        </div>
      </el-col>
      <el-col :xs="24" :lg="12">
        <div class="panel">
          <div class="panel-head">
            <h2>活动文案</h2>
            <el-button
              type="primary"
              :icon="MagicStick"
              :disabled="!canGenerate"
              :loading="generating === 'copy'"
              @click="generateCampaignCopy"
            >
              生成文案
            </el-button>
          </div>
          <el-form label-width="72px">
            <el-form-item label="目标">
              <el-input v-model="copyForm.goal" maxlength="120" />
            </el-form-item>
            <el-form-item label="人群">
              <el-input v-model="copyForm.audience" maxlength="120" />
            </el-form-item>
            <el-form-item label="语气">
              <el-input v-model="copyForm.tone" maxlength="80" />
            </el-form-item>
          </el-form>
        </div>
      </el-col>
    </el-row>

    <div class="panel mt">
      <div class="filter-bar">
        <el-select v-model="filters.scene" clearable placeholder="场景">
          <el-option label="经营日报" value="daily_report" />
          <el-option label="活动文案" value="campaign_copy" />
        </el-select>
        <el-select v-model="filters.status" clearable placeholder="状态">
          <el-option label="已生成" value="generated" />
          <el-option label="已确认" value="accepted" />
          <el-option label="已忽略" value="dismissed" />
          <el-option label="生成失败" value="failed" />
        </el-select>
        <el-button type="primary" @click="search">查询</el-button>
      </div>
      <el-table :data="rows" border>
        <el-table-column label="场景" width="110">
          <template #default="{ row }">{{ sceneText(row.scene) }}</template>
        </el-table-column>
        <el-table-column label="摘要" min-width="260">
          <template #default="{ row }">
            <span>{{
              row.output?.summary ||
              row.output?.theme ||
              row.failure_reason ||
              "-"
            }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="model" label="模型" width="130" />
        <el-table-column prop="created_at" label="生成时间" width="170" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openReport(row)"
              >查看</el-button
            >
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination
          v-model:current-page="filters.page"
          v-model:page-size="filters.page_size"
          layout="total, prev, pager, next"
          :total="total"
          @change="loadReports"
        />
      </div>
    </div>

    <el-drawer
      v-model="reportDrawerVisible"
      :title="activeReport ? sceneText(activeReport.scene) : 'AI 结果'"
      size="560px"
    >
      <template v-if="activeReport">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="状态">
            <el-tag :type="statusType(activeReport.status)">
              {{ statusText(activeReport.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="模型">
            {{ activeReport.model || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="时间">
            {{ activeReport.created_at }}
          </el-descriptions-item>
          <el-descriptions-item
            v-if="activeReport.failure_reason"
            label="失败原因"
          >
            {{ activeReport.failure_reason }}
          </el-descriptions-item>
        </el-descriptions>

        <template v-if="activeReport.scene === 'daily_report'">
          <section class="result-block">
            <h3>总结</h3>
            <p>{{ activeReport.output?.summary || "-" }}</p>
          </section>
          <section class="result-block">
            <h3>关键指标</h3>
            <div class="kv-grid">
              <span>订单</span
              ><strong>{{ activeReport.output?.metrics?.orders || 0 }}</strong>
              <span>已支付</span
              ><strong>{{
                activeReport.output?.metrics?.paid_orders || 0
              }}</strong>
              <span>成交额</span
              ><strong>{{
                yuan(activeReport.output?.metrics?.revenue_amount)
              }}</strong>
              <span>优惠</span
              ><strong>{{
                yuan(activeReport.output?.metrics?.discount_amount)
              }}</strong>
              <span>售后</span
              ><strong>{{
                activeReport.output?.metrics?.after_sale_count || 0
              }}</strong>
            </div>
          </section>
          <section class="result-block">
            <h3>风险提醒</h3>
            <el-empty
              v-if="!(activeReport.output?.risks || []).length"
              description="暂无风险"
            />
            <div
              v-for="item in activeReport.output?.risks || []"
              :key="item.title"
              class="result-item"
            >
              <strong>{{ item.title }}</strong>
              <p>{{ item.reason }}</p>
            </div>
          </section>
          <section class="result-block">
            <h3>建议动作</h3>
            <el-empty
              v-if="!(activeReport.output?.actions || []).length"
              description="暂无建议"
            />
            <div
              v-for="item in activeReport.output?.actions || []"
              :key="item.title"
              class="result-item"
            >
              <strong>{{ item.title }}</strong>
              <p>{{ item.detail }}</p>
            </div>
          </section>
        </template>

        <template v-else>
          <section class="result-block">
            <h3>{{ activeReport.output?.theme || "活动主题" }}</h3>
            <p>{{ activeReport.output?.audience || "-" }}</p>
          </section>
          <section class="result-block">
            <h3>卖点</h3>
            <el-tag
              v-for="item in activeReport.output?.selling_points || []"
              :key="item"
              class="tag"
            >
              {{ item }}
            </el-tag>
          </section>
          <section class="result-block">
            <h3>候选文案</h3>
            <div
              v-for="item in activeReport.output?.copy_candidates || []"
              :key="`${item.channel}-${item.title}`"
              class="copy-card"
            >
              <div class="copy-head">
                <strong>{{ item.title }}</strong>
                <el-button
                  link
                  type="primary"
                  :icon="DocumentCopy"
                  @click="copyText(copyCandidateText(item))"
                >
                  复制
                </el-button>
              </div>
              <p>{{ item.body }}</p>
              <em>{{ item.cta }}</em>
            </div>
          </section>
          <section class="result-block">
            <h3>合规提示</h3>
            <p
              v-for="item in activeReport.output?.compliance_notes || []"
              :key="item"
            >
              {{ item }}
            </p>
          </section>
        </template>

        <div class="drawer-actions">
          <el-button @click="confirmReport('dismissed')">忽略</el-button>
          <el-button type="primary" @click="confirmReport('accepted')">
            人工确认
          </el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.ai-page {
  padding: 16px;
}

.page-head {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.page-head h1,
.panel h2 {
  margin: 0;
  color: #202124;
}

.page-head p {
  margin: 6px 0 0;
  color: #667085;
}

.metric,
.panel {
  padding: 16px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.metric span,
.metric em,
.hint {
  display: block;
  font-style: normal;
  color: #667085;
}

.metric strong {
  display: block;
  margin-top: 8px;
  font-size: 24px;
  color: #111827;
}

.panel-head,
.filter-bar,
.copy-head,
.drawer-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
}

.filter-bar {
  justify-content: flex-start;
  margin-bottom: 12px;
}

.mt {
  margin-top: 16px;
}

.mb {
  margin-bottom: 12px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.result-block {
  margin-top: 18px;
}

.result-block h3 {
  margin: 0 0 10px;
  font-size: 15px;
  color: #111827;
}

.result-block p {
  margin: 6px 0;
  line-height: 1.7;
  color: #4b5563;
}

.kv-grid {
  display: grid;
  grid-template-columns: 90px 1fr;
  gap: 8px 12px;
}

.kv-grid span {
  color: #667085;
}

.result-item,
.copy-card {
  padding: 12px;
  margin-bottom: 10px;
  background: #f9fafb;
  border: 1px solid #edf0f3;
  border-radius: 8px;
}

.copy-card em {
  font-style: normal;
  color: #1f6f4a;
}

.tag {
  margin: 0 8px 8px 0;
}

.drawer-actions {
  justify-content: flex-end;
  padding-top: 16px;
  margin-top: 20px;
  border-top: 1px solid #e5e7eb;
}

@media (width <= 768px) {
  .page-head,
  .panel-head {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
