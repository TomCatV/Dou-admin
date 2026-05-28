<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { notificationsApi, type AdminNotificationItem } from "@/api/admin";
import { noticeTabs, type ListItem, type TabItem } from "./data";
import NoticeList from "./components/NoticeList.vue";
import BellIcon from "~icons/ep/bell";

const router = useRouter();
const loading = ref(false);
const summaryTotal = ref(0);
const rawItems = ref<AdminNotificationItem[]>([]);
const activeKey = ref(noticeTabs[0]?.key || "todo");
let refreshTimer: number | undefined;

const notices = computed<TabItem[]>(() =>
  noticeTabs.map(tab => ({
    ...tab,
    list: rawItems.value
      .filter(item => item.category === tab.key)
      .map(toNoticeItem)
  }))
);

const noticesNum = computed(() => summaryTotal.value || rawItems.value.length);

const getLabel = computed(
  () => (item: TabItem) => {
    const count = item.list.reduce(
      (sum, notice) => sum + Number(notice.count || 1),
      0
    );
    return item.name + (count > 0 ? `(${count})` : "");
  }
);

function toNoticeItem(item: AdminNotificationItem): ListItem {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    datetime: item.latest_at || "",
    type: item.category,
    status: item.severity,
    extra: `${item.count}`,
    routePath: item.route_path,
    count: item.count
  };
}

async function loadNotifications(silent = false) {
  if (!silent) loading.value = true;
  try {
    const data = await notificationsApi.summary();
    rawItems.value = data.items || [];
    summaryTotal.value = Number(data.unread_like_count || data.total || 0);
    const firstNonEmpty = notices.value.find(item => item.list.length)?.key;
    if (firstNonEmpty && !notices.value.some(item => item.key === activeKey.value && item.list.length)) {
      activeKey.value = firstNonEmpty;
    }
  } catch (error: any) {
    if (!silent) ElMessage.error(error?.message || "通知提醒加载失败");
  } finally {
    loading.value = false;
  }
}

function handleVisibleChange(visible: boolean) {
  if (visible) loadNotifications(false);
}

function handleNoticeClick(item: ListItem) {
  if (!item.routePath) return;
  router.push(item.routePath);
}

onMounted(() => {
  loadNotifications(true);
  refreshTimer = window.setInterval(() => loadNotifications(true), 60 * 1000);
});

onUnmounted(() => {
  if (refreshTimer) window.clearInterval(refreshTimer);
});
</script>

<template>
  <el-dropdown
    trigger="click"
    placement="bottom-end"
    @visible-change="handleVisibleChange"
  >
    <span
      :class="[
        'dropdown-badge',
        'navbar-bg-hover',
        'select-none',
        Number(noticesNum) !== 0 && 'mr-[10px]'
      ]"
    >
      <el-badge :value="Number(noticesNum) === 0 ? '' : noticesNum" :max="99">
        <span class="header-notice-icon">
          <IconifyIconOffline :icon="BellIcon" />
        </span>
      </el-badge>
    </span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-tabs
          v-model="activeKey"
          v-loading="loading"
          :stretch="true"
          class="dropdown-tabs"
          :style="{ width: '360px' }"
        >
          <template v-for="item in notices" :key="item.key">
            <el-tab-pane :label="getLabel(item)" :name="`${item.key}`">
              <el-scrollbar max-height="360px">
                <div class="noticeList-container">
                  <NoticeList
                    :list="item.list"
                    :emptyText="item.emptyText"
                    @item-click="handleNoticeClick"
                  />
                </div>
              </el-scrollbar>
            </el-tab-pane>
          </template>
        </el-tabs>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style lang="scss" scoped>
.dropdown-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 48px;
  cursor: pointer;

  .header-notice-icon {
    font-size: 18px;
  }
}

.dropdown-tabs {
  .noticeList-container {
    padding: 15px 24px 0;
  }

  :deep(.el-tabs__header) {
    margin: 0;
  }

  :deep(.el-tabs__nav-wrap)::after {
    height: 1px;
  }

  :deep(.el-tabs__nav-wrap) {
    padding: 0 24px;
  }

  :deep(.el-empty) {
    padding: 30px 0;
  }
}
</style>
