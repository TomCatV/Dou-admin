<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { tenantConversionApi } from "@/api/admin";

defineOptions({ name: "TenantConversionTools" });

const loading = ref(false);
const welcome = reactive({ enabled: false, message: "", task_text: "", coupon_code: "" });
const coupons = ref<Array<Record<string, any>>>([]);
const invites = ref<Array<Record<string, any>>>([]);
const campaigns = ref<Array<Record<string, any>>>([]);
const couponForm = reactive({ name: "", code: "", discount_value_yuan: "", min_amount_yuan: "", total_count: 0 });
const inviteForm = reactive({ code: "", channel: "", owner_name: "", max_uses: 0, reward_text: "" });
const campaignForm = reactive({ name: "", campaign_type: "signup", status: "active", goal_text: "" });

function yuan(value?: number) {
  return `¥${((Number(value) || 0) / 100).toFixed(2)}`;
}

async function loadData() {
  loading.value = true;
  try {
    Object.assign(welcome, (await tenantConversionApi.welcome()).automation);
    coupons.value = (await tenantConversionApi.coupons()).items;
    invites.value = (await tenantConversionApi.inviteCodes()).items;
    campaigns.value = (await tenantConversionApi.campaigns()).items;
  } finally {
    loading.value = false;
  }
}

async function saveWelcome() {
  await tenantConversionApi.saveWelcome({ ...welcome });
  ElMessage.success("欢迎自动化已保存");
}

async function createCoupon() {
  await tenantConversionApi.createCoupon({
    name: couponForm.name,
    code: couponForm.code,
    discount_value: Math.round(Number(couponForm.discount_value_yuan || 0) * 100),
    min_amount: Math.round(Number(couponForm.min_amount_yuan || 0) * 100),
    total_count: couponForm.total_count
  });
  Object.assign(couponForm, { name: "", code: "", discount_value_yuan: "", min_amount_yuan: "", total_count: 0 });
  ElMessage.success("优惠券已创建");
  coupons.value = (await tenantConversionApi.coupons()).items;
}

async function createInvite() {
  await tenantConversionApi.createInviteCode({ ...inviteForm });
  Object.assign(inviteForm, { code: "", channel: "", owner_name: "", max_uses: 0, reward_text: "" });
  ElMessage.success("邀请码已创建");
  invites.value = (await tenantConversionApi.inviteCodes()).items;
}

async function createCampaign() {
  await tenantConversionApi.createCampaign({ ...campaignForm });
  Object.assign(campaignForm, { name: "", campaign_type: "signup", status: "active", goal_text: "" });
  ElMessage.success("活动已创建");
  campaigns.value = (await tenantConversionApi.campaigns()).items;
}

onMounted(loadData);
</script>

<template>
  <div class="tenant-page" v-loading="loading">
    <div class="page-head">
      <h1>自动化与营销工具</h1>
      <el-button type="primary" @click="loadData">刷新</el-button>
    </div>

    <div class="panel">
      <h2>新人欢迎自动化</h2>
      <el-switch v-model="welcome.enabled" active-text="启用" inactive-text="停用" />
      <el-input v-model="welcome.message" class="mt" type="textarea" :rows="3" placeholder="欢迎语" />
      <el-input v-model="welcome.task_text" class="mt" placeholder="新人任务" />
      <el-input v-model="welcome.coupon_code" class="mt" placeholder="关联优惠券编码" />
      <el-button class="mt" type="primary" @click="saveWelcome">保存自动化</el-button>
    </div>

    <el-row :gutter="16" class="mt">
      <el-col :xs="24" :lg="8">
        <div class="panel">
          <h2>优惠券</h2>
          <el-input v-model="couponForm.name" placeholder="名称" />
          <el-input v-model="couponForm.code" class="mt" placeholder="编码，留空自动生成" />
          <el-input v-model="couponForm.discount_value_yuan" class="mt" placeholder="优惠金额，元" />
          <el-input v-model="couponForm.min_amount_yuan" class="mt" placeholder="最低消费，元" />
          <el-input-number v-model="couponForm.total_count" class="mt full" :min="0" />
          <el-button class="mt full" type="primary" @click="createCoupon">创建优惠券</el-button>
          <el-table class="mt" :data="coupons" border>
            <el-table-column prop="name" label="名称" />
            <el-table-column label="优惠" width="100"><template #default="{ row }">{{ yuan(row.discount_value) }}</template></el-table-column>
            <el-table-column prop="status" label="状态" width="90" />
          </el-table>
        </div>
      </el-col>
      <el-col :xs="24" :lg="8">
        <div class="panel">
          <h2>邀请码</h2>
          <el-input v-model="inviteForm.code" placeholder="编码，留空自动生成" />
          <el-input v-model="inviteForm.channel" class="mt" placeholder="渠道" />
          <el-input v-model="inviteForm.owner_name" class="mt" placeholder="负责人" />
          <el-input-number v-model="inviteForm.max_uses" class="mt full" :min="0" />
          <el-input v-model="inviteForm.reward_text" class="mt" placeholder="奖励说明" />
          <el-button class="mt full" type="primary" @click="createInvite">创建邀请码</el-button>
          <el-table class="mt" :data="invites" border>
            <el-table-column prop="code" label="编码" />
            <el-table-column prop="channel" label="渠道" />
            <el-table-column prop="used_count" label="使用" width="80" />
          </el-table>
        </div>
      </el-col>
      <el-col :xs="24" :lg="8">
        <div class="panel">
          <h2>转化活动</h2>
          <el-input v-model="campaignForm.name" placeholder="活动名称" />
          <el-select v-model="campaignForm.campaign_type" class="mt full">
            <el-option label="报名转化" value="signup" />
            <el-option label="优惠券" value="coupon" />
            <el-option label="打卡挑战" value="challenge" />
            <el-option label="直播课" value="webinar" />
            <el-option label="训练营" value="training" />
          </el-select>
          <el-input v-model="campaignForm.goal_text" class="mt" placeholder="目标" />
          <el-button class="mt full" type="primary" @click="createCampaign">创建活动</el-button>
          <el-table class="mt" :data="campaigns" border>
            <el-table-column prop="name" label="活动" />
            <el-table-column prop="campaign_type" label="类型" width="100" />
            <el-table-column prop="status" label="状态" width="90" />
          </el-table>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.tenant-page { padding: 16px; }
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-head h1, .panel h2 { margin: 0 0 12px; color: #221a14; }
.panel { padding: 16px; background: #fffdf9; border: 1px solid #e6ddd2; border-radius: 8px; }
.mt { margin-top: 12px; }
.full { width: 100%; }
</style>
