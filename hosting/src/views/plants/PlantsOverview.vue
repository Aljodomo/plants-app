<script setup lang="ts">
import { computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAllPlantsRef } from '../plantsRepo'
import { date, timezoned } from '../dateUtils'
import { wateringUrgencyColor } from '../wateringInfoColors'

const router = useRouter()

const { plantsRef, unsub } = await getAllPlantsRef()

const sortedPlants = computed(() => {
  return plantsRef.value.slice().sort((a, b) => {
    if (!a.nextWatering) {
      return 1
    }
    if (!b.nextWatering) {
      return -1
    }

    return a.nextWatering.seconds - b.nextWatering.seconds
  })
})

onUnmounted(() => {
  unsub()
})

function goToPlantPage(plantId: string) {
  router.push('/plants/' + plantId)
}

function goToNewPlantPage() {
  router.push('/plants/new')
}
</script>

<template>
  <main>
    <h1
      class="sticky left-0 right-0 top-0 bg-f-beige text-center text-3xl font-bold shadow-xl border-solid border-b-2 border-gray-700 p-4 bg-gradient-to-br from-f-green from-50%"
    >
      Mein Garten
    </h1>
    <div class="grid grid-cols-2 p-4 text-f-beige gap-4 overflow-scroll">
      <div
        class="rounded-xl p-4 h-32 flex justify-center items-center bg-f-beige border-solid border-f-green border-2"
        @click="goToNewPlantPage"
      >
        <p class="text-f-green font-bold">Pflanze anlegen</p>
      </div>
      <div
        v-for="plant of sortedPlants"
        :key="plant.id"
        class="bg-f-green rounded-xl p-4 h-32 flex flex-col justify-between"
        :style="{
          'background-image': `linear-gradient(to left bottom, ${wateringUrgencyColor(plant)}, rgba(255,0,0,0) 50%)`
        }"
        @click="goToPlantPage(plant.id)"
      >
        <div>{{ plant.name }}</div>
        <div v-if="plant.nextWatering" class="w-full flex flex-col items-end">
          <div>
            <p class="text-sm">Gießen am</p>
            <p>{{ date(timezoned(plant.nextWatering.toDate())) }}</p>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style></style>
