<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { shopApi, type PublicOrder } from "@/api/shop";
import { validateShopContact } from "./contact";
import { shopImage, statusLabel, yuan } from "./format";

defineOptions({ name: "PublicShopReport" });

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const error = ref("");
const order = ref<PublicOrder | null>(null);
const contact = ref("");
const reportSubmitting = ref(false);
const reportMessage = ref("");
const reportForm = reactive({
  complaint_type: "invalid_product",
  description: ""
});

const complaintOptions = [
  { label: "资源与描述不符", value: "invalid_product" },
  { label: "无法获得支持", value: "no_support" },
  { label: "疑似虚假交易", value: "fraud" },
  { label: "色情低俗内容", value: "sexual_content" },
  { label: "赌博抽奖内容", value: "gambling_content" },
  { label: "其他问题", value: "other" }
];

const orderTitle = computed(
  () => order.value?.product_title || order.value?.resource_title || "商品"
);
const orderSummary = computed(
  () =>
    order.value?.product_summary ||
    order.value?.resource_summary ||
    "请确认订单信息后提交投诉内容。"
);
const orderCoverUrl = computed(
  () => order.value?.product_cover_url || order.value?.resource_cover_url || ""
);
const contactValidation = computed(() => validateShopContact(contact.value));
const canSubmitReport = computed(
  () =>
    Boolean(order.value?.can_report) &&
    contactValidation.value.ok &&
    Boolean(reportForm.description.trim())
);

function orderId() {
  return String(route.params.orderId || "").trim();
}

async function loadOrder() {
  const id = orderId();
  if (!id) {
    loading.value = false;
    order.value = null;
    error.value = "订单不存在";
    return;
  }

  const validation = validateShopContact(contact.value);
  if (!validation.ok) {
    loading.value = false;
    order.value = null;
    error.value = validation.message;
    return;
  }

  loading.value = true;
  error.value = "";
  contact.value = validation.normalized;
  try {
    const data = await shopApi.order(id, validation.normalized);
    order.value = data.order;
    window.sessionStorage?.setItem(
      `shop_order_contact_${id}`,
      validation.normalized
    );
    if (!data.order.can_report) {
      error.value = "当前订单暂不支持投诉举报";
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : "订单暂不可访问";
  } finally {
    loading.value = false;
  }
}

async function submitReport() {
  if (!order.value) return;
  const validation = contactValidation.value;
  if (!validation.ok) {
    reportMessage.value = validation.message;
    return;
  }
  if (!reportForm.description.trim()) {
    reportMessage.value = "请填写投诉举报说明";
    return;
  }
  reportSubmitting.value = true;
  reportMessage.value = "";
  try {
    const data = await shopApi.createOrderAfterSale(order.value.id, {
      buyer_contact: validation.normalized,
      complaint_type: reportForm.complaint_type,
      description: reportForm.description.trim()
    });
    reportMessage.value = data.reused
      ? "该订单已有投诉售后记录，已为你同步展示。"
      : "投诉举报已提交，小程序同一订单售后记录会同步可见。";
    reportForm.description = "";
  } catch (err) {
    reportMessage.value =
      err instanceof Error ? err.message : "提交失败，请稍后再试";
  } finally {
    reportSubmitting.value = false;
  }
}

function backToOrder() {
  const id = orderId();
  router.push({
    path: `/shop/order/${encodeURIComponent(id)}`,
    query: contact.value ? { contact: contact.value } : undefined
  });
}

onMounted(() => {
  const id = orderId();
  contact.value =
    String(route.query.contact || route.query.buyer_contact || "") ||
    window.sessionStorage?.getItem(`shop_order_contact_${id}`) ||
    "";
  if (contact.value.trim()) {
    loadOrder();
    return;
  }
  loading.value = false;
  error.value = "请输入下单时填写的手机号、QQ号或邮箱继续投诉";
});
</script>

<template>
  <main class="report-page">
    <section v-if="loading" class="state-panel">正在读取订单...</section>
    <section v-else-if="error && !order" class="state-panel">
      <p class="error">{{ error }}</p>
      <div class="contact-check">
        <input
          v-model="contact"
          maxlength="80"
          name="buyerContact"
          autocomplete="on"
          autocapitalize="off"
          spellcheck="false"
          placeholder="输入下单时填写的手机号 / QQ号 / 邮箱"
          @keyup.enter="loadOrder"
        />
        <button @click="loadOrder">读取订单</button>
      </div>
    </section>
    <template v-else-if="order">
      <section class="report-card">
        <h1>投诉举报</h1>
        <div class="product-row">
          <img v-if="shopImage(orderCoverUrl)" :src="orderCoverUrl" alt="" />
          <div v-else class="fallback">{{ orderTitle.slice(0, 1) }}</div>
          <div>
            <strong>{{ orderTitle }}</strong>
            <p>{{ orderSummary }}</p>
          </div>
        </div>
        <dl>
          <div>
            <dt>订单状态</dt>
            <dd>{{ statusLabel(order.status) }}</dd>
          </div>
          <div>
            <dt>订单金额</dt>
            <dd class="price">{{ yuan(order.amount) }}</dd>
          </div>
          <div>
            <dt>联系方式</dt>
            <dd>{{ order.buyer_contact_hint || "已核验" }}</dd>
          </div>
        </dl>
      </section>

      <section class="report-card">
        <p v-if="error" class="inline-error">{{ error }}</p>
        <p class="notice">
          提交后会进入同一订单售后记录，小程序与 H5 共用这一条处理线。
        </p>
        <label class="form-field">
          <span>下单联系方式</span>
          <input
            v-model="contact"
            maxlength="80"
            name="buyerContact"
            autocomplete="on"
            autocapitalize="off"
            spellcheck="false"
            placeholder="用于核验订单归属，仅支持手机号 / QQ号 / 邮箱"
          />
        </label>
        <label class="form-field">
          <span>问题类型</span>
          <select v-model="reportForm.complaint_type">
            <option
              v-for="item in complaintOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </option>
          </select>
        </label>
        <label class="form-field">
          <span>问题说明</span>
          <textarea
            v-model="reportForm.description"
            maxlength="1000"
            rows="6"
            placeholder="请描述遇到的问题、沟通过程或希望平台处理的诉求"
          />
        </label>
        <div class="actions">
          <button class="secondary" @click="backToOrder">返回订单</button>
          <button
            :disabled="reportSubmitting || !canSubmitReport"
            @click="submitReport"
          >
            {{ reportSubmitting ? "正在提交" : "提交投诉举报" }}
          </button>
        </div>
        <p v-if="reportMessage" class="notice">{{ reportMessage }}</p>
      </section>
    </template>
  </main>
</template>

<style scoped>
.report-page {
  min-height: 100vh;
  padding: 18px;
  color: #201b16;
  background: #f7faf8;
}

.report-card,
.state-panel {
  max-width: 760px;
  padding: 22px;
  margin: 28px auto;
  background: #fff;
  border: 1px solid #e2eae6;
  border-radius: 8px;
}

h1 {
  margin: 0 0 18px;
  font-size: 28px;
}

.product-row {
  display: grid;
  grid-template-columns: 82px 1fr;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.product-row img,
.fallback {
  width: 82px;
  height: 82px;
  border-radius: 8px;
}

.product-row img {
  object-fit: cover;
}

.fallback {
  display: grid;
  place-items: center;
  font-size: 28px;
  font-weight: 800;
  color: #327060;
  background: #eef6f2;
}

.product-row p,
.notice {
  line-height: 1.7;
  color: #69736e;
}

dl {
  display: grid;
  gap: 10px;
  margin: 0;
}

dl div {
  display: flex;
  gap: 14px;
  justify-content: space-between;
  padding: 10px 0;
  border-top: 1px solid #edf2ef;
}

dt {
  color: #69736e;
}

dd {
  max-width: 70%;
  margin: 0;
  text-align: right;
  word-break: break-all;
}

.price {
  font-size: 22px;
  font-weight: 800;
  color: #b64826;
}

.state-panel {
  text-align: center;
}

.error,
.inline-error {
  color: #a33424;
}

.contact-check {
  display: grid;
  grid-template-columns: 1fr 120px;
  gap: 10px;
  max-width: 520px;
  margin: 14px auto 0;
}

.form-field {
  display: grid;
  gap: 8px;
  margin-top: 12px;
}

.form-field span {
  font-weight: 700;
  color: #3d3731;
}

.contact-check input,
.form-field input,
.form-field select,
.form-field textarea {
  width: 100%;
  min-width: 0;
  padding: 0 12px;
  color: #201b16;
  background: #fbfcfb;
  border: 1px solid #dbe6e1;
  border-radius: 6px;
}

.contact-check input,
.contact-check button,
.form-field input,
.form-field select,
.actions button {
  height: 42px;
}

.form-field textarea {
  padding-top: 10px;
  line-height: 1.6;
  resize: vertical;
}

button {
  padding: 0 18px;
  font-weight: 800;
  color: #fff;
  background: #1f7a64;
  border: 0;
  border-radius: 6px;
}

.actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 14px;
}

.secondary {
  color: #2e5148;
  background: #eef6f2;
}

button:disabled {
  background: #a9b6b0;
}

@media (width <= 620px) {
  .contact-check,
  .actions {
    grid-template-columns: 1fr;
  }

  .actions {
    display: grid;
  }
}
</style>
