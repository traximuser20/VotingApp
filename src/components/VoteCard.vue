<script setup>
defineProps({
  animal: { type: String, required: true },
  emoji: { type: String, required: true },
  label: { type: String, required: true },
  description: { type: String, required: true },
  votes: { type: Number, required: true },
  hasVoted: { type: Boolean, required: true },
  isWinner: { type: Boolean, default: false },
  isLoser: { type: Boolean, default: false },
  wasSelected: { type: Boolean, default: false }
})

const emit = defineEmits(['vote'])
</script>

<template>
  <div
    class="rounded-2xl border-2 bg-surface p-8 text-center flex flex-col items-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
    :class="[
      animal === 'cat' ? 'border-cat/40' : 'border-dog/40',
      {
        'scale-[0.97] opacity-40': hasVoted && isLoser,
        'ring-4 ring-win -translate-y-1 shadow-[0_0_0_3px_theme(--color-win)]': wasSelected
      }
    ]"
  >
    <span class="text-6xl leading-none">{{ emoji }}</span>
    <h2 class="text-2xl font-semibold">{{ label }}</h2>
    <p class="text-slate-400 text-sm leading-relaxed">{{ description }}</p>
    <span
      class="px-4 py-1 rounded-full text-sm font-semibold"
      :class="animal === 'cat' ? 'bg-cat-bg text-cat' : 'bg-dog-bg text-dog'"
    >
      {{ votes }} votes
    </span>
    <button
      class="mt-2 px-8 py-2.5 rounded-full font-semibold text-white text-base cursor-pointer transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 hover:scale-105 hover:shadow-lg"
      :class="animal === 'cat' ? 'bg-cat' : 'bg-dog'"
      :disabled="hasVoted"
      @click="emit('vote', animal)"
    >
      {{ wasSelected ? '✓ Voted' : `Vote ${label}` }}
    </button>
  </div>
</template>
