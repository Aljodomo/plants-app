import { createRouter, createWebHistory } from 'vue-router'
import HumidityForm from '@/views/humidity/HumidityForm.vue'
import WaterPlant from '@/views/waterPlant/WaterPlant.vue'
import WasWateredLoader from '@/views/wasWatered/WasWateredLoader.vue'
import PlantDetailsLoader from '@/views/plant/PlantDetailsLoader.vue'
import PlantsOverviewLoader from '@/views/plants/PlantsOverviewLoader.vue'
import NewPlant from '@/views/NewPlant/NewPlant.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/plants',
      name: "plants",
      component: PlantsOverviewLoader
    },
    {
      path: '/plants/new',
      component: NewPlant
    },
    {
      path: '/plants/:id',
      component: PlantDetailsLoader
    },
    {
      path: '/plants/:id/waterPlant',
      component: WaterPlant
    },
    {
      path: '/plants/:id/visits/:visitId/setHumidity',
      component: HumidityForm
    },
    {
      path: '/plants/:id/visits/:visitId/setWasWatered',
      component: WasWateredLoader
    },
    {
      path: '/:catchAll(.*)',
      redirect: '/plants'
    }
  ]
})

export default router
