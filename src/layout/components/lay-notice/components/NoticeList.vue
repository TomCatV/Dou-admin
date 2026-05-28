<script setup lang="ts">
import { PropType } from "vue";
import { ListItem } from "../data";
import NoticeItem from "./NoticeItem.vue";

defineProps({
  list: {
    type: Array as PropType<Array<ListItem>>,
    default: () => []
  },
  emptyText: {
    type: String,
    default: ""
  }
});

const emit = defineEmits<{
  (e: "item-click", item: ListItem): void;
}>();
</script>

<template>
  <div v-if="list.length">
    <NoticeItem
      v-for="item in list"
      :key="item.id"
      :noticeItem="item"
      @click="emit('item-click', item)"
    />
  </div>
  <el-empty v-else :description="emptyText" />
</template>
