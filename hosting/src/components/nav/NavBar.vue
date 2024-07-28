<template>
  <div v-if="!isHome" class="flex justify-center bg-f-beige p-4 border-t border-t-gray-400">
    <button
      class="border py-4 px-5 rounded-full text-f-green border-gray-400 font-bold"
      @click="goToHome"
    >
      Garten
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const isHome = computed(() => router.currentRoute.value.name === 'plants')

function goToHome() {
  router.push('/plants')
}
</script>
