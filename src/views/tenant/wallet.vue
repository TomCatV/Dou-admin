<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { tenantApi } from "@/api/admin";

defineOptions({ name: "TenantWallet" });

const loading = ref(false);
const submitting = ref(false);
const data = ref<Record<string, any>>({});
const form = reactive({ amount_yuan: "", remark: "" });

function yuan(value?: number) {
  return `¥${((Number(value) || 0) / 100).toFixed(2)}`;
}

async function loadData() {
  loading.value = true;
  try {
    data.value = await tenantApi.wallet();
  } finally {
    loading.value = false;
  }
}

async function submitWithdrawal() {
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
  <div class="tenant-page" v-loading="loading">
    <div class="page-head">
      <h1>钱包与提现</h1>
      <el-button type="primary" @click="loadData">刷新</el-button>
    </div>

    <el-row :gutter="16">
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="metric"><span>可提现</span><strong>{{ yuan(data.wallet?.available_amount) }}</strong></div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="metric"><span>结算中</span><strong>{{ yuan(data.wallet?.pending_amount) }}</strong></div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="metric"><span>提现中</span><strong>{{ yuan(data.wallet?.withdrawing_amount) }}</strong></div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="metric income"><span>累计收入</span><strong>{{ yuan(data.wallet?.lifetime_income_amount) }}</strong></div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mt">
      <el-col :xs="24" :lg="10">
        <div class="panel">
          <h2>提现申请</h2>
          <el-form label-width="80px">
            <el-form-item label="金额">
              <el-input v-model="form.amount_yuan" placeholder="单位：元" />
            </el-form-item>
            <el-form-item label="备注">
              <el-input v-model="form.remark" maxlength="80" />
            </el-form-item>
            <el-button type="primary" :loading="submitting" @click="submitWithdrawal">提交提现</el-button>
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
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.page-head h1,
.panel h2 {
  margin: 0 0 12px;
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
.metric.income strong {
  color: #16794c;
}
.mt {
  margin-top: 16px;
}
</style>
