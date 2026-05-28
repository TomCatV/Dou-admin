<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { shopApi, type OrderDraft } from "@/api/shop";
import { shopImage, statusLabel, yuan } from "./format";

defineOptions({ name: "PublicShopCheckout" });

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const error = ref("");
const draft = ref<OrderDraft | null>(null);

async function loadDraft() {
  loading.value = true;
  error.value = "";
  try {
    const id = String(route.params.draftId || "").trim();
    if (!id) throw new Error("订单草稿不存在");
    const data = await shopApi.orderDraft(id);
    draft.value = data.order_draft;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "订单草稿暂不可访问";
  } finally {
    loading.value = false;
  }
}

function backToProduct() {
  const key = draft.value?.product_snapshot?.product_key;
  if (key) router.push(`/shop/product/${encodeURIComponent(key)}`);
}

onMounted(loadDraft);
</script>

<template>
  <main class="checkout-page">
    <section v-if="loading" class="state-panel">正在确认订单...</section>
    <section v-else-if="error" class="state-panel error">{{ error }}</section>
    <template v-else-if="draft">
      <section class="checkout-card">
        <h1>确认订单</h1>
        <div class="product-row">
          <img
            v-if="shopImage(draft.product_snapshot.cover_url)"
            :src="draft.product_snapshot.cover_url"
            alt=""
          />
          <div v-else class="fallback">{{ draft.product_snapshot.title.slice(0, 1) }}</div>
          <div>
            <strong>{{ draft.product_snapshot.title }}</strong>
            <p>{{ draft.product_snapshot.summary }}</p>
          </div>
        </div>
        <dl>
          <div>
            <dt>订单状态</dt>
            <dd>{{ statusLabel(draft.status) }}</dd>
          </div>
          <div>
            <dt>联系方式</dt>
            <dd>{{ draft.buyer_contact || "未填写" }}</dd>
          </div>
          <div>
            <dt>锁定金额</dt>
            <dd class="price">{{ yuan(draft.amount) }}</dd>
          </div>
          <div>
            <dt>有效期</dt>
            <dd>{{ draft.expires_at }}</dd>
          </div>
        </dl>
      </section>

      <section class="checkout-card">
        <h2>下一步</h2>
        <p class="notice">订单草稿已创建。P2 接入微信/支付宝扫码支付后，这里会展示付款二维码和支付状态。</p>
        <div class="actions">
          <button @click="loadDraft">刷新状态</button>
          <button class="secondary" @click="backToProduct">返回商品</button>
        </div>
      </section>
    </template>
  </main>
</template>

<style scoped>
.checkout-page {
  min-height: 100vh;
  padding: 18px;
  color: #201b16;
  background: linear-gradient(180deg, #f7faf8 0%, #fff 46%);
}

.checkout-card,
.state-panel {
  max-width: 760px;
  margin: 0 auto 14px;
  padding: 20px;
  background: #fff;
  border: 1px solid #e2eae6;
  border-radius: 8px;
}

h1,
h2 {
  margin: 0 0 16px;
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
  margin: 0;
  text-align: right;
}

.price {
  color: #b64826;
  font-size: 22px;
  font-weight: 800;
}

.actions {
  display: flex;
  gap: 10px;
}

button {
  height: 42px;
  padding: 0 18px;
  color: #fff;
  font-weight: 800;
  background: #1f7a64;
  border: 0;
  border-radius: 6px;
}

.secondary {
  color: #2e5148;
  background: #eef6f2;
}

.state-panel {
  margin-top: 28px;
  text-align: center;
}

.error {
  color: #a33424;
}
</style>
