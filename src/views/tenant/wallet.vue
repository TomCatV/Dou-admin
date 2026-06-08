<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { hasPerms } from "@/utils/auth";
import { tenantApi, type TenantContext } from "@/api/admin";
import {
  getSelectedTenantCircleId,
  setSelectedTenantCircleId
} from "@/utils/tenantContext";

defineOptions({ name: "TenantWallet" });

const loading = ref(false);
const submitting = ref(false);
const data = ref<Record<string, any>>({});
const tenantContext = ref<TenantContext | null>(null);
const selectedCircleId = ref(getSelectedTenantCircleId());
const form = reactive({ amount_yuan: "", remark: "" });
const canWithdraw = computed(() => hasPerms("tenant:wallet:withdraw"));
const feePolicy = computed(() => data.value.fee_policy || null);
const feeUpgrade = computed(() => data.value.fee_policy_upgrade || null);
const currentCircle = computed(() => tenantContext.value?.current_circle || null);

function yuan(value?: number) {
  return `¥${((Number(value) || 0) / 100).toFixed(2)}`;
}

function percentBps(value?: number) {
  return `${((Number(value) || 0) / 100).toFixed(2)}%`;
}

function feeSourceLabel(source?: string) {
  return (
    {
      tenant: "专属费率",
      plan: "套餐费率",
      global: "平台默认",
      env: "系统默认"
    }[String(source || "")] || "当前策略"
  );
}

function savingPerHundred(value?: number) {
  return yuan(Math.floor((10000 * (Number(value) || 0)) / 10000));
}

async function loadTenantContext() {
  try {
    const context = await tenantApi.context();
    const circles = context.circles || [];
    let nextSelected = selectedCircleId.value || context.selected_circle_id;
    if (!circles.some(item => item.id === nextSelected)) {
      nextSelected = context.selected_circle_id || circles[0]?.id || "";
    }
    if (nextSelected) {
      setSelectedTenantCircleId(nextSelected);
      selectedCircleId.value = nextSelected;
    }
    const nextCircle =
      circles.find(item => item.id === nextSelected) ||
      context.current_circle ||
      null;
    tenantContext.value = {
      ...context,
      can_enter: Boolean(nextCircle),
      selected_circle_id: nextSelected,
      current_circle: nextCircle
    };
    return Boolean(nextCircle);
  } catch (error) {
    tenantContext.value = {
      can_enter: false,
      message: error instanceof Error ? error.message : "当前账号暂无可经营圈子",
      selected_circle_id: "",
      current_circle: null,
      circles: []
    };
    return false;
  }
}

async function loadData() {
  loading.value = true;
  try {
    const canEnter = await loadTenantContext();
    if (!canEnter) {
      data.value = {};
      return;
    }
    data.value = await tenantApi.wallet();
  } finally {
    loading.value = false;
  }
}

async function switchTenantCircle(value: string) {
  setSelectedTenantCircleId(value);
  selectedCircleId.value = value;
  await loadData();
}

async function submitWithdrawal() {
  if (!canWithdraw.value) {
    ElMessage.warning("当前账号没有发起提现权限");
    return;
  }
  const amount = Math.round(Number(form.amount_yuan || 0) * 100);
  if (!amount) {
    ElMessage.warning("请输入提现金额");
    return;
  }
  submitting.value = true;
  try {
    await tenantApi.createWithdrawal({ amount, remark: form.remark });
    ElMessage.success("提现申请已提交");
    form.amount_yuan = "";
    form.remark = "";
    await loadData();
  } finally {
    submitting.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <div v-loading="loading" class="tenant-page">
    <div class="page-head">
      <div>
        <h1>钱包与提现</h1>
        <p>查看当前经营圈子的可提现余额、结算进度和最近提现申请。</p>
      </div>
      <div class="head-actions">
        <el-select
          v-if="tenantContext?.circles?.length"
          v-model="selectedCircleId"
          class="circle-switch"
          placeholder="选择经营圈子"
          @change="switchTenantCircle"
        >
          <el-option
            v-for="item in tenantContext.circles"
            :key="item.id"
            :label="item.name || item.circle_code || item.id"
            :value="item.id"
          />
        </el-select>
        <el-button type="primary" @click="loadData">刷新</el-button>
      </div>
    </div>

    <el-alert
      v-if="tenantContext && !tenantContext.can_enter"
      class="mb"
      type="warning"
      show-icon
      :closable="false"
      :title="tenantContext.message || '当前账号还没有可经营的圈子上下文。'"
      description="请先确认后台账号已绑定到微信小程序注册的圈主用户，并且该用户名下至少有一个活跃圈子。"
    />

    <el-alert
      v-else-if="currentCircle"
      class="mb"
      type="info"
      show-icon
      :closable="false"
      :title="`当前经营圈子：${currentCircle.name || currentCircle.circle_code || currentCircle.id}`"
      description="余额、提现和结算明细都会按当前选中的圈子上下文展示。"
    />

    <el-row :gutter="16">
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="metric">
          <span>可提现</span
          ><strong>{{ yuan(data.wallet?.available_amount) }}</strong>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="metric">
          <span>结算中</span
          ><strong>{{ yuan(data.wallet?.pending_amount) }}</strong>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="metric">
          <span>提现中</span
          ><strong>{{ yuan(data.wallet?.withdrawing_amount) }}</strong>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="metric income">
          <span>累计收入</span
          ><strong>{{ yuan(data.wallet?.lifetime_income_amount) }}</strong>
        </div>
      </el-col>
    </el-row>

    <div v-if="feePolicy" class="panel fee-panel mt">
      <div class="fee-main">
        <div>
          <span>当前交易服务费</span>
          <strong>{{ percentBps(feePolicy.fee_bps) }}</strong>
          <em
            >{{
              feeSourceLabel(feePolicy.source)
            }}生效，仅影响后续新订单结算。</em
          >
        </div>
        <div v-if="feeUpgrade" class="upgrade-hint">
          <span
            >{{ feeUpgrade.action_label || "升级"
            }}{{ feeUpgrade.plan.name }}后费率
            {{ percentBps(feeUpgrade.fee_policy.fee_bps) }}</span
          >
          <strong
            >每成交 ¥100 预计少扣
            {{ savingPerHundred(feeUpgrade.save_bps) }}</strong
          >
        </div>
        <div v-else class="upgrade-empty">当前暂无更低费率套餐建议。</div>
      </div>
    </div>

    <el-row :gutter="16" class="mt">
      <el-col :xs="24" :lg="10">
        <div class="panel">
          <h2>提现申请</h2>
          <el-alert
            v-if="!canWithdraw"
            class="mb"
            type="info"
            show-icon
            :closable="false"
            title="当前账号可查看钱包，但不能发起提现。"
          />
          <el-form label-width="80px">
            <el-form-item label="金额">
              <el-input
                v-model="form.amount_yuan"
                :disabled="!canWithdraw"
                placeholder="单位：元"
              />
            </el-form-item>
            <el-form-item label="备注">
              <el-input
                v-model="form.remark"
                :disabled="!canWithdraw"
                maxlength="80"
              />
            </el-form-item>
            <el-button
              type="primary"
              :disabled="!canWithdraw"
              :loading="submitting"
              @click="submitWithdrawal"
              >提交提现</el-button
            >
          </el-form>
        </div>
      </el-col>
      <el-col :xs="24" :lg="14">
        <div class="panel">
          <h2>最近提现</h2>
          <el-table :data="data.withdrawals || []" border>
            <el-table-column prop="id" label="提现单" min-width="180" />
            <el-table-column label="金额" width="120">
              <template #default="{ row }">{{ yuan(row.amount) }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="130" />
            <el-table-column prop="requested_at" label="申请时间" width="170" />
          </el-table>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.tenant-page {
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
  margin: 0 0 12px;
  color: #221a14;
}

.page-head p {
  margin: 6px 0 0;
  color: #766b61;
}

.head-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.circle-switch {
  width: 220px;
}

.metric,
.panel {
  padding: 18px;
  background: #fffdf9;
  border: 1px solid #e6ddd2;
  border-radius: 8px;
}

.metric span {
  color: #766b61;
}

.metric strong {
  display: block;
  margin-top: 8px;
  font-size: 28px;
}

.metric.income strong {
  color: #16794c;
}

.fee-main {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
}

.fee-main span,
.fee-main em {
  display: block;
  font-style: normal;
  color: #766b61;
}

.fee-main strong {
  display: block;
  margin-top: 8px;
  font-size: 24px;
  color: #221a14;
}

.upgrade-hint,
.upgrade-empty {
  min-width: 240px;
  padding: 12px;
  background: #fff7e8;
  border: 1px solid #f0d5a8;
  border-radius: 8px;
}

.upgrade-hint span {
  color: #8a6125;
}

.upgrade-hint strong {
  font-size: 16px;
  color: #4f3a1b;
}

.upgrade-empty {
  color: #8f8276;
  background: #fff;
  border-color: #efe6db;
}

.mt {
  margin-top: 16px;
}

.mb {
  margin-bottom: 12px;
}

@media (width <= 768px) {
  .page-head,
  .head-actions,
  .fee-main {
    flex-direction: column;
    align-items: stretch;
  }

  .circle-switch {
    width: 100%;
  }
}
</style>
