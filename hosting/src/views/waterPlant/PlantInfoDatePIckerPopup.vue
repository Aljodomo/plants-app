<script setup lang="ts">
import { ref } from 'vue'
import dayjs from 'dayjs'
import { setVisitData } from '@/views/plantsRepo'

const open = defineModel<boolean>({ required: true })

const emit = defineEmits(['save'])

const props = defineProps<{
  plantInfoId: string
  visitId: string
}>()

const date = ref(new Date())
const max = dayjs().format('YYYY-MM-DD')

const isLoading = ref(false)

async function save() {
  isLoading.value = true
  await setVisitData(props.plantInfoId, props.visitId, {
    timestamp: date.value
  }).finally(() => (isLoading.value = false))
  open.value = false
  emit('save')
}
</script>

<template>
  <v-dialog v-model="open">
    <v-card>
      <v-date-picker v-model="date" :max="max"></v-date-picker>
      <template v-slot:actions>
        <v-btn @click="save" :loading="isLoading">Speichern</v-btn>
      </template>
    </v-card>
  </v-dialog>
</template>

<style scoped></style>
