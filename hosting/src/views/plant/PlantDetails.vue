<script setup lang="ts">
import { computed, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Humidity, deletePlant, findPlantRef, savePlantInfo, tanslateHumidity } from '../plantsRepo'
import { format, date, timezoned } from '../dateUtils'
import { Timestamp } from 'firebase/firestore'
import { wateringUrgencyColor } from '../wateringInfoColors'

const route = useRoute()
const router = useRouter()

const plantId = route.params.id as string

const { ref: plantInfo, unsub } = await findPlantRef(plantId)

let timeout: number | null = null

async function save(skipTimeout: boolean = false) {
  let time = 1000
  if (skipTimeout === true) {
    time = 0
  }

  if (timeout) {
    clearTimeout(timeout)
    timeout = null
  }
  timeout = setTimeout(async () => await savePlantInfo(plantId, plantInfo.value), time)
}

onUnmounted(async () => {
  unsub()

  if (timeout) {
    await savePlantInfo(plantId, plantInfo.value)
    timeout = null
  }
})

const waterVisits = computed(() => {
  return plantInfo.value.visits
    .slice()
    .reverse()
    .filter((visit) => visit.wasWatered === true)
})

const nonWaterVisits = computed(() => {
  return plantInfo.value.visits
    .slice()
    .reverse()
    .filter((visit) => visit.wasWatered === false)
})

function handleDelete() {
  const confirmed = confirm(`Möchtest du die Pflanze ${plantInfo.value.name} wirklich löschen?`)

  if (confirmed) {
    deletePlant(plantId)
    router.push('/plants')
  }
}

const daysRemaingToWater = computed(() => {
  const now = Timestamp.now()

  if (now.seconds > plantInfo.value.nextWatering!.seconds) {
    return 0
  }

  const delta = plantInfo.value.nextWatering!.seconds - now.seconds

  return Math.floor(delta / 60 / 60 / 24)
})
</script>

<template>
  <div
    class="px-8 pt-8"
    :style="{
      'background-image': `linear-gradient(to left bottom, ${wateringUrgencyColor(plantInfo)}, rgba(255,0,0,0) 50%)`
    }"
  >
    <main
      class="flex flex-col items-center justify-center p-8 text-f-beige rounded-3xl bg-f-green"
      :style="{
        'border-bottom-left-radius': 0,
        'border-bottom-right-radius': 0
      }"
    >
      <p>Spitzname</p>
      <textarea
        class="text-5xl bg-transparent text-center"
        style="max-width: 100%"
        v-model="plantInfo.name"
        @focus="($event.target as any).select()"
        @keyup="save()"
      ></textarea>
      <div v-if="plantInfo.nextWatering" class="flex flex-col justify-center self-start pl-2 mb-8">
        <p>Gießen am</p>
        <p class="text-2xl mt-2">
          <span>{{ date(timezoned(plantInfo.nextWatering.toDate())) }}</span>
          <span class="text-sm"> ({{ daysRemaingToWater }} Tag/e verbleibend)</span>
        </p>
      </div>
      <div class="flex flex-col justify-center self-start pl-2">
        <p>Bevorzugte Boden feuchtigkeit</p>
        <p class="text-2xl mt-2">
          <select v-model="plantInfo.preferedHumidy" class="text-black" required @change="save(true)">
            <option :value="Humidity.WET">{{ tanslateHumidity(Humidity.WET) }}</option>
            <option :value="Humidity.MOIST">{{ tanslateHumidity(Humidity.MOIST) }}</option>
            <option :value="Humidity.DRY">{{ tanslateHumidity(Humidity.DRY) }}</option>
            <option :value="Humidity.VERY_DRY">{{ tanslateHumidity(Humidity.VERY_DRY) }}</option>
          </select>
        </p>
      </div>
      <div class="mt-8 flex flex-col justify-center self-start pl-2 gap-8">
        <div v-if="waterVisits.length">
          <div>Gegossen am</div>
          <ul>
            <li v-for="visit of waterVisits" :key="visit.id" class="text-2xl mt-2">
              {{ format(visit.timestamp.toDate()) }}
              <p class="text-xs">Der Boden war {{ tanslateHumidity(visit.soilHumidity) }}</p>
            </li>
          </ul>
        </div>
        <div v-if="nonWaterVisits.length">
          <div>Bodenfeuchtigkeit geprüft am</div>
          <ul>
            <li v-for="visit of nonWaterVisits" :key="visit.id" class="text-2xl mt-2">
              {{ format(visit.timestamp.toDate()) }}
              <p class="text-xs">Der Boden war {{ tanslateHumidity(visit.soilHumidity) }}</p>
            </li>
          </ul>
        </div>
      </div>
    </main>
  </div>
  <button
    class="bg-red-600 p-4 mx-8 text-xl font-bold text-center text-f-beige"
    @click="handleDelete"
  >
    Löschen
  </button>
</template>

<style></style>
