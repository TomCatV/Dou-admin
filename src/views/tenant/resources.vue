<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { tenantApi, type ManagedResourceCard } from "@/api/admin";

defineOptions({ name: "TenantResources" });

const loading = ref(false);
const rows = ref<ManagedResourceCard[]>([]);
const total = ref(0);
const filters = reactive({ keyword: "", status: "", page: 1, page_size: 20 });

function yuan(value: number) {
  return `¥${((Number(value) || 0) / 100).toFixed(2)}`;
}

async function loadList() {
  loading.value = true;
  try {
    const data = await tenantApi.resourceCards({ ...filters });
    rows.value = data.items;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

onMounted(loadList);
</script>

<template>
  <div class="tenant-list-page">
    <div class="filter-bar">
      <el-input v-model="filters.keyword" class="keyword" clearable placeholder="搜索资源标题或简介" @keyup.enter="loadList" />
      <el-select v-model="filters.status" class="filter-item" clearable placeholder="状态">
        <el-option label="草稿" value="draft" />
        <el-option label="已发布" value="published" />
        <el-option label="已下架" value="offline" />
        <el-option label="已禁用" value="disabled" />
      </el-select>
      <el-button type="primary" @click="loadList">查询</el-button>
    </div>
    <el-table v-loading="loading" :data="rows" border>
      <el-table-column label="资源" min-width="260">
        <template #default="{ row }">
          <div class="main">{{ row.title }}</div>
          <div class="sub">{{ row.summary || "-" }}</div>
        </template>
      </el-table-column>
      <el-table-column label="价格" width="120">
        <template #default="{ row }">{{ yuan(row.price) }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="110" />
      <el-table-column prop="audit_status" label="审核" width="110" />
      <el-table-column prop="purchase_count" label="销量" width="100" />
      <el-table-column label="收入" width="130">
        <template #default="{ row }">{{ yuan(row.revenue_amount || 0) }}</template>
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
