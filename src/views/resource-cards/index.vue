<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { CopyDocument, Link, View } from "@element-plus/icons-vue";
import { managedResourceCardsApi, type ManagedResourceCard } from "@/api/admin";
import {
  auditStatusMap,
  deliveryTypeLabels,
  governanceReasonOptions,
  resourceCardStatusMap
} from "@/utils/labels";
import { hasPerms } from "@/utils/auth";

defineOptions({
  name: "ManagedResourceCards"
});

type TagType = "primary" | "success" | "warning" | "danger" | "info";

const loading = ref(false);
const detailLoading = ref(false);
const actionLoading = ref(false);
const rows = ref<ManagedResourceCard[]>([]);
const total = ref(0);
const detailVisible = ref(false);
const current = ref<ManagedResourceCard | null>(null);
const purchases = ref<Array<Record<string, any>>>([]);

const filters = reactive({
  keyword: "",
  status: "",
  audit_status: "",
  delivery_type: "",
  circle_id: "",
  page: 1,
  page_size: 20
});

const actionForm = reactive({
  status: "published",
  audit_status: "pass",
  audit_reason: "人工复核通过",
  is_pinned: false
});

const canManage = computed(() => hasPerms("resource_card:manage"));

function metaOf<T extends Record<string, { label: string; type: string }>>(
  map: T,
  value: string
) {
  return (map[value as keyof T] || { label: value || "-", type: "info" }) as {
    label: string;
    type: TagType;
  };
}

function moneyText(value: number) {
  return `￥${((Number(value) || 0) / 100).toFixed(2)}`;
}

function shopBase() {
  return String(
    import.meta.env.VITE_SHOP_BASE_URL || window.location.origin
  ).replace(/\/$/, "");
}

function isH5Visible(row: ManagedResourceCard) {
  return (
    row.status === "published" &&
    row.audit_status === "pass" &&
    row.h5_status !== "hidden"
  );
}

function shopPath(row: ManagedResourceCard, type: "product" | "store") {
  if (type === "store") {
    return (
      row.store_path ||
      `/#/shop/store/${encodeURIComponent(row.circle_code || row.circle_id)}`
    );
  }
  return (
    row.public_path ||
    `/#/shop/product/${encodeURIComponent(row.share_token || row.id)}`
  );
}

function shopUrl(row: ManagedResourceCard, type: "product" | "store") {
  const path = shopPath(row, type);
  return /^https?:\/\//i.test(path) ? path : `${shopBase()}${path}`;
}

function openShopPage(row: ManagedResourceCard, type: "product" | "store") {
  if (!isH5Visible(row)) {
    ElMessage.warning("该商品未满足 H5 展示条件，打开后可能显示不可访问。");
  }
  window.open(shopUrl(row, type), "_blank", "noopener,noreferrer");
}

async function copyShopLink(row: ManagedResourceCard) {
  const url = shopUrl(row, "product");
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
  } else {
    const textarea = document.createElement("textarea");
    textarea.value = url;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
  ElMessage.success("H5 商品链接已复制");
}

async function loadList() {
  loading.value = true;
  try {
    const data = await managedResourceCardsApi.list({ ...filters });
    rows.value = data.items;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

function resetSearch() {
  filters.keyword = "";
  filters.status = "";
  filters.audit_status = "";
  filters.delivery_type = "";
  filters.circle_id = "";
  filters.page = 1;
  loadList();
}

async function openDetail(row: ManagedResourceCard) {
  detailVisible.value = true;
  detailLoading.value = true;
  try {
    const data = await managedResourceCardsApi.detail(row.id);
    current.value = data.resource_card;
    purchases.value = data.recent_purchases;
    actionForm.status = data.resource_card.status;
    actionForm.audit_status = data.resource_card.audit_status || "pass";
    actionForm.audit_reason =
      data.resource_card.audit_status === "reject"
        ? "人工复核拒绝"
        : "人工复核通过";
    actionForm.is_pinned = data.resource_card.is_pinned;
  } finally {
    detailLoading.value = false;
  }
}

async function submitAction() {
  if (!current.value) return;
  if (!actionForm.audit_reason) {
    ElMessage.warning("请选择处置原因");
    return;
  }
  await ElMessageBox.confirm("确认更新该资源卡的治理状态？", "资源卡处置确认", {
    type: "warning"
  });
  actionLoading.value = true;
  try {
    const next = await managedResourceCardsApi.update(current.value.id, {
      status: actionForm.status,
      audit_status: actionForm.audit_status,
      audit_reason: actionForm.audit_reason,
      is_pinned: actionForm.is_pinned
    });
    current.value = next;
    ElMessage.success("资源卡状态已更新");
    await loadList();
  } finally {
    actionLoading.value = false;
  }
}

async function setStatus(row: ManagedResourceCard, status: string) {
  await ElMessageBox.confirm(
    `确认将资源卡「${row.title}」设为${status}？`,
    "资源卡状态确认",
    {
      type: "warning"
    }
  );
  await managedResourceCardsApi.update(row.id, {
    status,
    audit_status: status === "published" ? "pass" : row.audit_status || "pass",
    audit_reason:
      status === "published"
        ? "后台管理员恢复发布"
        : status === "offline"
          ? "后台管理员下架资源卡"
          : "后台管理员禁用资源卡"
  });
  ElMessage.success("资源卡状态已更新");
  await loadList();
}

onMounted(loadList);
</script>

<template>
  <div class="resource-cards-page">
    <div class="filter-bar">
      <el-input
        v-model="filters.keyword"
        class="keyword"
        clearable
        placeholder="搜索标题、简介、圈子、创作者或ID"
        @keyup.enter="loadList"
      />
      <el-input
        v-model="filters.circle_id"
        class="circle-input"
        clearable
        placeholder="圈子ID"
        @keyup.enter="loadList"
      />
      <el-select
        v-model="filters.status"
        class="filter-item"
        placeholder="状态"
        clearable
      >
        <el-option label="草稿" value="draft" />
        <el-option label="已发布" value="published" />
        <el-option label="已下架" value="offline" />
        <el-option label="已禁用" value="disabled" />
      </el-select>
      <el-select
        v-model="filters.audit_status"
        class="filter-item"
        placeholder="审核"
        clearable
      >
        <el-option label="待审核" value="pending" />
        <el-option label="通过" value="pass" />
        <el-option label="拒绝" value="reject" />
        <el-option label="人工复核" value="manual_review" />
      </el-select>
      <el-select
        v-model="filters.delivery_type"
        class="filter-item"
        placeholder="交付"
        clearable
      >
        <el-option label="资源交付" value="resource" />
        <el-option label="卡密交付" value="code" />
      </el-select>
      <el-button type="primary" @click="loadList">查询</el-button>
      <el-button @click="resetSearch">重置</el-button>
    </div>

    <el-table v-loading="loading" :data="rows" border>
      <el-table-column label="资源卡" min-width="260">
        <template #default="{ row }">
          <div class="resource-cell">
            <el-image
              v-if="row.cover_url"
              class="cover"
              :src="row.cover_url"
              fit="cover"
            />
            <div v-else class="cover empty" />
            <div>
              <div class="cell-main">{{ row.title }}</div>
              <div class="cell-sub">{{ row.summary || row.id }}</div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="圈子/创作者" min-width="190">
        <template #default="{ row }">
          <div class="cell-main">{{ row.circle_name || row.circle_id }}</div>
          <div class="cell-sub">
            {{ row.creator_nickname || row.creator_dxq_id }}
          </div>
        </template>
      </el-table-column>
      <el-table-column label="价格" width="100">
        <template #default="{ row }">{{ moneyText(row.price) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="metaOf(resourceCardStatusMap, row.status).type">
            {{ metaOf(resourceCardStatusMap, row.status).label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="审核" width="110">
        <template #default="{ row }">
          <el-tag :type="metaOf(auditStatusMap, row.audit_status).type">
            {{ metaOf(auditStatusMap, row.audit_status).label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="数据" min-width="240">
        <template #default="{ row }">
          <el-tag class="metric" type="info">{{
            deliveryTypeLabels[row.delivery_type]
          }}</el-tag>
          <el-tag class="metric" type="success"
            >销量 {{ row.sales_count }}</el-tag
          >
          <el-tag class="metric" type="info"
            >评论 {{ row.comment_count }}</el-tag
          >
          <el-tag
            class="metric"
            :type="
              isH5Visible(row)
                ? 'success'
                : row.h5_status === 'hidden'
                  ? 'info'
                  : 'warning'
            "
          >
            {{
              isH5Visible(row)
                ? "H5 可访问"
                : row.h5_status === "hidden"
                  ? "H5 隐藏"
                  : "H5 未公开"
            }}
          </el-tag>
          <el-tag
            v-if="row.delivery_type === 'code'"
            class="metric"
            type="warning"
          >
            库存 {{ row.code_stock_available }}/{{ row.code_stock_total }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="updated_at" label="更新时间" width="170" />
      <el-table-column label="操作" fixed="right" width="260">
        <template #default="{ row }">
          <el-button
            link
            type="primary"
            :icon="View"
            @click="openShopPage(row, 'product')"
          >
            商品页
          </el-button>
          <el-button
            link
            type="primary"
            :icon="Link"
            @click="openShopPage(row, 'store')"
          >
            店铺页
          </el-button>
          <el-button
            link
            type="primary"
            :icon="CopyDocument"
            @click="copyShopLink(row)"
          >
            复制H5
          </el-button>
          <el-button link type="primary" @click="openDetail(row)"
            >查看</el-button
          >
          <el-button
            v-if="canManage && row.status === 'published'"
            link
            type="warning"
            @click="setStatus(row, 'offline')"
          >
            下架
          </el-button>
          <el-button
            v-if="canManage && row.status !== 'disabled'"
            link
            type="danger"
            @click="setStatus(row, 'disabled')"
          >
            禁用
          </el-button>
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

    <el-drawer v-model="detailVisible" size="680px" title="资源卡详情">
      <div v-if="current" v-loading="detailLoading" class="detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="标题">{{
            current.title
          }}</el-descriptions-item>
          <el-descriptions-item label="简介">{{
            current.summary || "-"
          }}</el-descriptions-item>
          <el-descriptions-item label="圈子">
            {{ current.circle_name || current.circle_id }}
            <span class="muted">{{
              current.creator_nickname || current.creator_dxq_id
            }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="价格">{{
            moneyText(current.price)
          }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="metaOf(resourceCardStatusMap, current.status).type">
              {{ metaOf(resourceCardStatusMap, current.status).label }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="审核">
            <el-tag :type="metaOf(auditStatusMap, current.audit_status).type">
              {{ metaOf(auditStatusMap, current.audit_status).label }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="H5 公开页">
            <div class="h5-actions">
              <el-tag :type="isH5Visible(current) ? 'success' : 'warning'">
                {{ isH5Visible(current) ? "可访问" : "未公开或已隐藏" }}
              </el-tag>
              <el-button
                link
                type="primary"
                :icon="View"
                @click="openShopPage(current, 'product')"
              >
                商品页
              </el-button>
              <el-button
                link
                type="primary"
                :icon="Link"
                @click="openShopPage(current, 'store')"
              >
                店铺页
              </el-button>
              <el-button
                link
                type="primary"
                :icon="CopyDocument"
                @click="copyShopLink(current)"
              >
                复制商品链接
              </el-button>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="最近购买">
            <el-tag
              v-for="item in purchases"
              :key="item.id"
              class="metric"
              type="info"
            >
              {{ item.user_nickname || item.user_dxq_id || item.user_id }} /
              {{ item.status }}
            </el-tag>
            <span v-if="!purchases.length">-</span>
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="canManage" class="action-box">
          <h3>治理操作</h3>
          <el-radio-group v-model="actionForm.status">
            <el-radio-button label="published">发布</el-radio-button>
            <el-radio-button label="offline">下架</el-radio-button>
            <el-radio-button label="disabled">禁用</el-radio-button>
          </el-radio-group>
          <el-switch
            v-model="actionForm.is_pinned"
            active-text="置顶"
            inactive-text="不置顶"
          />
          <el-select v-model="actionForm.audit_status" class="full">
            <el-option label="待审核" value="pending" />
            <el-option label="通过" value="pass" />
            <el-option label="拒绝" value="reject" />
            <el-option label="人工复核" value="manual_review" />
          </el-select>
          <el-select
            v-model="actionForm.audit_reason"
            class="full"
            placeholder="选择处置原因"
          >
            <el-option
              v-for="item in governanceReasonOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <el-button
            class="submit-btn"
            type="primary"
            :loading="actionLoading"
            @click="submitAction"
          >
            保存处置
          </el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped>
.resource-cards-page {
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

.circle-input {
  width: 220px;
}

.filter-item {
  width: 130px;
}

.resource-cell {
  display: flex;
  gap: 10px;
  align-items: center;
}

.cover {
  flex: none;
  width: 42px;
  height: 42px;
  background: #f0ebe3;
  border-radius: 6px;
}

.cell-main {
  font-weight: 700;
  color: #221a14;
}

.cell-sub,
.muted {
  margin-left: 4px;
  font-size: 12px;
  color: #8f8276;
}

.metric {
  margin: 0 4px 4px 0;
}

.h5-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.action-box {
  display: grid;
  gap: 12px;
  padding: 14px;
  margin-top: 18px;
  background: #fffdf9;
  border: 1px solid #e6ddd2;
  border-radius: 8px;
}

.action-box h3 {
  margin: 0;
}

.full,
.submit-btn {
  width: 100%;
}
</style>
