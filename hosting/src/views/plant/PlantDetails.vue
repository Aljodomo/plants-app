<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watchEffect } from 'vue'
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
import { deletePlantImage, uploadPlantImage } from '@/views/imageRepo'
import { cachedBlobUrl } from '@/views/fileCache'
import gsap from 'gsap'

const route = useRoute()
const router = useRouter()

const plantId = route.params.id as string

const { ref: plantInfo, unsub } = await findPlantRef(plantId)

let timeout: any | null = null

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

function handleDeletePlant() {
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

const image = ref<File | null>(null)

watchEffect(async () => {
  if (image.value) {
    await uploadPlantImage(plantInfo.value, image.value)
  }
})

const cachedImageUrl = ref<string>()
const imageUrl = computed(() => plantInfo.value.imageUrl)
watchEffect(async () => (cachedImageUrl.value = await cachedBlobUrl(imageUrl.value)))

const isUploading = ref(false)

function openFileDialog() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.multiple = false
  input.hidden = true

  input.onchange = async (event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) {
      isUploading.value = true
      await uploadPlantImage(plantInfo.value, file).finally(() => (isUploading.value = false))
    }
  }

  input.click()
  input.remove()
}

function deleteImage() {
  if (window.confirm('Bist du sicher, dass du dieses Bild loschen willst?')) {
    deletePlantImage(plantInfo.value)
  }
}

const Timings = {
  slow: 1,
  relaxed: 0.5,
  medium: 0.3,
  fast: 0.2,
  veryFast: 0.1
}

onMounted(() => {
  gsap.from(".ani-3", {
    duration: Timings.medium,
    x: 30,
    opacity: 0,
    stagger: {
      amount: 0.1 * plantInfo.value.visits.length,
      from: "start",
      ease: "power1.in" // Eases the stagger timing itself
    },
  })
})
</script>

<template>
  <v-card id="card" class="m-4">
    <v-img
      id="img"
      v-if="plantInfo.imageUrl"
      height="20vh"
      :src="cachedImageUrl"
      cover
      class="relative"
    >
      <v-toolbar color="transparent">
        <template v-slot:append>
          <v-btn
            icon="mdi-trash-can-outline"
            variant="text"
            class="bg-black"
            @click="handleDeletePlant"
          ></v-btn>
        </template>
      </v-toolbar>
    </v-img>
    <v-card-text>
      <div class="flex justify-between items-center mb-4">
        <PopupEditor type="textarea" v-model="plantInfo.name" @save="save">
          <div class="text-h5">{{ plantInfo.name }}</div>
        </PopupEditor>
        <v-btn
          v-if="!plantInfo.imageUrl"
          class="ml-auto"
          icon="mdi-camera-plus-outline"
          :loading="isUploading"
          @click="openFileDialog"
        ></v-btn>
      </div>
      <div v-if="plantInfo.nextWatering" class="text-subtitle mb-4">
        Giesen am {{ getNextWateringText(plantInfo) }}
      </div>
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
              <div class="font-weight-normal ani-3">
                <strong>{{ visit.text }}</strong>
                @{{ visit.timestamp }}
              </div>
              <div class="ani-3">Der Boden war {{ visit.soil }}</div>
              <div class="ani-3">Vor {{ visit.diffToNow }} Tagen</div>
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
    </v-card-text>
  </v-card>
</template>

<style scoped>
:deep(.v-timeline-item__body) {
  width: 100%;
}
</style>
