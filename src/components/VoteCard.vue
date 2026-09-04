<script setup>
import { ref, watch, nextTick } from 'vue'
import confetti from 'canvas-confetti'

const props = defineProps({
  animal: { type: String, required: true },
  emoji: { type: String, required: true },
  label: { type: String, required: true },
  description: { type: String, required: true },
  votes: { type: Number, required: true },
  hasVoted: { type: Boolean, required: true },
  isWinner: { type: Boolean, default: false },
  isLoser: { type: Boolean, default: false },
  wasSelected: { type: Boolean, default: false },
  animDelay: { type: Number, default: 0 }
})

const emit = defineEmits(['vote'])

const cardRef = ref(null)
const tiltX = ref(0)
const tiltY = ref(0)
const glareX = ref(50)
const glareY = ref(50)
const isHovering = ref(false)
const countAnimating = ref(false)
const prevVotes = ref(props.votes)

const isCat = props.animal === 'cat'

function handleMouseMove(e) {
  if (!cardRef.value) return
  const rect = cardRef.value.getBoundingClientRect()
  const x = (e.clientX - rect.left) / rect.width
  const y = (e.clientY - rect.top) / rect.height
  tiltY.value = (x - 0.5) * 16
  tiltX.value = (0.5 - y) * 16
  glareX.value = x * 100
  glareY.value = y * 100
}

function handleMouseEnter() {
  isHovering.value = true
}

function handleMouseLeave() {
  isHovering.value = false
  tiltX.value = 0
  tiltY.value = 0
}

watch(() => props.votes, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    countAnimating.value = true
    prevVotes.value = newVal
    setTimeout(() => { countAnimating.value = false }, 350)
  }
})

watch(() => props.wasSelected, (val) => {
  if (val) {
    nextTick(() => fireConfetti())
  }
})

function fireConfetti() {
  const color = isCat ? '#f472b6' : '#60a5fa'
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.65 },
    colors: [color, '#ffffff', '#fbbf24'],
    gravity: 0.8,
    scalar: 0.9,
    ticks: 120
  })
  setTimeout(() => {
    confetti({
      particleCount: 40,
      spread: 100,
      origin: { y: 0.7, x: isCat ? 0.3 : 0.7 },
      colors: [color, '#ffffff'],
      gravity: 0.7,
      scalar: 0.8
    })
  }, 150)
}

const cardStyle = ref({})
watch([tiltX, tiltY, isHovering], () => {
  if (!isHovering.value) {
    cardStyle.value = {
      transform: 'perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0)',
      transition: 'transform 0.5s cubic-bezier(0.03, 0.98, 0.52, 0.99)'
    }
  } else {
    cardStyle.value = {
      transform: `perspective(800px) rotateX(${tiltX.value}deg) rotateY(${tiltY.value}deg) translateZ(10px)`,
      transition: 'transform 0.1s ease-out'
    }
  }
}, { immediate: true })
</script>

<template>
  <div
    class="animate-slide-up"
    :style="{ animationDelay: `${animDelay}ms` }"
  >
    <div
      ref="cardRef"
      class="card-3d relative rounded-2xl p-8 text-center flex flex-col items-center gap-3 transition-all duration-400 cursor-pointer overflow-hidden"
      :class="[
        isCat ? 'border border-[rgba(244,114,182,0.2)]' : 'border border-[rgba(96,165,250,0.2)]',
        {
          'opacity-30 scale-[0.95] saturate-50': hasVoted && isLoser,
          'glow-win ring-2 ring-win': wasSelected && !isLoser,
        },
        isCat ? 'hover:glow-cat-intense' : 'hover:glow-dog-intense'
      ]"
      :style="{
        ...cardStyle,
        background: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        transformStyle: 'preserve-3d',
        willChange: 'transform'
      }"
      @mousemove="handleMouseMove"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <!-- Specular Glare Overlay -->
      <div
        class="specular-glare"
        :style="{ '--glare-x': glareX + '%', '--glare-y': glareY + '%' }"
      />

      <!-- Inner glow border on hover -->
      <div
        class="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300"
        :class="isCat ? 'shadow-[inset_0_0_30px_rgba(244,114,182,0.08)]' : 'shadow-[inset_0_0_30px_rgba(96,165,250,0.08)]'"
        :style="{ opacity: isHovering ? 1 : 0 }"
      />

      <!-- Emoji -->
      <span
        class="text-6xl leading-none relative z-10 transition-transform duration-300"
        :style="{ transform: isHovering ? 'translateZ(30px) scale(1.1)' : 'translateZ(0)' }"
      >
        {{ emoji }}
      </span>

      <!-- Label -->
      <h2
        class="text-2xl font-semibold relative z-10 text-white"
        :style="{ transform: isHovering ? 'translateZ(20px)' : 'translateZ(0)', transition: 'transform 0.3s ease' }"
      >
        {{ label }}
      </h2>

      <!-- Description -->
      <p
        class="text-slate-400 text-sm leading-relaxed relative z-10 max-w-65"
        :style="{ transform: isHovering ? 'translateZ(15px)' : 'translateZ(0)', transition: 'transform 0.3s ease' }"
      >
        {{ description }}
      </p>

      <!-- Vote Count Badge -->
      <span
        class="px-4 py-1.5 rounded-full text-sm font-bold relative z-10 transition-all duration-300"
        :class="isCat
          ? 'bg-[rgba(244,114,182,0.15)] text-cat border border-[rgba(244,114,182,0.2)]'
          : 'bg-[rgba(96,165,250,0.15)] text-dog border border-[rgba(96,165,250,0.2)]'"
        :style="{ transform: isHovering ? 'translateZ(25px)' : 'translateZ(0)' }"
      >
        <span :class="{ 'animate-count-pulse inline-block': countAnimating }">
          {{ votes }}
        </span>
        votes
      </span>

      <!-- Vote Button -->
      <button
        class="mt-2 px-8 py-2.5 rounded-full font-semibold text-white text-base cursor-pointer transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 relative z-10"
        :class="[
          isCat
            ? 'bg-linear-to-r from-cat to-pink-400 hover:shadow-[0_0_25px_rgba(244,114,182,0.5)]'
            : 'bg-linear-to-r from-dog to-blue-400 hover:shadow-[0_0_25px_rgba(96,165,250,0.5)]',
          { 'scale-105': !hasVoted }
        ]"
        :disabled="hasVoted"
        :style="{ transform: isHovering ? 'translateZ(35px)' : 'translateZ(0)' }"
        @click.stop="emit('vote', animal)"
      >
        <span v-if="wasSelected" class="flex items-center gap-1.5">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>
          Voted!
        </span>
        <span v-else>Vote {{ label }}</span>
      </button>
    </div>
  </div>
</template>
