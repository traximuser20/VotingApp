<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="min-h-screen bg-slate-950 flex flex-col items-center px-4 py-6">
    <!-- Nav -->
    <nav class="w-full max-w-[860px] flex justify-center gap-4 mb-8">
      <RouterLink
        to="/"
        class="px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200"
        :class="$route.path === '/' ? 'bg-white text-slate-950' : 'text-slate-400 hover:text-white hover:bg-surface'"
      >
        Vote
      </RouterLink>
      <RouterLink
        to="/results"
        class="px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200"
        :class="$route.path === '/results' ? 'bg-white text-slate-950' : 'text-slate-400 hover:text-white hover:bg-surface'"
      >
        Results
      </RouterLink>
    </nav>

    <!-- Page -->
    <RouterView />
  </div>
</template>
