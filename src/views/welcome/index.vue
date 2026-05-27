<script setup lang="ts">
import { onMounted, ref } from "vue";
import { dashboardApi, type DashboardSummary } from "@/api/admin";

defineOptions({
  name: "Dashboard"
});

const loading = ref(false);
const summary = ref<DashboardSummary>({
  reports: { pending: 0, processed: 0, rejected: 0, total: 0 },
  content: {
    users: 0,
    banned_users: 0,
    active_circles: 0,
    hidden_messages: 0,
    published_resource_cards: 0
  },
  finance: {
    open_after_sales: 0,
    pending_withdrawals: 0
  }
});

async function loadSummary() {
  loading.value = true;
  try {
    summary.value = await dashboardApi.summary();
  } finally {
    loading.value = false;
  }
}

onMounted(loadSummary);
</script>

<template>
  <div class="dashboard-page" v-loading="loading">
    <div class="page-head">
      <div>
        <h1>平台治理工作台</h1>
        <p>举报、内容状态和管理员操作的第一阶段管理入口。</p>
      </div>
      <el-button type="primary" @click="loadSummary">刷新</el-button>
    </div>

    <el-row :gutter="16">
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="metric urgent">
          <span>待处理举报</span>
          <strong>{{ summary.reports.pending }}</strong>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="metric">
          <span>举报总数</span>
          <strong>{{ summary.reports.total }}</strong>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="metric">
          <span>活跃圈子</span>
          <strong>{{ summary.content.active_circles }}</strong>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="metric">
          <span>注册用户</span>
          <strong>{{ summary.content.users }}</strong>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="metric urgent">
          <span>待处理售后</span>
          <strong>{{ summary.finance?.open_after_sales || 0 }}</strong>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="metric urgent">
          <span>待审核提现</span>
          <strong>{{ summary.finance?.pending_withdrawals || 0 }}</strong>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mt-4">
      <el-col :xs="24" :lg="12">
        <div class="panel">
          <h2>举报处理</h2>
          <div class="status-line">
            <span>已处理</span>
            <strong>{{ summary.reports.processed }}</strong>
          </div>
          <div class="status-line">
            <span>已驳回</span>
            <strong>{{ summary.reports.rejected }}</strong>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :lg="12">
        <div class="panel">
          <h2>内容治理</h2>
          <div class="status-line">
            <span>封禁用户</span>
            <strong>{{ summary.content.banned_users }}</strong>
          </div>
          <div class="status-line">
            <span>隐藏消息</span>
            <strong>{{ summary.content.hidden_messages }}</strong>
          </div>
          <div class="status-line">
            <span>已发布资源卡</span>
            <strong>{{ summary.content.published_resource_cards }}</strong>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.dashboard-page {
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
.status-line span {
  color: #766b61;
}

.metric strong {
  display: block;
  margin-top: 8px;
  font-size: 30px;
  color: #221a14;
}

.metric.urgent strong {
  color: #b54708;
}

.panel h2 {
  margin: 0 0 12px;
  font-size: 16px;
}

.status-line {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-top: 1px solid #efe6db;
}

.mt-4 {
  margin-top: 16px;
}
</style>
