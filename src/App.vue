<script setup>
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
const isVote = computed(() => route.path === '/')
</script>

<template>
  <div class="min-h-screen flex flex-col items-center px-4 py-6 relative overflow-hidden">
    <!-- Animated Background Blobs -->
    <div class="bg-blob animate-float-slow" style="width:600px;height:600px;background:radial-gradient(circle,rgba(244,114,182,0.3),transparent 70%);top:-10%;left:-10%;animation-delay:0s;" />
    <div class="bg-blob animate-float-slow" style="width:500px;height:500px;background:radial-gradient(circle,rgba(96,165,250,0.3),transparent 70%);bottom:-15%;right:-10%;animation-delay:-7s;" />
    <div class="bg-blob animate-float-slow" style="width:400px;height:400px;background:radial-gradient(circle,rgba(251,191,36,0.15),transparent 70%);top:40%;left:50%;transform:translateX(-50%);animation-delay:-14s;" />

    <!-- Glass Navbar -->
    <nav class="glass w-full max-w-[860px] rounded-full flex justify-center gap-2 sm:gap-4 mb-8 py-2 px-2 relative z-10 animate-fade-in">
      <RouterLink
        to="/"
        class="relative px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300"
        :class="isVote
          ? 'bg-white text-slate-950 shadow-[0_0_20px_rgba(255,255,255,0.2)]'
          : 'text-slate-400 hover:text-white hover:bg-white/5'"
      >
        <span class="relative z-10">🗳️ Vote</span>
      </RouterLink>
      <RouterLink
        to="/results"
        class="relative px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300"
        :class="!isVote
          ? 'bg-white text-slate-950 shadow-[0_0_20px_rgba(255,255,255,0.2)]'
          : 'text-slate-400 hover:text-white hover:bg-white/5'"
      >
        <span class="relative z-10">📊 Results</span>
      </RouterLink>
    </nav>

    <!-- Page Content with Transition -->
    <RouterView v-slot="{ Component }">
      <Transition name="page" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>
  </div>
</template>

<style scoped>
.page-enter-active {
  animation: slide-up 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}
.page-leave-active {
  animation: fade-in 0.2s ease reverse;
}
</style>
