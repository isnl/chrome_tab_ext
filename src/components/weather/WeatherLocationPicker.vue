<script setup lang="ts">
import { nextTick, ref, watch } from "vue";

import type { LocationOption } from "@/types/weather";

const props = defineProps<{
  open: boolean;
  query: string;
  results: LocationOption[];
  message: string;
  searching: boolean;
}>();

const emit = defineEmits<{
  "update:query": [value: string];
  select: [value: LocationOption];
  close: [];
  quick: [value: string];
}>();

const inputRef = ref<HTMLInputElement | null>(null);
const quickCities = ["北京", "上海", "杭州", "广州", "深圳", "西安", "成都", "武汉"];

function handleInput(event: Event) {
  emit("update:query", (event.target as HTMLInputElement).value);
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      await nextTick();
      inputRef.value?.focus();
      inputRef.value?.select();
    }
  }
);
</script>

<template>
  <transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="translate-y-2 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-2 opacity-0"
  >
    <section v-if="open" class="inner-panel p-4 sm:p-5">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="section-kicker">Change City</p>
          <h4 class="mt-2 font-display text-[1.9rem] font-semibold tracking-tight text-slate-900">切换天气城市</h4>
          <p class="mt-2 text-sm leading-6 text-slate-500">支持搜索城市、区县和州省，保存后下次新标签页会直接沿用。</p>
        </div>

        <button class="ghost-button" type="button" @click="emit('close')">
          收起
        </button>
      </div>

      <div class="mt-5">
        <input
          ref="inputRef"
          :value="query"
          class="search-input h-14 px-4"
          type="search"
          autocomplete="off"
          spellcheck="false"
          placeholder="例如：上海、杭州、西安、成都"
          @input="handleInput"
        />
      </div>

      <div class="mt-3 flex flex-wrap gap-2">
        <button
          v-for="city in quickCities"
          :key="city"
          class="pill-tag normal-case tracking-normal transition duration-200 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
          type="button"
          @click="emit('quick', city)"
        >
          {{ city }}
        </button>
      </div>

      <p class="mt-4 text-sm text-slate-500">
        {{ searching ? "正在搜索..." : message }}
      </p>

      <div class="scroll-soft mt-4 flex max-h-72 flex-col gap-3 overflow-y-auto pr-1">
        <button
          v-for="item in results"
          :key="`${item.latitude}-${item.longitude}`"
          class="tone-panel flex items-center justify-between gap-4 px-4 py-3 text-left transition duration-200 hover:-translate-y-0.5"
          style="--tone-bg: linear-gradient(148deg, rgba(255,255,255,0.84), rgba(248,246,255,0.72)); --tone-glow: radial-gradient(circle at top right, rgba(139,92,246,0.1), transparent 42%);"
          type="button"
          @click="emit('select', item)"
        >
          <div>
            <p class="text-base font-semibold text-slate-900">{{ item.name }}</p>
            <p class="mt-1 text-sm text-slate-500">{{ [item.admin1, item.country].filter(Boolean).join(" · ") }}</p>
          </div>
          <span class="pill-tag normal-case tracking-normal">设为当前城市</span>
        </button>
      </div>
    </section>
  </transition>
</template>
