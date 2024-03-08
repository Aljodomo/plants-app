<script setup lang="ts">
import { computed, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { deletePlant, findPlantRef, savePlantInfo, tanslateHumidity } from '../plantsRepo'

const route = useRoute()
const router = useRouter()

const plantId = route.params.id as string

const { ref: plantInfo, unsub } = await findPlantRef(plantId)

function format(date: Date): string {
  const timeZoneDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000)
  return (
    timeZoneDate.getDate() +
    '.' +
    (timeZoneDate.getMonth() + 1) +
    ' - ' +
    timeZoneDate.getHours() +
    ':' +
    (timeZoneDate.getMinutes() < 10 ? "0" : "") + timeZoneDate.getMinutes()
  )
}

let timeout: number | null = null

async function save() {
  if (timeout) {
    clearTimeout(timeout)
    timeout = null
  }
  timeout = setTimeout(async () => await savePlantInfo(plantId, plantInfo.value), 1000)
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

  if(confirmed) {
    deletePlant(plantId)
    router.push("/plants")
  }
}
</script>

<template>
  <div class="bg-f-green mx-8 mt-8 min-h-full rounded-3xl" style="border-bottom-left-radius: 0; border-bottom-right-radius: 0">
    <main class="flex flex-col items-center justify-center p-8 text-f-beige">
      <p>Nickname</p>
      <textarea
        class="text-5xl bg-transparent text-center"
        style="max-width: 100%"
        v-model="plantInfo.name"
        @focus="($event.target as any).select()"
        @keyup="save"
      ></textarea>
      <div class="flex flex-col justify-center self-start pl-2">
        <p>Gießen</p>
        <p class="text-2xl mt-2">
          Alle
          <input
            type="number"
            class="bg-transparent text-3xl box-border w-10 text-center"
            v-model="plantInfo.wateringInterval"
            @focus="($event.target as any).select()"
            @input="save"
          />
          Tage
        </p>
      </div>
      <div class="mt-8 flex flex-col justify-center self-start pl-2 gap-8">
        <div v-if="waterVisits.length">
          <div>Gegossen am</div>
          <ul>
            <li v-for="visit of waterVisits" :key="visit.id" class="text-4xl mt-2">
              {{ format(visit.timestamp.toDate()) }}
              <p class="text-xs">Der Boden war {{ tanslateHumidity(visit.soilHumidity) }}</p>
            </li>
          </ul>
        </div>
        <div v-if="nonWaterVisits.length">
          <div>Bodenfeuchtigkeit geprüft am</div>
          <ul>
            <li v-for="visit of nonWaterVisits" :key="visit.id" class="text-4xl mt-2">
              {{ format(visit.timestamp.toDate()) }}
              <p class="text-xs">Der Boden war {{ tanslateHumidity(visit.soilHumidity) }}</p>
            </li>
          </ul>
        </div>
      </div>
    </main>
  </div>
  <button class="bg-red-600 p-4 mx-8 text-xl font-bold text-center text-f-beige" @click="handleDelete">Löschen</button>
</template>

<style></style>
