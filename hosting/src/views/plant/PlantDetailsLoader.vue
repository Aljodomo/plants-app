<script setup lang="ts">
import PlantDetailsVue from './PlantDetails.vue';
</script>


<template>
  <Suspense>
    <PlantDetailsVue />

    <template #fallback>
      <main
        class="absolute left-0 right-0 top-0 bottom-0 flex flex-col items-center justify-center text-4xl font-bold text-center"
      >
        Ich denke nach...
      </main>
    </template>
  </Suspense>
</template>
