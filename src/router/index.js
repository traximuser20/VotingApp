import { createRouter, createWebHistory } from 'vue-router'
import VotePage from '../pages/VotePage.vue'
import ResultsPage from '../pages/ResultsPage.vue'

const routes = [
  { path: '/', name: 'vote', component: VotePage },
  { path: '/results', name: 'results', component: ResultsPage }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
