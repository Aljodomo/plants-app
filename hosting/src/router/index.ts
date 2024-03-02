import { createRouter, createWebHistory } from 'vue-router'
import PlantDetailsLoaderVue from '@/views/plants/PlantDetailsLoader.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/plants/:id',
      name: 'plants',
      component: PlantDetailsLoaderVue
    },
  ]
})

export default router
