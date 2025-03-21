import { createRouter, createWebHistory, type NavigationGuard } from 'vue-router'
import HumidityForm from '@/views/humidity/HumidityForm.vue'
import WaterPlant from '@/views/waterPlant/WaterPlant.vue'
import WasWateredLoader from '@/views/wasWatered/WasWateredLoader.vue'
import PlantDetailsLoader from '@/views/plant/PlantDetailsLoader.vue'
import PlantsOverviewLoader from '@/views/plants/PlantsOverviewLoader.vue'
import NewPlant from '@/views/NewPlant/NewPlant.vue'
import LoginPage from '@/views/login/LoginPage.vue'
import { auth } from '@/views/firebase'
import ScanPlant from "@/views/scan-plant/ScanPlant.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginPage
    },
    {
      path: '/plants',
      name: 'plants',
      component: PlantsOverviewLoader
    },
    {
      path: '/scan',
      name: 'scan',
      component: ScanPlant
    },
    {
      path: '/plants/new',
      component: NewPlant
    },
    {
      path: '/plants/:id',
      name: 'plant',
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

async function isLoggedIn() {
  await auth.authStateReady()
  return auth.currentUser !== null
}

const navigationGuard: NavigationGuard = async (to) => {
  if (!(await isLoggedIn()) && to.name !== 'login') {
    return { name: 'login' }
  }
}

router.beforeEach(navigationGuard)

export default router
