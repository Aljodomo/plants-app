<script setup lang="ts">
import { onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAllPlantsRef } from '../plantsRepo'

const router = useRouter()

const { plantsRef, unsub } = await getAllPlantsRef()

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
        v-for="plant of plantsRef"
        :key="plant.id"
        class="bg-f-green rounded-xl p-4 h-32"
        @click="goToPlantPage(plant.id)"
      >
        {{ plant.name }}
      </div>
    </div>
  </main>
</template>

<style></style>
