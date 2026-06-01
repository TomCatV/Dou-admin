<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { tenantConversionApi, type TenantConversionSummary } from "@/api/admin";

defineOptions({ name: "TenantConversionFunnel" });

const loading = ref(false);
const summary = ref<TenantConversionSummary | null>(null);

const stages = computed(() => {
  const f = summary.value?.funnel || {};
  return [
    { key: "exposure", label: "曝光", value: f.exposure || 0 },
    { key: "leads", label: "留资", value: f.leads || 0 },
    { key: "contacted", label: "触达", value: f.contacted || 0 },
    { key: "converted", label: "转化", value: f.converted || 0 },
    { key: "paid", label: "成交", value: f.paid || 0 }
  ];
});

function rate(index: number) {
  if (index === 0) return "100%";
  const prev = stages.value[index - 1]?.value || 0;
  const cur = stages.value[index]?.value || 0;
  if (!prev) return "0%";
  return `${Math.round((cur / prev) * 100)}%`;
}

function yuan(value?: number) {
  return `¥${((Number(value) || 0) / 100).toFixed(2)}`;
}

async function loadData() {
  loading.value = true;
  try {
    summary.value = await tenantConversionApi.summary();
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <div v-loading="loading" class="tenant-page">
    <div class="page-head">
      <h1>转化漏斗</h1>
      <el-button type="primary" @click="loadData">刷新</el-button>
    </div>

    <el-row :gutter="16">
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="metric">
          <span>线索总数</span><strong>{{ summary?.leads.total || 0 }}</strong>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="metric">
          <span>新线索</span><strong>{{ summary?.leads.new || 0 }}</strong>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="metric">
          <span>高意向</span
          ><strong>{{ summary?.leads.high_intent || 0 }}</strong>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="metric">
          <span>已转化</span
          ><strong>{{ summary?.leads.converted || 0 }}</strong>
        </div>
      </el-col>
    </el-row>

    <div class="panel mt">
      <div v-for="(stage, index) in stages" :key="stage.key" class="funnel-row">
        <div>
          <strong>{{ stage.label }}</strong>
          <span>阶段转化 {{ rate(index) }}</span>
        </div>
        <el-progress
          :percentage="Math.min(100, stage.value ? 100 : 0)"
          :show-text="false"
        />
        <b>{{ stage.value }}</b>
      </div>
    </div>

    <el-row :gutter="16" class="mt">
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="panel">
          <h2>标签</h2>
          <strong>{{ summary?.tools.tags || 0 }}</strong>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="panel">
          <h2>有效优惠券</h2>
          <strong>{{ summary?.tools.active_coupons || 0 }}</strong>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="panel">
          <h2>有效活动</h2>
          <strong>{{ summary?.tools.active_campaigns || 0 }}</strong>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="panel">
          <h2>归因成交</h2>
          <strong>{{ summary?.attribution?.attributed_orders || 0 }}</strong>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6" class="mt">
        <div class="panel">
          <h2>优惠订单</h2>
          <strong>{{ summary?.attribution?.coupon_orders || 0 }}</strong>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6" class="mt">
        <div class="panel">
          <h2>邀请码订单</h2>
          <strong>{{ summary?.attribution?.invite_orders || 0 }}</strong>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6" class="mt">
        <div class="panel">
          <h2>优惠抵扣</h2>
          <strong>{{
            yuan(summary?.attribution?.discount_amount || 0)
          }}</strong>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6" class="mt">
        <div class="panel">
          <h2>归因成交额</h2>
          <strong>{{ yuan(summary?.attribution?.payable_amount || 0) }}</strong>
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
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.page-head h1 {
  margin: 0;
  color: #221a14;
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

.mt {
  margin-top: 16px;
}

.funnel-row {
  display: grid;
  grid-template-columns: 160px 1fr 80px;
  gap: 14px;
  align-items: center;
  padding: 12px 0;
  border-top: 1px solid #efe6db;
}

.funnel-row span {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #8f8276;
}

.panel h2 {
  margin: 0 0 10px;
  font-size: 16px;
  color: #221a14;
}
</style>
