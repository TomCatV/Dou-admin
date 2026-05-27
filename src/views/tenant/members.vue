<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { tenantApi, type TenantMember } from "@/api/admin";

defineOptions({ name: "TenantMembers" });

const loading = ref(false);
const rows = ref<TenantMember[]>([]);
const total = ref(0);
const filters = reactive({ keyword: "", role: "", page: 1, page_size: 20 });

async function loadList() {
  loading.value = true;
  try {
    const data = await tenantApi.members({ ...filters });
    rows.value = data.items;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

function resetSearch() {
  filters.keyword = "";
  filters.role = "";
  filters.page = 1;
  loadList();
}

onMounted(loadList);
</script>

<template>
  <div class="tenant-list-page">
    <div class="filter-bar">
      <el-input v-model="filters.keyword" class="keyword" clearable placeholder="搜索昵称、抖小圈号或用户ID" @keyup.enter="loadList" />
      <el-select v-model="filters.role" class="filter-item" clearable placeholder="角色">
        <el-option label="圈主" value="owner" />
        <el-option label="管理员" value="admin" />
        <el-option label="成员" value="member" />
      </el-select>
      <el-button type="primary" @click="loadList">查询</el-button>
      <el-button @click="resetSearch">重置</el-button>
    </div>
    <el-table v-loading="loading" :data="rows" border>
      <el-table-column label="成员" min-width="220">
        <template #default="{ row }">
          <div class="main">{{ row.nickname || "-" }}</div>
          <div class="sub">{{ row.dxq_id || row.user_id }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="role" label="角色" width="120" />
      <el-table-column prop="user_status" label="账号状态" width="120" />
      <el-table-column prop="mute_until" label="禁言到期" width="170" />
      <el-table-column prop="joined_at" label="加入时间" width="170" />
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
  flex-wrap: wrap;
  gap: 10px;
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
