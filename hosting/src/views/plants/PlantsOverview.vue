<script setup lang="ts">
import {computed, onUnmounted, reactive} from 'vue'
import { useRouter } from 'vue-router'
import { getAllPlantsRef, type PlantInfo } from '../plantsRepo'
import { date, timezoned } from '../dateUtils'
import { wateringUrgencyColor } from '../wateringInfoColors'
import dayjs from "dayjs";

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

function nextWatering(plant: PlantInfo): string {
  return dayjs(plant.nextWatering?.toDate()).format("DD.MM")
}

function daysLeft(plant: PlantInfo) {
  return dayjs(plant.nextWatering?.toDate()).diff(new Date(), "days")
}
</script>

<template>
  <div class="grid gap-4 ma-4 grid-cols-2">
    <v-card variant="outlined" hover @click="goToNewPlantPage">
      <div class="h-full w-full flex justify-center align-center">Hinzufugen</div>
    </v-card>
    <v-card
      v-for="plant of sortedPlants"
      :key="plant.id"
      :title="plant.name"
      @click="goToPlantPage(plant.id)"
      class="status-border"
      :style="{ '--border-color': wateringUrgencyColor(plant) }"
    >
      <template v-if="plant.nextWatering" v-slot:subtitle>Giesen: {{nextWatering(plant)}} in {{daysLeft(plant)}} days</template>
      <template v-else v-slot:subtitle>Noch nicht genug Daten</template>
    </v-card>
  </div>
</template>

<style scoped>
.status-border {
  position: relative;
  overflow: visible;
}
.status-border:before {
  content: ' ';
  position: absolute;
  background-color: var(--border-color);
  height: 100%;
  left: -4px;
  width: 4px;
  border-radius: 2px 0 0 2px;
  z-index: 1;
}

.status-border:hover:before {
  z-index: 1;
}
</style>
