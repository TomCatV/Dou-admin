<script setup lang="ts">
import { onMounted, ref } from "vue";
import { tenantApi, type TenantDashboard } from "@/api/admin";

defineOptions({ name: "TenantDashboard" });

const loading = ref(false);
const data = ref<TenantDashboard | null>(null);

function yuan(value?: number) {
  return `¥${((Number(value) || 0) / 100).toFixed(2)}`;
}

async function loadData() {
  loading.value = true;
  try {
    data.value = await tenantApi.dashboard();
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <div class="tenant-page" v-loading="loading">
    <div class="page-head">
      <div>
        <h1>{{ data?.circle?.name || "圈主工作台" }}</h1>
        <p>{{ data?.circle?.description || "查看本圈经营、内容、订单和钱包概览。" }}</p>
      </div>
      <el-button type="primary" @click="loadData">刷新</el-button>
    </div>

    <el-row :gutter="16">
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="metric">
          <span>成员</span>
          <strong>{{ data?.metrics.members || 0 }}</strong>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="metric">
          <span>资源卡</span>
          <strong>{{ data?.metrics.resources || 0 }}</strong>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="metric">
          <span>已支付订单</span>
          <strong>{{ data?.metrics.paid_orders || 0 }}</strong>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="metric income">
          <span>成交金额</span>
          <strong>{{ yuan(data?.metrics.revenue_amount) }}</strong>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mt">
      <el-col :xs="24" :lg="12">
        <div class="panel">
          <h2>内容与售后</h2>
          <div class="line"><span>已发布资源</span><strong>{{ data?.metrics.published_resources || 0 }}</strong></div>
          <div class="line"><span>待处理售后</span><strong>{{ data?.metrics.open_after_sales || 0 }}</strong></div>
          <div class="line"><span>待处理举报</span><strong>{{ data?.metrics.reports_pending || 0 }}</strong></div>
        </div>
      </el-col>
      <el-col :xs="24" :lg="12">
        <div class="panel">
          <h2>钱包</h2>
          <div class="line"><span>可提现</span><strong>{{ yuan(data?.wallet.available_amount) }}</strong></div>
          <div class="line"><span>结算中</span><strong>{{ yuan(data?.wallet.pending_amount) }}</strong></div>
          <div class="line"><span>累计收入</span><strong>{{ yuan(data?.wallet.lifetime_income_amount) }}</strong></div>
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
  gap: 16px;
  margin-bottom: 16px;
}

.page-head h1 {
  margin: 0;
  font-size: 22px;
  color: #221a14;
}

.page-head p {
  margin: 6px 0 0;
  color: #766b61;
}

.metric,
.panel {
  padding: 18px;
  background: #fffdf9;
  border: 1px solid #e6ddd2;
  border-radius: 8px;
}

.metric span,
.line span {
  color: #766b61;
}

.metric strong {
  display: block;
  margin-top: 8px;
  color: #221a14;
  font-size: 28px;
}

.metric.income strong {
  color: #16794c;
}

.panel h2 {
  margin: 0 0 12px;
  font-size: 16px;
}

.line {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-top: 1px solid #efe6db;
}

.mt {
  margin-top: 16px;
}
</style>
