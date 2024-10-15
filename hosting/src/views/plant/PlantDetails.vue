<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  deletePlant,
  findPlantRef,
  getHumidityText,
  Humidity,
  removeVisit,
  savePlantInfo
} from '../plantsRepo'
import { daysLeft, getNextWateringText } from '../dateUtils'
import PopupEditor from '@/views/plant/PopupEditor.vue'
import dayjs from 'dayjs'

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

function handleWater() {
  router.push(router.currentRoute.value.path + '/waterPlant')
}

function handleDelete() {
  const confirmed = confirm(`Möchtest du die Pflanze ${plantInfo.value.name} wirklich löschen?`)

  if (confirmed) {
    deletePlant(plantId)
    router.push('/plants')
  }
}

function handleRemoveVisit(visitId: string) {
  if (window.confirm('Bist du sicher, dass du diesen Eintrag löschen willst?')) {
    removeVisit(plantId, visitId)
  }
}

const timelineEntries = computed(() => {
  const visits = plantInfo.value.visits.slice().reverse()

  let res = []
  for (let i = 0; i < visits.length; i++) {
    let visit = visits[i]
    let before = visits.find((v, idx) => idx > i && v.wasWatered)
    res.push({
      id: visit.id,
      wasWatered: visit.wasWatered,
      color: visit.wasWatered ? 'blue' : 'brown',
      text: visit.wasWatered ? 'Gegossen' : 'Gepruft',
      timestamp: dayjs(visit.timestamp.toDate()).format('HH:mm DD.MM.YY'),
      soil: getHumidityText(visit.soilHumidity),
      diffToBefore: Math.round(
        dayjs(visit.timestamp.toDate()).diff(before?.timestamp.toDate(), 'hours') / 24
      ),
      diffToNow: Math.round(dayjs().diff(visit.timestamp.toDate(), 'hours') / 24)
    })
  }
  return res
})

const humidityItems = [Humidity.WET, Humidity.MOIST, Humidity.DRY, Humidity.VERY_DRY].map((it) => ({
  value: it,
  title: getHumidityText(it)
}))

const currentTime = ref(getTime())

function getTime() {
  return dayjs().format('HH:mm:ss DD.MM.YY')
}

setInterval(() => (currentTime.value = getTime()), 1000)
</script>

<template>
  <v-card class="m-4">
    <template v-slot:title>
      <PopupEditor type="textarea" v-model="plantInfo.name" @save="save">
        {{ plantInfo.name }}
      </PopupEditor>
    </template>
    <template v-if="plantInfo.nextWatering" v-slot:subtitle>
      Giesen am {{ getNextWateringText(plantInfo) }}</template
    >

    <template v-slot:text>
      <v-select
        label="Boden"
        v-model="plantInfo.preferedHumidy"
        :items="humidityItems"
        variant="plain"
        @update:modelValue="save()"
      ></v-select>
      <v-divider class="mb-4"></v-divider>
      <v-timeline align="start" density="compact" truncate-line="start">
        <v-timeline-item
          :dot-color="dayjs().isAfter(plantInfo.nextWatering?.toDate()) ? 'yellow' : 'green'"
          size="x-small"
        >
          <div class="w-full flex justify-between">
            <div class="mb-4">
              <div class="font-weight-normal">
                <strong>Heute</strong>
                @ {{ currentTime }}
              </div>
              <div v-if="daysLeft(plantInfo) <= 0">Du solltest heute giesen</div>
              <div v-else>In {{ daysLeft(plantInfo) }} Tagen giesen</div>
            </div>
            <v-btn class="self-start" color="success" variant="outlined" @click="handleWater"
              >+</v-btn
            >
          </div>
        </v-timeline-item>
        <v-timeline-item
          v-for="visit of timelineEntries"
          :key="visit.timestamp"
          :dot-color="visit.color"
          size="x-small"
        >
          <div class="w-full flex justify-between">
            <div class="mb-4">
              <div class="font-weight-normal">
                <strong>{{ visit.text }}</strong>
                @{{ visit.timestamp }}
              </div>
              <div>Der Boden war {{ visit.soil }}</div>
              <div>Vor {{ visit.diffToNow }} Tagen</div>
            </div>
            <v-btn
              class="self-start"
              color="error"
              variant="outlined"
              @click="handleRemoveVisit(visit.id)"
              >X</v-btn
            >
          </div>
        </v-timeline-item>
      </v-timeline>
    </template>
  </v-card>
</template>

<style scoped>
:deep(.v-timeline-item__body) {
  width: 100%;
}
</style>
