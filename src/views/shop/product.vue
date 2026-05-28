<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { shopApi, type PublicProduct, type PublicStore } from "@/api/shop";
import { shopImage, yuan } from "./format";

defineOptions({ name: "PublicShopProduct" });

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const buying = ref(false);
const error = ref("");
const store = ref<PublicStore | null>(null);
const product = ref<PublicProduct | null>(null);
const buyerContact = ref("");

const productKey = computed(() =>
  String(route.params.productKey || route.query.id || "").trim()
);
const previewImages = computed(() => product.value?.preview_images || []);
const soldOut = computed(() => product.value?.stock_status === "sold_out");

async function loadProduct() {
  loading.value = true;
  error.value = "";
  try {
    if (!productKey.value) throw new Error("商品不存在");
    const data = await shopApi.product(productKey.value);
    store.value = data.store;
    product.value = data.product;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "商品暂不可访问";
  } finally {
    loading.value = false;
  }
}

async function createDraft() {
  if (!product.value || soldOut.value) return;
  buying.value = true;
  try {
    const data = await shopApi.createOrderDraft(product.value.product_key, {
      buyer_contact: buyerContact.value.trim(),
      source_channel: "admin_public_h5"
    });
    router.push(`/shop/checkout/${encodeURIComponent(data.order_draft.id)}`);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "下单失败，请稍后再试";
  } finally {
    buying.value = false;
  }
}

function openStore() {
  if (store.value?.store_key) {
    router.push(`/shop/store/${encodeURIComponent(store.value.store_key)}`);
  }
}

onMounted(loadProduct);
</script>

<template>
  <main class="shop-page with-bottom">
    <section v-if="loading" class="state-panel">正在打开商品...</section>
    <section v-else-if="error && !product" class="state-panel error">{{ error }}</section>
    <template v-else-if="product">
      <section class="product-hero">
        <div class="cover-box">
          <img v-if="shopImage(product.cover_url)" :src="product.cover_url" alt="" />
          <span v-else>{{ product.title.slice(0, 1) }}</span>
        </div>
        <div class="product-copy">
          <button class="store-link" @click="openStore">{{ store?.name || "Dou 小店" }}</button>
          <h1>{{ product.title }}</h1>
          <p>{{ product.summary }}</p>
          <div class="price-line">
            <strong>{{ yuan(product.price) }}</strong>
            <span>已售 {{ product.sales_count || 0 }}</span>
          </div>
          <div class="badges">
            <span>{{ product.delivery_type === "code" ? "卡密自动发放" : "资源资料交付" }}</span>
            <span>售后协商入口</span>
            <span>支付前锁价</span>
          </div>
        </div>
      </section>

      <section class="section-block">
        <h2>预览部分</h2>
        <p v-if="product.preview_text" class="preline">{{ product.preview_text }}</p>
        <div v-if="previewImages.length" class="preview-grid">
          <img v-for="src in previewImages" :key="src" :src="src" alt="" />
        </div>
        <p v-if="!product.preview_text && !previewImages.length" class="muted">圈主暂未上传预览内容。</p>
      </section>

      <section class="section-block">
        <h2>购买信息</h2>
        <label class="contact-field">
          <span>联系方式</span>
          <input
            v-model="buyerContact"
            maxlength="80"
            placeholder="微信号 / 手机号 / 邮箱，便于订单沟通"
          />
        </label>
        <p class="muted">P1 仅锁定订单草稿和商品价格，扫码支付会在 P2 接入。</p>
        <p v-if="error" class="inline-error">{{ error }}</p>
      </section>

      <section class="section-block compact">
        <h2>交付说明</h2>
        <div class="notice-list">
          <span>付款成功后展示购买后的资源或卡密。</span>
          <span>购买前只能看到公开预览，交付链接和卡密不会公开泄露。</span>
          <span>如商品或店铺暂停营业，订单草稿不会继续创建。</span>
        </div>
      </section>

      <div class="bottom-bar">
        <div>
          <span>应付</span>
          <strong>{{ yuan(product.price) }}</strong>
        </div>
        <button :disabled="soldOut || buying" @click="createDraft">
          {{ soldOut ? "已售罄" : buying ? "正在锁单" : "立即购买" }}
        </button>
      </div>
    </template>
  </main>
</template>

<style scoped>
.shop-page {
  min-height: 100vh;
  padding: 18px;
  color: #201b16;
  background: #f7faf8;
}

.with-bottom {
  padding-bottom: 96px;
}

.product-hero,
.section-block {
  max-width: 980px;
  margin: 0 auto 14px;
  background: #fff;
  border: 1px solid #e2eae6;
  border-radius: 8px;
}

.product-hero {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 24px;
  padding: 18px;
}

.cover-box {
  display: grid;
  width: 100%;
  aspect-ratio: 1 / 1;
  place-items: center;
  overflow: hidden;
  color: #327060;
  font-size: 60px;
  font-weight: 800;
  background: #eef6f2;
  border-radius: 8px;
}

.cover-box img,
.preview-grid img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.store-link {
  padding: 0;
  color: #327060;
  font-weight: 700;
  background: transparent;
  border: 0;
}

h1 {
  margin: 12px 0;
  font-size: 28px;
  line-height: 1.25;
}

.product-copy p,
.muted {
  color: #69736e;
  line-height: 1.7;
}

.price-line {
  display: flex;
  align-items: end;
  gap: 14px;
  margin: 18px 0;
}

.price-line strong,
.bottom-bar strong {
  color: #b64826;
  font-size: 30px;
}

.price-line span,
.bottom-bar span {
  color: #7e8983;
  font-size: 13px;
}

.badges,
.notice-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.badges span,
.notice-list span {
  padding: 7px 10px;
  color: #3f5f56;
  background: #eef6f2;
  border-radius: 6px;
}

.section-block {
  padding: 18px;
}

.section-block h2 {
  margin: 0 0 12px;
  font-size: 17px;
}

.preline {
  color: #3d3731;
  white-space: pre-wrap;
  line-height: 1.8;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
}

.preview-grid img {
  aspect-ratio: 1 / 1;
  border-radius: 8px;
}

.contact-field {
  display: grid;
  gap: 8px;
}

.contact-field span {
  font-weight: 700;
}

.contact-field input {
  height: 44px;
  padding: 0 12px;
  color: #201b16;
  background: #fbfcfb;
  border: 1px solid #dbe6e1;
  border-radius: 6px;
}

.inline-error,
.error {
  color: #a33424;
}

.bottom-bar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 28px;
  padding: 12px 18px;
  background: rgba(255, 255, 255, 0.96);
  border-top: 1px solid #e2eae6;
  backdrop-filter: blur(12px);
}

.bottom-bar div {
  display: grid;
  min-width: 150px;
}

.bottom-bar button {
  width: min(320px, 46vw);
  height: 46px;
  color: #fff;
  font-weight: 800;
  background: #1f7a64;
  border: 0;
  border-radius: 6px;
}

.bottom-bar button:disabled {
  background: #a9b6b0;
}

.state-panel {
  max-width: 760px;
  margin: 28px auto;
  padding: 22px;
  text-align: center;
  background: #fff;
  border: 1px solid #e2eae6;
  border-radius: 8px;
}

@media (max-width: 760px) {
  .shop-page {
    padding: 12px;
  }

  .product-hero {
    grid-template-columns: 1fr;
  }

  .bottom-bar {
    justify-content: space-between;
  }

  .bottom-bar button {
    width: 48vw;
  }
}
</style>
