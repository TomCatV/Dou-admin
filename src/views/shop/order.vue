<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import WarningFilled from "~icons/ep/warning-filled";
import { shopApi, type PublicOrder } from "@/api/shop";
import { validateShopContact } from "./contact";
import { shopImage, statusLabel, yuan } from "./format";

defineOptions({ name: "PublicShopOrder" });

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const error = ref("");
const order = ref<PublicOrder | null>(null);
const contact = ref("");

const orderTitle = computed(
  () => order.value?.product_title || order.value?.resource_title || "商品"
);
const orderSummary = computed(
  () =>
    order.value?.product_summary ||
    order.value?.resource_summary ||
    "订单已创建，后续交付状态请以页面状态为准。"
);
const orderCoverUrl = computed(
  () => order.value?.product_cover_url || order.value?.resource_cover_url || ""
);
const delivery = computed(() => order.value?.delivery || null);
const canReport = computed(() => Boolean(order.value?.can_report));

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
  } catch (err) {
    error.value = err instanceof Error ? err.message : "订单暂不可访问";
  } finally {
    loading.value = false;
  }
}

function openReportPage() {
  if (!order.value) return;
  router.push({
    path: `/shop/order/${encodeURIComponent(order.value.id)}/report`,
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
  error.value = "请输入下单时填写的手机号、QQ号或邮箱查询订单";
});
</script>

<template>
  <main class="order-page">
    <section v-if="loading" class="state-panel">正在读取订单...</section>
    <section v-else-if="error" class="state-panel">
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
        <button @click="loadOrder">查询订单</button>
      </div>
    </section>
    <template v-else-if="order">
      <section class="order-card">
        <p class="eyebrow">订单状态</p>
        <h1>{{ statusLabel(order.status) }}</h1>
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
            <dt>订单编号</dt>
            <dd>{{ order.id }}</dd>
          </div>
          <div>
            <dt>订单金额</dt>
            <dd class="price">{{ yuan(order.amount) }}</dd>
          </div>
          <div v-if="order.discount_amount">
            <dt>优惠抵扣</dt>
            <dd>-{{ yuan(order.discount_amount) }}</dd>
          </div>
          <div
            v-if="order.coupon_code || order.invite_code || order.campaign_name"
          >
            <dt>成交来源</dt>
            <dd>
              {{
                order.coupon_code || order.invite_code || order.campaign_name
              }}
            </dd>
          </div>
          <div>
            <dt>支付时间</dt>
            <dd>{{ order.paid_at || "未支付" }}</dd>
          </div>
          <div>
            <dt>联系方式</dt>
            <dd>{{ order.buyer_contact_hint || "已核验" }}</dd>
          </div>
          <div>
            <dt>更新时间</dt>
            <dd>{{ order.updated_at }}</dd>
          </div>
        </dl>
      </section>

      <section v-if="delivery" class="order-card delivery-panel">
        <h2>取货信息</h2>
        <template v-if="delivery.type === 'code'">
          <dl>
            <div>
              <dt>卡密</dt>
              <dd>
                {{
                  delivery.assigned_code ||
                  "卡密发放异常，请联系商家补货或处理退款"
                }}
              </dd>
            </div>
            <div v-if="delivery.assigned_code_at">
              <dt>发放时间</dt>
              <dd>{{ delivery.assigned_code_at }}</dd>
            </div>
          </dl>
        </template>
        <template v-else>
          <dl>
            <div v-if="delivery.resource_url">
              <dt>资源链接</dt>
              <dd>
                <a :href="delivery.resource_url" target="_blank">{{
                  delivery.resource_url
                }}</a>
              </dd>
            </div>
            <div v-if="delivery.resource_access_code">
              <dt>提取码</dt>
              <dd>{{ delivery.resource_access_code }}</dd>
            </div>
            <div v-if="delivery.doc_url">
              <dt>说明链接</dt>
              <dd>
                <a :href="delivery.doc_url" target="_blank">{{
                  delivery.doc_url
                }}</a>
              </dd>
            </div>
          </dl>
        </template>
        <p v-if="delivery.doc_content" class="preline">
          {{ delivery.doc_content }}
        </p>
      </section>
      <section v-else class="order-card">
        <p class="notice">订单支付成功后，这里会展示购买后的资源或卡密。</p>
      </section>

      <section v-if="canReport" class="order-card report-entry">
        <h2>投诉举报</h2>
        <p class="notice">
          如需投诉商品、售后支持或发起平台介入，请进入独立投诉页填写表单。
        </p>
        <button class="report-button" @click="openReportPage">
          <IconifyIconOffline :icon="WarningFilled" class="report-icon" />
          <span>进入投诉页</span>
        </button>
      </section>
    </template>
  </main>
</template>

<style scoped>
.order-page {
  min-height: 100vh;
  padding: 18px;
  color: #201b16;
  background: #f7faf8;
}

.order-card,
.state-panel {
  max-width: 760px;
  padding: 22px;
  margin: 28px auto;
  background: #fff;
  border: 1px solid #e2eae6;
  border-radius: 8px;
}

.eyebrow {
  margin: 0 0 8px;
  font-weight: 800;
  color: #327060;
}

h1 {
  margin: 0 0 18px;
  font-size: 28px;
}

h2 {
  margin: 0 0 10px;
  font-size: 18px;
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

.delivery-panel {
  background: #fbfcfb;
}

.delivery-panel a {
  color: #1f7a64;
  word-break: break-all;
}

.preline {
  line-height: 1.8;
  color: #3d3731;
  white-space: pre-wrap;
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

.error {
  color: #a33424;
}

.contact-check {
  display: grid;
  grid-template-columns: 1fr 120px;
  gap: 10px;
  max-width: 520px;
  margin: 14px auto 0;
}

.contact-check input {
  width: 100%;
  min-width: 0;
  height: 42px;
  padding: 0 12px;
  color: #201b16;
  background: #fbfcfb;
  border: 1px solid #dbe6e1;
  border-radius: 6px;
}

button {
  height: 42px;
  padding: 0 18px;
  font-weight: 800;
  color: #fff;
  background: #1f7a64;
  border: 0;
  border-radius: 6px;
}

.report-entry {
  display: grid;
  gap: 14px;
}

.report-button {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  width: fit-content;
  min-width: 152px;
}

.report-icon {
  font-size: 18px;
}

@media (width <= 620px) {
  .contact-check {
    grid-template-columns: 1fr;
  }

  .report-button {
    width: 100%;
  }
}
</style>
