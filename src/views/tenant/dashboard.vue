<script setup lang="ts">
import { onMounted, ref } from "vue";
import { tenantApi, type TenantDashboard } from "@/api/admin";

defineOptions({ name: "TenantDashboard" });

const loading = ref(false);
const data = ref<TenantDashboard | null>(null);

function yuan(value?: number) {
  return `¥${((Number(value) || 0) / 100).toFixed(2)}`;
}

function statusLabel(status?: string) {
  return (
    {
      none: "未开通",
      trial: "试用中",
      active: "已开通",
      expired: "已到期",
      suspended: "已暂停"
    }[String(status || "none")] || status
  );
}

function statusType(status?: string) {
  if (status === "active") return "success";
  if (status === "trial") return "warning";
  if (status === "expired" || status === "suspended") return "danger";
  return "info";
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
          <div class="panel-title">
            <h2>套餐订阅</h2>
            <el-tag :type="statusType(data?.subscription_status?.status)">
              {{ statusLabel(data?.subscription_status?.status) }}
            </el-tag>
          </div>
          <div class="line">
            <span>当前套餐</span>
            <strong>{{ data?.subscription?.plan_name || "未开通套餐" }}</strong>
          </div>
          <div class="line">
            <span>服务到期</span>
            <strong>{{ data?.subscription_status?.paid_until || "-" }}</strong>
          </div>
          <div class="line">
            <span>租户状态</span>
            <strong>{{ statusLabel(data?.subscription?.status) }}</strong>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :lg="12">
        <div class="panel">
          <h2>当前用量</h2>
          <div class="usage-grid">
            <div>
              <span>成员</span>
              <strong>{{ data?.usage?.members || 0 }}</strong>
            </div>
            <div>
              <span>子账号</span>
              <strong>{{ data?.usage?.staff_accounts || 0 }}</strong>
            </div>
            <div>
              <span>资源卡</span>
              <strong>{{ data?.usage?.resource_cards || 0 }}</strong>
            </div>
            <div>
              <span>线索</span>
              <strong>{{ data?.usage?.leads || 0 }}</strong>
            </div>
          </div>
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

.panel-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.panel-title h2 {
  margin: 0 0 12px;
}

.line {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-top: 1px solid #efe6db;
}

.usage-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.usage-grid div {
  min-height: 74px;
  padding: 12px;
  background: #ffffff;
  border: 1px solid #efe6db;
  border-radius: 8px;
}

.usage-grid span {
  display: block;
  color: #766b61;
}

.usage-grid strong {
  display: block;
  margin-top: 8px;
  color: #221a14;
  font-size: 20px;
}

.mt {
  margin-top: 16px;
}

@media (max-width: 768px) {
  .usage-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
