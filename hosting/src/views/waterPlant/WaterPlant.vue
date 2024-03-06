<template>
  <main
    class="flex-1 flex flex-col items-center justify-center gap-16 text-4xl"
  >
    <h1
      v-if="plantVisited"
      class="text-4xl bg-green-600 text-center font-bold text-white"
      style="border-radius: 100%; width: 22rem; height: 22rem; line-height: 22rem"
    >
      Pflanze gegossen!
    </h1>
    <h1
      v-else-if="error"
      class="text-4xl text-center font-bold p-8"
    >
      Es gab einen Fehler beim gießen... Sorryyy
    </h1>
    <h1 v-else class="text-4xl text-center font-bold p-8">Pflanze wird gegossen...</h1>
  </main>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { addVisit } from '../plantsRepo'
import { ref } from 'vue'

const route = useRoute()
const router = useRouter()

const plantId = route.params.id as string

const plantVisited = ref(false)
const error = ref(false)

addVisit(plantId)
  .then((visitId) => {
    plantVisited.value = true
    setTimeout(() => {
        router.push(`/plants/${plantId}/visits/${visitId}/setHumidity`)
    }, 1000)
  })
  .catch((err) => {
    error.value = true
    console.error(err)
  })
</script>

<style></style>
