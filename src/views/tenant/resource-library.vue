<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import {
  Document,
  Link,
  Refresh,
  Search,
  Upload
} from "@element-plus/icons-vue";
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules
} from "element-plus";
import { hasPerms } from "@/utils/auth";
import {
  tenantApi,
  type ProductCategory,
  type ResourceImportBatch,
  type ResourceImportItem,
  type ResourceImportStats,
  type TenantContext
} from "@/api/admin";
import {
  getSelectedTenantCircleId,
  setSelectedTenantCircleId
} from "@/utils/tenantContext";

defineOptions({ name: "TenantResourceLibrary" });

const router = useRouter();
const loading = ref(false);
const itemLoading = ref(false);
const uploading = ref(false);
const converting = ref(false);
const batches = ref<ResourceImportBatch[]>([]);
const items = ref<ResourceImportItem[]>([]);
const categories = ref<ProductCategory[]>([]);
const stats = ref<ResourceImportStats | null>(null);
const tenantContext = ref<TenantContext | null>(null);
const selectedCircleId = ref(getSelectedTenantCircleId());
const selectedBatchId = ref("");
const batchTotal = ref(0);
const itemTotal = ref(0);
const fileInputRef = ref<HTMLInputElement>();
const convertFormRef = ref<FormInstance>();
const convertDialogVisible = ref(false);
const currentItem = ref<ResourceImportItem | null>(null);

const batchFilters = reactive({
  page: 1,
  page_size: 20
});

const itemFilters = reactive({
  keyword: "",
  risk_level: "",
  status: "",
  page: 1,
  page_size: 20
});

const convertForm = reactive({
  title: "",
  summary: "",
  price_yuan: "9.90",
  category_id: "",
  h5_status: "hidden" as "visible" | "hidden"
});

const convertRules: FormRules = {
  title: [{ required: true, message: "请输入资源卡标题", trigger: "blur" }],
  summary: [{ required: true, message: "请输入资源卡简介", trigger: "blur" }],
  price_yuan: [{ required: true, message: "请输入价格", trigger: "blur" }]
};

const canManage = computed(() => hasPerms("tenant:resource:manage"));
const currentCircle = computed(() => tenantContext.value?.current_circle || null);
const selectedBatch = computed(
  () => batches.value.find(item => item.id === selectedBatchId.value) || null
);
const activeCategories = computed(() =>
  categories.value.filter(item => item.status === "active")
);

const riskText: Record<string, string> = {
  low: "低风险",
  medium: "中风险",
  high: "高风险"
};

const statusText: Record<string, string> = {
  candidate: "候选",
  isolated: "隔离",
  converted: "已转草稿",
  ignored: "已忽略"
};

function riskType(value: string) {
  if (value === "high") return "danger";
  if (value === "medium") return "warning";
  return "success";
}

function statusType(value: string) {
  if (value === "converted") return "success";
  if (value === "isolated") return "danger";
  if (value === "ignored") return "info";
  return "warning";
}

function yuanToFen(value: string) {
  return Math.max(1, Math.round(Number(value || 0) * 100));
}

function scoreText(row: ResourceImportItem) {
  return `${row.commercial_score} 分`;
}

function canConvert(row: ResourceImportItem) {
  return (
    canManage.value &&
    row.status === "candidate" &&
    row.risk_level !== "high" &&
    !row.converted_resource_card_id
  );
}

async function loadTenantContext() {
  try {
    const data = await tenantApi.context();
    const circles = data.circles || [];
    let nextSelected = selectedCircleId.value || data.selected_circle_id;
    if (!circles.some(item => item.id === nextSelected)) {
      nextSelected = data.selected_circle_id || circles[0]?.id || "";
    }
    if (nextSelected) {
      setSelectedTenantCircleId(nextSelected);
      selectedCircleId.value = nextSelected;
    }
    const nextCircle =
      circles.find(item => item.id === nextSelected) ||
      data.current_circle ||
      null;
    tenantContext.value = {
      ...data,
      can_enter: Boolean(nextCircle),
      selected_circle_id: nextSelected,
      current_circle: nextCircle
    };
    return Boolean(nextCircle);
  } catch (error) {
    tenantContext.value = {
      can_enter: false,
      message: error instanceof Error ? error.message : "无法进入圈主后台",
      selected_circle_id: "",
      current_circle: null,
      circles: []
    };
    return false;
  }
}

async function loadCategories() {
  const data = await tenantApi.productCategories();
  categories.value = data.items;
}

async function loadBatches() {
  loading.value = true;
  try {
    const data = await tenantApi.resourceImportBatches({ ...batchFilters });
    batches.value = data.items;
    batchTotal.value = data.total;
    if (!selectedBatchId.value && data.items.length) {
      selectedBatchId.value = data.items[0].id;
    }
  } finally {
    loading.value = false;
  }
}

async function loadBatchDetail() {
  if (!selectedBatchId.value) {
    stats.value = null;
    items.value = [];
    itemTotal.value = 0;
    return;
  }
  const data = await tenantApi.resourceImportDetail(selectedBatchId.value);
  stats.value = data.stats;
}

async function loadItems() {
  if (!selectedBatchId.value) {
    items.value = [];
    itemTotal.value = 0;
    return;
  }
  itemLoading.value = true;
  try {
    const data = await tenantApi.resourceImportItems(selectedBatchId.value, {
      ...itemFilters
    });
    items.value = data.items;
    itemTotal.value = data.total;
  } finally {
    itemLoading.value = false;
  }
}

async function loadPageData() {
  const canEnter = await loadTenantContext();
  if (!canEnter) return;
  await Promise.all([loadCategories(), loadBatches()]);
  await Promise.all([loadBatchDetail(), loadItems()]);
}

async function switchTenantCircle(value: string) {
  setSelectedTenantCircleId(value);
  selectedCircleId.value = value;
  selectedBatchId.value = "";
  batchFilters.page = 1;
  itemFilters.page = 1;
  await loadPageData();
}

async function selectBatch(row: ResourceImportBatch) {
  selectedBatchId.value = row.id;
  itemFilters.page = 1;
  await Promise.all([loadBatchDetail(), loadItems()]);
}

function searchItems() {
  itemFilters.page = 1;
  loadItems();
}

function triggerUpload() {
  fileInputRef.value?.click();
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  const lower = file.name.toLowerCase();
  if (!/\.(xlsx|xls|csv)$/.test(lower)) {
    ElMessage.warning("仅支持 .xlsx、.xls、.csv 文件");
    return;
  }
  uploading.value = true;
  try {
    const data = await tenantApi.uploadResourceImport(file);
    selectedBatchId.value = data.batch.id;
    batchFilters.page = 1;
    itemFilters.page = 1;
    ElMessage.success("资源表已解析");
    if (data.truncated) {
      ElMessage.warning("本次只解析前 5000 条有效资源");
    }
    await Promise.all([loadBatches(), loadBatchDetail(), loadItems()]);
  } finally {
    uploading.value = false;
  }
}

function openLink(row: ResourceImportItem) {
  if (!row.link) {
    ElMessage.info("该资源没有识别到链接");
    return;
  }
  window.open(row.link, "_blank", "noopener,noreferrer");
}

function openConvertDialog(row: ResourceImportItem) {
  currentItem.value = row;
  Object.assign(convertForm, {
    title: row.title.slice(0, 40),
    summary: (row.commercial_action || row.snake_judgement || row.note).slice(
      0,
      200
    ),
    price_yuan: "9.90",
    category_id: "",
    h5_status: "hidden"
  });
  convertFormRef.value?.clearValidate();
  convertDialogVisible.value = true;
}

async function submitConvert() {
  await convertFormRef.value?.validate();
  if (!currentItem.value) return;
  converting.value = true;
  try {
    await tenantApi.convertResourceImportItem(currentItem.value.id, {
      title: convertForm.title,
      summary: convertForm.summary,
      price: yuanToFen(convertForm.price_yuan),
      category_id: convertForm.category_id,
      h5_status: convertForm.h5_status
    });
    ElMessage.success("已生成资源卡草稿");
    convertDialogVisible.value = false;
    await Promise.all([loadBatches(), loadBatchDetail(), loadItems()]);
  } finally {
    converting.value = false;
  }
}

async function goResources(row?: ResourceImportItem) {
  if (row?.converted_resource_card_id) {
    await router.push({
      path: "/tenant/resources",
      query: { keyword: row.title }
    });
    return;
  }
  await router.push("/tenant/resources");
}

async function confirmHighRisk(row: ResourceImportItem) {
  await ElMessageBox.alert(row.risk_reason || "隔离资源不能转为资源卡", "隔离原因", {
    type: "warning",
    confirmButtonText: "知道了"
  });
}

onMounted(loadPageData);
</script>

<template>
  <div class="tenant-resource-library">
    <div class="page-head">
      <div>
        <h1>资源库导入</h1>
        <p>上传资源表后按风险、展示面和转化价值整理，候选资源可生成资源卡草稿。</p>
      </div>
      <div class="head-actions">
        <el-select
          v-if="tenantContext?.circles?.length"
          v-model="selectedCircleId"
          class="circle-switch"
          placeholder="选择经营圈子"
          @change="switchTenantCircle"
        >
          <el-option
            v-for="item in tenantContext.circles"
            :key="item.id"
            :label="item.name || item.circle_code || item.id"
            :value="item.id"
          />
        </el-select>
        <el-button :icon="Refresh" @click="loadPageData">刷新</el-button>
        <el-button
          v-if="canManage"
          type="primary"
          :icon="Upload"
          :loading="uploading"
          @click="triggerUpload"
        >
          上传资源表
        </el-button>
        <input
          ref="fileInputRef"
          class="file-input"
          type="file"
          accept=".xlsx,.xls,.csv"
          @change="onFileChange"
        />
      </div>
    </div>

    <el-alert
      v-if="tenantContext && !tenantContext.can_enter"
      class="mb"
      type="warning"
      show-icon
      :closable="false"
      :title="tenantContext.message || '当前账号还没有可经营的圈子上下文。'"
    />

    <el-alert
      v-else-if="currentCircle"
      class="mb"
      type="info"
      show-icon
      :closable="false"
      :title="`当前经营圈子：${currentCircle.name || currentCircle.circle_code || currentCircle.id}`"
      description="导入、隔离和转草稿都会按当前圈子隔离。"
    />

    <el-alert
      v-if="!canManage"
      class="mb"
      type="info"
      show-icon
      :closable="false"
      title="当前账号为只读权限，可查看导入结果，不能上传或转资源卡草稿。"
    />

    <div class="summary-strip" v-if="selectedBatch">
      <div>
        <span class="summary-label">总资源</span>
        <strong>{{ selectedBatch.total_count }}</strong>
      </div>
      <div>
        <span class="summary-label">候选</span>
        <strong>{{ selectedBatch.candidate_count }}</strong>
      </div>
      <div>
        <span class="summary-label">隔离</span>
        <strong>{{ selectedBatch.isolated_count }}</strong>
      </div>
      <div>
        <span class="summary-label">已转草稿</span>
        <strong>{{ selectedBatch.converted_count }}</strong>
      </div>
      <div>
        <span class="summary-label">重复链接</span>
        <strong>{{ selectedBatch.duplicate_count }}</strong>
      </div>
    </div>

    <div class="content-grid">
      <section class="batch-pane">
        <div class="section-head">
          <h2>导入批次</h2>
        </div>
        <el-table
          v-loading="loading"
          :data="batches"
          border
          highlight-current-row
          :current-row-key="selectedBatchId"
          row-key="id"
          @row-click="selectBatch"
        >
          <el-table-column label="文件" min-width="180">
            <template #default="{ row }">
              <div class="main batch-file">{{ row.source_filename }}</div>
              <div class="sub">{{ row.created_at }}</div>
            </template>
          </el-table-column>
          <el-table-column label="资源" width="90">
            <template #default="{ row }">{{ row.total_count }}</template>
          </el-table-column>
          <el-table-column label="隔离" width="90">
            <template #default="{ row }">
              <el-tag :type="row.isolated_count ? 'danger' : 'success'">
                {{ row.isolated_count }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="草稿" width="90">
            <template #default="{ row }">{{ row.converted_count }}</template>
          </el-table-column>
        </el-table>
        <div class="pagination compact">
          <el-pagination
            v-model:current-page="batchFilters.page"
            v-model:page-size="batchFilters.page_size"
            small
            layout="prev, pager, next"
            :total="batchTotal"
            @change="loadBatches"
          />
        </div>
      </section>

      <section class="item-pane">
        <div class="section-head item-section-head">
          <div>
            <h2>资源明细</h2>
            <p v-if="stats?.risk_distribution?.length">
              <span
                v-for="risk in stats.risk_distribution"
                :key="risk.risk_level"
                class="risk-stat"
              >
                {{ riskText[risk.risk_level] || risk.risk_level }} {{ risk.count }}
              </span>
            </p>
          </div>
          <el-button :icon="Document" @click="goResources()">资源卡管理</el-button>
        </div>

        <div class="filter-bar">
          <el-input
            v-model="itemFilters.keyword"
            class="keyword"
            clearable
            placeholder="搜索标题、备注、链接"
            @keyup.enter="searchItems"
          />
          <el-select
            v-model="itemFilters.risk_level"
            class="filter-item"
            clearable
            placeholder="风险等级"
          >
            <el-option label="低风险" value="low" />
            <el-option label="中风险" value="medium" />
            <el-option label="高风险" value="high" />
          </el-select>
          <el-select
            v-model="itemFilters.status"
            class="filter-item"
            clearable
            placeholder="状态"
          >
            <el-option label="候选" value="candidate" />
            <el-option label="隔离" value="isolated" />
            <el-option label="已转草稿" value="converted" />
          </el-select>
          <el-button type="primary" :icon="Search" @click="searchItems">
            查询
          </el-button>
        </div>

        <el-table v-loading="itemLoading" :data="items" border>
          <el-table-column label="资源" min-width="280">
            <template #default="{ row }">
              <div class="main">{{ row.title }}</div>
              <div class="sub line-clamp">{{ row.note || row.commercial_action || "-" }}</div>
            </template>
          </el-table-column>
          <el-table-column label="平台" width="110" prop="platform" />
          <el-table-column label="风险" width="110">
            <template #default="{ row }">
              <el-tag :type="riskType(row.risk_level)">
                {{ riskText[row.risk_level] || row.risk_level }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="资源池" min-width="150" prop="resource_pool" />
          <el-table-column label="商业化分" width="110">
            <template #default="{ row }">{{ scoreText(row) }}</template>
          </el-table-column>
          <el-table-column label="动作" min-width="220">
            <template #default="{ row }">
              <div class="line-clamp">{{ row.commercial_action }}</div>
              <div class="sub line-clamp">{{ row.snake_judgement }}</div>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="110">
            <template #default="{ row }">
              <el-tag :type="statusType(row.status)">
                {{ statusText[row.status] || row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="210" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" :icon="Link" @click="openLink(row)">
                链接
              </el-button>
              <el-button
                v-if="canConvert(row)"
                link
                type="success"
                @click="openConvertDialog(row)"
              >
                转草稿
              </el-button>
              <el-button
                v-else-if="row.status === 'converted'"
                link
                type="primary"
                @click="goResources(row)"
              >
                去管理
              </el-button>
              <el-button
                v-else-if="row.status === 'isolated'"
                link
                type="danger"
                @click="confirmHighRisk(row)"
              >
                隔离原因
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination">
          <el-pagination
            v-model:current-page="itemFilters.page"
            v-model:page-size="itemFilters.page_size"
            layout="total, sizes, prev, pager, next"
            :page-sizes="[10, 20, 50, 100]"
            :total="itemTotal"
            @change="loadItems"
          />
        </div>
      </section>
    </div>

    <el-dialog
      v-model="convertDialogVisible"
      title="转资源卡草稿"
      width="620px"
      destroy-on-close
    >
      <el-form
        ref="convertFormRef"
        :model="convertForm"
        :rules="convertRules"
        label-width="110px"
      >
        <el-form-item label="资源卡标题" prop="title">
          <el-input v-model="convertForm.title" maxlength="40" show-word-limit />
        </el-form-item>
        <el-form-item label="资源卡简介" prop="summary">
          <el-input
            v-model="convertForm.summary"
            type="textarea"
            :rows="3"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="价格" prop="price_yuan">
          <el-input v-model="convertForm.price_yuan" placeholder="单位：元" />
        </el-form-item>
        <el-form-item label="商品分类">
          <el-select v-model="convertForm.category_id" clearable placeholder="选择分类">
            <el-option
              v-for="item in activeCategories"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="H5 展示">
          <el-radio-group v-model="convertForm.h5_status">
            <el-radio-button label="hidden">隐藏</el-radio-button>
            <el-radio-button label="visible">可见</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="convertDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="converting" @click="submitConvert">
          生成草稿
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.tenant-resource-library {
  padding: 16px;
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.page-head h1,
.section-head h2 {
  margin: 0;
  color: #221a14;
}

.page-head h1 {
  font-size: 22px;
}

.section-head h2 {
  font-size: 16px;
}

.page-head p,
.section-head p {
  margin: 6px 0 0;
  color: #766b61;
}

.head-actions,
.filter-bar,
.item-section-head {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.head-actions,
.item-section-head {
  align-items: center;
}

.circle-switch {
  width: 220px;
}

.file-input {
  display: none;
}

.mb {
  margin-bottom: 12px;
}

.summary-strip {
  display: grid;
  grid-template-columns: repeat(5, minmax(120px, 1fr));
  gap: 1px;
  overflow: hidden;
  margin-bottom: 14px;
  border: 1px solid #e6ddd2;
  border-radius: 6px;
  background: #e6ddd2;
}

.summary-strip > div {
  padding: 12px;
  background: #fffdf9;
}

.summary-label {
  display: block;
  margin-bottom: 6px;
  color: #8f8276;
  font-size: 12px;
}

.summary-strip strong {
  color: #221a14;
  font-size: 20px;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(320px, 0.35fr) minmax(0, 1fr);
  gap: 14px;
}

.batch-pane,
.item-pane {
  min-width: 0;
}

.section-head {
  margin-bottom: 10px;
}

.item-section-head {
  justify-content: space-between;
}

.filter-bar {
  margin-bottom: 12px;
}

.keyword {
  width: 300px;
}

.filter-item {
  width: 140px;
}

.main {
  color: #221a14;
  font-weight: 700;
}

.batch-file {
  word-break: break-all;
}

.sub {
  color: #8f8276;
  font-size: 12px;
}

.line-clamp {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.risk-stat {
  margin-right: 12px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.pagination.compact {
  justify-content: center;
}

@media (max-width: 1180px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .page-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .summary-strip {
    grid-template-columns: repeat(2, minmax(120px, 1fr));
  }

  .keyword {
    width: 100%;
  }
}
</style>
