<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { auditLogsApi } from "@/api/admin";
import { readableChangeRows } from "@/utils/readableDetail";

defineOptions({
  name: "AuditLogs"
});

const loading = ref(false);
const rows = ref<Record<string, any>[]>([]);
const total = ref(0);
const filters = reactive({
  action: "",
  target_type: "",
  page: 1,
  page_size: 20
});

async function loadList() {
  loading.value = true;
  try {
    const data = await auditLogsApi.list({ ...filters });
    rows.value = data.items;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

function resetSearch() {
  filters.action = "";
  filters.target_type = "";
  filters.page = 1;
  loadList();
}

onMounted(loadList);
</script>

<template>
  <div class="audit-page">
    <div class="filter-bar">
      <el-input
        v-model="filters.action"
        class="filter-item"
        clearable
        placeholder="动作"
      />
      <el-input
        v-model="filters.target_type"
        class="filter-item"
        clearable
        placeholder="对象类型"
      />
      <el-button type="primary" @click="loadList">查询</el-button>
      <el-button @click="resetSearch">重置</el-button>
    </div>

    <el-table v-loading="loading" :data="rows" border>
      <el-table-column prop="created_at" label="时间" width="170" />
      <el-table-column prop="admin_username" label="管理员" width="140" />
      <el-table-column prop="action" label="动作" width="150" />
      <el-table-column prop="target_type" label="对象类型" width="130" />
      <el-table-column
        prop="target_id"
        label="对象ID"
        min-width="220"
        show-overflow-tooltip
      />
      <el-table-column
        prop="summary"
        label="摘要"
        min-width="220"
        show-overflow-tooltip
      />
      <el-table-column label="详情" width="90">
        <template #default="{ row }">
          <el-popover width="420" trigger="click">
            <div v-if="readableChangeRows(row.detail).length" class="info-list">
              <div
                v-for="item in readableChangeRows(row.detail)"
                :key="item.label"
                class="info-row"
              >
                <span>{{ item.label }}</span>
                <strong :class="{ long: item.long }">{{ item.value }}</strong>
              </div>
            </div>
            <span v-else>暂无更多详情</span>
            <template #reference>
              <el-button link type="primary">查看</el-button>
            </template>
          </el-popover>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="filters.page"
        v-model:page-size="filters.page_size"
        layout="total, sizes, prev, pager, next"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        @change="loadList"
      />
    </div>
  </div>
</template>

<style scoped>
.audit-page {
  padding: 16px;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.filter-item {
  width: 180px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.info-list {
  display: grid;
  gap: 8px;
  max-height: 360px;
  overflow: auto;
}

.info-row {
  display: grid;
  grid-template-columns: 82px 1fr;
  gap: 10px;
  align-items: start;
}

.info-row span {
  color: #8f8276;
}

.info-row strong {
  font-weight: 500;
  color: #221a14;
  word-break: break-word;
}

.info-row .long {
  white-space: pre-wrap;
}
</style>
