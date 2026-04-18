<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from "vue";

const props = withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    subtitle?: string;
    kicker?: string;
    description?: string;
    viewName?: string;
    panelClass?: string;
  }>(),
  {
    subtitle: "",
    kicker: "",
    description: "",
    viewName: "",
    panelClass: "max-w-[1120px]"
  }
);

const emit = defineEmits<{
  close: [];
}>();

const headingKicker = computed(() => props.kicker || props.title);
const headingTitle = computed(() => props.subtitle || props.title);

function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    emit("close");
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      window.addEventListener("keydown", handleKeydown);
      document.body.style.overflow = "hidden";
      return;
    }

    window.removeEventListener("keydown", handleKeydown);
    document.body.style.overflow = "";
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeydown);
  document.body.style.overflow = "";
});
</script>

<template>
  <Teleport to="body">
    <Transition name="widget-modal">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(15,10,40,0.32)] px-4 py-6 backdrop-blur-xl sm:px-6 sm:py-8"
        @click.self="emit('close')"
      >
        <section
          class="widget-detail-surface w-full"
          :class="panelClass"
          :style="{ viewTransitionName: viewName }"
        >
          <div class="surface-card overflow-hidden p-3 sm:p-4">
            <div class="rounded-[24px] border border-white/78 bg-[linear-gradient(180deg,rgba(255,254,252,0.96),rgba(248,246,255,0.92)_52%,rgba(243,246,251,0.92))] p-5 sm:p-6">
              <div class="mb-5 flex flex-col gap-4 border-b border-white/60 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div class="min-w-0">
                  <div class="flex flex-wrap gap-2">
                    <span class="pill-tag">{{ headingKicker }}</span>
                    <span class="search-hint">Expanded View</span>
                  </div>
                  <h2 class="mt-4 font-display text-2xl font-semibold tracking-tight text-slate-900 sm:text-[2.35rem]">{{ headingTitle }}</h2>
                  <p v-if="description" class="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                    {{ description }}
                  </p>
                </div>

                <button
                  class="soft-button h-11 min-w-11 rounded-full px-0 text-sm"
                  type="button"
                  aria-label="关闭详情"
                  @click="emit('close')"
                >
                  关闭
                </button>
              </div>

              <div class="scroll-soft max-h-[calc(100vh-11rem)] overflow-y-auto pr-1">
                <slot />
              </div>
            </div>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.widget-modal-enter-active,
.widget-modal-leave-active {
  transition: opacity 260ms cubic-bezier(0.34, 1.56, 0.64, 1),
    transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.widget-modal-enter-from,
.widget-modal-leave-to {
  opacity: 0;
}

.widget-modal-enter-from .widget-detail-surface,
.widget-modal-leave-to .widget-detail-surface {
  transform: translateY(16px) scale(0.985);
}

.widget-detail-surface {
  transition: transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
</style>
