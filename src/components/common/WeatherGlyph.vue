<script setup lang="ts">
import { computed } from "vue";

import type { WeatherIconName } from "@/utils/weather";

const props = withDefaults(
  defineProps<{
    name: WeatherIconName;
    sizeClass?: string;
  }>(),
  {
    sizeClass: "h-6 w-6"
  }
);

const iconMarkup = computed(() => {
  const common = `class="${props.sizeClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"`;

  const icons: Record<WeatherIconName, string> = {
    sun: `<svg ${common}><circle cx="12" cy="12" r="4"></circle><path d="M12 2.5v2.6M12 18.9v2.6M4.5 4.5l1.8 1.8M17.7 17.7l1.8 1.8M2.5 12h2.6M18.9 12h2.6M4.5 19.5l1.8-1.8M17.7 6.3l1.8-1.8"></path></svg>`,
    "sun-haze": `<svg ${common}><circle cx="12" cy="10" r="4"></circle><path d="M12 1.8v2.2M4.9 4.9l1.6 1.6M1.8 10h2.2M19.9 10h2.2M17.5 6.5l1.6-1.6M5 16.8h14M3.5 20h17"></path></svg>`,
    "cloud-sun": `<svg ${common}><path d="M8.5 17.5h8.3a3.7 3.7 0 0 0 .3-7.4 5.5 5.5 0 0 0-10.7-1.4A4 4 0 0 0 8.5 17.5Z"></path><path d="M13 4.2a3.3 3.3 0 0 1 2.9 1.6M16.9 2.8v1.7M20.2 6.1h-1.7"></path></svg>`,
    cloud: `<svg ${common}><path d="M6.8 18h9.3a4.5 4.5 0 1 0-.7-8.9 6 6 0 0 0-11.4 1.4A4.1 4.1 0 0 0 6.8 18Z"></path></svg>`,
    fog: `<svg ${common}><path d="M5 10.5h14a3.5 3.5 0 0 0 0-7 4.8 4.8 0 0 0-4.6 3 4.9 4.9 0 0 0-8.9 2.3"></path><path d="M4 14.5h16M6 18h12M8 21h8"></path></svg>`,
    drizzle: `<svg ${common}><path d="M7 16.5h9.2a4.2 4.2 0 0 0-.6-8.4 5.7 5.7 0 0 0-10.9 1.4A4 4 0 0 0 7 16.5Z"></path><path d="M9 19.2l-.8 2M13 19.2l-.8 2M17 19.2l-.8 2"></path></svg>`,
    rain: `<svg ${common}><path d="M7 15.8h9.2a4.2 4.2 0 0 0-.6-8.4 5.7 5.7 0 0 0-10.9 1.4A4 4 0 0 0 7 15.8Z"></path><path d="M8.8 18.5l-1 2.8M12.8 18.5l-1 2.8M16.8 18.5l-1 2.8"></path></svg>`,
    sleet: `<svg ${common}><path d="M7 15.8h9.2a4.2 4.2 0 0 0-.6-8.4 5.7 5.7 0 0 0-10.9 1.4A4 4 0 0 0 7 15.8Z"></path><path d="M9 18.8l-1 2.4M15 18.8l-1 2.4"></path><circle cx="12" cy="21" r="0.8" fill="currentColor" stroke="none"></circle></svg>`,
    snow: `<svg ${common}><path d="M7 15.8h9.2a4.2 4.2 0 0 0-.6-8.4 5.7 5.7 0 0 0-10.9 1.4A4 4 0 0 0 7 15.8Z"></path><path d="M9 18.5v4M7.6 19.5l2.8 2M10.4 19.5l-2.8 2M15 18.5v4M13.6 19.5l2.8 2M16.4 19.5l-2.8 2"></path></svg>`,
    storm: `<svg ${common}><path d="M7 15.5h9.2a4.2 4.2 0 0 0-.6-8.4 5.7 5.7 0 0 0-10.9 1.4A4 4 0 0 0 7 15.5Z"></path><path d="M12 16.8 9.7 21h2.6l-1 3.2 4-5.9h-2.6l1.1-1.5"></path></svg>`
  };

  return icons[props.name];
});
</script>

<template>
  <span class="inline-flex" v-html="iconMarkup" />
</template>
