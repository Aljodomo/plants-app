<script setup lang="ts">
import { onUnmounted } from 'vue';
import { findPlantRef, savePlantInfo } from './plantsRepo'
import { useRoute } from 'vue-router';

const route = useRoute()
const plantId = route.params.id as string

const {ref: plantInfo, unsub} = await findPlantRef(plantId)

function format(date: Date): string {
    const timeZoneDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000)
    return timeZoneDate.getDate() + "." + (timeZoneDate.getMonth() + 1) + " - " + 
    timeZoneDate.getHours() + ":" + timeZoneDate.getMinutes();
}

let timeout: number | null  = null;

async function save() {
  if(timeout) {
    clearTimeout(timeout)
    timeout = null
  }
  timeout = setTimeout(async () => await savePlantInfo(plantId, plantInfo.value), 1000)
}

onUnmounted(async () => {
  unsub()

  if(timeout) {
    await savePlantInfo(plantId, plantInfo.value)
    timeout = null
  }
})

</script>

<template>
  <div class="bg-[#6E8C7D] absolute left-8 right-8 top-8 -bottom-8 rounded-3xl">
    <main class="flex flex-col items-center justify-center p-8 text-[#FDF4E2]">
      <textarea class="text-5xl mt-8 bg-transparent text-center" style="max-width: 100%;"
          v-model="plantInfo.name"
          @keyup="save"></textarea>
      <div class="mt-8 flex flex-col justify-center self-start pl-2">
        <div>Gegossen am</div>
        <ul>
          <li v-for="ts of (plantInfo.wateringTimestamps.slice().reverse())" :key="ts.toString()" class="text-4xl mt-2">{{ format(ts.toDate()) }}</li>
        </ul>
      </div>
    </main>
  </div>
</template>

<style>
body {
    background-color: #FFF8EF;
}
</style>
