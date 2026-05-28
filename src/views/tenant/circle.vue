<script setup lang="ts">
import { CopyDocument, Refresh } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { computed, onMounted, reactive, ref } from "vue";
import { hasPerms } from "@/utils/auth";
import { tenantApi, type ManagedCircle } from "@/api/admin";

defineOptions({ name: "TenantCircle" });

const loading = ref(false);
const saving = ref(false);
const circle = ref<ManagedCircle | null>(null);
const rooms = ref<Array<Record<string, any>>>([]);
const subscription = ref<Record<string, any> | null>(null);
const subscriptionStatus = ref<Record<string, any>>({});
const writable = ref(true);
const form = reactive({
  name: "",
  description: "",
  cover_image: "",
  is_public_square: false,
  is_private: false
});

const canManage = computed(() => hasPerms("tenant:store:manage"));
const readonly = computed(() => !canManage.value || !writable.value);
const shopLink = computed(() => {
  const base = String(import.meta.env.VITE_SHOP_BASE_URL || window.location.origin).replace(/\/$/, "");
  return `${base}/s/${circle.value?.id || ""}`;
});

function statusLabel(status?: string) {
  return (
    {
      none: "未开通",
      trial: "试用中",
      active: "已开通",
      expired: "已到期",
      suspended: "已暂停"
    }[String(status || "none")] || status || "-"
  );
}

function roomTypeLabel(type: string) {
  return type === "main" ? "主房间" : type === "paid" ? "付费房间" : type || "-";
}

function assignForm(data: ManagedCircle) {
  form.name = data.name || "";
  form.description = data.description || "";
  form.cover_image = data.cover_image || "";
  form.is_public_square = !!data.is_public_square;
  form.is_private = !!data.is_private;
}

async function loadData() {
  loading.value = true;
  try {
    const data = await tenantApi.circle();
    circle.value = data.circle;
    rooms.value = data.rooms;
    subscription.value = data.subscription || null;
    subscriptionStatus.value = data.subscription_status || {};
    writable.value = data.writable !== false;
    assignForm(data.circle);
  } finally {
    loading.value = false;
  }
}

async function save() {
  if (readonly.value) return;
  saving.value = true;
  try {
    const data = await tenantApi.updateCircle({ ...form });
    circle.value = data.circle;
    assignForm(data.circle);
    ElMessage.success("店铺资料已保存");
  } finally {
    saving.value = false;
  }
}

async function copyShopLink() {
  if (!circle.value?.id) return;
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(shopLink.value);
  } else {
    const textarea = document.createElement("textarea");
    textarea.value = shopLink.value;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
  ElMessage.success("店铺链接已复制");
}

onMounted(loadData);
</script>

<template>
  <div class="tenant-page" v-loading="loading">
    <div class="page-head">
      <div>
        <h1>店铺资料</h1>
        <p>维护买家看到的店铺基础信息，后续 H5 店铺页会复用这些资料。</p>
      </div>
      <div class="head-actions">
        <el-button :icon="Refresh" @click="loadData">刷新</el-button>
        <el-button type="primary" :loading="saving" :disabled="readonly" @click="save">
          保存资料
        </el-button>
      </div>
    </div>

    <el-alert
      v-if="!canManage"
      class="mb"
      type="info"
      show-icon
      :closable="false"
      title="当前账号为只读权限，可查看店铺资料，不能保存修改。"
    />
    <el-alert
      v-else-if="!writable"
      class="mb"
      type="warning"
      show-icon
      :closable="false"
      title="当前套餐已到期或暂停，店铺资料进入只读保护。"
    />

    <el-row :gutter="16">
      <el-col :xs="24" :lg="14">
        <div class="panel">
          <div class="panel-title">
            <h2>基础资料</h2>
            <el-tag :type="readonly ? 'info' : 'success'">
              {{ readonly ? "只读" : "可编辑" }}
            </el-tag>
          </div>
          <el-form label-width="96px">
            <el-form-item label="店铺名称" required>
              <el-input v-model="form.name" :disabled="readonly" maxlength="60" show-word-limit />
            </el-form-item>
            <el-form-item label="店铺简介">
              <el-input
                v-model="form.description"
                :disabled="readonly"
                type="textarea"
                :rows="5"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>
            <el-form-item label="店铺封面">
              <el-input
                v-model="form.cover_image"
                :disabled="readonly"
                maxlength="1000"
                placeholder="请填写平台上传后的图片地址"
              />
            </el-form-item>
            <el-form-item label="公开展示">
              <el-switch
                v-model="form.is_public_square"
                :disabled="readonly"
                active-text="展示"
                inactive-text="隐藏"
              />
            </el-form-item>
            <el-form-item label="入圈方式">
              <el-radio-group v-model="form.is_private" :disabled="readonly">
                <el-radio-button :value="false">公开加入</el-radio-button>
                <el-radio-button :value="true">审核加入</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-form>
        </div>
      </el-col>
      <el-col :xs="24" :lg="10">
        <div class="panel">
          <div class="panel-title">
            <h2>经营信息</h2>
            <el-tag>{{ statusLabel(subscriptionStatus.status as string) }}</el-tag>
          </div>
          <div class="line"><span>圈号</span><strong>{{ circle?.circle_code || "-" }}</strong></div>
          <div class="line"><span>成员上限</span><strong>{{ circle?.max_members || 0 }}</strong></div>
          <div class="line"><span>店铺状态</span><strong>{{ circle?.status || "-" }}</strong></div>
          <div class="line"><span>内容审核</span><strong>{{ circle?.audit_status || "-" }}</strong></div>
          <div class="line"><span>当前套餐</span><strong>{{ subscription?.plan_name || "未开通" }}</strong></div>
          <div class="line"><span>服务到期</span><strong>{{ subscriptionStatus.paid_until || "-" }}</strong></div>
          <div class="link-row">
            <el-input :model-value="shopLink" readonly />
            <el-button :icon="CopyDocument" @click="copyShopLink">复制</el-button>
          </div>
        </div>
      </el-col>
    </el-row>

    <div class="panel mt">
      <h2>房间</h2>
      <el-table :data="rooms" border>
        <el-table-column label="房间" min-width="180">
          <template #default="{ row }">
            <div class="main">{{ row.name || "-" }}</div>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="120">
          <template #default="{ row }">{{ roomTypeLabel(row.type) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="110" />
        <el-table-column prop="audit_status" label="审核" width="110" />
        <el-table-column prop="price" label="价格" width="120" />
        <el-table-column prop="max_members" label="人数上限" width="120" />
      </el-table>
    </div>
  </div>
</template>

<style scoped>
.tenant-page {
  padding: 16px;
}

.page-head,
.panel-title,
.head-actions,
.link-row {
  display: flex;
  align-items: center;
}

.page-head {
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.page-head h1,
.panel h2 {
  margin: 0;
  color: #221a14;
}

.page-head p {
  margin: 6px 0 0;
  color: #766b61;
}

.head-actions,
.link-row {
  gap: 8px;
}

.panel {
  padding: 16px;
  background: #fffdf9;
  border: 1px solid #e6ddd2;
  border-radius: 8px;
}

.panel-title {
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.line {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-top: 1px solid #efe6db;
}

.line span {
  color: #766b61;
}

.link-row {
  padding-top: 12px;
  border-top: 1px solid #efe6db;
}

.main {
  font-weight: 700;
  color: #221a14;
}

.mt {
  margin-top: 16px;
}

.mb {
  margin-bottom: 16px;
}
</style>
