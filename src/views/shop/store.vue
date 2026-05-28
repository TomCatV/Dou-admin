<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { shopApi, type PublicProduct, type PublicStore } from "@/api/shop";
import { shopImage, yuan } from "./format";

defineOptions({ name: "PublicShopStore" });

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const error = ref("");
const store = ref<PublicStore | null>(null);
const categories = ref<Array<{ id: string; name: string; product_count: number }>>([]);
const products = ref<PublicProduct[]>([]);
const activeCategory = ref("");

const storeKey = computed(() =>
  String(route.params.storeKey || route.query.store || "").trim()
);

const filteredProducts = computed(() => {
  if (!activeCategory.value) return products.value;
  return products.value.filter(item => item.category_id === activeCategory.value);
});

async function loadStore() {
  loading.value = true;
  error.value = "";
  try {
    if (!storeKey.value) throw new Error("店铺不存在");
    const data = await shopApi.store(storeKey.value);
    store.value = data.store;
    categories.value = data.categories || [];
    products.value = data.products || [];
  } catch (err) {
    error.value = err instanceof Error ? err.message : "店铺暂不可访问";
  } finally {
    loading.value = false;
  }
}

function openProduct(item: PublicProduct) {
  router.push(`/shop/product/${encodeURIComponent(item.product_key)}`);
}

onMounted(loadStore);
</script>

<template>
  <main class="shop-page">
    <section v-if="loading" class="state-panel">正在打开店铺...</section>
    <section v-else-if="error" class="state-panel error">{{ error }}</section>
    <template v-else-if="store">
      <section class="store-hero">
        <div class="store-copy">
          <p class="eyebrow">Dou 小店</p>
          <h1>{{ store.name }}</h1>
          <p class="desc">{{ store.description || "精选资料与服务，拍下后按订单状态完成交付。" }}</p>
          <div class="store-meta">
            <span>{{ store.member_count || 0 }} 位成员</span>
            <span>{{ products.length }} 件商品</span>
          </div>
        </div>
        <img v-if="shopImage(store.cover_image)" :src="store.cover_image" alt="" />
      </section>

      <section v-if="store.status !== 'open'" class="state-panel">
        {{ store.closed_message || "店铺已暂停营业" }}
      </section>

      <nav v-if="categories.length" class="category-tabs">
        <button :class="{ active: !activeCategory }" @click="activeCategory = ''">
          全部
        </button>
        <button
          v-for="item in categories"
          :key="item.id"
          :class="{ active: activeCategory === item.id }"
          @click="activeCategory = item.id"
        >
          {{ item.name }}
        </button>
      </nav>

      <section class="product-grid">
        <button
          v-for="item in filteredProducts"
          :key="item.id"
          class="product-card"
          @click="openProduct(item)"
        >
          <span class="thumb">
            <img v-if="shopImage(item.cover_url)" :src="item.cover_url" alt="" />
            <span v-else>{{ item.title.slice(0, 1) }}</span>
          </span>
          <span class="product-info">
            <strong>{{ item.title }}</strong>
            <em>{{ item.summary }}</em>
            <span class="price-row">
              <b>{{ yuan(item.price) }}</b>
              <small>已售 {{ item.sales_count || 0 }}</small>
            </span>
          </span>
        </button>
      </section>

      <section v-if="!filteredProducts.length" class="state-panel">
        暂无可购买商品
      </section>
    </template>
  </main>
</template>

<style scoped>
.shop-page {
  min-height: 100vh;
  padding: 18px;
  color: #201b16;
  background: linear-gradient(180deg, #f7faf8 0%, #fff 42%);
}

.store-hero {
  display: grid;
  grid-template-columns: 1fr 132px;
  gap: 18px;
  max-width: 980px;
  margin: 0 auto 18px;
  padding: 24px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #e4ebe7;
  border-radius: 8px;
}

.store-hero img {
  width: 132px;
  height: 132px;
  object-fit: cover;
  border-radius: 8px;
}

.eyebrow {
  margin: 0 0 8px;
  color: #327060;
  font-size: 13px;
  font-weight: 700;
}

h1 {
  margin: 0;
  font-size: 26px;
}

.desc {
  margin: 10px 0 14px;
  color: #68605a;
  line-height: 1.7;
}

.store-meta {
  display: flex;
  gap: 10px;
  color: #8c5b3f;
  font-size: 13px;
}

.category-tabs {
  display: flex;
  gap: 8px;
  max-width: 980px;
  margin: 0 auto 14px;
  overflow-x: auto;
}

.category-tabs button {
  height: 34px;
  padding: 0 14px;
  color: #4f5f59;
  white-space: nowrap;
  background: #fff;
  border: 1px solid #dfe8e3;
  border-radius: 17px;
}

.category-tabs .active {
  color: #fff;
  background: #1f7a64;
  border-color: #1f7a64;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
  max-width: 980px;
  margin: 0 auto;
}

.product-card {
  display: grid;
  grid-template-columns: 84px 1fr;
  gap: 12px;
  width: 100%;
  padding: 10px;
  text-align: left;
  background: #fff;
  border: 1px solid #e4ebe7;
  border-radius: 8px;
}

.thumb {
  display: grid;
  width: 84px;
  height: 84px;
  place-items: center;
  overflow: hidden;
  color: #327060;
  font-size: 28px;
  font-weight: 800;
  background: #eef6f2;
  border-radius: 6px;
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
}

.product-info strong,
.product-info em {
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-info strong {
  white-space: nowrap;
}

.product-info em {
  display: -webkit-box;
  color: #6d746f;
  font-size: 12px;
  font-style: normal;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
}

.price-row b {
  color: #b64826;
  font-size: 18px;
}

.price-row small {
  color: #8b9690;
}

.state-panel {
  max-width: 980px;
  margin: 24px auto;
  padding: 22px;
  color: #52615b;
  text-align: center;
  background: #fff;
  border: 1px solid #e4ebe7;
  border-radius: 8px;
}

.error {
  color: #a33424;
}

@media (max-width: 640px) {
  .shop-page {
    padding: 12px;
  }

  .store-hero {
    grid-template-columns: 1fr;
    padding: 18px;
  }

  .store-hero img {
    width: 100%;
    height: 160px;
  }
}
</style>
