<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  shopApi,
  type PaymentChannel,
  type PromotionQuote,
  type PublicProduct,
  type PublicStore
} from "@/api/shop";
import { validateShopContact } from "./contact";
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
const couponCode = ref("");
const inviteCode = ref("");
const quoteLoading = ref(false);
const quote = ref<PromotionQuote | null>(null);
const paymentChannels = ref<Record<string, { enabled: boolean }>>({});
const selectedChannel = ref<PaymentChannel>("wechat_native");

const productKey = computed(() =>
  String(route.params.productKey || route.query.id || "").trim()
);
const previewImages = computed(() => product.value?.preview_images || []);
const soldOut = computed(() => product.value?.stock_status === "sold_out");
const contactValidation = computed(() =>
  validateShopContact(buyerContact.value)
);
const payableAmount = computed(
  () => quote.value?.payable_amount || product.value?.price || 0
);
const discountAmount = computed(() => quote.value?.discount_amount || 0);
const hasEnabledChannels = computed(() =>
  ["wechat_native", "alipay_precreate"].some(item =>
    isChannelEnabled(item as PaymentChannel)
  )
);
const buyButtonText = computed(() => {
  if (soldOut.value) return "已售罄";
  if (buying.value) {
    return selectedChannel.value === "wechat_native"
      ? "正在生成微信支付"
      : "正在生成支付宝";
  }
  return "立即购买";
});

function normalizedQueryChannel(): PaymentChannel | "" {
  const raw = String(
    route.query.channel || route.query.pay_channel || route.query.pay || ""
  )
    .trim()
    .toLowerCase();
  if (raw.includes("ali")) return "alipay_precreate";
  if (raw.includes("wechat") || raw.includes("wx")) return "wechat_native";
  return "";
}

function isChannelEnabled(name: PaymentChannel) {
  const hasChannelMap = Object.keys(paymentChannels.value).length > 0;
  if (!hasChannelMap) return true;
  const state = paymentChannels.value[name];
  return state?.enabled === true;
}

function chooseDefaultChannel(channels = paymentChannels.value) {
  const preferred = normalizedQueryChannel();
  if (preferred && isChannelEnabled(preferred)) {
    selectedChannel.value = preferred;
    return;
  }
  if (!Object.keys(channels).length || channels.wechat_native?.enabled === true) {
    selectedChannel.value = "wechat_native";
    return;
  }
  if (channels.alipay_precreate?.enabled === true) {
    selectedChannel.value = "alipay_precreate";
  }
}

function applyPaymentChannels(channels?: Record<string, { enabled: boolean }>) {
  paymentChannels.value = channels || {};
  if (!isChannelEnabled(selectedChannel.value)) chooseDefaultChannel();
}

async function loadProduct() {
  loading.value = true;
  error.value = "";
  try {
    if (!productKey.value) throw new Error("商品不存在");
    const data = await shopApi.product(productKey.value);
    store.value = data.store;
    product.value = data.product;
    applyPaymentChannels(data.payment_channels);
    couponCode.value = String(
      route.query.coupon || route.query.coupon_code || ""
    );
    inviteCode.value = String(
      route.query.invite || route.query.invite_code || ""
    );
    if (couponCode.value || inviteCode.value) await loadQuote();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "商品暂不可访问";
  } finally {
    loading.value = false;
  }
}

async function loadQuote() {
  if (!product.value) return;
  quoteLoading.value = true;
  error.value = "";
  try {
    const data = await shopApi.promotionQuote(product.value.product_key, {
      coupon_code: couponCode.value.trim(),
      invite_code: inviteCode.value.trim(),
      source_channel: inviteCode.value.trim()
        ? "invite_code"
        : "admin_public_h5"
    });
    quote.value = data.quote;
    if (
      (couponCode.value.trim() || inviteCode.value.trim()) &&
      !data.quote.coupon &&
      couponCode.value.trim()
    ) {
      error.value = "优惠券不可用或已过期";
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : "优惠试算失败";
  } finally {
    quoteLoading.value = false;
  }
}

async function createDraft() {
  if (buying.value) return;
  if (!product.value || soldOut.value) return;
  const validation = contactValidation.value;
  if (!validation.ok) {
    error.value = validation.message;
    return;
  }
  const contact = validation.normalized;
  buyerContact.value = contact;
  buying.value = true;
  error.value = "";
  let createdDraftId = "";
  try {
    const data = await shopApi.createOrderDraft(product.value.product_key, {
      buyer_contact: contact,
      coupon_code: couponCode.value.trim(),
      invite_code: inviteCode.value.trim(),
      source_channel: inviteCode.value.trim()
        ? "invite_code"
        : "admin_public_h5"
    });
    applyPaymentChannels(data.payment_channels);
    createdDraftId = data.order_draft.id;
    window.sessionStorage?.setItem(
      `shop_contact_${data.order_draft.id}`,
      contact
    );
    if (!hasEnabledChannels.value) {
      await router.push({
        path: `/shop/checkout/${encodeURIComponent(data.order_draft.id)}`
      });
      return;
    }
    await router.push({
      path: `/shop/checkout/${encodeURIComponent(data.order_draft.id)}`,
      query: {
        autopay: "1",
        channel:
          selectedChannel.value === "wechat_native" ? "wechat" : "alipay"
      }
    });
  } catch (err) {
    if (createdDraftId) {
      await router.push({
        path: `/shop/checkout/${encodeURIComponent(createdDraftId)}`,
        query: {
          autopay: "1",
          channel:
            selectedChannel.value === "wechat_native" ? "wechat" : "alipay"
        }
      });
      return;
    }
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
    <section v-else-if="error && !product" class="state-panel error">
      {{ error }}
    </section>
    <template v-else-if="product">
      <section class="product-hero">
        <div class="cover-box">
          <img
            v-if="shopImage(product.cover_url)"
            :src="product.cover_url"
            alt=""
          />
          <span v-else>{{ product.title.slice(0, 1) }}</span>
        </div>
        <div class="product-copy">
          <button class="store-link" @click="openStore">
            {{ store?.name || "Dou 小店" }}
          </button>
          <h1>{{ product.title }}</h1>
          <p>{{ product.summary }}</p>
          <div class="price-line">
            <strong>{{ yuan(product.price) }}</strong>
            <span>已售 {{ product.sales_count || 0 }}</span>
          </div>
          <div class="badges">
            <span>{{
              product.delivery_type === "code" ? "卡密自动发放" : "资源资料交付"
            }}</span>
            <span>售后协商入口</span>
            <span>支付前锁价</span>
          </div>
        </div>
      </section>

      <section class="section-block">
        <h2>预览部分</h2>
        <p v-if="product.preview_text" class="preline">
          {{ product.preview_text }}
        </p>
        <div v-if="previewImages.length" class="preview-grid">
          <img v-for="src in previewImages" :key="src" :src="src" alt="" />
        </div>
        <p v-if="!product.preview_text && !previewImages.length" class="muted">
          圈主暂未上传预览内容。
        </p>
      </section>

      <section class="section-block">
        <h2>购买信息</h2>
        <label class="contact-field">
          <span>联系方式（必填）</span>
          <input
            v-model="buyerContact"
            maxlength="80"
            name="buyerContact"
            autocomplete="on"
            autocapitalize="off"
            required
            spellcheck="false"
            placeholder="手机号 / QQ号 / 邮箱，便于订单沟通"
          />
        </label>
        <p class="muted">
          仅支持手机号、QQ号或邮箱。浏览器会尽量记住此项，便于后续下单和查单。
        </p>
        <div class="promo-grid">
          <label class="contact-field">
            <span>优惠券</span>
            <input
              v-model="couponCode"
              maxlength="40"
              placeholder="输入圈主发放的优惠券编码"
              @blur="loadQuote"
            />
          </label>
          <label class="contact-field">
            <span>邀请码</span>
            <input
              v-model="inviteCode"
              maxlength="40"
              placeholder="输入渠道邀请码"
              @blur="loadQuote"
            />
          </label>
        </div>
        <button
          class="quote-button"
          :disabled="quoteLoading"
          @click="loadQuote"
        >
          {{ quoteLoading ? "正在试算" : "试算优惠" }}
        </button>
        <div v-if="quote" class="quote-box">
          <span>原价 {{ yuan(quote.original_amount) }}</span>
          <span v-if="discountAmount > 0"
            >优惠 -{{ yuan(discountAmount) }}</span
          >
          <strong>应付 {{ yuan(payableAmount) }}</strong>
        </div>
        <div class="payment-methods">
          <span class="payment-title">支付方式</span>
          <div class="channel-tabs">
            <button
              :class="{ active: selectedChannel === 'wechat_native' }"
              :disabled="!isChannelEnabled('wechat_native') || buying"
              type="button"
              @click="selectedChannel = 'wechat_native'"
            >
              微信扫码
            </button>
            <button
              :class="{ active: selectedChannel === 'alipay_precreate' }"
              :disabled="!isChannelEnabled('alipay_precreate') || buying"
              type="button"
              @click="selectedChannel = 'alipay_precreate'"
            >
              支付宝
            </button>
          </div>
          <p class="muted">
            {{
              hasEnabledChannels
                ? selectedChannel === "wechat_native"
                  ? "将进入确认页并自动生成微信支付二维码。"
                  : "将进入确认页并自动生成支付宝扫码二维码。"
                : "当前暂无可用支付渠道，请联系商家。"
            }}
          </p>
        </div>
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
          <strong>{{ yuan(payableAmount) }}</strong>
        </div>
        <button
          :disabled="
            soldOut || buying || !contactValidation.ok || !hasEnabledChannels
          "
          :aria-busy="buying"
          @click="createDraft"
        >
          {{ buyButtonText }}
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
  place-items: center;
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  font-size: 60px;
  font-weight: 800;
  color: #327060;
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
  font-weight: 700;
  color: #327060;
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
  line-height: 1.7;
  color: #69736e;
}

.price-line {
  display: flex;
  gap: 14px;
  align-items: end;
  margin: 18px 0;
}

.price-line strong,
.bottom-bar strong {
  font-size: 30px;
  color: #b64826;
}

.price-line span,
.bottom-bar span {
  font-size: 13px;
  color: #7e8983;
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
  line-height: 1.8;
  color: #3d3731;
  white-space: pre-wrap;
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

.promo-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.quote-button {
  height: 38px;
  padding: 0 14px;
  margin-top: 12px;
  font-weight: 800;
  color: #2e5148;
  background: #eef6f2;
  border: 0;
  border-radius: 6px;
}

.quote-box {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  padding: 10px 12px;
  margin-top: 12px;
  background: #fff8f0;
  border: 1px solid #f0ddc8;
  border-radius: 6px;
}

.quote-box strong {
  color: #b64826;
}

.payment-methods {
  display: grid;
  gap: 10px;
  margin-top: 16px;
}

.payment-title {
  font-weight: 800;
}

.channel-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.channel-tabs button {
  height: 38px;
  padding: 0 16px;
  font-weight: 800;
  color: #2e5148;
  background: #eef6f2;
  border: 1px solid #d7e8e1;
  border-radius: 6px;
}

.channel-tabs button.active {
  color: #fff;
  background: #1f7a64;
  border-color: #1f7a64;
}

.channel-tabs button:disabled {
  color: #88958f;
  background: #f1f4f2;
  border-color: #e0e7e3;
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
  gap: 28px;
  align-items: center;
  justify-content: center;
  padding: 12px 18px;
  background: rgb(255 255 255 / 96%);
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
  font-weight: 800;
  color: #fff;
  background: #1f7a64;
  border: 0;
  border-radius: 6px;
}

.bottom-bar button:disabled {
  background: #a9b6b0;
}

.state-panel {
  max-width: 760px;
  padding: 22px;
  margin: 28px auto;
  text-align: center;
  background: #fff;
  border: 1px solid #e2eae6;
  border-radius: 8px;
}

@media (width <= 760px) {
  .shop-page {
    padding: 12px;
  }

  .product-hero {
    grid-template-columns: 1fr;
  }

  .promo-grid {
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
