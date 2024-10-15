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

const daysSinceLastWatering = computed(() => {
  const vis = plantInfo.value.visits
    .slice()
    .reverse()
    .find((v) => v.wasWatered)
  if (!vis) return -1
  return Math.round(dayjs().diff(vis?.timestamp.toDate(), 'hours') / 24)
})

const daysUntilNextWatering = computed(() =>
  dayjs(plantInfo.value.nextWatering?.toDate()).diff(new Date(), 'days')
)

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
  <!--  <div-->
  <!--    class="px-8 pt-8"-->
  <!--    :style="{-->
  <!--      'background-image': `linear-gradient(to left bottom, ${wateringUrgencyColor(plantInfo)}, rgba(255,0,0,0) 50%)`-->
  <!--    }"-->
  <!--  >-->
  <!--    <main-->
  <!--      class="flex flex-col items-center justify-center p-8 text-f-beige rounded-3xl bg-f-green"-->
  <!--      :style="{-->
  <!--        'border-bottom-left-radius': 0,-->
  <!--        'border-bottom-right-radius': 0-->
  <!--      }"-->
  <!--    >-->
  <!--      <p>Spitzname</p>-->
  <!--      <textarea-->
  <!--        class="text-5xl bg-transparent text-center"-->
  <!--        style="max-width: 100%"-->
  <!--        v-model="plantInfo.name"-->
  <!--        @focus="($event.target as any).select()"-->
  <!--        @keyup="save()"-->
  <!--      ></textarea>-->
  <!--      <div v-if="plantInfo.nextWatering" class="flex flex-col justify-center self-start pl-2 mb-8">-->
  <!--        <p>Gießen am</p>-->
  <!--        <p class="text-2xl mt-2">-->
  <!--          <span>{{ date(timezoned(plantInfo.nextWatering.toDate())) }}</span>-->
  <!--          <span class="text-sm"> ({{ daysRemaingToWater }} Tag/e verbleibend)</span>-->
  <!--        </p>-->
  <!--      </div>-->
  <!--      <div class="flex flex-col justify-center self-start pl-2">-->
  <!--        <p>Bevorzugte Boden feuchtigkeit</p>-->
  <!--        <p class="text-2xl mt-2">-->
  <!--          <select-->
  <!--            v-model="plantInfo.preferedHumidy"-->
  <!--            class="text-black"-->
  <!--            required-->
  <!--            @change="save(true)"-->
  <!--          >-->
  <!--            <option :value="Humidity.WET">{{ tanslateHumidity(Humidity.WET) }}</option>-->
  <!--            <option :value="Humidity.MOIST">{{ tanslateHumidity(Humidity.MOIST) }}</option>-->
  <!--            <option :value="Humidity.DRY">{{ tanslateHumidity(Humidity.DRY) }}</option>-->
  <!--            <option :value="Humidity.VERY_DRY">{{ tanslateHumidity(Humidity.VERY_DRY) }}</option>-->
  <!--          </select>-->
  <!--        </p>-->
  <!--      </div>-->
  <!--      <div class="mt-8 flex flex-col justify-center self-start pl-2 gap-8">-->
  <!--        <div v-if="waterVisits.length">-->
  <!--          <div>Gegossen am</div>-->
  <!--          <ul>-->
  <!--            <li-->
  <!--              v-for="visit of waterVisits"-->
  <!--              :key="visit.id"-->
  <!--              class="flex items-center justify-between w-full"-->
  <!--            >-->
  <!--              <div>-->
  <!--                <p class="text-2xl mt-2">{{ format(visit.timestamp.toDate()) }}</p>-->
  <!--                <p class="text-xs">Der Boden war {{ tanslateHumidity(visit.soilHumidity) }}</p>-->
  <!--              </div>-->
  <!--              <button @click="handleRemoveVisit(visit.id)" class="text-xl text-red-500 px-1">-->
  <!--                X-->
  <!--              </button>-->
  <!--            </li>-->
  <!--          </ul>-->
  <!--        </div>-->
  <!--        <div v-if="nonWaterVisits.length">-->
  <!--          <div>Bodenfeuchtigkeit geprüft am</div>-->
  <!--          <ul>-->
  <!--            <li-->
  <!--              v-for="visit of nonWaterVisits"-->
  <!--              :key="visit.id"-->
  <!--              class="flex items-center justify-between"-->
  <!--            >-->
  <!--              <div>-->
  <!--                <p class="text-2xl mt-2">{{ format(visit.timestamp.toDate()) }}</p>-->
  <!--                <p class="text-xs">Der Boden war {{ tanslateHumidity(visit.soilHumidity) }}</p>-->
  <!--              </div>-->
  <!--              <button @click="handleRemoveVisit(visit.id)" class="text-xl text-red-500 px-1">-->
  <!--                X-->
  <!--              </button>-->
  <!--            </li>-->
  <!--          </ul>-->
  <!--        </div>-->
  <!--      </div>-->
  <!--    </main>-->
  <!--  </div>-->
  <!--  <button-->
  <!--    class="bg-red-600 p-4 mx-8 text-xl font-bold text-center text-f-beige"-->
  <!--    @click="handleDelete"-->
  <!--  >-->
  <!--    Löschen-->
  <!--  </button>-->
</template>

<style scoped>
:deep(.v-timeline-item__body) {
  width: 100%;
}
</style>
