<script setup>
import { onMounted } from 'vue'
import { useVoteStore } from '../stores/voteStore'
import VoteCard from '../components/VoteCard.vue'
import ProgressBar from '../components/ProgressBar.vue'

const store = useVoteStore()

onMounted(store.fetchVotes)
</script>

<template>
  <div class="w-full max-w-[860px] flex flex-col items-center gap-8">
    <header class="text-center">
      <h1
        class="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-cat to-dog bg-clip-text text-transparent"
      >
        Who's Your Favorite?
      </h1>
      <p class="text-slate-400 mt-3 text-lg">Cast your vote and see what others think!</p>
    </header>

    <div
      v-if="store.error"
      class="w-full px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center"
    >
      {{ store.error }}
    </div>

    <div v-if="store.loading" class="text-slate-400">Loading votes...</div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
      <VoteCard
        animal="cat"
        emoji="🐱"
        label="Cat"
        description="Independent, curious, and secretly plotting world domination"
        :votes="store.votes.cat"
        :has-voted="store.hasVoted"
        :is-winner="store.winner === 'cat'"
        :is-loser="store.winner === 'dog'"
        :was-selected="store.lastVote === 'cat'"
        @vote="store.vote"
      />
      <VoteCard
        animal="dog"
        emoji="🐶"
        label="Dog"
        description="Loyal, playful, and always happy to see you"
        :votes="store.votes.dog"
        :has-voted="store.hasVoted"
        :is-winner="store.winner === 'dog'"
        :is-loser="store.winner === 'cat'"
        :was-selected="store.lastVote === 'dog'"
        @vote="store.vote"
      />
    </div>

    <ProgressBar
      v-if="store.totalVotes > 0"
      :cat-percent="store.catPercent"
      :dog-percent="store.dogPercent"
      :cat-votes="store.votes.cat"
      :dog-votes="store.votes.dog"
      :total-votes="store.totalVotes"
      :winner="store.winner"
    />

    <button
      v-if="store.totalVotes > 0"
      class="px-6 py-2 rounded-full border border-border bg-transparent text-slate-400 text-sm cursor-pointer transition-all duration-200 hover:bg-surface hover:text-white hover:border-slate-400"
      @click="store.reset(prompt('Enter delete secret:') || '')"
    >
      🔄 Reset Votes
    </button>
  </div>
</template>
