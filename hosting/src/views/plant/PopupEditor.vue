<script setup lang="ts">
import { onMounted, ref } from 'vue'

defineProps<{
  type: 'textfield' | 'textarea'
}>()

const model = defineModel<string>({ required: true })

const input = ref('')

onMounted(() => (input.value = model.value))

const open = ref(false)

const emit = defineEmits(['save'])

function save() {
  emit('save')
  model.value = input.value
  open.value = false
}
</script>

<template>
  <span>
    <span @click="open = true">
      <slot></slot>
    </span>
    <v-dialog v-model="open">
      <v-card>
        <v-textarea v-if="type === 'textarea'" v-model="input"></v-textarea>
        <v-text-field v-else v-model="input"></v-text-field>
        <template v-slot:actions>
          <v-btn text="Abbrechen" @click="open = false"></v-btn>
          <v-btn text="Speichern" @click="save"></v-btn>
        </template>
      </v-card>
    </v-dialog>
  </span>
</template>

<style scoped></style>
