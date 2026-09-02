<script setup>
import { onMounted, onUnmounted } from 'vue'
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
</script>

<template>
  <div class="w-full max-w-[860px] flex flex-col items-center gap-8">
    <header class="text-center">
      <h1
        class="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-cat to-dog bg-clip-text text-transparent"
      >
        Live Results
      </h1>
      <p class="text-slate-400 mt-3 text-lg">Auto-refreshes every 5 seconds</p>
    </header>

    <div
      v-if="store.error"
      class="w-full px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center"
    >
      {{ store.error }}
    </div>

    <div v-if="store.loading" class="text-slate-400">Loading results...</div>

    <template v-else>
      <div
        v-if="store.winner"
        class="w-full rounded-2xl p-6 text-center bg-gradient-to-r from-win/10 to-win/5 border border-win/20"
      >
        <span class="text-5xl">{{ store.winner === 'cat' ? '🐱' : '🐶' }}</span>
        <h2 class="text-3xl font-bold text-white mt-3">
          {{ store.winner === 'cat' ? 'Cats' : 'Dogs' }} are winning!
        </h2>
        <p class="text-slate-400 mt-2">
          Leading by <span class="text-win font-semibold">{{ store.margin }}</span> vote{{ store.margin !== 1 ? 's' : '' }}
        </p>
      </div>

      <div
        v-else
        class="w-full rounded-2xl p-6 text-center bg-surface border border-border"
      >
        <span class="text-5xl">🤝</span>
        <h2 class="text-3xl font-bold text-white mt-3">It's a Tie!</h2>
        <p class="text-slate-400 mt-2">Both teams are evenly matched</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
        <div class="rounded-2xl bg-surface p-6 text-center">
          <span class="text-3xl">🐱</span>
          <p class="text-4xl font-bold text-cat mt-2">{{ store.votes.cat }}</p>
          <p class="text-slate-400 text-sm mt-1">Cat Votes</p>
        </div>
        <div class="rounded-2xl bg-surface p-6 text-center">
          <span class="text-3xl">📊</span>
          <p class="text-4xl font-bold text-white mt-2">{{ store.totalVotes }}</p>
          <p class="text-slate-400 text-sm mt-1">Total Votes</p>
        </div>
        <div class="rounded-2xl bg-surface p-6 text-center">
          <span class="text-3xl">🐶</span>
          <p class="text-4xl font-bold text-dog mt-2">{{ store.votes.dog }}</p>
          <p class="text-slate-400 text-sm mt-1">Dog Votes</p>
        </div>
      </div>

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
