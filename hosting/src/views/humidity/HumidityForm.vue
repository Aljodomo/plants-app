<template>
  <div class="flex-1 flex justify-center">
    <main class="flex flex-col items-center justify-evenly text-4xl gap-2 p-8">
      <h1 class="text-4xl text-center">Wie feucht ist die Blumenerde?</h1>
      <button
        class="bg-blue-600 text-white rounded-lg px-8 py-5 w-72"
        @click="handleSelectHumidity(Humidity.WET)"
      >
        {{ getHumidityText(Humidity.WET) }}
      </button>
      <button
        class="bg-blue-400 text-white rounded-lg px-8 py-5 w-72"
        @click="handleSelectHumidity(Humidity.MOIST)"
      >
        {{ getHumidityText(Humidity.MOIST) }}
      </button>
      <button
        class="bg-green-600 text-white rounded-lg px-8 py-5 w-72"
        @click="handleSelectHumidity(Humidity.DRY)"
      >
        {{ getHumidityText(Humidity.DRY) }}
      </button>
      <button
        class="bg-gray-400 text-white rounded-lg px-8 py-5 w-72"
        @click="handleSelectHumidity(Humidity.VERY_DRY)"
      >
        {{ getHumidityText(Humidity.VERY_DRY) }}
      </button>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { getHumidityText, Humidity, setVisitData } from '../plantsRepo'

const route = useRoute()
const router = useRouter()

const plantId = route.params.id as string
const visitId = route.params.visitId as string

function handleSelectHumidity(humidity: Humidity) {
  setVisitData(plantId, visitId, { humidity })
    .then(() => {
      router.push(`/plants/${plantId}/visits/${visitId}/setWasWatered`)
    })
    .catch((err) => console.error(err))
}
</script>

<style></style>
