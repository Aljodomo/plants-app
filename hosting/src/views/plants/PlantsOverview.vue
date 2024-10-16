<script setup lang="ts">
import { computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAllPlantsRef } from '../plantsRepo'
import { wateringUrgencyColor } from '../wateringInfoColors'
import dayjs from 'dayjs'
import type { Timestamp } from 'firebase/firestore'

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

function daysToToday(timestamp?: Timestamp) {
  if (!timestamp) return null
  return dayjs().diff(timestamp.toDate(), 'days')
}

function daysFromToday(timestamp?: Timestamp) {
  if (!timestamp) return null
  return dayjs(timestamp.toDate()).diff(new Date(), 'days')
}

const plants = computed(() =>
  plantsRef.value
    .slice()
    .sort((it1, it2) => it1.name.localeCompare(it2.name))
    .map((it) => ({
      id: it.id,
      name: it.name,
      daysSinceLastVisit: daysToToday(it.visits.slice().reverse()[0].timestamp),
      wateringStatusColor: wateringUrgencyColor(it),
      daysUntilNextWatering: daysFromToday(it.nextWatering)
    }))
)
</script>

<template>
  <div class="grid gap-4 ma-4 grid-cols-2">
    <v-card variant="outlined" hover @click="goToNewPlantPage">
      <div class="h-full w-full flex justify-center align-center">Hinzufugen</div>
    </v-card>
    <v-card
      v-for="plant of plants"
      :key="plant.id"
      @click="goToPlantPage(plant.id)"
      class="status-border"
      :style="{ '--border-color': plant.wateringStatusColor }"
    >
      <v-card-text class="relative">
        <div class="text-xl mr-2">{{ plant.name }}</div>
        <div
          v-if="plant.daysSinceLastVisit === null || plant.daysSinceLastVisit > 3"
          class="absolute top-2 right-2"
        >
          <v-icon icon="mdi-alert-circle-outline" color="yellow"></v-icon>
        </div>
        <div class="text-gray-400">
          <div v-if="(plant.daysUntilNextWatering ?? 0) > 0">
            In {{ plant.daysUntilNextWatering }} Tagen giesen
          </div>
          <div v-if="(plant.daysUntilNextWatering ?? 0) < 0">
            Vor {{ plant.daysUntilNextWatering }} Tagen giesen
          </div>
          <template v-if="plant.daysSinceLastVisit != null">
            <div v-if="plant.daysUntilNextWatering === 1">Gestern gepruft</div>
            <div v-else-if="plant.daysSinceLastVisit === 0">Heute gepruft</div>
            <div v-else>Vor {{ plant.daysSinceLastVisit }} Tagen gepruft</div>
          </template>
        </div>
      </v-card-text>
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
