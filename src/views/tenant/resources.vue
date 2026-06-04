<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import {
  CopyDocument,
  Delete,
  Edit,
  Plus,
  Refresh,
  Search
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
  type ManagedResourceCard,
  type ProductCategory,
  type TenantContext
} from "@/api/admin";
import {
  getSelectedTenantCircleId,
  setSelectedTenantCircleId
} from "@/utils/tenantContext";

defineOptions({ name: "TenantResources" });

type DeliveryType = "resource" | "code";

const router = useRouter();
const loading = ref(false);
const saving = ref(false);
const actionLoading = ref("");
const rows = ref<ManagedResourceCard[]>([]);
const categories = ref<ProductCategory[]>([]);
const tenantContext = ref<TenantContext | null>(null);
const selectedCircleId = ref(getSelectedTenantCircleId());
const total = ref(0);
const dialogVisible = ref(false);
const categoryDialogVisible = ref(false);
const formRef = ref<FormInstance>();
const filters = reactive({
  keyword: "",
  status: "",
  delivery_type: "",
  category_id: "",
  page: 1,
  page_size: 20
});
const categoryForm = reactive({
  name: "",
  sort_order: 0
});
const form = reactive({
  id: "",
  title: "",
  summary: "",
  category_id: "",
  h5_status: "visible" as "visible" | "hidden",
  price_yuan: "",
  delivery_type: "resource" as DeliveryType,
  cover_url: "",
  preview_text: "",
  preview_images_text: "",
  resource_url: "",
  resource_access_code: "",
  doc_content: "",
  doc_url: "",
  code_text: "",
  remark: "",
  is_pinned: false
});

const canManage = computed(() => hasPerms("tenant:resource:manage"));
const dialogTitle = computed(() => (form.id ? "编辑资源卡" : "发布资源卡"));
const currentCircle = computed(() => tenantContext.value?.current_circle || null);
const activeCategories = computed(() =>
  categories.value.filter(item => item.status === "active")
);

const rules: FormRules = {
  title: [{ required: true, message: "请输入资源卡标题", trigger: "blur" }],
  summary: [{ required: true, message: "请输入资源卡简介", trigger: "blur" }],
  price_yuan: [{ required: true, message: "请输入资源卡价格", trigger: "blur" }]
};

const statusText: Record<string, string> = {
  draft: "草稿",
  published: "已上架",
  offline: "已下架",
  disabled: "已禁用",
  deleted: "已删除"
};

const auditText: Record<string, string> = {
  pending: "审核中",
  pass: "已通过",
  reject: "已拒绝",
  manual_review: "人工复核"
};

function yuan(value?: number) {
  return `¥${((Number(value) || 0) / 100).toFixed(2)}`;
}

function toFen(value: string) {
  return Math.round(Number(value || 0) * 100);
}

function fromFen(value?: number) {
  return ((Number(value) || 0) / 100).toFixed(2);
}

function splitLines(value: string) {
  return String(value || "")
    .split(/\r?\n/)
    .map(item => item.trim())
    .filter(Boolean);
}

function resetForm() {
  Object.assign(form, {
    id: "",
    title: "",
    summary: "",
    category_id: "",
    h5_status: "visible",
    price_yuan: "",
    delivery_type: "resource",
    cover_url: "",
    preview_text: "",
    preview_images_text: "",
    resource_url: "",
    resource_access_code: "",
    doc_content: "",
    doc_url: "",
    code_text: "",
    remark: "",
    is_pinned: false
  });
  formRef.value?.clearValidate();
}

function statusType(status: string) {
  if (status === "published") return "success";
  if (status === "draft") return "warning";
  if (status === "disabled") return "danger";
  return "info";
}

function auditType(status: string) {
  if (status === "pass") return "success";
  if (status === "reject") return "danger";
  if (status === "manual_review") return "warning";
  return "info";
}

function deliveryLabel(type: string) {
  return type === "code" ? "卡密交付" : "资源交付";
}

function h5StatusLabel(status?: string) {
  return status === "hidden" ? "H5 隐藏" : "H5 可见";
}

function categoryText(row: ManagedResourceCard) {
  return row.category_name || "未分类";
}

function canPublish(row: ManagedResourceCard) {
  return row.status === "draft" || row.status === "offline";
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

async function loadPageData() {
  const canEnter = await loadTenantContext();
  if (!canEnter) return;
  await Promise.all([loadCategories(), loadList()]);
}

async function switchTenantCircle(value: string) {
  setSelectedTenantCircleId(value);
  selectedCircleId.value = value;
  filters.page = 1;
  await loadPageData();
}

function search() {
  filters.page = 1;
  loadList();
}

function openCategoryDialog() {
  Object.assign(categoryForm, { name: "", sort_order: 0 });
  categoryDialogVisible.value = true;
}

async function createCategory() {
  const name = categoryForm.name.trim();
  if (!name) {
    ElMessage.warning("请输入分类名称");
    return;
  }
  saving.value = true;
  try {
    await tenantApi.createProductCategory({
      name,
      sort_order: Number(categoryForm.sort_order) || 0
    });
    Object.assign(categoryForm, { name: "", sort_order: 0 });
    ElMessage.success("分类已创建");
    await loadCategories();
  } finally {
    saving.value = false;
  }
}

async function hideCategory(item: ProductCategory) {
  await ElMessageBox.confirm(
    `确认隐藏「${item.name}」？隐藏后商品仍保留，前台不再展示该分类。`,
    "隐藏分类",
    { type: "warning" }
  );
  await tenantApi.deleteProductCategory(item.id);
  ElMessage.success("分类已隐藏");
  await loadCategories();
  if (filters.category_id === item.id) {
    filters.category_id = "";
    await loadList();
  }
}

function openCreate() {
  resetForm();
  dialogVisible.value = true;
}

async function openEdit(row: ManagedResourceCard) {
  resetForm();
  const data = await tenantApi.resourceCardDetail(row.id);
  const item = data.resource_card;
  Object.assign(form, {
    id: item.id,
    title: item.title || "",
    summary: item.summary || "",
    category_id: item.category_id || "",
    h5_status: item.h5_status || "visible",
    price_yuan: fromFen(item.price),
    delivery_type: (item.delivery_type || "resource") as DeliveryType,
    cover_url: item.cover_url || "",
    preview_text: item.preview_text || "",
    preview_images_text: (item.preview_images || []).join("\n"),
    resource_url: item.resource_url || "",
    resource_access_code: item.resource_access_code || "",
    doc_content: item.doc_content || "",
    doc_url: item.doc_url || "",
    code_text: (item.code_items || []).join("\n"),
    remark: item.remark || "",
    is_pinned: !!item.is_pinned
  });
  dialogVisible.value = true;
}

function buildPayload() {
  const amount = toFen(form.price_yuan);
  if (amount < 1) throw new Error("资源卡价格不能低于 0.01 元");
  const payload: Record<string, any> = {
    title: form.title.trim(),
    summary: form.summary.trim(),
    category_id: form.category_id || null,
    h5_status: form.h5_status,
    price: amount,
    delivery_type: form.delivery_type,
    cover_url: form.cover_url.trim(),
    preview_text: form.preview_text.trim(),
    preview_images: splitLines(form.preview_images_text),
    remark: form.remark.trim(),
    is_pinned: form.is_pinned
  };
  if (form.delivery_type === "resource") {
    payload.resource_url = form.resource_url.trim();
    payload.resource_access_code = form.resource_access_code.trim();
    payload.doc_content = form.doc_content.trim();
    payload.doc_url = form.doc_url.trim();
    if (!payload.resource_url && !payload.doc_content && !payload.doc_url) {
      throw new Error("请填写资源链接、说明文档或使用说明");
    }
  } else {
    payload.doc_content = form.doc_content.trim();
    const codes = splitLines(form.code_text);
    if (!form.id || codes.length > 0) payload.code_items = codes;
    if (!form.id && !codes.length) throw new Error("请至少导入一条卡密");
  }
  return payload;
}

async function saveResource() {
  await formRef.value?.validate();
  saving.value = true;
  try {
    const payload = buildPayload();
    if (form.id) {
      await tenantApi.updateResourceCard(form.id, payload);
      ElMessage.success("资源卡已保存");
    } else {
      await tenantApi.createResourceCard(payload);
      ElMessage.success("资源卡已创建");
    }
    dialogVisible.value = false;
    await loadList();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "保存失败");
  } finally {
    saving.value = false;
  }
}

async function changeStatus(row: ManagedResourceCard, target: "publish" | "offline") {
  const verb = target === "publish" ? "上架" : "下架";
  await ElMessageBox.confirm(`确认${verb}「${row.title}」？`, `${verb}资源卡`, {
    type: "warning"
  });
  actionLoading.value = `${target}:${row.id}`;
  try {
    if (target === "publish") await tenantApi.publishResourceCard(row.id);
    else await tenantApi.offlineResourceCard(row.id);
    ElMessage.success(`资源卡已${verb}`);
    await loadList();
  } finally {
    actionLoading.value = "";
  }
}

async function deleteResource(row: ManagedResourceCard) {
  await ElMessageBox.confirm(`确认删除「${row.title}」？删除后小程序端也不可见。`, "删除资源卡", {
    type: "warning"
  });
  actionLoading.value = `delete:${row.id}`;
  try {
    await tenantApi.deleteResourceCard(row.id);
    ElMessage.success("资源卡已删除");
    await loadList();
  } finally {
    actionLoading.value = "";
  }
}

async function copyLink(row: ManagedResourceCard) {
  const base = String(import.meta.env.VITE_SHOP_BASE_URL || window.location.origin).replace(/\/$/, "");
  const link = await tenantApi.resourceCardPublicLink(row.id).catch(() => null);
  const path = link?.public_path || row.public_path || `/#/shop/product/${row.share_token || row.id}`;
  const url = link?.public_url && !import.meta.env.VITE_SHOP_BASE_URL
    ? link.public_url
    : /^https?:\/\//i.test(path)
      ? path
      : `${base}${path}`;
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
  ElMessage.success("资源卡链接已复制");
}

function viewOrders(row: ManagedResourceCard) {
  router.push({ path: "/tenant/orders", query: { keyword: row.title } });
}

onMounted(loadPageData);
</script>

<template>
  <div class="tenant-list-page">
    <div class="page-head">
      <div>
        <h1>资源卡管理</h1>
        <p>发布和管理资源卡，支持资源交付、卡密交付、分类、H5 链接、订单和售后联动。</p>
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
        <el-button v-if="canManage" @click="openCategoryDialog">分类管理</el-button>
        <el-button v-if="canManage" type="primary" :icon="Plus" @click="openCreate">发布资源卡</el-button>
      </div>
    </div>

    <el-alert
      v-if="tenantContext && !tenantContext.can_enter"
      class="mb"
      type="warning"
      show-icon
      :closable="false"
      :title="tenantContext.message || '当前账号还没有可经营的圈子上下文。'"
      description="超级管理员需要先在账号与权限中给自己绑定 Dou 用户；绑定后可进入自己名下圈子的资源卡管理。"
    />

    <el-alert
      v-else-if="currentCircle"
      class="mb"
      type="info"
      show-icon
      :closable="false"
      :title="`当前经营圈子：${currentCircle.name || currentCircle.circle_code || currentCircle.id}`"
      description="新增、编辑、删除和卡密库存操作都会作用于当前选中的圈子。"
    />

    <el-alert
      v-if="!canManage"
      class="mb"
      type="info"
      show-icon
      :closable="false"
      title="当前账号为只读权限，可查看资源卡与经营数据，不能创建或修改资源卡。"
    />

    <div class="filter-bar">
      <el-input
        v-model="filters.keyword"
        class="keyword"
        clearable
        placeholder="搜索资源卡标题或简介"
        @keyup.enter="search"
      />
      <el-select v-model="filters.delivery_type" class="filter-item" clearable placeholder="交付方式">
        <el-option label="资源交付" value="resource" />
        <el-option label="卡密交付" value="code" />
      </el-select>
      <el-select v-model="filters.category_id" class="filter-item" clearable placeholder="分类">
        <el-option
          v-for="item in activeCategories"
          :key="item.id"
          :label="item.name"
          :value="item.id"
        />
      </el-select>
      <el-select v-model="filters.status" class="filter-item" clearable placeholder="状态">
        <el-option label="草稿" value="draft" />
        <el-option label="已上架" value="published" />
        <el-option label="已下架" value="offline" />
        <el-option label="已禁用" value="disabled" />
      </el-select>
      <el-button type="primary" :icon="Search" @click="search">查询</el-button>
    </div>

    <el-table v-loading="loading" :data="rows" border>
      <el-table-column label="资源卡" min-width="280">
        <template #default="{ row }">
          <div class="product-cell">
            <el-image v-if="row.cover_url" class="cover" :src="row.cover_url" fit="cover" />
            <div>
              <div class="main">{{ row.title }}</div>
              <div class="sub">{{ row.summary || "-" }}</div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="分类 / H5" min-width="140">
        <template #default="{ row }">
          <div class="main small">{{ categoryText(row) }}</div>
          <el-tag class="h5-tag" :type="row.h5_status === 'hidden' ? 'info' : 'success'">
            {{ h5StatusLabel(row.h5_status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="交付与库存" min-width="170">
        <template #default="{ row }">
          <el-tag :type="row.delivery_type === 'code' ? 'warning' : 'success'">
            {{ deliveryLabel(row.delivery_type) }}
          </el-tag>
          <div class="sub stock">
            <template v-if="row.delivery_type === 'code'">
              可售 {{ row.code_stock_available || 0 }} / 总 {{ row.code_stock_total || 0 }}
            </template>
            <template v-else>资源交付</template>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="价格" width="120">
        <template #default="{ row }">{{ yuan(row.price) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="110">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)">{{ statusText[row.status] || row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="审核" width="110">
        <template #default="{ row }">
          <el-tag :type="auditType(row.audit_status)">
            {{ auditText[row.audit_status] || row.audit_status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="销量/收入" width="140">
        <template #default="{ row }">
          <div>{{ row.purchase_count || 0 }} 单</div>
          <div class="sub">{{ yuan(row.revenue_amount || 0) }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="updated_at" label="更新时间" width="170" />
      <el-table-column label="操作" width="260" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" :icon="CopyDocument" @click="copyLink(row)">复制链接</el-button>
          <el-button link type="primary" @click="viewOrders(row)">订单</el-button>
          <el-button v-if="canManage" link type="primary" :icon="Edit" @click="openEdit(row)">编辑</el-button>
          <el-button
            v-if="canManage && canPublish(row)"
            link
            type="success"
            :loading="actionLoading === `publish:${row.id}`"
            @click="changeStatus(row, 'publish')"
          >
            上架
          </el-button>
          <el-button
            v-if="canManage && row.status === 'published'"
            link
            type="warning"
            :loading="actionLoading === `offline:${row.id}`"
            @click="changeStatus(row, 'offline')"
          >
            下架
          </el-button>
          <el-button
            v-if="canManage && row.status !== 'published'"
            link
            type="danger"
            :icon="Delete"
            :loading="actionLoading === `delete:${row.id}`"
            @click="deleteResource(row)"
          >
            删除
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="780px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="资源卡标题" prop="title">
          <el-input v-model="form.title" maxlength="40" show-word-limit />
        </el-form-item>
        <el-form-item label="资源卡简介" prop="summary">
          <el-input v-model="form.summary" type="textarea" :rows="3" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="资源卡分类">
          <el-select v-model="form.category_id" clearable placeholder="选择分类">
            <el-option
              v-for="item in activeCategories"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="H5 展示">
          <el-radio-group v-model="form.h5_status">
            <el-radio-button label="visible">可见</el-radio-button>
            <el-radio-button label="hidden">隐藏</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="价格" prop="price_yuan">
          <el-input v-model="form.price_yuan" placeholder="单位：元" />
        </el-form-item>
        <el-form-item label="交付方式">
          <el-radio-group v-model="form.delivery_type">
            <el-radio-button label="resource">资源交付</el-radio-button>
            <el-radio-button label="code">卡密交付</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="封面地址">
          <el-input v-model="form.cover_url" placeholder="建议使用已上传到 COS 的图片地址" />
        </el-form-item>
        <el-form-item label="预览文案">
          <el-input v-model="form.preview_text" type="textarea" :rows="3" maxlength="1000" show-word-limit />
        </el-form-item>
        <el-form-item label="预览图片">
          <el-input
            v-model="form.preview_images_text"
            type="textarea"
            :rows="3"
            placeholder="一行一个图片地址，最多 5 张"
          />
        </el-form-item>
        <template v-if="form.delivery_type === 'resource'">
          <el-form-item label="资源链接">
            <el-input v-model="form.resource_url" placeholder="百度网盘、夸克网盘或其他资源链接" />
          </el-form-item>
          <el-form-item label="提取码">
            <el-input v-model="form.resource_access_code" maxlength="200" />
          </el-form-item>
          <el-form-item label="说明文档">
            <el-input v-model="form.doc_url" placeholder="可选，购买后展示" />
          </el-form-item>
        </template>
        <template v-else>
          <el-form-item label="卡密库存">
            <el-input
              v-model="form.code_text"
              type="textarea"
              :rows="5"
              placeholder="一行一个卡密；编辑时留空表示不替换现有可售卡密"
            />
          </el-form-item>
        </template>
        <el-form-item label="使用说明">
          <el-input v-model="form.doc_content" type="textarea" :rows="5" maxlength="20000" show-word-limit />
        </el-form-item>
        <el-form-item label="内部备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" maxlength="1000" show-word-limit />
        </el-form-item>
        <el-form-item label="置顶展示">
          <el-switch v-model="form.is_pinned" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveResource">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="categoryDialogVisible" title="分类管理" width="520px">
      <div class="category-create">
        <el-input
          v-model="categoryForm.name"
          maxlength="30"
          placeholder="分类名称"
        />
        <el-input-number
          v-model="categoryForm.sort_order"
          :min="0"
          :max="9999"
          controls-position="right"
        />
        <el-button type="primary" :loading="saving" @click="createCategory">
          新增
        </el-button>
      </div>
      <el-table :data="categories" border>
        <el-table-column prop="name" label="分类" />
        <el-table-column prop="product_count" label="资源卡数" width="100" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === "active" ? "启用" : "隐藏" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'active'"
              link
              type="danger"
              @click="hideCategory(row)"
            >
              隐藏
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<style scoped>
.tenant-list-page {
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
  color: #221a14;
  font-size: 22px;
}

.page-head p {
  margin: 6px 0 0;
  color: #766b61;
}

.head-actions,
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
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

.circle-switch {
  width: 220px;
}

.product-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cover {
  width: 52px;
  height: 52px;
  flex: 0 0 auto;
  border: 1px solid #efe6db;
  border-radius: 6px;
}

.main {
  color: #221a14;
  font-weight: 700;
}

.main.small {
  margin-bottom: 6px;
  font-size: 13px;
}

.h5-tag {
  margin-top: 2px;
}

.sub {
  color: #8f8276;
  font-size: 12px;
}

.stock {
  margin-top: 6px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.mb {
  margin-bottom: 12px;
}

.category-create {
  display: grid;
  grid-template-columns: 1fr 120px auto;
  gap: 10px;
  margin-bottom: 12px;
}

@media (max-width: 768px) {
  .page-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .keyword {
    width: 100%;
  }
}
</style>
