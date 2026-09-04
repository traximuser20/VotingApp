<script setup>
import { onMounted, ref } from 'vue'
import { useVoteStore } from '../stores/voteStore'
import VoteCard from '../components/VoteCard.vue'
import ProgressBar from '../components/ProgressBar.vue'

const store = useVoteStore()
const shakeError = ref(false)

onMounted(store.fetchVotes)

function handleReset() {
  const secret = window.prompt('Enter delete secret:')
  if (secret === null) return
  if (!secret.trim()) {
    store.error = 'Secret cannot be empty'
    triggerShake()
    return
  }
  store.reset(secret)
}

function triggerShake() {
  shakeError.value = false
  requestAnimationFrame(() => { shakeError.value = true })
}
</script>

<template>
  <div class="w-full max-w-215 flex flex-col items-center gap-8 relative z-10">
    <!-- Animated Header -->
    <header class="text-center animate-slide-up">
      <h1 class="text-4xl sm:text-5xl md:text-6xl font-extrabold gradient-text leading-tight">
        Who's Your Favorite?
      </h1>
      <p class="text-slate-400 mt-3 text-lg animate-fade-in delay-1">
        Cast your vote and see what others think!
      </p>
    </header>

    <!-- Error Banner -->
    <Transition name="error">
      <div
        v-if="store.error"
        class="w-full px-4 py-3 rounded-xl text-sm text-center border border-[rgba(239,68,68,0.3)]"
        :class="{ 'animate-shake': shakeError }"
        style="background: rgba(239, 68, 68, 0.08); backdrop-filter: blur(8px); color: #f87171;"
      >
        <span class="flex items-center justify-center gap-2">
          <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          {{ store.error }}
        </span>
      </div>
    </Transition>

    <!-- Loading -->
    <div v-if="store.loading" class="flex flex-col items-center gap-3 animate-fade-in">
      <div class="w-10 h-10 border-2 border-cat/30 border-t-cat rounded-full animate-spin" />
      <span class="text-slate-400 text-sm">Loading votes...</span>
    </div>

    <!-- Vote Cards -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
      <VoteCard
        animal="cat"
        emoji="🐱"
        label="Pussy"
        description="Independent, curious, and secretly plotting world domination"
        :votes="store.votes.cat"
        :has-voted="store.hasVoted"
        :is-winner="store.winner === 'cat'"
        :is-loser="store.winner === 'dog'"
        :was-selected="store.lastVote === 'cat'"
        :anim-delay="0"
        @vote="store.vote"
      />
      <VoteCard
        animal="dog"
        emoji="🐶"
        label="Madarchod"
        description="Loyal, playful, and always happy to see you"
        :votes="store.votes.dog"
        :has-voted="store.hasVoted"
        :is-winner="store.winner === 'dog'"
        :is-loser="store.winner === 'cat'"
        :was-selected="store.lastVote === 'dog'"
        :anim-delay="120"
        @vote="store.vote"
      />
    </div>

    <!-- Progress Bar -->
    <ProgressBar
      v-if="store.totalVotes > 0"
      :cat-percent="store.catPercent"
      :dog-percent="store.dogPercent"
      :cat-votes="store.votes.cat"
      :dog-votes="store.votes.dog"
      :total-votes="store.totalVotes"
      :winner="store.winner"
    />

    <!-- Reset Button -->
    <button
      v-if="store.totalVotes > 0"
      class="group px-6 py-2.5 rounded-full text-sm font-medium cursor-pointer transition-all duration-300 border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.25)] hover:text-white animate-fade-in delay-3"
      style="background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(8px); color: #94a3b8;"
      @click="handleReset"
    >
      <span class="flex items-center gap-2">
        <svg class="w-4 h-4 transition-transform duration-300 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Reset Votes
      </span>
    </button>
  </div>
</template>

<style scoped>
.error-enter-active {
  animation: shake 0.4s ease;
}
.error-leave-active {
  animation: fade-in 0.2s ease reverse;
}
</style>
