import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiFetch } from '../api'

export const useVoteStore = defineStore('vote', () => {
  const votes = ref({ cat: 0, dog: 0 })
  const hasVoted = ref(false)
  const lastVote = ref(null)
  const loading = ref(true)
  const error = ref(null)

  const totalVotes = computed(() => votes.value.cat + votes.value.dog)
  const catPercent = computed(() => totalVotes.value ? Math.round((votes.value.cat / totalVotes.value) * 100) : 0)
  const dogPercent = computed(() => totalVotes.value ? Math.round((votes.value.dog / totalVotes.value) * 100) : 0)
  const winner = computed(() => {
    if (votes.value.cat === votes.value.dog) return null
    return votes.value.cat > votes.value.dog ? 'cat' : 'dog'
  })
  const margin = computed(() => {
    if (!winner.value) return 0
    return Math.abs(votes.value.cat - votes.value.dog)
  })

  async function fetchVotes() {
    error.value = null
    try {
      votes.value = await apiFetch('/api/votes')
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  async function vote(animal) {
    if (hasVoted.value) return
    error.value = null
    try {
      votes.value = await apiFetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ choice: animal })
      })
      lastVote.value = animal
      hasVoted.value = true
    } catch (err) {
      error.value = err.message
    }
  }

  async function reset(secret) {
    error.value = null
    try {
      votes.value = await apiFetch('/api/votes', {
        method: 'DELETE',
        headers: { 'x-delete-secret': secret }
      })
      hasVoted.value = false
      lastVote.value = null
    } catch (err) {
      error.value = err.message
    }
  }

  return {
    votes, hasVoted, lastVote, loading, error,
    totalVotes, catPercent, dogPercent, winner, margin,
    fetchVotes, vote, reset
  }
})
