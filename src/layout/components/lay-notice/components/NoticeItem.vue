<script setup lang="ts">
import { ref, type PropType, nextTick } from "vue";
import { useNav } from "@/layout/hooks/useNav";
import { deviceDetection } from "@pureadmin/utils";
import type { ListItem } from "../data";

defineProps({
  noticeItem: {
    type: Object as PropType<ListItem>,
    default: () => ({})
  }
});

const emit = defineEmits<{
  (e: "click", item: ListItem): void;
}>();

const titleRef = ref<HTMLElement | null>(null);
const titleTooltip = ref(false);
const descriptionTooltip = ref(false);
const { tooltipEffect } = useNav();
const isMobile = deviceDetection();

function hoverTitle() {
  nextTick(() => {
    titleTooltip.value =
      Number(titleRef.value?.scrollWidth || 0) >
      Number(titleRef.value?.clientWidth || 0);
  });
}

function hoverDescription(event: MouseEvent, description: string) {
  const tempTag = document.createElement("span");
  tempTag.innerText = description;
  tempTag.className = "getDescriptionWidth";
  document.querySelector("body")?.appendChild(tempTag);
  const currentWidth =
    (document.querySelector(".getDescriptionWidth") as HTMLSpanElement)
      ?.offsetWidth || 0;
  document.querySelector(".getDescriptionWidth")?.remove();
  const cellWidth = (event.target as HTMLElement)?.offsetWidth || 0;
  descriptionTooltip.value = cellWidth > 0 && currentWidth > 2 * cellWidth;
}
</script>

<template>
  <div
    class="notice-container border-0 border-b-[1px] border-solid border-[#f0f0f0] dark:border-[#303030]"
    role="button"
    tabindex="0"
    @click="emit('click', noticeItem)"
    @keydown.enter="emit('click', noticeItem)"
  >
    <el-avatar
      v-if="noticeItem.avatar"
      :size="30"
      :src="noticeItem.avatar"
      class="notice-container-avatar"
    />
    <div class="notice-container-text">
      <div class="notice-text-title text-[#000000d9] dark:text-white">
        <el-tooltip
          popper-class="notice-title-popper"
          :effect="tooltipEffect"
          :disabled="!titleTooltip"
          :content="noticeItem.title"
          placement="top-start"
          :enterable="!isMobile"
        >
          <div
            ref="titleRef"
            class="notice-title-content"
            @mouseover="hoverTitle"
          >
            {{ noticeItem.title }}
          </div>
        </el-tooltip>
        <el-tag
          v-if="noticeItem?.extra"
          :type="noticeItem?.status"
          size="small"
          class="notice-title-extra"
        >
          {{ noticeItem?.extra }}
        </el-tag>
      </div>

      <el-tooltip
        popper-class="notice-title-popper"
        :effect="tooltipEffect"
        :disabled="!descriptionTooltip"
        :content="noticeItem.description"
        placement="top-start"
      >
        <div
          class="notice-text-description"
          @mouseover="hoverDescription($event, noticeItem.description)"
        >
          {{ noticeItem.description }}
        </div>
      </el-tooltip>
      <div class="notice-text-datetime text-[#00000073] dark:text-white">
        {{ noticeItem.datetime }}
      </div>
    </div>
  </div>
</template>

<style>
.notice-title-popper {
  max-width: 238px;
}
</style>

<style lang="scss" scoped>
.notice-container {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 12px 0;
  cursor: pointer;

  &:hover {
    .notice-title-content {
      color: var(--el-color-primary);
    }
  }

  .notice-container-avatar {
    margin-right: 16px;
    background: #fff;
  }

  .notice-container-text {
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: space-between;
    min-width: 0;

    .notice-text-title {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 8px;
      font-size: 14px;
      font-weight: 400;
      line-height: 1.5715;

      .notice-title-content {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .notice-title-extra {
        flex: none;
        font-weight: 400;
      }
    }

    .notice-text-description,
    .notice-text-datetime {
      font-size: 12px;
      line-height: 1.5715;
    }

    .notice-text-description {
      display: -webkit-box;
      overflow: hidden;
      text-overflow: ellipsis;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .notice-text-datetime {
      margin-top: 4px;
    }
  }
}
</style>
