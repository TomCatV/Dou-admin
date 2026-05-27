<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { tenantConversionApi, type TenantLead } from "@/api/admin";

defineOptions({ name: "TenantConversionLeads" });

const loading = ref(false);
const saving = ref(false);
const rows = ref<TenantLead[]>([]);
const tags = ref<Array<Record<string, any>>>([]);
const total = ref(0);
const dialogVisible = ref(false);
const filters = reactive({ keyword: "", status: "", page: 1, page_size: 20 });
const form = reactive({
  id: "",
  name: "",
  phone: "",
  wechat_id: "",
  source: "",
  intent_level: "medium",
  status: "new",
  tags: [] as string[],
  note: ""
});
const tagForm = reactive({ name: "", color: "#409EFF" });

async function loadList() {
  loading.value = true;
  try {
    const data = await tenantConversionApi.leads({ ...filters });
    rows.value = data.items;
    total.value = data.total;
    tags.value = (await tenantConversionApi.tags()).items;
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  Object.assign(form, {
    id: "",
    name: "",
    phone: "",
    wechat_id: "",
    source: "",
    intent_level: "medium",
    status: "new",
    tags: [],
    note: ""
  });
  dialogVisible.value = true;
}

function openEdit(row: TenantLead) {
  Object.assign(form, { ...row, tags: row.tags || [] });
  dialogVisible.value = true;
}

async function saveLead() {
  saving.value = true;
  try {
    if (form.id) await tenantConversionApi.updateLead(form.id, { ...form });
    else await tenantConversionApi.createLead({ ...form });
    ElMessage.success("线索已保存");
    dialogVisible.value = false;
    await loadList();
  } finally {
    saving.value = false;
  }
}

async function saveTag() {
  if (!tagForm.name) return;
  await tenantConversionApi.createTag({ ...tagForm });
  tagForm.name = "";
  ElMessage.success("标签已创建");
  tags.value = (await tenantConversionApi.tags()).items;
}

onMounted(loadList);
</script>

<template>
  <div class="tenant-list-page">
    <div class="filter-bar">
      <el-input v-model="filters.keyword" class="keyword" clearable placeholder="搜索姓名、手机号、微信号或来源" @keyup.enter="loadList" />
      <el-select v-model="filters.status" class="filter-item" clearable placeholder="状态">
        <el-option label="新线索" value="new" />
        <el-option label="已联系" value="contacted" />
        <el-option label="已转化" value="converted" />
        <el-option label="已流失" value="lost" />
      </el-select>
      <el-button type="primary" @click="loadList">查询</el-button>
      <el-button type="success" @click="openCreate">新增线索</el-button>
    </div>

    <el-row :gutter="16">
      <el-col :xs="24" :lg="18">
        <el-table v-loading="loading" :data="rows" border>
          <el-table-column label="线索" min-width="200">
            <template #default="{ row }">
              <div class="main">{{ row.name || row.wechat_id || row.phone }}</div>
              <div class="sub">{{ row.source || "-" }}</div>
            </template>
          </el-table-column>
          <el-table-column prop="phone" label="手机号" width="140" />
          <el-table-column prop="wechat_id" label="微信号" width="150" />
          <el-table-column prop="intent_level" label="意向" width="100" />
          <el-table-column prop="status" label="状态" width="100" />
          <el-table-column label="标签" min-width="180">
            <template #default="{ row }">
              <el-tag v-for="tag in row.tags" :key="tag" class="tag" type="info">{{ tag }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination">
          <el-pagination v-model:current-page="filters.page" v-model:page-size="filters.page_size" layout="total, sizes, prev, pager, next" :page-sizes="[10,20,50,100]" :total="total" @change="loadList" />
        </div>
      </el-col>
      <el-col :xs="24" :lg="6">
        <div class="panel">
          <h2>成员标签</h2>
          <div class="tag-list">
            <el-tag v-for="tag in tags" :key="tag.id" class="tag" :color="tag.color" effect="dark">{{ tag.name }}</el-tag>
          </div>
          <el-input v-model="tagForm.name" placeholder="新标签名称" class="mt" />
          <el-color-picker v-model="tagForm.color" />
          <el-button class="full" type="primary" @click="saveTag">创建标签</el-button>
        </div>
      </el-col>
    </el-row>

    <el-dialog v-model="dialogVisible" title="线索" width="560px">
      <el-form label-width="80px">
        <el-form-item label="姓名"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="手机号"><el-input v-model="form.phone" /></el-form-item>
        <el-form-item label="微信号"><el-input v-model="form.wechat_id" /></el-form-item>
        <el-form-item label="来源"><el-input v-model="form.source" /></el-form-item>
        <el-form-item label="意向">
          <el-radio-group v-model="form.intent_level">
            <el-radio-button label="low">低</el-radio-button>
            <el-radio-button label="medium">中</el-radio-button>
            <el-radio-button label="high">高</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" class="full">
            <el-option label="新线索" value="new" />
            <el-option label="已联系" value="contacted" />
            <el-option label="已转化" value="converted" />
            <el-option label="已流失" value="lost" />
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <el-select v-model="form.tags" multiple class="full">
            <el-option v-for="tag in tags" :key="tag.id" :label="tag.name" :value="tag.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="form.note" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveLead">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.tenant-list-page { padding: 16px; }
.filter-bar { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; }
.keyword { width: 320px; }
.filter-item { width: 140px; }
.main { font-weight: 700; color: #221a14; }
.sub { color: #8f8276; font-size: 12px; }
.tag { margin: 0 4px 4px 0; }
.pagination { display: flex; justify-content: flex-end; margin-top: 12px; }
.panel { padding: 16px; background: #fffdf9; border: 1px solid #e6ddd2; border-radius: 8px; }
.panel h2 { margin: 0 0 12px; font-size: 16px; }
.tag-list { min-height: 40px; }
.full { width: 100%; }
.mt { margin-top: 12px; margin-bottom: 8px; }
</style>
