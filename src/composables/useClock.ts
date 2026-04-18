import { computed, ref } from "vue";

import { storageGet, storageSet } from "@/services/storage";

const STORAGE_KEY = "clock.hour12";

function createClockStore() {
  const now = ref(new Date());
  const hour12 = ref(false);

  async function loadPreference() {
    const stored = await storageGet<Record<string, unknown>>({ [STORAGE_KEY]: false });
    hour12.value = Boolean(stored[STORAGE_KEY]);
  }

  async function toggleFormat() {
    hour12.value = !hour12.value;
    await storageSet({ [STORAGE_KEY]: hour12.value });
  }

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
      hour12: hour12.value
    })
  );

  const hours = computed(() => {
    const h = now.value.getHours();
    if (hour12.value) {
      const h12 = h % 12 || 12;
      return String(h12).padStart(2, "0");
    }
    return String(h).padStart(2, "0");
  });

  const minutes = computed(() => String(now.value.getMinutes()).padStart(2, "0"));

  const seconds = computed(() => String(now.value.getSeconds()).padStart(2, "0"));

  const secondsLabel = computed(() => seconds.value);

  const greetingText = computed(() => {
    const h = now.value.getHours();
    if (h >= 5 && h <= 8) return "早安，新的一天开始了";
    if (h >= 9 && h <= 11) return "上午好，保持专注";
    if (h >= 12 && h <= 13) return "中午好，记得休息";
    if (h >= 14 && h <= 17) return "下午好，继续加油";
    if (h >= 18 && h <= 19) return "傍晚好，辛苦了";
    if (h >= 20 && h <= 22) return "晚上好，放松一下";
    return "夜深了，注意休息";
  });

  void loadPreference();
  window.setInterval(() => {
    now.value = new Date();
  }, 1000);

  return {
    now,
    dateLabel,
    timeLabel,
    hour12,
    toggleFormat,
    hours,
    minutes,
    seconds,
    secondsLabel,
    greetingText
  };
}

let clockStore: ReturnType<typeof createClockStore> | null = null;

export function useClock() {
  if (!clockStore) {
    clockStore = createClockStore();
  }
  return clockStore;
}
