<script setup lang="ts">
import { useClock } from "@/composables/useClock";

import DashboardBoard from "@/components/dashboard/DashboardBoard.vue";
import SearchBar from "@/components/search/StickySearchBar.vue";

const { dateLabel, timeLabel } = useClock();
</script>

<template>
  <div class="page-shell min-h-screen">
    <div class="mx-auto flex min-h-screen w-full max-w-[1540px] flex-col px-4 pb-10 pt-5 sm:px-6 lg:px-8">
      <header class="pt-3">
        <SearchBar :date-label="dateLabel" :time-label="timeLabel" />
      </header>

      <main class="mt-8 flex-1">
        <DashboardBoard :date-label="dateLabel" :time-label="timeLabel" />
      </main>
    </div>
  </div>
</template>
