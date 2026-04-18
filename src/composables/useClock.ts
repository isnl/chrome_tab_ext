import { computed, onBeforeUnmount, onMounted, ref } from "vue";

export function useClock() {
  const now = ref(new Date());
  let timer: number | null = null;

  const dateLabel = computed(() =>
    now.value.toLocaleDateString("zh-CN", {
      month: "long",
      day: "numeric",
      weekday: "long"
    })
  );

  const timeLabel = computed(() =>
    now.value.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    })
  );

  onMounted(() => {
    timer = window.setInterval(() => {
      now.value = new Date();
    }, 1000);
  });

  onBeforeUnmount(() => {
    if (timer !== null) {
      window.clearInterval(timer);
    }
  });

  return {
    now,
    dateLabel,
    timeLabel
  };
}
