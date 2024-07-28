<template>
  <form class="flex flex-col items-center justify-center gap-16 p-8" @submit.prevent="handleSubmit">
    <h1 class="text-4xl">Neue Pflanze</h1>
    <div
      class="flex flex-col gap-16 bg-f-green p-8 rounded-xl text-f-beige text-lg"
      style="max-width: 80%"
    >
      <div class="flex flex-col gap-2">
        <label>Pflanzenname</label>
        <input
          v-model="name"
          class="text-gray-800"
          minlength="3"
          maxlength="30"
          style="max-width: 80%"
          required
        />
      </div>
      <div class="flex flex-col gap-2">
        <label>Wie feucht mag es die Pflanze?</label>
        <select v-model="preferedHumidyLevel" class="text-gray-800" required>
          <option :value="Humidity.WET">{{ tanslateHumidity(Humidity.WET) }}</option>
          <option :value="Humidity.MOIST">{{ tanslateHumidity(Humidity.MOIST) }}</option>
          <option :value="Humidity.DRY">{{ tanslateHumidity(Humidity.DRY) }}</option>
          <option :value="Humidity.VERY_DRY">{{ tanslateHumidity(Humidity.VERY_DRY) }}</option>
        </select>
      </div>
    </div>

    <button
      :disabled="disabled"
      pe="submit"
      class="bg-f-green py-4 px-8 text-f-beige text-2xl font-bold"
    >
      <span v-if="!disabled">Speichern</span>
      <span v-else>Wird erstellt...</span>
    </button>

    <p v-if="error" class="text-red-800 text-xl text-center">Fehler: {{ error }}</p>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { createPlant, Humidity, tanslateHumidity } from '../plantsRepo'
import { useRouter } from 'vue-router'

const router = useRouter()

const name = ref('')
const preferedHumidyLevel = ref(Humidity.DRY)
const disabled = ref(false)
const error = ref('')

function normalize(word: string) {
  word = word.replace(/\s/g, '_')
  return word.replace(/[^a-zA-Z0-9_]/g, '')
}

function handleSubmit() {
  disabled.value = true
  error.value = ''

  const id = 'plant_' + normalize(name.value)

  createPlant(id, name.value, preferedHumidyLevel.value)
    .then((plantInfo) => {
      router.push('/plants/' + plantInfo.id)
    })
    .catch((e) => {
      console.error('Could not create plant', e)
      disabled.value = false
      error.value = e.message
    })
}
</script>

<style></style>
