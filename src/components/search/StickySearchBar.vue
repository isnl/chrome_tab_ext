<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";

const searchInputRef = ref<HTMLInputElement | null>(null);
const query = ref("");

function focusInput(select = false) {
  nextTick(() => {
    const input = searchInputRef.value;
    if (!input) return;
    input.focus({ preventScroll: true });
    if (select) input.select();
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
  <section class="search-section">
    <form class="search-bar" @submit.prevent="submitSearch">
      <label class="search-bar-label">
        <!-- Google "G" logo -->
        <span class="search-bar-logo">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.0 24.0 0 0 0 0 21.56l7.98-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
        </span>
        <input
          ref="searchInputRef"
          v-model="query"
          class="search-bar-input"
          type="search"
          autocomplete="off"
          spellcheck="false"
          placeholder="搜索或输入网址"
        />
        <span class="search-bar-shortcut">
          <kbd>/</kbd>
        </span>
      </label>
    </form>
  </section>
</template>

<style scoped>
.search-section {
  padding: 32px 16px 12px;
  display: flex;
  justify-content: center;
}

.search-bar {
  width: 100%;
  max-width: 680px;
}

.search-bar-label {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 52px;
  padding: 0 20px;
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(0, 0, 0, 0.06);
  backdrop-filter: blur(24px) saturate(1.5);
  box-shadow:
    0 2px 6px rgba(0, 0, 0, 0.04),
    0 6px 20px rgba(0, 0, 0, 0.03);
  transition: all 0.2s ease;
  cursor: text;
}

.search-bar-label:focus-within {
  background: rgba(255, 255, 255, 0.92);
  border-color: rgba(0, 0, 0, 0.1);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.06),
    0 8px 28px rgba(0, 0, 0, 0.06);
}

.search-bar-logo {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.search-bar-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 16px;
  color: #1e293b;
  line-height: 1;
}

.search-bar-input::placeholder {
  color: rgba(0, 0, 0, 0.3);
}

.search-bar-input::-webkit-search-cancel-button {
  display: none;
}

.search-bar-shortcut {
  flex-shrink: 0;
  opacity: 0.32;
  transition: opacity 0.15s;
}

.search-bar-label:focus-within .search-bar-shortcut {
  opacity: 0;
}

.search-bar-shortcut kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 6px;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.6);
  font-family: inherit;
  font-size: 12px;
  color: #94a3b8;
}
</style>
