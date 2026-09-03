<script setup>
import { onMounted, onUnmounted, ref, watch, computed } from 'vue'
import { useVoteStore } from '../stores/voteStore'
import ProgressBar from '../components/ProgressBar.vue'

const store = useVoteStore()

let pollInterval = null

onMounted(() => {
  store.fetchVotes()
  pollInterval = setInterval(store.fetchVotes, 5000)
})

onUnmounted(() => {
  clearInterval(pollInterval)
})

// Animated counter
function useAnimatedCounter(targetValue) {
  const display = ref(0)
  let raf = null
  let current = 0

  watch(targetValue, (newVal) => {
    const start = current
    const diff = newVal - start
    if (diff === 0) return
    const duration = 600
    const startTime = performance.now()

    function step(now) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      current = Math.round(start + diff * eased)
      display.value = current
      if (progress < 1) {
        raf = requestAnimationFrame(step)
      }
    }
    if (raf) cancelAnimationFrame(raf)
    raf = requestAnimationFrame(step)
  })

  return display
}

const catDisplay = useAnimatedCounter(computed(() => store.votes.cat))
const dogDisplay = useAnimatedCounter(computed(() => store.votes.dog))
const totalDisplay = useAnimatedCounter(computed(() => store.totalVotes))

const statCardHover = ref(null)
</script>

<template>
  <div class="w-full max-w-[860px] flex flex-col items-center gap-8 relative z-10">
    <!-- Animated Header -->
    <header class="text-center animate-slide-up">
      <h1 class="text-4xl sm:text-5xl md:text-6xl font-extrabold gradient-text leading-tight">
        Live Results
      </h1>
      <p class="text-slate-400 mt-3 text-lg flex items-center justify-center gap-2.5 animate-fade-in delay-1">
        <span class="live-dot" />
        Auto-refreshes every 5 seconds
      </p>
    </header>

    <!-- Error Banner -->
    <Transition name="error">
      <div
        v-if="store.error"
        class="w-full px-4 py-3 rounded-xl text-sm text-center border border-[rgba(239,68,68,0.3)]"
        style="background: rgba(239, 68, 68, 0.08); backdrop-filter: blur(8px); color: #f87171;"
      >
        {{ store.error }}
      </div>
    </Transition>

    <!-- Loading -->
    <div v-if="store.loading" class="flex flex-col items-center gap-3 animate-fade-in">
      <div class="w-10 h-10 border-2 border-cat/30 border-t-cat rounded-full animate-spin" />
      <span class="text-slate-400 text-sm">Loading results...</span>
    </div>

    <template v-else>
      <!-- Winner / Tie Banner -->
      <Transition name="banner" mode="out-in">
        <div
          v-if="store.winner"
          :key="'winner-' + store.winner"
          class="w-full rounded-2xl p-6 sm:p-8 text-center animate-slide-up"
          style="background: linear-gradient(135deg, rgba(251,191,36,0.1), rgba(251,191,36,0.03)); border: 1px solid rgba(251,191,36,0.2);"
        >
          <span class="text-6xl animate-bounce-in inline-block">
            {{ store.winner === 'cat' ? '🐱' : '🐶' }}
          </span>
          <h2 class="text-3xl sm:text-4xl font-bold text-white mt-3 animate-slide-up">
            {{ store.winner === 'cat' ? 'Cats' : 'Dogs' }} are winning!
          </h2>
          <p class="text-slate-400 mt-2 text-lg">
            Leading by
            <span class="text-win font-bold text-xl mx-1">{{ store.margin }}</span>
            vote{{ store.margin !== 1 ? 's' : '' }}
          </p>
        </div>

        <div
          v-else
          key="tie"
          class="w-full rounded-2xl p-6 sm:p-8 text-center animate-slide-up"
          style="background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.06);"
        >
          <span class="text-6xl animate-bounce-in inline-block">🤝</span>
          <h2 class="text-3xl sm:text-4xl font-bold text-white mt-3">It's a Tie!</h2>
          <p class="text-slate-400 mt-2 text-lg">Both teams are evenly matched</p>
        </div>
      </Transition>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
        <!-- Cat Stats -->
        <div
          class="card-3d group rounded-2xl p-6 text-center relative overflow-hidden transition-all duration-400 animate-slide-up delay-1"
          style="background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(16px); border: 1px solid rgba(244,114,182,0.15); will-change: transform;"
          @mouseenter="statCardHover = 'cat'"
          @mouseleave="statCardHover = null"
          :style="{
            transform: statCardHover === 'cat' ? 'perspective(600px) rotateX(-3deg) rotateY(3deg) translateZ(8px)' : 'perspective(600px) rotateX(0) rotateY(0) translateZ(0)',
            boxShadow: statCardHover === 'cat' ? '0 0 30px rgba(244,114,182,0.2), 0 20px 40px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.2)',
            transition: 'transform 0.4s ease, box-shadow 0.4s ease'
          }"
        >
          <div class="specular-glare" style="--glare-x: 50%; --glare-y: 50%;" />
          <span class="text-4xl mb-2 inline-block transition-transform duration-300" :style="{ transform: statCardHover === 'cat' ? 'translateZ(20px) scale(1.1)' : '' }">🐱</span>
          <p class="text-4xl font-bold text-cat mt-2 relative z-10 transition-all duration-300" :class="{ 'animate-count-pulse': catDisplay !== store.votes.cat }">
            {{ catDisplay }}
          </p>
          <p class="text-slate-400 text-sm mt-1 relative z-10">Cat Votes</p>
        </div>

        <!-- Total Stats -->
        <div
          class="card-3d group rounded-2xl p-6 text-center relative overflow-hidden transition-all duration-400 animate-slide-up delay-2"
          style="background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.08); will-change: transform;"
          @mouseenter="statCardHover = 'total'"
          @mouseleave="statCardHover = null"
          :style="{
            transform: statCardHover === 'total' ? 'perspective(600px) rotateX(-3deg) rotateY(0deg) translateZ(8px)' : 'perspective(600px) rotateX(0) rotateY(0) translateZ(0)',
            boxShadow: statCardHover === 'total' ? '0 0 30px rgba(255,255,255,0.08), 0 20px 40px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.2)',
            transition: 'transform 0.4s ease, box-shadow 0.4s ease'
          }"
        >
          <div class="specular-glare" style="--glare-x: 50%; --glare-y: 50%;" />
          <span class="text-4xl mb-2 inline-block transition-transform duration-300" :style="{ transform: statCardHover === 'total' ? 'translateZ(20px) scale(1.1)' : '' }">📊</span>
          <p class="text-4xl font-bold text-white mt-2 relative z-10">
            {{ totalDisplay }}
          </p>
          <p class="text-slate-400 text-sm mt-1 relative z-10">Total Votes</p>
        </div>

        <!-- Dog Stats -->
        <div
          class="card-3d group rounded-2xl p-6 text-center relative overflow-hidden transition-all duration-400 animate-slide-up delay-3"
          style="background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(16px); border: 1px solid rgba(96,165,250,0.15); will-change: transform;"
          @mouseenter="statCardHover = 'dog'"
          @mouseleave="statCardHover = null"
          :style="{
            transform: statCardHover === 'dog' ? 'perspective(600px) rotateX(-3deg) rotateY(-3deg) translateZ(8px)' : 'perspective(600px) rotateX(0) rotateY(0) translateZ(0)',
            boxShadow: statCardHover === 'dog' ? '0 0 30px rgba(96,165,250,0.2), 0 20px 40px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.2)',
            transition: 'transform 0.4s ease, box-shadow 0.4s ease'
          }"
        >
          <div class="specular-glare" style="--glare-x: 50%; --glare-y: 50%;" />
          <span class="text-4xl mb-2 inline-block transition-transform duration-300" :style="{ transform: statCardHover === 'dog' ? 'translateZ(20px) scale(1.1)' : '' }">🐶</span>
          <p class="text-4xl font-bold text-dog mt-2 relative z-10 transition-all duration-300" :class="{ 'animate-count-pulse': dogDisplay !== store.votes.dog }">
            {{ dogDisplay }}
          </p>
          <p class="text-slate-400 text-sm mt-1 relative z-10">Dog Votes</p>
        </div>
      </div>

      <!-- Progress Bar -->
      <ProgressBar
        :cat-percent="store.catPercent"
        :dog-percent="store.dogPercent"
        :cat-votes="store.votes.cat"
        :dog-votes="store.votes.dog"
        :total-votes="store.totalVotes"
        :winner="store.winner"
      />
    </template>
  </div>
</template>

<style scoped>
.banner-enter-active {
  animation: bounce-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.banner-leave-active {
  animation: fade-in 0.2s ease reverse;
}
.error-enter-active {
  animation: slide-up 0.3s ease;
}
.error-leave-active {
  animation: fade-in 0.2s ease reverse;
}
</style>
