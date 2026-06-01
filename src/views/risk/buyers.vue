<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import {
  buyerRiskApi,
  type BuyerRiskLevel,
  type BuyerRiskProfile
} from "@/api/admin";
import { buyerRiskLevelMap } from "@/utils/labels";

defineOptions({
  name: "BuyerRiskProfiles"
});

type TagType = "primary" | "success" | "warning" | "danger" | "info";

const loading = ref(false);
const submitting = ref(false);
const rows = ref<BuyerRiskProfile[]>([]);
const total = ref(0);
const dialogVisible = ref(false);
const editingId = ref("");

const filters = reactive({
  keyword: "",
  risk_level: "",
  page: 1,
  page_size: 20
});

const form = reactive({
  user_id: "",
  buyer_contact: "",
  risk_level: "watch" as BuyerRiskLevel,
  blocked_until: "",
  reason: "售后或退款行为异常，平台人工风控",
  note: ""
});

function metaOf<T extends Record<string, { label: string; type: string }>>(
  map: T,
  value?: string
) {
  return (map[value as keyof T] || { label: value || "-", type: "info" }) as {
    label: string;
    type: TagType;
  };
}

function resetForm() {
  editingId.value = "";
  form.user_id = "";
  form.buyer_contact = "";
  form.risk_level = "watch";
  form.blocked_until = "";
  form.reason = "售后或退款行为异常，平台人工风控";
  form.note = "";
}

async function loadList() {
  loading.value = true;
  try {
    const data = await buyerRiskApi.list({ ...filters });
    rows.value = data.items;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

function search() {
  filters.page = 1;
  loadList();
}

function resetSearch() {
  filters.keyword = "";
  filters.risk_level = "";
  filters.page = 1;
  loadList();
}

function openCreate() {
  resetForm();
  dialogVisible.value = true;
}

function openEdit(row: BuyerRiskProfile) {
  editingId.value = row.id;
  form.user_id = row.user_id || "";
  form.buyer_contact = "";
  form.risk_level = row.risk_level;
  form.blocked_until = row.blocked_until || "";
  form.reason = row.reason || "售后或退款行为异常，平台人工风控";
  form.note = row.note || "";
  dialogVisible.value = true;
}

async function submitForm() {
  if (!editingId.value && !form.user_id.trim() && !form.buyer_contact.trim()) {
    ElMessage.warning("请填写买家用户ID或下单联系方式");
    return;
  }
  if (!form.reason.trim()) {
    ElMessage.warning("请填写风控原因");
    return;
  }
  submitting.value = true;
  try {
    const payload = {
      user_id: form.user_id.trim(),
      buyer_contact: form.buyer_contact.trim(),
      risk_level: form.risk_level,
      blocked_until: form.blocked_until || null,
      reason: form.reason.trim(),
      note: form.note.trim()
    };
    if (editingId.value) {
      await buyerRiskApi.update(editingId.value, payload);
    } else {
      await buyerRiskApi.create(payload);
    }
    ElMessage.success("买家风控档案已保存");
    dialogVisible.value = false;
    await loadList();
  } finally {
    submitting.value = false;
  }
}

onMounted(loadList);
</script>

<template>
  <div class="risk-page">
    <div class="filter-bar">
      <el-input
        v-model="filters.keyword"
        class="keyword"
        clearable
        placeholder="搜索买家ID、联系方式掩码、原因或备注"
        @keyup.enter="search"
      />
      <el-select
        v-model="filters.risk_level"
        class="filter-item"
        clearable
        placeholder="风险等级"
      >
        <el-option label="正常" value="normal" />
        <el-option label="观察" value="watch" />
        <el-option label="黑名单" value="blocked" />
      </el-select>
      <el-button type="primary" @click="search">查询</el-button>
      <el-button @click="resetSearch">重置</el-button>
      <el-button type="success" @click="openCreate">新增档案</el-button>
    </div>

    <el-table v-loading="loading" :data="rows" border>
      <el-table-column label="买家" min-width="220">
        <template #default="{ row }">
          <div class="main">
            {{ row.buyer_contact_mask || row.user_id || row.buyer_key }}
          </div>
          <div class="sub">{{ row.user_id || row.buyer_key }}</div>
        </template>
      </el-table-column>
      <el-table-column label="风险" width="120">
        <template #default="{ row }">
          <el-tag :type="metaOf(buyerRiskLevelMap, row.risk_level).type">
            {{ metaOf(buyerRiskLevelMap, row.risk_level).label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="30天售后/退款" width="140">
        <template #default="{ row }">
          {{ row.after_sale_count_30d }} / {{ row.refund_count_30d }}
        </template>
      </el-table-column>
      <el-table-column prop="blocked_until" label="封禁到期" width="170">
        <template #default="{ row }">{{
          row.blocked_until || "长期"
        }}</template>
      </el-table-column>
      <el-table-column prop="reason" label="原因" min-width="220" />
      <el-table-column prop="updated_at" label="更新时间" width="170" />
      <el-table-column label="操作" width="90" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
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

    <el-dialog
      v-model="dialogVisible"
      width="520px"
      :title="editingId ? '编辑买家风控' : '新增买家风控'"
    >
      <el-form label-position="top">
        <el-form-item label="买家用户ID">
          <el-input
            v-model="form.user_id"
            :disabled="!!editingId"
            placeholder="可填写 H5 买家或平台用户ID"
          />
        </el-form-item>
        <el-form-item label="下单联系方式">
          <el-input
            v-model="form.buyer_contact"
            placeholder="手机号、邮箱或微信号；保存后仅展示掩码"
          />
        </el-form-item>
        <el-form-item label="风险等级">
          <el-segmented
            v-model="form.risk_level"
            :options="[
              { label: '正常', value: 'normal' },
              { label: '观察', value: 'watch' },
              { label: '黑名单', value: 'blocked' }
            ]"
          />
        </el-form-item>
        <el-form-item label="封禁到期">
          <el-date-picker
            v-model="form.blocked_until"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="留空表示长期"
          />
        </el-form-item>
        <el-form-item label="风控原因">
          <el-input
            v-model="form.reason"
            type="textarea"
            :rows="3"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="内部备注">
          <el-input
            v-model="form.note"
            type="textarea"
            :rows="3"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm"
          >保存</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.risk-page {
  padding: 16px;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.keyword {
  width: 340px;
}

.filter-item {
  width: 140px;
}

.main {
  font-weight: 700;
  color: #221a14;
}

.sub {
  font-size: 12px;
  color: #8f8276;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
