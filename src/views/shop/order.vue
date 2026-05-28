<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { shopApi, type PublicOrder } from "@/api/shop";
import { shopImage, statusLabel, yuan } from "./format";

defineOptions({ name: "PublicShopOrder" });

const route = useRoute();
const loading = ref(true);
const error = ref("");
const order = ref<PublicOrder | null>(null);

async function loadOrder() {
  loading.value = true;
  error.value = "";
  try {
    const id = String(route.params.orderId || "").trim();
    if (!id) throw new Error("订单不存在");
    const data = await shopApi.order(id);
    order.value = data.order;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "订单暂不可访问";
  } finally {
    loading.value = false;
  }
}

onMounted(loadOrder);
</script>

<template>
  <main class="order-page">
    <section v-if="loading" class="state-panel">正在读取订单...</section>
    <section v-else-if="error" class="state-panel error">{{ error }}</section>
    <section v-else-if="order" class="order-card">
      <p class="eyebrow">订单状态</p>
      <h1>{{ statusLabel(order.status) }}</h1>
      <div class="product-row">
        <img v-if="shopImage(order.resource_cover_url)" :src="order.resource_cover_url" alt="" />
        <div v-else class="fallback">{{ order.resource_title.slice(0, 1) }}</div>
        <div>
          <strong>{{ order.resource_title }}</strong>
          <p>{{ order.resource_summary }}</p>
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
        <div>
          <dt>支付时间</dt>
          <dd>{{ order.paid_at || "未支付" }}</dd>
        </div>
        <div>
          <dt>更新时间</dt>
          <dd>{{ order.updated_at }}</dd>
        </div>
      </dl>
      <p class="notice">P1 阶段不展示购买后的私密交付内容；支付和交付闭环会在 P2/P3 接入。</p>
    </section>
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
  margin: 28px auto;
  padding: 22px;
  background: #fff;
  border: 1px solid #e2eae6;
  border-radius: 8px;
}

.eyebrow {
  margin: 0 0 8px;
  color: #327060;
  font-weight: 800;
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
  color: #327060;
  font-size: 28px;
  font-weight: 800;
  background: #eef6f2;
}

.product-row p,
.notice {
  color: #69736e;
  line-height: 1.7;
}

dl {
  display: grid;
  gap: 10px;
  margin: 0;
}

dl div {
  display: flex;
  justify-content: space-between;
  gap: 14px;
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
  color: #b64826;
  font-size: 22px;
  font-weight: 800;
}

.state-panel {
  text-align: center;
}

.error {
  color: #a33424;
}
</style>
