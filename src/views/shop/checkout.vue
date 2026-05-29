<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import QRCode from "qrcode";
import { useRoute, useRouter } from "vue-router";
import {
  shopApi,
  type OrderDraft,
  type PaymentChannel,
  type PaymentIntent,
  type PublicOrder
} from "@/api/shop";
import { shopImage, statusLabel, yuan } from "./format";

defineOptions({ name: "PublicShopCheckout" });

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const creating = ref(false);
const syncing = ref(false);
const closing = ref(false);
const error = ref("");
const draft = ref<OrderDraft | null>(null);
const order = ref<PublicOrder | null>(null);
const paymentIntent = ref<PaymentIntent | null>(null);
const channel = ref<PaymentChannel>("alipay_precreate");
const paymentChannels = ref<Record<string, { enabled: boolean }>>({});
const countdown = ref(0);
const qrDataUrl = ref("");
let pollTimer: number | undefined;
let countdownTimer: number | undefined;

const snapshot = computed(() => draft.value?.product_snapshot);
const paymentReady = computed(
  () =>
    Boolean(paymentIntent.value?.qr_code_url) &&
    ["created", "qr_issued"].includes(String(paymentIntent.value?.status))
);
const hasEnabledChannels = computed(() =>
  ["alipay_precreate", "wechat_native"].some(item =>
    isChannelEnabled(item as PaymentChannel)
  )
);

function draftId() {
  return String(route.params.draftId || "").trim();
}

function rememberContact(orderId: string, contact = "") {
  if (!contact) return;
  window.sessionStorage?.setItem(`shop_order_contact_${orderId}`, contact);
}

function normalizedQueryChannel(): PaymentChannel | "" {
  const raw = String(route.query.channel || route.query.pay_channel || route.query.pay || "")
    .trim()
    .toLowerCase();
  if (raw.includes("ali")) return "alipay_precreate";
  if (raw.includes("wechat") || raw.includes("wx")) return "wechat_native";
  return "";
}

function isChannelEnabled(name: PaymentChannel) {
  const state = paymentChannels.value[name];
  return state ? state.enabled !== false : true;
}

function chooseDefaultChannel(channels = paymentChannels.value) {
  const preferred = normalizedQueryChannel();
  if (preferred && channels[preferred]?.enabled !== false) {
    channel.value = preferred;
    return;
  }
  if (channels.alipay_precreate?.enabled) {
    channel.value = "alipay_precreate";
    return;
  }
  if (channels.wechat_native?.enabled) {
    channel.value = "wechat_native";
  }
}

function applyPaymentChannels(channels?: Record<string, { enabled: boolean }>) {
  paymentChannels.value = channels || {};
  if (!paymentIntent.value) chooseDefaultChannel(paymentChannels.value);
}

function stopTimers() {
  if (pollTimer) window.clearInterval(pollTimer);
  if (countdownTimer) window.clearInterval(countdownTimer);
  pollTimer = undefined;
  countdownTimer = undefined;
}

function updateCountdown() {
  const expiresAt = paymentIntent.value?.expires_at;
  if (!expiresAt) {
    countdown.value = 0;
    return;
  }
  const end = new Date(`${expiresAt.replace(" ", "T")}Z`).getTime();
  const seconds = Math.max(0, Math.floor((end - Date.now()) / 1000));
  countdown.value = Number.isFinite(seconds) ? seconds : 0;
}

function startPolling() {
  stopTimers();
  updateCountdown();
  countdownTimer = window.setInterval(updateCountdown, 1000);
  pollTimer = window.setInterval(syncPaymentStatus, 4000);
}

async function renderQr() {
  qrDataUrl.value = "";
  const qr = paymentIntent.value?.qr_code_url || "";
  if (!qr) return;
  qrDataUrl.value = await QRCode.toDataURL(qr, {
    width: 220,
    margin: 1,
    errorCorrectionLevel: "M"
  });
}

async function loadDraft() {
  loading.value = true;
  error.value = "";
  try {
    const id = draftId();
    if (!id) throw new Error("订单草稿不存在");
    const data = await shopApi.orderDraft(id);
    draft.value = data.order_draft;
    applyPaymentChannels(data.payment_channels);
    if (data.order_draft.buyer_contact) {
      window.sessionStorage?.setItem(
        `shop_contact_${data.order_draft.id}`,
        data.order_draft.buyer_contact
      );
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : "订单草稿暂不可访问";
  } finally {
    loading.value = false;
  }
}

async function createOrder() {
  if (!draft.value) return;
  creating.value = true;
  error.value = "";
  try {
    const data = await shopApi.createOrderFromDraft(draft.value.id);
    order.value = data.order;
    if (data.order_draft) draft.value = data.order_draft;
    applyPaymentChannels(data.payment_channels);
    rememberContact(data.order.id, draft.value.buyer_contact);
    await createPaymentIntent();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "订单创建失败，请重新下单";
  } finally {
    creating.value = false;
  }
}

async function createPaymentIntent() {
  if (!order.value) return;
  if (!isChannelEnabled(channel.value)) {
    chooseDefaultChannel();
    if (!isChannelEnabled(channel.value)) {
      error.value = "当前暂无可用支付渠道，请联系商家。";
      return;
    }
  }
  creating.value = true;
  error.value = "";
  try {
    const data = await shopApi.createPaymentIntent(order.value.id, {
      channel: channel.value
    });
    order.value = data.order;
    paymentIntent.value = data.payment_intent;
    await renderQr();
    startPolling();
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : "支付二维码创建失败，请稍后重试";
  } finally {
    creating.value = false;
  }
}

async function syncPaymentStatus() {
  if (!order.value || !paymentIntent.value || syncing.value) return;
  syncing.value = true;
  try {
    const data = await shopApi.syncPaymentStatus(
      order.value.id,
      paymentIntent.value.id
    );
    order.value = data.order;
    paymentIntent.value = data.payment_intent;
    if (data.order.status === "paid" || data.payment_intent.status === "paid") {
      stopTimers();
      router.push({
        path: `/shop/order/${encodeURIComponent(data.order.id)}`,
        query: draft.value?.buyer_contact
          ? { contact: draft.value.buyer_contact }
          : undefined
      });
    }
  } catch {
    // Polling failure should not interrupt the payment page.
  } finally {
    syncing.value = false;
  }
}

async function closeIntent() {
  if (!paymentIntent.value || closing.value) return;
  closing.value = true;
  try {
    const data = await shopApi.closePaymentIntent(paymentIntent.value.id);
    paymentIntent.value = data.payment_intent;
    order.value = data.order;
    stopTimers();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "关闭支付单失败";
  } finally {
    closing.value = false;
  }
}

function backToProduct() {
  const key = snapshot.value?.product_key;
  if (key) router.push(`/shop/product/${encodeURIComponent(key)}`);
}

onMounted(async () => {
  await loadDraft();
  if (draft.value?.order_id) {
    order.value = {
      id: draft.value.order_id,
      circle_id: draft.value.circle_id,
      resource_card_id: draft.value.resource_card_id,
      amount: draft.value.amount,
      currency: "CNY",
      status: "created",
      created_at: draft.value.created_at,
      updated_at: draft.value.updated_at
    };
  }
});

onBeforeUnmount(stopTimers);
</script>

<template>
  <main class="checkout-page">
    <section v-if="loading" class="state-panel">正在确认订单...</section>
    <section v-else-if="error && !draft" class="state-panel error">{{ error }}</section>
    <template v-else-if="draft && snapshot">
      <section class="checkout-card">
        <h1>确认订单</h1>
        <div class="product-row">
          <img v-if="shopImage(snapshot.cover_url)" :src="snapshot.cover_url" alt="" />
          <div v-else class="fallback">{{ snapshot.title.slice(0, 1) }}</div>
          <div>
            <strong>{{ snapshot.title }}</strong>
            <p>{{ snapshot.summary }}</p>
          </div>
        </div>
        <dl>
          <div>
            <dt>订单状态</dt>
            <dd>{{ statusLabel(order?.status || draft.status) }}</dd>
          </div>
          <div>
            <dt>联系方式</dt>
            <dd>{{ draft.buyer_contact }}</dd>
          </div>
          <div>
            <dt>锁定金额</dt>
            <dd class="price">{{ yuan(draft.amount) }}</dd>
          </div>
          <div>
            <dt>草稿有效期</dt>
            <dd>{{ draft.expires_at }}</dd>
          </div>
        </dl>
      </section>

      <section class="checkout-card">
        <h2>扫码支付</h2>
        <div class="channel-tabs">
          <button
            :class="{ active: channel === 'wechat_native' }"
            :disabled="creating || Boolean(paymentIntent) || !isChannelEnabled('wechat_native')"
            @click="channel = 'wechat_native'"
          >
            微信
          </button>
          <button
            :class="{ active: channel === 'alipay_precreate' }"
            :disabled="creating || Boolean(paymentIntent) || !isChannelEnabled('alipay_precreate')"
            @click="channel = 'alipay_precreate'"
          >
            支付宝
          </button>
        </div>

        <div v-if="!paymentIntent" class="pay-start">
          <p class="notice">
            {{
              hasEnabledChannels
                ? "点击生成二维码后，请用对应 App 扫码付款。"
                : "当前暂无可用支付渠道，请联系商家。"
            }}
          </p>
          <button :disabled="creating || !hasEnabledChannels" @click="order ? createPaymentIntent() : createOrder()">
            {{ creating ? "正在生成" : "生成支付二维码" }}
          </button>
        </div>

        <div v-else class="qr-panel">
          <div class="qr-box">
            <img v-if="qrDataUrl && paymentReady" :src="qrDataUrl" alt="支付二维码" />
            <span v-else>{{ statusLabel(paymentIntent.status) }}</span>
          </div>
          <div class="qr-copy">
            <strong>{{ statusLabel(paymentIntent.status) }}</strong>
            <p class="notice">
              {{ channel === "wechat_native" ? "请使用微信扫码完成支付。" : "请使用支付宝扫码完成支付。" }}
            </p>
            <p v-if="paymentReady" class="timer">剩余 {{ countdown }} 秒</p>
            <p v-if="paymentIntent.last_error_message" class="inline-error">
              {{ paymentIntent.last_error_message }}
            </p>
            <div class="actions">
              <button :disabled="syncing" @click="syncPaymentStatus">
                {{ syncing ? "正在刷新" : "刷新支付状态" }}
              </button>
              <button
                class="secondary"
                :disabled="closing || paymentIntent.status === 'paid'"
                @click="closeIntent"
              >
                {{ closing ? "正在关闭" : "取消支付" }}
              </button>
            </div>
          </div>
        </div>
        <p v-if="error" class="inline-error">{{ error }}</p>
      </section>

      <section class="checkout-card subtle">
        <h2>付款后</h2>
        <p class="notice">
          后端收到可信支付回调或查单确认后，会自动交付资源或卡密，并跳转到订单页查看取货信息。
        </p>
        <button class="secondary" @click="backToProduct">返回商品</button>
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
  padding: 20px;
  margin: 0 auto 14px;
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

.fallback,
.qr-box {
  display: grid;
  place-items: center;
  color: #327060;
  background: #eef6f2;
}

.fallback {
  font-size: 28px;
  font-weight: 800;
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
  margin: 0;
  text-align: right;
}

.price {
  font-size: 22px;
  font-weight: 800;
  color: #b64826;
}

.channel-tabs,
.actions {
  display: flex;
  gap: 10px;
}

.channel-tabs {
  margin-bottom: 14px;
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

button:disabled {
  background: #a9b6b0;
}

.channel-tabs button {
  color: #2e5148;
  background: #eef6f2;
}

.channel-tabs button.active {
  color: #fff;
  background: #1f7a64;
}

.secondary {
  color: #2e5148;
  background: #eef6f2;
}

.pay-start {
  display: grid;
  gap: 12px;
}

.qr-panel {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 18px;
  align-items: center;
}

.qr-box {
  width: 240px;
  height: 240px;
  border: 1px solid #dbe6e1;
  border-radius: 8px;
}

.qr-box img {
  width: 220px;
  height: 220px;
}

.qr-copy strong {
  font-size: 20px;
}

.timer {
  font-weight: 800;
  color: #b64826;
}

.inline-error,
.error {
  color: #a33424;
}

.state-panel {
  margin-top: 28px;
  text-align: center;
}

.subtle {
  background: #fbfcfb;
}

@media (width <= 680px) {
  .qr-panel {
    grid-template-columns: 1fr;
  }

  .qr-box {
    width: 100%;
    max-width: 260px;
    margin: 0 auto;
  }
}
</style>
