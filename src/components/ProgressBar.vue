<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  catPercent: { type: Number, required: true },
  dogPercent: { type: Number, required: true },
  catVotes: { type: Number, required: true },
  dogVotes: { type: Number, required: true },
  totalVotes: { type: Number, required: true },
  winner: { type: String, default: null },
  showLabel: { type: Boolean, default: true }
})

const mounted = ref(false)
const animCat = ref(0)
const animDog = ref(0)

onMounted(() => {
  setTimeout(() => {
    mounted.value = true
    animCat.value = props.catPercent
    animDog.value = props.dogPercent
  }, 100)
})

watch(() => props.catPercent, (val) => {
  animCat.value = val
})
watch(() => props.dogPercent, (val) => {
  animDog.value = val
})

const catVotesAnim = ref(0)
const dogVotesAnim = ref(0)
const totalVotesAnim = ref(0)

function animateCount(target, current) {
  const diff = target - current
  if (diff === 0) return current
  const steps = 20
  const increment = diff / steps
  let step = 0
  const timer = setInterval(() => {
    step++
    if (step >= steps) {
      clearInterval(timer)
      return target
    }
    current += increment
  }, 20)
  return target
}

watch(() => props.catVotes, (val) => { catVotesAnim.value = val })
watch(() => props.dogVotes, (val) => { dogVotesAnim.value = val })
watch(() => props.totalVotes, (val) => { totalVotesAnim.value = val })
</script>

<template>
  <div
    class="w-full rounded-2xl p-6 flex flex-col gap-4 animate-slide-up delay-2"
    style="background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(16px) saturate(180%); -webkit-backdrop-filter: blur(16px) saturate(180%); border: 1px solid rgba(255,255,255,0.06);"
  >
    <!-- Bar -->
    <div class="flex h-12 rounded-full overflow-hidden relative" style="background: rgba(30, 41, 59, 0.6);">
      <!-- Cat Segment -->
      <div
        class="relative flex items-center justify-center text-white text-sm font-bold transition-all duration-1000 ease-out min-w-0 overflow-hidden"
        :class="{ 'animate-shimmer': winner === 'cat' }"
        :style="{
          width: mounted ? animCat + '%' : '0%',
          background: winner === 'cat'
            ? 'linear-gradient(90deg, #ec4899, #f472b6, #f9a8d4)'
            : 'linear-gradient(90deg, #be185d, #ec4899)',
          boxShadow: winner === 'cat' ? '0 0 20px rgba(244,114,182,0.4), inset 0 1px 1px rgba(255,255,255,0.15)' : 'none',
          transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s ease'
        }"
      >
        <span v-if="animCat > 12" class="relative z-10 drop-shadow-lg">
          🐱 {{ animCat }}%
        </span>
      </div>

      <!-- Dog Segment -->
      <div
        class="relative flex items-center justify-center text-white text-sm font-bold transition-all duration-1000 ease-out min-w-0 overflow-hidden"
        :class="{ 'animate-shimmer': winner === 'dog' }"
        :style="{
          width: mounted ? animDog + '%' : '0%',
          background: winner === 'dog'
            ? 'linear-gradient(90deg, #3b82f6, #60a5fa, #93c5fd)'
            : 'linear-gradient(90deg, #1d4ed8, #3b82f6)',
          boxShadow: winner === 'dog' ? '0 0 20px rgba(96,165,250,0.4), inset 0 1px 1px rgba(255,255,255,0.15)' : 'none',
          transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s ease'
        }"
      >
        <span v-if="animDog > 12" class="relative z-10 drop-shadow-lg">
          🐶 {{ animDog }}%
        </span>
      </div>
    </div>

    <!-- Labels -->
    <div v-if="showLabel" class="flex justify-between text-sm text-slate-400">
      <span class="transition-colors duration-300" :class="{ 'text-cat font-semibold': winner === 'cat' }">
        Cat: {{ catVotes }} ({{ catPercent }}%)
      </span>
      <span class="text-slate-500 font-medium">{{ totalVotes }} total</span>
      <span class="transition-colors duration-300" :class="{ 'text-dog font-semibold': winner === 'dog' }">
        Dog: {{ dogVotes }} ({{ dogPercent }}%)
      </span>
    </div>

    <!-- Winner / Tie Badge -->
    <Transition name="badge" mode="out-in">
      <div v-if="winner" :key="'winner-' + winner" class="text-center">
        <span
          class="inline-flex items-center gap-2 px-6 py-2 rounded-full font-bold text-win border border-[rgba(251,191,36,0.3)] animate-pulse-glow"
          style="background: linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.05));"
        >
          <span class="text-lg">{{ winner === 'cat' ? '🐱' : '🐶' }}</span>
          {{ winner === 'cat' ? 'Cats' : 'Dogs' }} are winning!
        </span>
      </div>
      <div v-else-if="totalVotes > 0" key="tie" class="text-center">
        <span class="inline-flex items-center gap-2 px-6 py-2 rounded-full font-bold text-slate-400 border border-[rgba(148,163,184,0.2)]" style="background: rgba(148,163,184,0.08);">
          <span class="text-lg">🤝</span>
          It's a tie!
        </span>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.badge-enter-active {
  animation: bounce-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.badge-leave-active {
  animation: fade-in 0.15s ease reverse;
}
</style>
