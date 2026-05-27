<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { tenantApi, type ManagedCircle } from "@/api/admin";

defineOptions({ name: "TenantCircle" });

const loading = ref(false);
const saving = ref(false);
const circle = ref<ManagedCircle | null>(null);
const rooms = ref<Array<Record<string, any>>>([]);
const form = reactive({ name: "", description: "", cover_image: "" });

async function loadData() {
  loading.value = true;
  try {
    const data = await tenantApi.circle();
    circle.value = data.circle;
    rooms.value = data.rooms;
    form.name = data.circle.name;
    form.description = data.circle.description;
    form.cover_image = data.circle.cover_image;
  } finally {
    loading.value = false;
  }
}

async function save() {
  saving.value = true;
  try {
    const data = await tenantApi.updateCircle({ ...form });
    circle.value = data.circle;
    ElMessage.success("圈子资料已保存");
  } finally {
    saving.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <div class="tenant-page" v-loading="loading">
    <div class="page-head">
      <h1>我的圈子</h1>
      <el-button type="primary" :loading="saving" @click="save">保存资料</el-button>
    </div>

    <el-row :gutter="16">
      <el-col :xs="24" :lg="14">
        <div class="panel">
          <el-form label-width="90px">
            <el-form-item label="圈子名称">
              <el-input v-model="form.name" maxlength="60" show-word-limit />
            </el-form-item>
            <el-form-item label="简介">
              <el-input v-model="form.description" type="textarea" :rows="5" maxlength="500" show-word-limit />
            </el-form-item>
            <el-form-item label="封面地址">
              <el-input v-model="form.cover_image" maxlength="1000" />
            </el-form-item>
          </el-form>
        </div>
      </el-col>
      <el-col :xs="24" :lg="10">
        <div class="panel">
          <h2>基础信息</h2>
          <div class="line"><span>圈号</span><strong>{{ circle?.circle_code || "-" }}</strong></div>
          <div class="line"><span>成员上限</span><strong>{{ circle?.max_members || 0 }}</strong></div>
          <div class="line"><span>状态</span><strong>{{ circle?.status || "-" }}</strong></div>
          <div class="line"><span>审核</span><strong>{{ circle?.audit_status || "-" }}</strong></div>
        </div>
      </el-col>
    </el-row>

    <div class="panel mt">
      <h2>房间</h2>
      <el-table :data="rooms" border>
        <el-table-column prop="name" label="房间" min-width="180" />
        <el-table-column prop="type" label="类型" width="110" />
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
.page-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.page-head h1,
.panel h2 {
  margin: 0;
  color: #221a14;
}
.panel {
  padding: 16px;
  background: #fffdf9;
  border: 1px solid #e6ddd2;
  border-radius: 8px;
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
.mt {
  margin-top: 16px;
}
</style>
