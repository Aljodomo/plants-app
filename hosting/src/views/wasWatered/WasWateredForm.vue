<template>
  <div class="flex-1 flex justify-center">
    <main class="flex flex-col items-center justify-evenly gap-2 text-4xl p-8">
      <div class="text-center font-bold">
        <h1 v-if="humidity === Humidity.WET">
          Du solltest heute auf keinen Fall gießen. Warte einige Tage bis der Boden trocken ist.
        </h1>
        <h1 v-if="humidity === Humidity.MOIST">
          Du solltest heute nicht gießen und lieber ein paar Tage warten bis der Boden trocken ist.
        </h1>
        <h1 v-if="humidity === Humidity.DRY">Du solltest heute gießen.</h1>
        <h1 v-if="humidity === Humidity.VERY_DRY">
          Du solltest die Pflanze heute auf jeden Fall gießen bevor sie schaden nimmt.
        </h1>
      </div>

      <h1 class="text-4xl text-center">Hast du die Pflanze gegossen?</h1>
      <button
        class="bg-blue-600 text-white font-bold rounded-lg px-8 py-5 w-60"
        @click="handleClickWasWatered(true)"
      >
        Ja
      </button>
      <button
        class="bg-blue-600 text-white font-bold rounded-lg px-8 py-5 w-60"
        @click="handleClickWasWatered(false)"
      >
        Nein
      </button>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { getVisitHumidity, Humidity, setVisitData } from '../plantsRepo'

const route = useRoute()
const router = useRouter()

const plantId = route.params.id as string
const visitId = route.params.visitId as string

const humidity = await getVisitHumidity(plantId, visitId)

function handleClickWasWatered(wasWatered: boolean) {
  setVisitData(plantId, visitId, { wasWatered })
    .then(() => {
      router.push(`/plants/${plantId}`)
    })
    .catch((err) => console.error(err))
}
</script>

<style></style>
