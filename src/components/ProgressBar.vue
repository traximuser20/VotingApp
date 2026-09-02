<script setup>
defineProps({
  catPercent: { type: Number, required: true },
  dogPercent: { type: Number, required: true },
  catVotes: { type: Number, required: true },
  dogVotes: { type: Number, required: true },
  totalVotes: { type: Number, required: true },
  winner: { type: String, default: null },
  showLabel: { type: Boolean, default: true }
})
</script>

<template>
  <div class="w-full bg-surface rounded-2xl p-6 flex flex-col gap-3">
    <div class="flex h-10 rounded-full overflow-hidden bg-surface-hover">
      <div
        class="bg-cat flex items-center justify-center text-white text-sm font-semibold transition-all duration-500 min-w-0"
        :style="{ width: catPercent + '%' }"
      >
        <span v-if="catPercent > 10">🐱 {{ catPercent }}%</span>
      </div>
      <div
        class="bg-dog flex items-center justify-center text-white text-sm font-semibold transition-all duration-500 min-w-0"
        :style="{ width: dogPercent + '%' }"
      >
        <span v-if="dogPercent > 10">🐶 {{ dogPercent }}%</span>
      </div>
    </div>

    <div v-if="showLabel" class="flex justify-between text-sm text-slate-400">
      <span>Cat: {{ catVotes }}{{ showLabel ? ` (${catPercent}%)` : '' }}</span>
      <span>{{ totalVotes }} total votes</span>
      <span>Dog: {{ dogVotes }}{{ showLabel ? ` (${dogPercent}%)` : '' }}</span>
    </div>

    <div v-if="winner" class="text-center">
      <span class="inline-block px-5 py-1.5 rounded-full font-bold text-win bg-gradient-to-r from-win/20 to-win/10 border border-win/30">
        {{ winner === 'cat' ? '🐱 Cats' : '🐶 Dogs' }} are winning!
      </span>
    </div>
    <div v-else-if="totalVotes > 0" class="text-center">
      <span class="inline-block px-5 py-1.5 rounded-full font-bold text-slate-400 bg-slate-400/10 border border-border">
        It's a tie!
      </span>
    </div>
  </div>
</template>
