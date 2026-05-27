<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { tenantApi, type TenantAfterSale, type TenantOrder } from "@/api/admin";

defineOptions({ name: "TenantOrders" });

const activeTab = ref("orders");
const loading = ref(false);
const orders = ref<TenantOrder[]>([]);
const afterSales = ref<TenantAfterSale[]>([]);
const total = ref(0);
const filters = reactive({ keyword: "", status: "", page: 1, page_size: 20 });

function yuan(value: number) {
  return `¥${((Number(value) || 0) / 100).toFixed(2)}`;
}

async function loadList() {
  loading.value = true;
  try {
    if (activeTab.value === "orders") {
      const data = await tenantApi.orders({ ...filters });
      orders.value = data.items;
      total.value = data.total;
    } else {
      const data = await tenantApi.afterSales({ status: filters.status, page: filters.page, page_size: filters.page_size });
      afterSales.value = data.items;
      total.value = data.total;
    }
  } finally {
    loading.value = false;
  }
}

function switchTab() {
  filters.page = 1;
  filters.status = "";
  loadList();
}

onMounted(loadList);
</script>

<template>
  <div class="tenant-list-page">
    <el-tabs v-model="activeTab" @tab-change="switchTab">
      <el-tab-pane label="订单" name="orders" />
      <el-tab-pane label="售后" name="after-sales" />
    </el-tabs>
    <div class="filter-bar">
      <el-input v-if="activeTab === 'orders'" v-model="filters.keyword" class="keyword" clearable placeholder="搜索订单、用户或资源" @keyup.enter="loadList" />
      <el-select v-model="filters.status" class="filter-item" clearable placeholder="状态">
        <template v-if="activeTab === 'orders'">
          <el-option label="待支付" value="created" />
          <el-option label="已支付" value="paid" />
          <el-option label="已退款" value="refunded" />
        </template>
        <template v-else>
          <el-option label="处理中" value="open" />
          <el-option label="已退款" value="refunded" />
          <el-option label="已拒绝" value="rejected" />
          <el-option label="已关闭" value="closed" />
        </template>
      </el-select>
      <el-button type="primary" @click="loadList">查询</el-button>
    </div>

    <el-table v-if="activeTab === 'orders'" v-loading="loading" :data="orders" border>
      <el-table-column label="订单" min-width="220">
        <template #default="{ row }">
          <div class="main">{{ row.resource_title || row.room_name || row.id }}</div>
          <div class="sub">{{ row.id }}</div>
        </template>
      </el-table-column>
      <el-table-column label="买家" min-width="150">
        <template #default="{ row }">{{ row.buyer_nickname || row.buyer_dxq_id || "-" }}</template>
      </el-table-column>
      <el-table-column label="金额" width="120">
        <template #default="{ row }">{{ yuan(row.amount) }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="110" />
      <el-table-column prop="created_at" label="创建时间" width="170" />
    </el-table>

    <el-table v-else v-loading="loading" :data="afterSales" border>
      <el-table-column label="售后" min-width="220">
        <template #default="{ row }">
          <div class="main">{{ row.resource_title || row.id }}</div>
          <div class="sub">{{ row.description || "-" }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="buyer_nickname" label="买家" min-width="140" />
      <el-table-column prop="complaint_type" label="类型" width="130" />
      <el-table-column prop="status" label="状态" width="110" />
      <el-table-column label="退款" width="120">
        <template #default="{ row }">{{ yuan(row.refund_amount) }}</template>
      </el-table-column>
      <el-table-column prop="updated_at" label="更新时间" width="170" />
    </el-table>

    <div class="pagination">
      <el-pagination v-model:current-page="filters.page" v-model:page-size="filters.page_size" layout="total, sizes, prev, pager, next" :page-sizes="[10,20,50,100]" :total="total" @change="loadList" />
    </div>
  </div>
</template>

<style scoped>
.tenant-list-page {
  padding: 16px;
}
.filter-bar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.keyword {
  width: 300px;
}
.filter-item {
  width: 140px;
}
.main {
  font-weight: 700;
  color: #221a14;
}
.sub {
  color: #8f8276;
  font-size: 12px;
}
.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
