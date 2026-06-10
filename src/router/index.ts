import { createRouter, createWebHistory } from 'vue-router'
import EditorPage from '../pages/EditorPage.vue'
import HelpPage from '../pages/HelpPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'editor', component: EditorPage },
    { path: '/help', name: 'help', component: HelpPage },
  ],
})

export default router
