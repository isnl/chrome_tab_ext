<script setup lang="ts">
import DashboardBoard from "@/components/dashboard/DashboardBoard.vue";
import SearchBar from "@/components/search/StickySearchBar.vue";
</script>

<template>
  <div class="page-shell min-h-screen">
    <div class="mx-auto flex min-h-screen w-full max-w-[1540px] flex-col px-4 pb-10 pt-5 sm:px-6 lg:px-8">
      <header>
        <SearchBar />
      </header>

      <main class="mt-6 flex-1">
        <DashboardBoard />
      </main>
    </div>
  </div>
</template>
