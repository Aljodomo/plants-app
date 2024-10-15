<template>
  <main class="flex-1 flex flex-col items-center justify-center gap-16 text-4xl">
    <div v-if="plantVisited">Fertig!</div>
    <h1
      v-if="plantVisited"
      class="text-4xl bg-green-600 text-center font-bold text-white"
      style="border-radius: 100%; width: 22rem; height: 22rem; line-height: 22rem"
      @click="goToSetHumidity"
    >
      Daten anpassen
    </h1>
    <h1 v-else-if="error" class="text-4xl text-center font-bold p-8">
      Es gab einen Fehler beim gießen... Sorryyy
    </h1>
    <h1 v-else class="text-4xl text-center font-bold p-8">Pflanze wird gegossen...</h1>
    <div v-if="visitId">
      <v-btn @click="openDatePicker">Datum andern</v-btn>
      <PlantInfoDatePIckerPopup
        v-model="isDatePickerOpen"
        :visit-id="visitId"
        :plant-info-id="plantId"
        @save="goToSetHumidity"
      ></PlantInfoDatePIckerPopup>
    </div>
  </main>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { addVisit } from '../plantsRepo'
import { ref } from 'vue'
import PlantInfoDatePIckerPopup from '@/views/waterPlant/PlantInfoDatePIckerPopup.vue'

const route = useRoute()
const router = useRouter()

const plantId = route.params.id as string
const visitId = ref<string | null>(null)

const plantVisited = ref(false)
const error = ref(false)

const isDatePickerOpen = ref(false)

function goToSetHumidity() {
  clearTimeout(timeout)
  router.push(`/plants/${plantId}/visits/${visitId.value!}/setHumidity`)
}

function openDatePicker() {
  clearTimeout(timeout)
  isDatePickerOpen.value = true
}

let timeout: any = null

addVisit(plantId)
  .then((newVisitId) => {
    visitId.value = newVisitId
    plantVisited.value = true
    timeout = setTimeout(() => {
      goToSetHumidity()
    }, 3000)
  })
  .catch((err) => {
    error.value = true
    console.error(err)
  })
</script>

<style></style>
