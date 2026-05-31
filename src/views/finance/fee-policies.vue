<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  platformFeePoliciesApi,
  type PlatformFeePolicy,
  type PlatformFeePolicyPlan,
  type PlatformFeePolicyTenant
} from "@/api/admin";

defineOptions({
  name: "PlatformFeePolicies"
});

type EditTarget = "global" | "plan" | "tenant";

const loading = ref(false);
const submitting = ref(false);
const globalPolicy = ref<PlatformFeePolicy | null>(null);
const fallbackPolicy = ref<PlatformFeePolicy | null>(null);
const plans = ref<PlatformFeePolicyPlan[]>([]);
const tenants = ref<PlatformFeePolicyTenant[]>([]);
const policies = ref<PlatformFeePolicy[]>([]);
const tenantTotal = ref(0);
const dialogVisible = ref(false);
const editTarget = ref<EditTarget>("global");
const editTargetId = ref("");
const editTitle = ref("编辑费率");

const filters = reactive({
  keyword: "",
  page: 1,
  page_size: 20
});

const form = reactive({
  fee_percent: 20,
  min_fee_yuan: 0,
  max_fee_yuan: null as number | null,
  note: ""
});

const summary = computed(() => {
  const overrideCount = tenants.value.filter(item => item.fee_policy).length;
  return {
    global: globalPolicy.value || fallbackPolicy.value,
    planCount: plans.value.filter(item => item.fee_policy).length,
    overrideCount
  };
});

function yuan(value?: number | null) {
  return `¥${((Number(value) || 0) / 100).toFixed(2)}`;
}

function feePercent(policy?: PlatformFeePolicy | null) {
  const bps = Number(policy?.fee_bps) || 0;
  return `${(bps / 100).toFixed(2)}%`;
}

function sourceText(policy?: PlatformFeePolicy | null) {
  const source = String(policy?.source || policy?.scope_type || "");
  if (source === "tenant") return "租户覆盖";
  if (source === "plan") return "套餐费率";
  if (source === "global") return "平台默认";
  if (source === "env") return "环境默认";
  return source || "-";
}

function statusText(value?: string) {
  const status = String(value || "");
  if (status === "active") return "启用";
  if (status === "disabled") return "停用";
  if (status === "trial") return "试用";
  if (status === "expired") return "到期";
  if (status === "suspended") return "暂停";
  return status || "-";
}

function toFen(value?: number | null) {
  return Math.max(0, Math.round((Number(value) || 0) * 100));
}

function fromFen(value?: number | null) {
  return Number(((Number(value) || 0) / 100).toFixed(2));
}

function policyPayload() {
  return {
    fee_bps: Math.round((Number(form.fee_percent) || 0) * 100),
    min_fee_amount: toFen(form.min_fee_yuan),
    max_fee_amount:
      form.max_fee_yuan === null ? null : toFen(form.max_fee_yuan),
    note: form.note.trim()
  };
}

async function loadData() {
  loading.value = true;
  try {
    const data = await platformFeePoliciesApi.overview({ ...filters });
    globalPolicy.value = data.global_policy;
    fallbackPolicy.value = data.fallback_policy;
    plans.value = data.plans || [];
    tenants.value = data.tenants?.items || [];
    tenantTotal.value = data.tenants?.total || 0;
    policies.value = data.policies || [];
  } finally {
    loading.value = false;
  }
}

function search() {
  filters.page = 1;
  loadData();
}

function resetSearch() {
  filters.keyword = "";
  filters.page = 1;
  loadData();
}

function fillForm(policy?: PlatformFeePolicy | null) {
  form.fee_percent = Number(((Number(policy?.fee_bps) || 0) / 100).toFixed(2));
  form.min_fee_yuan = fromFen(policy?.min_fee_amount);
  form.max_fee_yuan =
    policy?.max_fee_amount === null || policy?.max_fee_amount === undefined
      ? null
      : fromFen(policy.max_fee_amount);
  form.note = "";
}

function openGlobal() {
  editTarget.value = "global";
  editTargetId.value = "default";
  editTitle.value = "平台默认费率";
  fillForm(globalPolicy.value || fallbackPolicy.value);
  dialogVisible.value = true;
}

function openPlan(row: PlatformFeePolicyPlan) {
  editTarget.value = "plan";
  editTargetId.value = row.id;
  editTitle.value = `套餐费率：${row.name || row.code}`;
  fillForm(row.fee_policy || row.effective_policy);
  dialogVisible.value = true;
}

function openTenant(row: PlatformFeePolicyTenant) {
  editTarget.value = "tenant";
  editTargetId.value = row.circle_id;
  editTitle.value = `租户覆盖：${row.circle_name || row.circle_id}`;
  fillForm(row.fee_policy || row.effective_policy);
  dialogVisible.value = true;
}

async function submitPolicy() {
  if (!form.note.trim()) {
    ElMessage.warning("请填写调整原因");
    return;
  }
  submitting.value = true;
  try {
    const payload = policyPayload();
    if (editTarget.value === "global") {
      await platformFeePoliciesApi.updateGlobal(payload);
    } else if (editTarget.value === "plan") {
      await platformFeePoliciesApi.updatePlan(editTargetId.value, payload);
    } else {
      await platformFeePoliciesApi.updateTenant(editTargetId.value, payload);
    }
    ElMessage.success("费率策略已保存");
    dialogVisible.value = false;
    await loadData();
  } finally {
    submitting.value = false;
  }
}

async function disablePolicy(policy?: PlatformFeePolicy | null) {
  if (!policy?.id || policy.scope_type === "env") return;
  const result = await ElMessageBox.prompt("请输入停用原因", "停用费率策略", {
    inputPattern: /\S+/,
    inputErrorMessage: "停用原因不能为空",
    confirmButtonText: "停用",
    cancelButtonText: "取消",
    type: "warning"
  });
  await platformFeePoliciesApi.disable(policy.id, {
    note: String(result.value || "").trim()
  });
  ElMessage.success("费率策略已停用");
  await loadData();
}

onMounted(loadData);
</script>

<template>
  <div class="fee-page">
    <div v-loading="loading" class="summary-strip">
      <div class="metric">
        <span>平台默认</span>
        <strong>{{ feePercent(summary.global) }}</strong>
        <em>{{ sourceText(summary.global) }}</em>
      </div>
      <div class="metric">
        <span>套餐策略</span>
        <strong>{{ summary.planCount }}</strong>
        <em>已配置套餐</em>
      </div>
      <div class="metric">
        <span>租户覆盖</span>
        <strong>{{ summary.overrideCount }}</strong>
        <em>当前筛选内</em>
      </div>
      <div class="metric action">
        <span>默认策略</span>
        <el-button type="primary" @click="openGlobal">编辑平台默认</el-button>
      </div>
    </div>

    <section class="panel">
      <div class="panel-title">套餐费率</div>
      <el-table :data="plans" border>
        <el-table-column label="套餐" min-width="170">
          <template #default="{ row }">
            <div class="cell-main">{{ row.name || row.code }}</div>
            <div class="cell-sub">{{ row.code }}</div>
          </template>
        </el-table-column>
        <el-table-column label="月费/年费" width="170">
          <template #default="{ row }">
            <div>{{ yuan(row.price_monthly) }}</div>
            <div class="cell-sub">{{ yuan(row.price_yearly) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="当前费率" width="130">
          <template #default="{ row }">
            <div class="cell-main">{{ feePercent(row.effective_policy) }}</div>
            <div class="cell-sub">{{ sourceText(row.effective_policy) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="最低/最高" width="150">
          <template #default="{ row }">
            <div>{{ yuan(row.effective_policy?.min_fee_amount) }}</div>
            <div class="cell-sub">
              {{
                row.effective_policy?.max_fee_amount === null
                  ? "无上限"
                  : yuan(row.effective_policy?.max_fee_amount)
              }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="170" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openPlan(row)"
              >编辑</el-button
            >
            <el-button
              v-if="row.fee_policy"
              link
              type="warning"
              @click="disablePolicy(row.fee_policy)"
            >
              停用
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <section class="panel">
      <div class="panel-title">租户覆盖</div>
      <div class="filter-bar">
        <el-input
          v-model="filters.keyword"
          class="keyword"
          clearable
          placeholder="搜索圈子、圈主或套餐"
          @keyup.enter="search"
        />
        <el-button type="primary" @click="search">查询</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </div>
      <el-table :data="tenants" border>
        <el-table-column label="租户" min-width="210">
          <template #default="{ row }">
            <div class="cell-main">{{ row.circle_name || row.circle_id }}</div>
            <div class="cell-sub">
              {{ row.owner_nickname || row.owner_dxq_id || "-" }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="套餐" min-width="140">
          <template #default="{ row }">
            <div>{{ row.plan_name || row.plan_code || "-" }}</div>
            <div class="cell-sub">{{ statusText(row.status) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="生效率" width="130">
          <template #default="{ row }">
            <div class="cell-main">{{ feePercent(row.effective_policy) }}</div>
            <div class="cell-sub">{{ sourceText(row.effective_policy) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="租户覆盖" width="130">
          <template #default="{ row }">
            <span v-if="row.fee_policy">{{ feePercent(row.fee_policy) }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="到期" width="170">
          <template #default="{ row }">
            {{ row.paid_until || row.trial_ends_at || "-" }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openTenant(row)"
              >设置覆盖</el-button
            >
            <el-button
              v-if="row.fee_policy"
              link
              type="warning"
              @click="disablePolicy(row.fee_policy)"
            >
              停用
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
          :total="tenantTotal"
          @change="loadData"
        />
      </div>
    </section>

    <section class="panel">
      <div class="panel-title">策略记录</div>
      <el-table :data="policies" border>
        <el-table-column label="策略" min-width="190">
          <template #default="{ row }">
            <div class="cell-main">{{ row.name || row.id }}</div>
            <div class="cell-sub">
              {{ sourceText(row) }} · {{ row.scope_id }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="费率" width="120">
          <template #default="{ row }">{{ feePercent(row) }}</template>
        </el-table-column>
        <el-table-column label="最低/最高" width="150">
          <template #default="{ row }">
            {{ yuan(row.min_fee_amount) }} /
            {{
              row.max_fee_amount === null ? "无上限" : yuan(row.max_fee_amount)
            }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="更新时间" width="170" />
      </el-table>
    </section>

    <el-dialog v-model="dialogVisible" :title="editTitle" width="460px">
      <el-form label-width="110px">
        <el-form-item label="服务费率">
          <el-input-number
            v-model="form.fee_percent"
            :min="0"
            :max="100"
            :precision="2"
            :step="0.5"
            class="full"
          />
        </el-form-item>
        <el-form-item label="最低服务费">
          <el-input-number
            v-model="form.min_fee_yuan"
            :min="0"
            :precision="2"
            :step="0.1"
            class="full"
          />
        </el-form-item>
        <el-form-item label="最高服务费">
          <el-input-number
            v-model="form.max_fee_yuan"
            :min="0"
            :precision="2"
            :step="1"
            class="full"
            placeholder="不填表示无上限"
          />
        </el-form-item>
        <el-form-item label="调整原因">
          <el-input
            v-model="form.note"
            type="textarea"
            :rows="3"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitPolicy">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.fee-page {
  padding: 16px;
}

.summary-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.metric {
  min-height: 88px;
  padding: 14px 16px;
  background: #fff;
  border: 1px solid #e7e2dc;
  border-radius: 8px;
}

.metric span,
.metric em {
  display: block;
  font-size: 13px;
  font-style: normal;
  color: #8a7d71;
}

.metric strong {
  display: block;
  margin: 8px 0;
  font-size: 22px;
  line-height: 1.2;
  color: #211a14;
}

.metric.action {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.panel {
  padding: 14px;
  margin-bottom: 12px;
  background: #fff;
  border: 1px solid #e7e2dc;
  border-radius: 8px;
}

.panel-title {
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 700;
  color: #211a14;
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

.cell-main {
  font-weight: 700;
  color: #221a14;
}

.cell-sub {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.35;
  color: #8f8276;
  word-break: break-all;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.full {
  width: 100%;
}

@media (width <= 960px) {
  .summary-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (width <= 640px) {
  .summary-strip {
    grid-template-columns: 1fr;
  }

  .keyword {
    width: 100%;
  }
}
</style>
