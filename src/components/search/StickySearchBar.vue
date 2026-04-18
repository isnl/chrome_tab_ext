<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";

const props = defineProps<{
  dateLabel: string;
  timeLabel: string;
}>();

const searchInputRef = ref<HTMLInputElement | null>(null);
const query = ref("");

function focusInput(select = false) {
  nextTick(() => {
    const input = searchInputRef.value;
    if (!input) {
      return;
    }

    input.focus({ preventScroll: true });
    if (select) {
      input.select();
    }
  });
}

function submitSearch() {
  const target = query.value.trim()
    ? `https://www.google.com/search?q=${encodeURIComponent(query.value.trim())}`
    : "https://www.google.com/";

  window.location.assign(target);
}

function handleGlobalShortcut(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null;
  const isEditable =
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target?.isContentEditable;

  if (event.key === "/" && !isEditable) {
    event.preventDefault();
    focusInput(true);
    return;
  }

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    focusInput(true);
  }
}

onMounted(() => {
  window.addEventListener("keydown", handleGlobalShortcut);
  window.setTimeout(() => focusInput(false), 120);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleGlobalShortcut);
});
</script>

<template>
  <section aria-labelledby="new-tab-title">
    <div class="surface-card p-3 sm:p-4">
      <div
        class="grid gap-4 rounded-[30px] border border-white/80 bg-[linear-gradient(140deg,rgba(255,252,248,0.95),rgba(239,248,245,0.88)_56%,rgba(239,244,251,0.86))] p-5 sm:p-6 xl:grid-cols-[1.08fr_1.24fr]"
      >
        <div class="flex flex-col justify-between gap-6">
          <div>
            <div class="flex flex-wrap gap-2">
              <span class="pill-tag">Fluid New Tab</span>
              <span class="search-hint">Ambient Dashboard</span>
            </div>

            <p class="section-kicker mt-6">Start Page</p>
            <h1
              id="new-tab-title"
              class="mt-3 max-w-[13ch] font-display text-[2.85rem] leading-[0.96] font-semibold tracking-tight text-slate-900 sm:text-[3.35rem]"
            >
              把今天最重要的信息，安静地放回桌面。
            </h1>
            <p class="hero-note mt-4 max-w-2xl">
              搜索依然是第一入口，天气、日历和时间退到更舒服的位置，打开新标签后就能立刻进入状态。
            </p>
          </div>

          <div class="grid gap-3 sm:grid-cols-3">
            <article class="stat-tile">
              <p class="mini-kicker">Today</p>
              <p class="mt-3 text-lg font-semibold tracking-tight text-slate-900">{{ props.dateLabel }}</p>
              <p class="mt-1 text-sm text-slate-500">当前日期与节奏</p>
            </article>

            <article class="stat-tile">
              <p class="mini-kicker">Local Time</p>
              <p class="widget-value mt-3 text-[2rem] leading-none">{{ props.timeLabel }}</p>
              <p class="mt-1 text-sm text-slate-500">新标签页已经准备好</p>
            </article>

            <article class="stat-tile">
              <p class="mini-kicker">Shortcuts</p>
              <p class="mt-3 text-base font-semibold text-slate-900">/ · Ctrl/Cmd + K</p>
              <p class="mt-1 text-sm text-slate-500">随时召回搜索栏</p>
            </article>
          </div>
        </div>

        <div class="inner-panel overflow-hidden p-4 sm:p-5">
          <div class="grid h-full gap-4">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p class="section-kicker">Command Search</p>
                <h2 class="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.95rem]">直接开始搜索</h2>
                <p class="mt-3 max-w-xl text-sm leading-6 text-slate-500">
                  默认使用 Google。输入关键词后回车即可离开新标签页，保留你熟悉的搜索习惯。
                </p>
              </div>

              <div class="flex flex-wrap gap-2 sm:justify-end">
                <span class="search-hint">/ 聚焦</span>
                <span class="search-hint">Ctrl/Cmd + K</span>
              </div>
            </div>

            <form class="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center" @submit.prevent="submitSearch">
              <label class="relative block min-w-0 flex-1">
                <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <span class="search-badge h-12 w-12">GO</span>
                </span>
                <input
                  ref="searchInputRef"
                  v-model="query"
                  class="search-input h-16 pl-20 pr-5 text-base sm:text-lg"
                  type="search"
                  autocomplete="off"
                  spellcheck="false"
                  placeholder="搜索新闻、资料、问题、灵感..."
                />
              </label>

              <button class="search-submit h-16 min-w-[168px] px-6 text-sm sm:text-base" type="submit">
                Google 搜索
              </button>
            </form>

            <div class="grid gap-3 sm:grid-cols-3">
              <article
                class="tone-panel p-4"
                style="--tone-bg: linear-gradient(145deg, rgba(255,255,255,0.92), rgba(244,251,249,0.82)); --tone-glow: radial-gradient(circle at top right, rgba(45,212,191,0.16), transparent 40%);"
              >
                <p class="mini-kicker">Default</p>
                <p class="mt-3 text-base font-semibold text-slate-900">Google 作为默认入口</p>
                <p class="mt-1 text-sm text-slate-500">不改变你的搜索习惯，只把入口放得更顺手。</p>
              </article>

              <article
                class="tone-panel p-4"
                style="--tone-bg: linear-gradient(145deg, rgba(255,255,255,0.92), rgba(239,246,255,0.82)); --tone-glow: radial-gradient(circle at top right, rgba(96,165,250,0.18), transparent 42%);"
              >
                <p class="mini-kicker">Keyboard</p>
                <p class="mt-3 text-base font-semibold text-slate-900">键盘优先</p>
                <p class="mt-1 text-sm text-slate-500">打开新标签自动可输入，打断最少，节奏更快。</p>
              </article>

              <article
                class="tone-panel p-4"
                style="--tone-bg: linear-gradient(145deg, rgba(255,255,255,0.92), rgba(255,247,237,0.84)); --tone-glow: radial-gradient(circle at top right, rgba(251,146,60,0.18), transparent 40%);"
              >
                <p class="mini-kicker">Ambient</p>
                <p class="mt-3 text-base font-semibold text-slate-900">摘要优先的信息布局</p>
                <p class="mt-1 text-sm text-slate-500">先看重点，需要时再展开细节，避免首页过载。</p>
              </article>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
